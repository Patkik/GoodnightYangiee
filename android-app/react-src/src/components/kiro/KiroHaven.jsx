import React, { lazy, Suspense, useEffect } from 'react';
import { useKiroStore, calcWellbeing, wellbeingTier } from '../../store/kiroStore.js';
import { useAppStore } from '../../store/appStore.js';
import { kiroRef, onSnapshot } from '../../firebase.js';

const KiroScene = lazy(() => import('./KiroScene.jsx'));

// ─── Weather SVG icons ────────────────────────────────────────────────────────
function WeatherIcon({ icon, size = 22 }) {
  const paths = {
    'clear':         'M12 3v1m9 8h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 17a5 5 0 100-10 5 5 0 000 10z',
    'hot':           'M12 3v1m9 8h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 17a5 5 0 100-10 5 5 0 000 10z',
    'extreme-hot':   'M12 2L8 6H3l3 3-1 5 5-2.5L15 14l-1-5 3-3h-5z',
    'partly-cloudy': 'M5 8a4 4 0 018 0m-4-4v1M6.343 9.657l-.707-.707M17.657 9.657l-.707.707M18 14a6 6 0 11-12 0h12z',
    'cloudy':        'M18 10a6 6 0 10-11.94 1.5A5 5 0 006 20h12a4 4 0 000-10z',
    'rain-light':    'M18 10a6 6 0 10-11.94 1.5A5 5 0 006 20h12a4 4 0 000-10zM8 22l-1 3M12 22v3M16 22l1 3',
    'rain':          'M18 10a6 6 0 10-11.94 1.5A5 5 0 006 20h12a4 4 0 000-10zM8 22l-1 4M12 22v4M16 22l1 4',
    'rain-heavy':    'M18 10a6 6 0 10-11.94 1.5A5 5 0 006 20h12a4 4 0 000-10zM7 22l-2 4M11 22l-1 4M15 22v4M19 22l-1 4',
    'thunder':       'M18 10a6 6 0 10-11.94 1.5A5 5 0 006 20h12a4 4 0 000-10zM13 20l-3 5h4l-3 5',
    'snow':          'M18 10a6 6 0 10-11.94 1.5A5 5 0 006 20h12a4 4 0 000-10zM8 23h1M12 22v2M15 23h1M10 22l2 2 2-2',
    'drizzle':       'M18 10a6 6 0 10-11.94 1.5A5 5 0 006 20h12a4 4 0 000-10zM9 22l-.5 2M13 22l-.5 2M17 22l-.5 2',
    'fog':           'M4 12h16M4 16h16M4 8h16',
    'dust':          'M3 8s2-2 9-2 9 2 9 2M3 16s2-2 9-2 9 2 9 2M5 12h14',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="weather-icon-svg">
      <path d={paths[icon] || paths.clear} />
    </svg>
  );
}

// ─── Stat Bar Row ─────────────────────────────────────────────────────────────
function StatBar({ label, value, type }) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <div className="stat-bar-track">
        <div className={`stat-bar-fill ${type}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <span className="stat-value">{Math.round(value)}%</span>
    </div>
  );
}

// ─── Kiro Haven Overlay ───────────────────────────────────────────────────────
export default function KiroHaven({ isOpen, onClose, timeOfDay }) {
  const stats = useKiroStore(s => s.stats);
  const sleepMode = useKiroStore(s => s.sleepMode);
  const treatPending = useKiroStore(s => s.treatPending);
  const wellRestedUntil = useKiroStore(s => s.wellRestedUntil);
  const initFromFirebase = useKiroStore(s => s.initFromFirebase);
  const tickDecay = useKiroStore(s => s.tickDecay);
  const addWater = useKiroStore(s => s.addWater);
  const addMeal = useKiroStore(s => s.addMeal);
  const startSleep = useKiroStore(s => s.startSleep);
  const wakeUp = useKiroStore(s => s.wakeUp);
  const claimTreat = useKiroStore(s => s.claimTreat);
  const showToast = useAppStore(s => s.showToast);

  const W = calcWellbeing(stats.food, stats.water, stats.energy);
  const tier = wellbeingTier(W);
  const isWellRested = wellRestedUntil && Date.now() < wellRestedUntil;

  // Firebase sync
  useEffect(() => {
    const unsub = onSnapshot(kiroRef(), (snap) => {
      if (snap.exists()) initFromFirebase(snap.data());
    });
    return () => unsub();
  }, [initFromFirebase]);

  // Passive decay every 60s
  useEffect(() => {
    const id = setInterval(tickDecay, 60_000);
    return () => clearInterval(id);
  }, [tickDecay]);

  const handleWater = () => {
    addWater();
    showToast('Kiro drank water! 💧 +15%');
  };

  const handleMeal = () => {
    addMeal('meal');
    showToast('Kiro ate a meal! 🍲 +35%');
  };

  const handleSnack = () => {
    addMeal('snack');
    showToast('Kiro had a snack! 🍪 +15%');
  };

  const handleSleepToggle = () => {
    if (sleepMode.is_sleeping) {
      wakeUp();
      showToast('Good morning! Kiro is awake ☀️');
    } else {
      startSleep();
      showToast('Goodnight! Kiro is resting 🌙');
    }
  };

  const handleTreat = () => {
    claimTreat();
    showToast('Treat claimed! Kiro is thrilled! 🎁 +20%');
  };

  const tierDescriptions = {
    thriving: 'Kiro is thriving! Full of energy and love.',
    happy: 'Kiro is happy and content today.',
    okay: "Kiro's doing okay — could use some care.",
    low: "Kiro's feeling a bit low... feed and water needed.",
    critical: 'Kiro needs urgent care! Please help Kiro! 😢',
  };

  return (
    <div className={`kiro-overlay ${isOpen ? 'open' : ''}`}>
      {/* 3D Scene — lazy loaded */}
      <div className="kiro-canvas-wrap">
        {isOpen && (
          <Suspense fallback={null}>
            <KiroScene timeOfDay={timeOfDay} />
          </Suspense>
        )}
      </div>

      {/* HUD */}
      <div className="kiro-hud">
        {/* Top bar */}
        <div className="kiro-top-bar">
          <div>
            <div className="kiro-title">Kiro's Haven</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '9px', letterSpacing: '1px', color: 'var(--subtext-gray)', marginTop: '2px' }}>
              {tierDescriptions[tier]}
            </div>
          </div>
          <button className="kiro-back-btn" onClick={onClose} id="kiro-back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
        </div>

        {/* Treat box (if partner sent one) */}
        {treatPending && (
          <div className="treat-box-popup">
            <button className="treat-box-btn" onClick={handleTreat}>
              🎁 Patrick sent a treat! Tap to open
            </button>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Wellbeing stat bars */}
        <div className="kiro-stats-bar">
          {isWellRested && (
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '9px', letterSpacing: '1.5px', color: 'var(--amber-glow)', textAlign: 'center', marginBottom: '4px', textTransform: 'uppercase' }}>
              ✨ Well Rested — Golden Aura Active
            </div>
          )}
          <StatBar label="Food" value={stats.food} type="food" />
          <StatBar label="Water" value={stats.water} type="water" />
          <StatBar label="Energy" value={stats.energy} type="energy" />

          {/* Wellbeing total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '9px', letterSpacing: '1.5px', color: 'var(--subtext-gray)', textTransform: 'uppercase' }}>Wellbeing</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: W >= 75 ? 'var(--aurora-emerald)' : W >= 40 ? 'var(--amber-glow)' : '#F38BA8' }}>
              {Math.round(W)}%
            </span>
          </div>

          {/* Action buttons */}
          <div className="kiro-actions-row">
            <button className="kiro-action-btn water" onClick={handleWater} id="kiro-water-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z" />
              </svg>
              Water
            </button>
            <button className="kiro-action-btn meal" onClick={handleMeal} id="kiro-meal-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 11l19-9-9 19-2-8-8-2z" />
              </svg>
              Meal
            </button>
            <button className="kiro-action-btn" onClick={handleSnack} id="kiro-snack-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="9" cy="9" r="5" />
                <path d="M9 4v2M9 12v2M4 9h2M12 9h2" />
              </svg>
              Snack
            </button>
            <button className="kiro-action-btn" onClick={handleSleepToggle} id="kiro-sleep-btn" style={{ borderColor: sleepMode.is_sleeping ? 'rgba(249,226,175,0.4)' : undefined, color: sleepMode.is_sleeping ? 'var(--amber-glow)' : undefined }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {sleepMode.is_sleeping
                  ? <><circle cx="12" cy="12" r="5" /><line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" /><line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" /></>
                  : <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                }
              </svg>
              {sleepMode.is_sleeping ? 'Wake' : 'Sleep'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
