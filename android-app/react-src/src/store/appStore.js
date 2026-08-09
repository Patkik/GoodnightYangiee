import { create } from 'zustand';
import { db, careJarRef, mailboxRef, onSnapshot, setDoc, getDoc } from '../firebase.js';

// ─── PST Helpers (Philippine Standard Time, UTC+8) ───────────────────────────
let pstNetworkOffsetMs = 0;

export function syncPSTNetworkTime(fetchedPstMs) {
  if (fetchedPstMs) {
    pstNetworkOffsetMs = fetchedPstMs - Date.now();
  }
}

export function getPSTDate() {
  const nowMs = Date.now() + pstNetworkOffsetMs;
  const d = new Date(nowMs);
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    }).formatToParts(d);
    const map = {};
    parts.forEach(p => map[p.type] = p.value);
    let h = parseInt(map.hour, 10);
    if (h === 24) h = 0;
    const hStr = h.toString().padStart(2, '0');
    return new Date(`${map.year}-${map.month}-${map.day}T${hStr}:${map.minute}:${map.second}+08:00`);
  } catch (e) {
    const utcMs = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utcMs + (8 * 3600000));
  }
}

function getTimeOfDay(hour) {
  if (hour >= 3 && hour < 6) return 'mornight';
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}
function getGreeting(tod) {
  const map = {
    mornight: 'Good Mornight',
    morning: 'Good Morning',
    afternoon: 'Good Afternoon',
    evening: 'Good Evening',
    night: 'Good Night'
  };
  return map[tod] || 'Good Night';
}


// Days met: January 27, 2024 (Philippine Standard Time baseline)
const MET_DATE = new Date('2024-01-27T00:00:00+08:00');
function getDaysMet() {
  const now = Date.now();
  return Math.floor((now - MET_DATE.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── QUOTES ──────────────────────────────────────────────────────────────────
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

// ─── STORE ───────────────────────────────────────────────────────────────────
export const useAppStore = create((set, get) => ({
  // ── App lifecycle
  isStarted: false,
  isDissipated: false,
  activeModal: null, // 'vault' | 'mailbox' | 'care' | 'kiro' | null

  // ── Time / Greeting
  pstDate: getPSTDate(),
  timeOfDay: getTimeOfDay(getPSTDate().getHours()),
  greeting: getGreeting(getTimeOfDay(getPSTDate().getHours())),
  daysMet: getDaysMet(),

  // ── Weather
  herWeather: null,
  yourWeather: null,

  // ── Quote
  quoteIndex: Math.floor(Math.random() * QUOTES.length),
  get currentQuote() { return QUOTES[get().quoteIndex]; },

  // ── Care Jar
  careLeaves: 0,
  careStreak: 0,
  careChecks: { ate: false, water: false, slept: false, vitamins: false },
  careLastDate: '',

  // ── Mailbox
  mailboxNotes: [],
  mailboxInput: '',

  // ── Audio
  audioPlaying: false,
  audioPreset: 'rain',

  // ── Sleep
  isSleeping: false,
  sleepStartTime: null,

  // ── Pop Toast
  toastMsg: '',
  toastVisible: false,

  // ── Weather Banner
  weatherBannerMsg: '',
  weatherBannerVisible: false,

  // ── Actions ─────────────────────────────────────────────────────────────────

  start: () => set({ isStarted: true }),

  toggleDissipate: () => set(s => ({ isDissipated: !s.isDissipated })),

  setModal: (modal) => set({ activeModal: modal }),

  tickClock: () => {
    const d = getPSTDate();
    const tod = getTimeOfDay(d.getHours());
    set({ pstDate: d, timeOfDay: tod, greeting: getGreeting(tod), daysMet: getDaysMet() });
  },

  nextQuote: () => set(s => ({ quoteIndex: (s.quoteIndex + 1) % QUOTES.length })),

  showToast: (msg, duration = 3000) => {
    set({ toastMsg: msg, toastVisible: true });
    setTimeout(() => set({ toastVisible: false }), duration);
  },

  showWeatherBanner: (msg, duration = 6000) => {
    set({ weatherBannerMsg: msg, weatherBannerVisible: true });
    setTimeout(() => set({ weatherBannerVisible: false }), duration);
  },

  setHerWeather: (w) => set({ herWeather: w }),
  setYourWeather: (w) => set({ yourWeather: w }),

  setAudioPlaying: (v) => set({ audioPlaying: v }),
  setAudioPreset: (v) => set({ audioPreset: v }),

  // ── Sleep
  setSleeping: (val, timestamp = null) => set({ isSleeping: val, sleepStartTime: timestamp }),

  // ── Care Jar ─────────────────────────────────────────────────────────────────
  initCareFromFirebase: (data) => {
    const today = getPSTDate().toISOString().slice(0, 10);
    const isToday = data.lastDate === today;
    set({
      careLeaves: data.leaves || 0,
      careStreak: data.streak || 0,
      careLastDate: data.lastDate || '',
      careChecks: isToday ? (data.checks || { ate: false, water: false, slept: false, vitamins: false })
                          : { ate: false, water: false, slept: false, vitamins: false },
    });
  },

  checkCareAction: async (action) => {
    const { careChecks, careLeaves, careStreak, careLastDate, showToast } = get();
    if (careChecks[action]) return;

    const today = getPSTDate().toISOString().slice(0, 10);
    const newChecks = { ...careChecks, [action]: true };
    const newLeaves = careLeaves + 1;
    const isNewDay = careLastDate !== today;
    const allDone = Object.values(newChecks).every(Boolean);
    const newStreak = isNewDay && allDone ? careStreak + 1 : careStreak;

    set({ careChecks: newChecks, careLeaves: newLeaves, careStreak: newStreak, careLastDate: today });

    const messages = {
      ate: 'Kiro got a little meal! 🍲',
      water: 'Water bowl filled! 💧',
      slept: 'Kiro rested with you! ✨',
      vitamins: 'Feeling healthy! 💊',
    };
    showToast(messages[action]);

    try {
      await setDoc(careJarRef(), { leaves: newLeaves, streak: newStreak, lastDate: today, checks: newChecks }, { merge: true });
    } catch (e) { console.warn('Care jar sync error', e); }
  },

  // ── Mailbox & ntfy.sh Integration ──────────────────────────────────────────
  setMailboxNotes: (notes) => set({ mailboxNotes: notes }),
  setMailboxInput: (v) => set({ mailboxInput: v }),

  sendMailboxNote: async (text, senderTag = 'Yangiee') => {
    if (!text.trim()) return;
    const noteText = text.trim();
    const note = { text: noteText, sender: senderTag, ts: Date.now() };
    const { mailboxNotes } = get();
    const updated = [note, ...mailboxNotes].slice(0, 40);
    set({ mailboxNotes: updated, mailboxInput: '' });

    // 1. Sync to Firebase
    try {
      await setDoc(mailboxRef(), { notes: updated }, { merge: false });
    } catch (e) { console.warn('Mailbox sync error', e); }

    // 2. Publish to ntfy.sh channel so Patrick gets an instant push notification
    try {
      await fetch('https://ntfy.sh/hakdog_starlight_mailbox', {
        method: 'POST',
        headers: {
          'Title': `Starlight Mailbox from ${senderTag} 💌`,
          'Tags': 'envelope,sparkles',
        },
        body: noteText,
      });
    } catch (e) { console.warn('ntfy publish error', e); }
  },

  syncNtfyToMailbox: async () => {
    try {
      const res = await fetch('https://ntfy.sh/hakdog_starlight_mailbox/json?poll=1&since=24h');
      if (!res.ok) return;
      const text = await res.text();
      const lines = text.trim().split('\n').filter(Boolean);
      const incoming = [];

      for (const line of lines) {
        try {
          const item = JSON.parse(line);
          if (item.event === 'message' && item.message) {
            // Check if sender title indicates external or internal
            const sender = item.title?.includes('Patrick') ? 'Patrick' : (item.title?.includes('Yangiee') ? 'Yangiee' : 'Patrick');
            incoming.push({
              text: item.message,
              sender,
              ts: item.time ? item.time * 1000 : Date.now(),
              id: item.id
            });
          }
        } catch (err) {}
      }

      if (incoming.length > 0) {
        const { mailboxNotes } = get();
        let changed = false;
        const currentTexts = new Set(mailboxNotes.map(n => `${n.text}_${Math.floor(n.ts / 2000)}`));
        const newNotes = [...mailboxNotes];

        let hasNewPatrickMsg = false;
        let lastPatrickText = '';

        for (const item of incoming.reverse()) {
          const key = `${item.text}_${Math.floor(item.ts / 2000)}`;
          if (!currentTexts.has(key)) {
            currentTexts.add(key);
            newNotes.unshift({ text: item.text, sender: item.sender, ts: item.ts });
            changed = true;

            if (item.sender === 'Patrick') {
              hasNewPatrickMsg = true;
              lastPatrickText = item.text;
            }
          }
        }

        if (changed) {
          const updated = newNotes.slice(0, 40);
          set({ mailboxNotes: updated });
          try {
            await setDoc(mailboxRef(), { notes: updated }, { merge: false });
          } catch (e) {}

          if (hasNewPatrickMsg && lastPatrickText) {
            get().showToast(`💌 Message from Patrick: ${lastPatrickText}`);
            try {
              if (window.AndroidHost?.sendNotification) {
                window.AndroidHost.sendNotification("Message from Patrick 💌", lastPatrickText);
              }
            } catch (err) {}
          }
        }

      }
    } catch (e) {
      console.warn('ntfy poll error', e);
    }
  },
}));

