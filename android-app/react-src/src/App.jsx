import React, { useState, useCallback, lazy, Suspense, useEffect } from 'react';
import { useAppStore } from './store/appStore.js';
import { useKiroStore } from './store/kiroStore.js';
import { usePSTClock } from './hooks/usePSTClock.js';
import { useWeather } from './hooks/useWeather.js';
import { useGitHubSync } from './hooks/useGitHubSync.js';
import { useWebAudio } from './hooks/useWebAudio.js';
import {
  StartOverlay,
  DissipationHint,
  Filigrees,
  SanctuaryHeader,
  HeroHeading,
  ConnectionCard,
  QuickActions,
  QuoteCard,
  AudioPill,
  SleepSwitch,
  CareBubbleBtn,
  PopToast,
  WeatherBanner,
  VaultModal,
  MailboxModal,
  CareModal,
} from './components/ui/UIComponents.jsx';
import KiroHaven from './components/kiro/KiroHaven.jsx';
import TouchEffectsCanvas from './components/ui/TouchEffectsCanvas.jsx';

// Lazy-load heavy 3D sanctuary scene
const SanctuaryScene = lazy(() => import('./components/sanctuary/SanctuaryScene.jsx'));


// ─── Note Modal (simple inline) ───────────────────────────────────────────────
function NoteModal({ isOpen, onClose }) {
  const [text, setText] = useState(() => {
    try { return localStorage.getItem('quick_note') || ''; } catch { return ''; }
  });
  const save = () => { try { localStorage.setItem('quick_note', text); } catch {} onClose(); };
  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="modal-title">Quick Note</div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '0 20px 20px' }}>
          <textarea
            className="vault-note-area"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Jot something down…"
            style={{ minHeight: '160px' }}
          />
          <button className="vault-save-btn" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  // Global state
  const isStarted      = useAppStore(s => s.isStarted);
  const isDissipated   = useAppStore(s => s.isDissipated);
  const timeOfDay      = useAppStore(s => s.timeOfDay);
  const greeting       = useAppStore(s => s.greeting);
  const pstDate        = useAppStore(s => s.pstDate);
  const daysMet        = useAppStore(s => s.daysMet);
  const herWeather     = useAppStore(s => s.herWeather);
  const yourWeather    = useAppStore(s => s.yourWeather);
  const quoteIndex     = useAppStore(s => s.quoteIndex);
  const toastMsg       = useAppStore(s => s.toastMsg);
  const toastVisible   = useAppStore(s => s.toastVisible);
  const wBannerMsg     = useAppStore(s => s.weatherBannerMsg);
  const wBannerVisible = useAppStore(s => s.weatherBannerVisible);
  const audioPlaying   = useAppStore(s => s.audioPlaying);
  const audioPreset    = useAppStore(s => s.audioPreset);
  const isSleeping     = useAppStore(s => s.isSleeping);
  const careLeaves     = useAppStore(s => s.careLeaves);

  const start          = useAppStore(s => s.start);
  const toggleDissipate= useAppStore(s => s.toggleDissipate);
  const nextQuote      = useAppStore(s => s.nextQuote);
  const setAudioPlaying= useAppStore(s => s.setAudioPlaying);
  const setAudioPreset = useAppStore(s => s.setAudioPreset);
  const setSleeping    = useAppStore(s => s.setSleeping);
  const showToast      = useAppStore(s => s.showToast);

  // Kiro store
  const kiroStartSleep = useKiroStore(s => s.startSleep);
  const kiroWakeUp     = useKiroStore(s => s.wakeUp);
  const kiroAddWater   = useKiroStore(s => s.addWater);
  const kiroAddMeal    = useKiroStore(s => s.addMeal);
  const kiroTickDecay  = useKiroStore(s => s.tickDecay);

  // Modal state (local — avoids unnecessary re-renders elsewhere)
  const [modal, setModal] = useState(null); // 'vault' | 'mailbox' | 'care' | 'note' | null
  const [kiroOpen, setKiroOpen] = useState(false);

  // Hooks
  usePSTClock();
  useWeather();
  useGitHubSync();
  const audio = useWebAudio(audioPreset);

  // Get derived quote
  const QUOTES = [
    { text: "You are the calm in my chaos and the light in my darkest nights.", author: "P" },
    { text: "Every second I'm not with you, I'm counting down the seconds until I am.", author: "P" },
    { text: "The stars shine a little brighter because you exist, Yangiee.", author: "P" },
    { text: "In every universe, every timeline, every version of life — I choose you.", author: "P" },
    { text: "You are my favorite notification, my favorite distraction, my favorite everything.", author: "P" },
    { text: "Distance means so little when someone means so much.", author: "Tom McNeal" },
    { text: "Whatever our souls are made of, his and mine are the same.", author: "Emily Brontë" },
    { text: "I carry your heart with me, I carry it in my heart.", author: "e.e. cummings" },
    { text: "You are braver than you believe, stronger than you seem, and more loved than you know.", author: "A.A. Milne" },
    { text: "Be gentle with yourself today — you're doing better than you think.", author: "P" },
    { text: "Kahit malayo, nandito ako para sayo, Yangiee. Always.", author: "P" },
    { text: "Your laugh is my favorite sound in the universe.", author: "P" },
    { text: "Drink your water, eat your meals, rest your heart — Kiro needs you healthy.", author: "Kiro" },
    { text: "The world is better, warmer, and infinitely more beautiful because you're in it.", author: "P" },
    { text: "One day or day one — you decide. But every day with you is day one.", author: "P" },
  ];
  const currentQuote = QUOTES[quoteIndex % QUOTES.length];

  // Kiro decay tick syncs with app start
  useEffect(() => {
    if (!isStarted) return;
    const id = setInterval(kiroTickDecay, 60_000);
    return () => clearInterval(id);
  }, [isStarted, kiroTickDecay]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleStart = useCallback(() => start(), [start]);

  const handleBgClick = useCallback((e) => {
    if (!isStarted || kiroOpen) return;
    if (e && (e.clientX !== undefined || (e.touches && e.touches[0]))) {
      const x = e.clientX ?? e.touches?.[0]?.clientX;
      const y = e.clientY ?? e.touches?.[0]?.clientY;
      if (x !== undefined && y !== undefined) {
        window.dispatchEvent(new CustomEvent('trigger-liquid-ripple', { detail: { x, y } }));
      }
    }
    toggleDissipate();
  }, [isStarted, kiroOpen, toggleDissipate]);


  const handlePlanetClick = useCallback(() => {
    if (!isStarted || isDissipated) return;
    setKiroOpen(true);
  }, [isStarted, isDissipated]);

  const handleAudioToggle = useCallback(() => {
    const nowPlaying = audio.toggle(audioPreset);
    setAudioPlaying(nowPlaying);
  }, [audio, audioPreset, setAudioPlaying]);

  const handlePresetChange = useCallback((preset) => {
    setAudioPreset(preset);
    audio.changePreset(preset);
    if (!audioPlaying) { audio.toggle(preset); setAudioPlaying(true); }
  }, [audio, audioPlaying, setAudioPreset, setAudioPlaying]);

  const handleSleepToggle = useCallback(() => {
    if (isSleeping) {
      setSleeping(false, null);
      kiroWakeUp();
      showToast('Good morning, Yangiee! Kiro woke up too ☀️');
    } else {
      setSleeping(true, Date.now());
      kiroStartSleep();
      showToast('Goodnight, Yangiee. Sleep well, my love 🌙');
    }
  }, [isSleeping, setSleeping, kiroWakeUp, kiroStartSleep, showToast]);

  const handleSyncUpdate = useCallback(async () => {
    try {
      showToast('Checking GitHub for updates…');
      const rawUrl = `https://raw.githubusercontent.com/Patkik/GoodnightYangiee/main/version.json?t=${Date.now()}`;
      const res = await fetch(rawUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Sync check failed (${res.status})`);

      const data = await res.json();
      const remoteCommit = data.commit;
      const storedCommit = localStorage.getItem('gn_sync_commit');

      if (!storedCommit) {
        localStorage.setItem('gn_sync_commit', remoteCommit || 'fresh');
        showToast('Sync bookmark saved. You’re ready to update.', 2800);
        return;
      }

      if (remoteCommit && storedCommit !== remoteCommit) {
        localStorage.setItem('gn_sync_commit', remoteCommit);
        showToast(`Sync update found — refreshing now ✨`, 3200);
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(reg => reg.update()));
          } catch {}
        }
        setTimeout(() => window.location.reload(), 900);
      } else {
        showToast('Your app is already synced with the latest update.', 2600);
      }
    } catch (e) {
      console.warn('Manual sync update error:', e);
      showToast('Sync check failed. Please try again in a moment.', 2800);
    }
  }, [showToast]);

  // ── Care bubble integrations (syncs with Kiro stats)
  const handleCareAction = useCallback((action) => {
    if (action === 'water') kiroAddWater();
    if (action === 'ate')   kiroAddMeal('meal');
  }, [kiroAddWater, kiroAddMeal]);

  return (
    <>
      {/* Film grain overlay */}
      <div className="film-grain" />

      {/* Corner filigrees */}
      <Filigrees visible={isStarted && !isDissipated} />

      {/* Touch & pointer effects canvas (ripples + aurora dust) */}
      <TouchEffectsCanvas />

      {/* 3D Sanctuary Scene (background) */}

      <Suspense fallback={null}>
        {isStarted && (
          <SanctuaryScene
            timeOfDay={timeOfDay}
            onPlanetClick={handlePlanetClick}
            isKiroMode={kiroOpen}
          />
        )}
      </Suspense>

      {/* Background click to dissipate (z-index 8 — above canvas, below UI) */}
      {isStarted && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 8, pointerEvents: kiroOpen ? 'none' : 'auto' }}
          onClick={handleBgClick}
        />
      )}

      {/* Main app UI layer */}
      {isStarted && (
        <div className={`app-ui visible ${isDissipated ? 'dissipated' : ''}`}>
          {/* Header */}
          <SanctuaryHeader
            onVault={() => setModal('vault')}
            onMailbox={() => setModal('mailbox')}
            onSyncUpdate={handleSyncUpdate}
          />

          {/* Hero center scroll area */}
          <div className="hero-center">
            <HeroHeading greeting={greeting} pstDate={pstDate} />

            <ConnectionCard
              daysMet={daysMet}
              herWeather={herWeather}
              yourWeather={yourWeather}
            />

            <QuickActions
              onNote={() => setModal('note')}
              onCare={() => setModal('care')}
              onKiro={() => setKiroOpen(true)}
            />

            <QuoteCard quote={currentQuote} onRefresh={nextQuote} />

            <div className="scroll-indicator-compact dissipatable" style={{ fontFamily: 'var(--font-heading)', fontSize: '9px', letterSpacing: '2px', color: 'var(--subtext-gray)', opacity: 0.7 }}>
              · · ·
            </div>
          </div>

          {/* Zone C — fixed bottom */}
          <div className="zone-c-container">
            <AudioPill
              isPlaying={audioPlaying}
              preset={audioPreset}
              onToggle={handleAudioToggle}
              onPresetChange={handlePresetChange}
            />
            <SleepSwitch isSleeping={isSleeping} onToggle={handleSleepToggle} timeOfDay={timeOfDay} />
          </div>

          {/* Care bubble FAB */}
          <CareBubbleBtn leaves={careLeaves} onClick={() => setModal('care')} />
        </div>
      )}

      {/* Dissipation restore hint */}
      {isStarted && (
        <DissipationHint
          isDissipated={isDissipated}
          onRestore={() => toggleDissipate()}
        />
      )}

      {/* Pop Toast */}
      <PopToast msg={toastMsg} visible={toastVisible} />

      {/* Weather Banner */}
      <WeatherBanner msg={wBannerMsg} visible={wBannerVisible} />

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}
      <VaultModal isOpen={modal === 'vault'} onClose={() => setModal(null)} />
      <MailboxModal isOpen={modal === 'mailbox'} onClose={() => setModal(null)} />
      <CareModal isOpen={modal === 'care'} onClose={() => setModal(null)} />
      <NoteModal isOpen={modal === 'note'} onClose={() => setModal(null)} />

      {/* ── KIRO HAVEN ──────────────────────────────────────────────────────── */}
      <KiroHaven
        isOpen={kiroOpen}
        onClose={() => setKiroOpen(false)}
        timeOfDay={timeOfDay}
      />

      {/* Start overlay (renders on top of everything until tapped) */}
      {!isStarted && <StartOverlay onStart={handleStart} />}
    </>
  );
}
