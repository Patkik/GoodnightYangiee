import { useEffect } from 'react';
import { useAppStore } from '../store/appStore.js';

// ─── Weather icon SVG paths by condition code ─────────────────────────────────
function decodeWeather(code, temp) {
  if (code === 0) {
    if (temp >= 38) return { label: 'Extremely Hot', icon: 'extreme-hot' };
    if (temp >= 32) return { label: 'Hot', icon: 'hot' };
    return { label: 'Clear Sky', icon: 'clear' };
  }
  if (code <= 2) return { label: 'Partly Cloudy', icon: 'partly-cloudy' };
  if (code <= 9) return { label: 'Overcast', icon: 'cloudy' };
  if (code <= 19) return { label: 'Foggy', icon: 'fog' };
  if (code <= 29) return { label: 'Drizzle', icon: 'rain-light' };
  if (code <= 39) return { label: 'Dust / Sand', icon: 'cloudy' };
  if (code <= 49) return { label: 'Foggy', icon: 'fog' };
  if (code <= 59) return { label: 'Light Rain', icon: 'rain-light' };
  if (code <= 69) return { label: 'Rain', icon: 'rain' };
  if (code <= 79) return { label: 'Snow', icon: 'snow' };
  if (code <= 84) return { label: 'Rain Showers', icon: 'rain' };
  if (code <= 94) return { label: 'Heavy Rain', icon: 'rain-heavy' };
  if (code <= 99) return { label: 'Thunderstorm', icon: 'thunder' };
  return { label: 'Clear Sky', icon: 'clear' };
}

// Highly reliable multi-source weather provider fetcher
async function fetchHighPrecisionWeather(lat, lon, cityName) {
  // Primary Provider: Open-Meteo High Precision 2m Realtime Air Temperature API
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,weather_code&hourly=precipitation,precipitation_probability&timezone=Asia%2FManila&forecast_days=1`;
    const res = await fetch(url);
    if (res.ok) {
      const d = await res.json();
      const curr = d.current || d.current_weather;
      if (curr) {
        const rawTemp = curr.temperature_2m ?? curr.temperature ?? curr.apparent_temperature;
        const temp = Math.round(rawTemp);
        const code = curr.weather_code ?? curr.weathercode ?? 0;
        const decoded = decodeWeather(code, temp);
        return {
          ...decoded,
          temp,
          city: cityName,
          raw: d,
          hourly: d.hourly
        };
      }
    }
  } catch (e) {
    console.warn('Open-Meteo primary fetch warning:', e);
  }

  // Secondary Provider Fallback: wttr.in JSON API
  try {
    const url2 = `https://wttr.in/${encodeURIComponent(cityName)}?format=j1`;
    const res2 = await fetch(url2);
    if (res2.ok) {
      const d2 = await res2.json();
      const curr = d2.current_condition?.[0];
      if (curr) {
        const temp = Math.round(parseFloat(curr.temp_C));
        const desc = curr.weatherDesc?.[0]?.value || 'Clear';
        let code = 0;
        if (desc.toLowerCase().includes('rain')) code = 61;
        else if (desc.toLowerCase().includes('cloud')) code = 2;
        else if (desc.toLowerCase().includes('thunder')) code = 95;

        const decoded = decodeWeather(code, temp);
        return {
          ...decoded,
          temp,
          city: cityName,
          raw: d2,
          hourly: null
        };
      }
    }
  } catch (e2) {
    console.warn('wttr.in fallback fetch warning:', e2);
  }

  throw new Error(`Weather fetch failed for ${cityName}`);
}

export function useWeather() {
  const setHerWeather = useAppStore(s => s.setHerWeather);
  const setYourWeather = useAppStore(s => s.setYourWeather);
  const showWeatherBanner = useAppStore(s => s.showWeatherBanner);

  useEffect(() => {
    // HER location: Capas, Tarlac, PH
    const herCoords = { lat: 15.3262, lon: 120.5912, city: 'Capas, Tarlac' };
    // YOUR location: Malaybalay City, Bukidnon, PH
    const yourCoords = { lat: 8.1575, lon: 125.1278, city: 'Malaybalay, Bukidnon' };

    async function load() {
      try {
        const [herRes, yourRes] = await Promise.allSettled([
          fetchHighPrecisionWeather(herCoords.lat, herCoords.lon, herCoords.city),
          fetchHighPrecisionWeather(yourCoords.lat, yourCoords.lon, yourCoords.city),
        ]);

        if (herRes.status === 'fulfilled') {
          const w = herRes.value;
          setHerWeather(w);

          // Rain forecast check for Capas (next 3 hours)
          if (w.hourly?.precipitation) {
            const hour = new Date().getHours();
            for (let i = 1; i <= 3; i++) {
              const idx = (hour + i) % 24;
              const prob = w.hourly.precipitation_probability?.[idx] || 0;
              const amount = w.hourly.precipitation[idx] || 0;
              if (prob >= 30 || amount > 0.1) {
                let intensity = 'Light Drizzle';
                if (amount > 7.6) intensity = 'Heavy Downpour';
                else if (amount > 2.5) intensity = 'Moderate Rain';
                else if (amount > 0.5) intensity = 'Light Rain';

                const bannerMsg = `Yangiee, dala ka ng umbrella uulan mamayaa ☔ (${intensity} sa Capas, ~${amount.toFixed(1)}mm/hr)`;
                const notifMsg = `Yangiee, dala ka ng umbrella uulan mamayaa! (${intensity} sa Capas) ☔`;
                setTimeout(() => showWeatherBanner(bannerMsg), 1500);

                try {
                  if (window.AndroidHost?.sendNotification) {
                    window.AndroidHost.sendNotification("Ulan Alert ☔", notifMsg);
                  }
                } catch(err){}
                break;
              }
            }
          }
        }

        if (yourRes.status === 'fulfilled') {
          setYourWeather(yourRes.value);
        }
      } catch (e) {
        console.warn('Weather load error:', e);
      }
    }

    load();
    const id = setInterval(load, 10 * 60 * 1000); // Refresh weather every 10 min
    return () => clearInterval(id);
  }, [setHerWeather, setYourWeather, showWeatherBanner]);
}
