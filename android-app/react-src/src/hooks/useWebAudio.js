import { useRef, useCallback } from 'react';

/** Lookup table: preset name → { frequencies, gains } oscillator config */
const PRESETS = {
  rain: {
    label: 'Rain',
    build: (ctx) => {
      const bufSz = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, bufSz, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSz; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 0.3;
      const gain = ctx.createGain();
      gain.gain.value = 0.35;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
      return () => { try { src.stop(); } catch(e){} };
    },
  },
  thunder: {
    label: 'Thunderstorm',
    build: (ctx) => {
      const stops = [];
      // Base rain
      const bufSz = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, bufSz, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSz; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 800;
      const gain = ctx.createGain(); gain.gain.value = 0.45;
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      src.start();
      stops.push(() => { try { src.stop(); } catch(e){} });
      // Periodic low rumble
      const rumble = () => {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth'; osc.frequency.value = 40;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.3);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 2);
      };
      const id = setInterval(rumble, 8000 + Math.random() * 12000);
      stops.push(() => clearInterval(id));
      return () => stops.forEach(s => s());
    },
  },
  ocean: {
    label: 'Ocean',
    build: (ctx) => {
      const bufSz = ctx.sampleRate * 4;
      const buf = ctx.createBuffer(2, bufSz, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < bufSz; i++) d[i] = Math.random() * 2 - 1;
      }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 600;
      const gain = ctx.createGain(); gain.gain.value = 0.25;
      // LFO for wave rhythm
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.12;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.18;
      lfo.connect(lfoGain); lfoGain.connect(gain.gain);
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      lfo.start(); src.start();
      return () => { try { src.stop(); lfo.stop(); } catch(e){} };
    },
  },
  forest: {
    label: 'Forest',
    build: (ctx) => {
      const stops = [];
      // Wind
      const bufSz = ctx.sampleRate * 3;
      const buf = ctx.createBuffer(1, bufSz, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSz; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 300; filter.Q.value = 0.5;
      const gain = ctx.createGain(); gain.gain.value = 0.2;
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      src.start();
      stops.push(() => { try { src.stop(); } catch(e){} });
      // Cricket chirps
      const chirp = () => {
        const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 4000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.02);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.1);
      };
      const id = setInterval(() => { chirp(); setTimeout(chirp, 60); setTimeout(chirp, 130); }, 800 + Math.random() * 1200);
      stops.push(() => clearInterval(id));
      return () => stops.forEach(s => s());
    },
  },
  lofi: {
    label: 'Lo-Fi',
    build: (ctx) => {
      const stops = [];
      // Simple lo-fi melody using oscillators
      const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00];
      const sequence = [0, 2, 4, 2, 0, 3, 5, 3];
      let step = 0;
      const play = () => {
        const freq = notes[sequence[step % sequence.length]];
        const osc = ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.12, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.7);
        step++;
      };
      const id = setInterval(play, 700);
      stops.push(() => clearInterval(id));
      // Vinyl hiss
      const bufSz = ctx.sampleRate;
      const buf = ctx.createBuffer(1, bufSz, ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < bufSz; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3000;
      const gv = ctx.createGain(); gv.gain.value = 0.04;
      src.connect(f); f.connect(gv); gv.connect(ctx.destination); src.start();
      stops.push(() => { try { src.stop(); } catch(e){} });
      return () => stops.forEach(s => s());
    },
  },
};

export const AUDIO_PRESETS = Object.entries(PRESETS).map(([key, v]) => ({ key, label: v.label }));

/** Web Audio synth hook — returns { isPlaying, toggle, changePreset } */
export function useWebAudio(preset = 'rain') {
  const ctxRef = useRef(null);
  const stopRef = useRef(null);
  const isPlayingRef = useRef(false);

  const stop = useCallback(() => {
    if (stopRef.current) { stopRef.current(); stopRef.current = null; }
    isPlayingRef.current = false;
  }, []);

  const play = useCallback((presetKey) => {
    stop();
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const builder = PRESETS[presetKey]?.build || PRESETS.rain.build;
    stopRef.current = builder(ctx);
    isPlayingRef.current = true;
  }, [stop]);

  const toggle = useCallback((presetKey) => {
    if (isPlayingRef.current) { stop(); return false; }
    play(presetKey || preset);
    return true;
  }, [stop, play, preset]);

  const changePreset = useCallback((newPreset) => {
    if (isPlayingRef.current) { play(newPreset); }
  }, [play]);

  return { toggle, changePreset, stop };
}
