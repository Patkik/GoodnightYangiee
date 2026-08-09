import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/appStore.js';
import { careJarRef, mailboxRef, onSnapshot } from '../../firebase.js';

// ─── SVG Icon helpers ─────────────────────────────────────────────────────────
const SVG = ({ d, size = 16, color = 'currentColor', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// ─── Care Jar SVG leaves ──────────────────────────────────────────────────────
const LEAF_COLORS = ['#94E2D5', '#A6E3A1', '#CBA6F7', '#F5C2E7', '#F9E2AF'];
function CareLeaf({ idx }) {
  const color = LEAF_COLORS[idx % LEAF_COLORS.length];
  return (
    <svg className="care-leaf" width="28" height="28" viewBox="0 0 28 28" style={{ animationDelay: `${idx * 0.05}s` }}>
      <ellipse cx="14" cy="16" rx="8" ry="11" fill={color} opacity="0.85" transform="rotate(-15 14 14)" />
      <line x1="14" y1="6" x2="14" y2="24" stroke={color} strokeWidth="1.2" opacity="0.6" />
    </svg>
  );
}

// ─── START OVERLAY ────────────────────────────────────────────────────────────
export function StartOverlay({ onStart }) {
  return (
    <div className="start-overlay" onClick={onStart}>
      <div className="start-logo">Hakdog</div>
      <div className="start-sub">Celestial Sanctuary</div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', letterSpacing: '2px', color: 'var(--subtext-gray)', textAlign: 'center', maxWidth: '240px', lineHeight: 1.6, marginBottom: '40px' }}>
        A little universe built<br />just for you, Yangiee.
      </div>
      <div className="start-cta">Tap to enter</div>
    </div>
  );
}

// ─── DISSIPATION HINT ─────────────────────────────────────────────────────────
export function DissipationHint({ isDissipated, onRestore }) {
  return (
    <div className={`dissipation-hint ${isDissipated ? 'visible' : ''}`} onClick={onRestore}>
      Tap to restore sanctuary
    </div>
  );
}

// ─── FILIGREES ────────────────────────────────────────────────────────────────
const FiligreeNode = () => (
  <path d="M0 30 Q15 0 30 15 Q15 30 0 30 M30 0 Q15 20 0 20 Q15 5 30 0" />
);
export function Filigrees({ visible }) {
  return (
    <>
      {['f-tl', 'f-tr', 'f-bl', 'f-br'].map(cls => (
        <div key={cls} className={`filigree ${cls} ${visible ? 'visible' : ''}`}>
          <svg viewBox="0 0 30 30"><FiligreeNode /></svg>
        </div>
      ))}
    </>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
export function SanctuaryHeader({ onVault, onMailbox }) {
  return (
    <header className="sanctuary-header dissipatable">
      <div className="brand">
        <img src="icon-192.png" className="brand-logo-img" alt="Logo" />
        <div className="brand-text-col">
          <div className="brand-title">Hakdog</div>
          <div className="brand-sub">Celestial Sanctuary</div>
        </div>
      </div>
      <div className="header-nav-icons">
        <button className="nav-icon-btn" onClick={onMailbox} id="mailbox-btn" title="Starlight Mailbox">
          <SVG d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" size={15} />
        </button>
        <button className="nav-icon-btn" onClick={onVault} id="vault-btn" title="Secret Vault">
          <SVG d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" size={15} />
          <div className="gyro-dot" />
        </button>
      </div>
    </header>
  );
}

// ─── HERO HEADING ─────────────────────────────────────────────────────────────
export function HeroHeading({ greeting, pstDate }) {
  const timeStr = pstDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' });
  const dayStr = pstDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Manila' });
  return (
    <>
      <div className="hero-heading">
        <span>{greeting},</span>
        <br />Yangiee
      </div>
      <div className="live-clock">{timeStr} PHT — {dayStr}</div>
    </>
  );
}


// ─── WEATHER ICONS ────────────────────────────────────────────────────────────
const WEATHER_PATHS = {
  clear:        'M12 3v1m9 8h-1M4 12H3m15.36-6.36-.71.71M6.34 17.66l-.71.71M17.66 17.66l-.71-.71M6.34 6.34l-.71-.71M12 17a5 5 0 100-10 5 5 0 000 10z',
  hot:          'M12 3v1m9 8h-1M4 12H3m15.36-6.36-.71.71M6.34 17.66l-.71.71M17.66 17.66l-.71-.71M6.34 6.34l-.71-.71M12 17a5 5 0 100-10 5 5 0 000 10z',
  'extreme-hot':'M12 2L8 6H3l3 3-1 5 5-2.5L15 14l-1-5 3-3h-5z',
  'partly-cloudy':'M5 8a4 4 0 018 0m-4-4v1M18 14a6 6 0 11-12 0h12z',
  cloudy:       'M18 10a6 6 0 10-11.94 1.5A5 5 0 006 20h12a4 4 0 000-10z',
  'rain-light': 'M18 10a6 6 0 10-11.94 1.5A5 5 0 006 20h12a4 4 0 000-10zM8 22l-1 3M12 22v3M16 22l1 3',
  rain:         'M18 10a6 6 0 10-11.94 1.5A5 5 0 006 20h12a4 4 0 000-10zM8 22l-1 4M12 22v4M16 22l1 4',
  'rain-heavy': 'M18 10a6 6 0 10-11.94 1.5A5 5 0 006 20h12a4 4 0 000-10zM7 22l-2 4M11 22l-1 4M15 22v4',
  thunder:      'M18 10a6 6 0 10-11.94 1.5A5 5 0 006 20h12a4 4 0 000-10zM13 20l-3 5h4l-3 5',
  snow:         'M18 10a6 6 0 10-11.94 1.5A5 5 0 006 20h12a4 4 0 000-10zM8 23h1M12 22v2M15 23h1',
  fog:          'M4 12h16M4 16h16M4 8h16',
};
function WeatherIcon({ icon, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="weather-icon-svg">
      <path d={WEATHER_PATHS[icon] || WEATHER_PATHS.clear} />
    </svg>
  );
}

// ─── CONNECTION CARD ──────────────────────────────────────────────────────────
export function ConnectionCard({ daysMet, herWeather, yourWeather }) {
  return (
    <div className="unified-connection-card dissipatable">
      <div className="connection-badge-top">
        <span className="days-icon">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--pastel-pink)" strokeWidth="2.5" strokeLinecap="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </span>
        <span className="days-count">{daysMet}</span>
        <span>days since the day we met</span>
      </div>

      <div className="connection-weather-row">
        {/* Her weather */}
        <div className="connection-weather-col her-card">
          <span className="weather-loc-tag">Yangiee</span>
          <div className="weather-info-main">
            {herWeather ? (
              <>
                <WeatherIcon icon={herWeather.icon || 'clear'} />
                <span className="weather-temp">{herWeather.temp}°C</span>
              </>
            ) : <span className="weather-temp" style={{ fontSize: '11px', color: 'var(--subtext-gray)' }}>Loading…</span>}
          </div>
          <span className="weather-city">{herWeather?.city || 'Capas, Tarlac'}</span>
        </div>

        <div className="connection-divider" />

        {/* Your weather */}
        <div className="connection-weather-col you-card">
          <span className="weather-loc-tag">Patrick</span>
          <div className="weather-info-main">
            {yourWeather ? (
              <>
                <WeatherIcon icon={yourWeather.icon || 'clear'} />
                <span className="weather-temp">{yourWeather.temp}°C</span>
              </>
            ) : <span className="weather-temp" style={{ fontSize: '11px', color: 'var(--subtext-gray)' }}>Loading…</span>}
          </div>
          <span className="weather-city">{yourWeather?.city || 'Malaybalay, Bukidnon'}</span>
        </div>
      </div>

      <div className="connection-card-footer">
        938 km apart · Under the same Philippine sky 🌌
      </div>
    </div>
  );
}


// ─── QUICK ACTIONS ────────────────────────────────────────────────────────────
const QuickSVG = ({ d }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="quick-action-icon">
    <path d={d} />
  </svg>
);
export function QuickActions({ onNote, onCare, onKiro }) {
  return (
    <div className="quick-action-row dissipatable">
      <button className="quick-action-btn" onClick={onNote} id="note-btn">
        <QuickSVG d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        Note
      </button>
      <button className="quick-action-btn" onClick={onCare} id="care-btn">
        <QuickSVG d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        Care
      </button>
      <button className="quick-action-btn" onClick={onKiro} id="planet-btn" style={{ borderColor: 'rgba(148,226,213,0.25)' }}>
        <QuickSVG d="M12 2a10 10 0 100 20A10 10 0 0012 2zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        Kiro
      </button>
    </div>
  );
}

// ─── QUOTE CARD ───────────────────────────────────────────────────────────────
export function QuoteCard({ quote, onRefresh }) {
  return (
    <div className="quote-card-compact dissipatable">
      <div className="quote-card-header">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--amber-glow)"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" /></svg>
        <button className="quote-refresh-btn" onClick={onRefresh} id="quote-refresh-btn">↺</button>
      </div>
      <div className="quote-text">"{quote?.text}"</div>
      <div className="quote-author">— {quote?.author}</div>
    </div>
  );
}

// ─── AUDIO PILL ───────────────────────────────────────────────────────────────
const PRESETS = [
  { key: 'rain', label: 'Rain' },
  { key: 'thunder', label: 'Thunderstorm' },
  { key: 'ocean', label: 'Ocean' },
  { key: 'forest', label: 'Forest' },
  { key: 'lofi', label: 'Lo-Fi' },
];
export function AudioPill({ isPlaying, preset, onToggle, onPresetChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="compact-audio-pill dissipatable">
      <div className="audio-left">
        <button className="sound-play-toggle" onClick={onToggle} id="audio-toggle-btn">
          {isPlaying
            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
          }
        </button>
        <div className="sound-now-playing">{PRESETS.find(p => p.key === preset)?.label || 'Rain'}</div>
      </div>
      <div className="audio-right" style={{ position: 'relative' }}>
        <button className="track-selector-btn" onClick={() => setOpen(o => !o)} id="track-selector-btn">
          {open ? '▲ Sounds' : '▼ Sounds'}
        </button>
        {open && (
          <div style={{ position: 'absolute', bottom: '110%', right: 0, background: 'rgba(30,30,46,0.97)', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '6px', display: 'flex', flexDirection: 'column', gap: '2px', backdropFilter: 'blur(16px)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 50, minWidth: '110px' }}>
            {PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => { onPresetChange(p.key); setOpen(false); }}
                style={{ padding: '6px 10px', borderRadius: '8px', background: preset === p.key ? 'rgba(245,194,231,0.2)' : 'transparent', border: 'none', color: preset === p.key ? 'var(--pastel-pink)' : 'var(--subtext-gray)', fontFamily: 'var(--font-heading)', fontSize: '9.5px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SLEEP SWITCH ─────────────────────────────────────────────────────────────
export function SleepSwitch({ isSleeping, onToggle }) {
  return (
    <div className="sleep-switch-container dissipatable">
      <div className="sleep-switch" onClick={onToggle} id="sleep-switch">
        <div className={`sleep-switch-bg ${isSleeping ? 'sleeping' : ''}`}>
          <span className="sleep-switch-icon">
            {isSleeping
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" /><line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" /></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" /></svg>
            }
          </span>
          {isSleeping ? 'GOOD MORNING — TAP TO WAKE UP' : 'GOODNIGHT — HOLD TO SLEEP'}
        </div>
      </div>
    </div>
  );
}

// ─── CARE BUBBLE BUTTON ───────────────────────────────────────────────────────
export function CareBubbleBtn({ leaves, onClick }) {
  return (
    <div className="care-bubble-container dissipatable">
      <button className="care-bubble-btn" onClick={onClick} id="care-bubble-btn">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
      </button>
      {leaves > 0 && <div className="care-bubble-badge">{leaves > 99 ? '99+' : leaves}</div>}
    </div>
  );
}

// ─── POP TOAST ────────────────────────────────────────────────────────────────
export function PopToast({ msg, visible }) {
  return (
    <div className={`pop-toast ${visible ? 'show' : ''}`}>{msg}</div>
  );
}

// ─── WEATHER BANNER ───────────────────────────────────────────────────────────
export function WeatherBanner({ msg, visible }) {
  return (
    <div className={`weather-banner ${visible ? 'show' : ''}`}>{msg}</div>
  );
}

// ─── VAULT MODAL ──────────────────────────────────────────────────────────────
const VAULT_PIN = '0318';
export function VaultModal({ isOpen, onClose }) {
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);
  const [note, setNote] = useState(() => {
    try { return localStorage.getItem('vault_note') || ''; } catch { return ''; }
  });

  const handleKey = (k) => {
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      if (next === VAULT_PIN) {
        setTimeout(() => setUnlocked(true), 200);
      } else {
        setError(true);
        setTimeout(() => { setPin(''); setError(false); }, 800);
      }
    }
  };

  const handleSave = () => {
    try { localStorage.setItem('vault_note', note); } catch {}
    onClose();
  };

  const handleClose = () => { setPin(''); setUnlocked(false); setError(false); onClose(); };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="modal-title">{unlocked ? 'Secret Vault' : 'Enter PIN'}</div>
          <button className="modal-close-btn" onClick={handleClose}>✕</button>
        </div>

        {!unlocked ? (
          <>
            <div className="vault-pin-display">
              {[0,1,2,3].map(i => (
                <div key={i} className={`vault-pin-dot ${pin.length > i ? (error ? 'error' : 'filled') : ''}`} />
              ))}
            </div>
            <div className="vault-keypad">
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
                <button
                  key={i}
                  className="vault-key-btn"
                  onClick={() => k === '⌫' ? setPin(p => p.slice(0,-1)) : k ? handleKey(k) : null}
                  style={{ opacity: k ? 1 : 0, pointerEvents: k ? 'auto' : 'none' }}
                >
                  {k}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="vault-content">
            <textarea
              className="vault-note-area"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Your private thoughts, memories, feelings… only you can see this."
            />
            <button className="vault-save-btn" onClick={handleSave}>Save & Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAILBOX MODAL ────────────────────────────────────────────────────────────
export function MailboxModal({ isOpen, onClose }) {
  const notes = useAppStore(s => s.mailboxNotes);
  const input = useAppStore(s => s.mailboxInput);
  const setInput = useAppStore(s => s.setMailboxInput);
  const sendNote = useAppStore(s => s.sendMailboxNote);
  const setNotes = useAppStore(s => s.setMailboxNotes);

  const syncNtfy = useAppStore(s => s.syncNtfyToMailbox);

  useEffect(() => {
    if (!isOpen) return;
    syncNtfy();
    const unsub = onSnapshot(mailboxRef(), snap => {
      if (snap.exists()) setNotes(snap.data().notes || []);
    });
    const interval = setInterval(syncNtfy, 10_000); // poll ntfy every 10s while modal is open
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [isOpen, setNotes, syncNtfy]);


  const handleSend = () => { if (input.trim()) sendNote(input.trim()); };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="modal-title">Starlight Mailbox</div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="mailbox-compose">
          <textarea
            className="mailbox-textarea"
            placeholder="Write a message across the stars…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            rows={2}
          />
          <button className="mailbox-send-btn" onClick={handleSend} disabled={!input.trim()} id="mailbox-send-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        <div className="mailbox-feed">
          {notes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--subtext-gray)', fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '1px' }}>
              No messages yet — write something beautiful.
            </div>
          )}
          {notes.map((n, i) => {
            const isMine = n.sender === 'Patrick';
            const date = new Date(n.ts);
            return (
              <div key={i} className={`mailbox-note ${isMine ? 'mine' : 'theirs'}`}>
                <div className="note-text">{n.text}</div>
                <div className="note-meta">
                  {n.sender} · {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── CARE MODAL ───────────────────────────────────────────────────────────────
const CARE_ACTIONS = [
  { key: 'ate', label: "I've eaten today", icon: 'M3 11l19-9-9 19-2-8-8-2z' },
  { key: 'water', label: "Drank 8 glasses", icon: 'M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z' },
  { key: 'slept', label: "Slept well", icon: 'M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z' },
  { key: 'vitamins', label: "Took vitamins", icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18' },
];

export function CareModal({ isOpen, onClose }) {
  const leaves = useAppStore(s => s.careLeaves);
  const streak = useAppStore(s => s.careStreak);
  const checks = useAppStore(s => s.careChecks);
  const checkAction = useAppStore(s => s.checkCareAction);
  const initCare = useAppStore(s => s.initCareFromFirebase);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = onSnapshot(careJarRef(), snap => {
      if (snap.exists()) initCare(snap.data());
    });
    return () => unsub();
  }, [isOpen, initCare]);

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="modal-title">Care Jar</div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="care-modal-body">
          {/* Leaf display */}
          <div className="care-jar-display">
            {Array.from({ length: Math.min(leaves, 30) }).map((_, i) => (
              <CareLeaf key={i} idx={i} />
            ))}
            {leaves === 0 && (
              <div style={{ color: 'var(--subtext-gray)', fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '1px', textAlign: 'center', padding: '20px 0' }}>
                Take care of yourself to fill this jar with leaves
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="care-action-grid">
            {CARE_ACTIONS.map(a => (
              <button
                key={a.key}
                className={`care-action-btn ${checks[a.key] ? 'checked' : ''}`}
                onClick={() => checkAction(a.key)}
                id={`care-${a.key}-btn`}
                disabled={checks[a.key]}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="care-action-icon">
                  <path d={a.icon} />
                </svg>
                {checks[a.key] ? '✓ Done' : a.label}
              </button>
            ))}
          </div>

          {/* Streak */}
          <div className="streak-section">
            <div>
              <div className="streak-label">Daily Streak</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '9px', color: 'var(--subtext-gray)', marginTop: '2px' }}>Complete all 4 to extend</div>
            </div>
            <div className="streak-count">{streak}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
