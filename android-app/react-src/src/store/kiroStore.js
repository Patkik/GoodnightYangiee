import { create } from 'zustand';
import { kiroRef, setDoc, getDoc, onSnapshot } from '../firebase.js';

// ─── Constants ───────────────────────────────────────────────────────────────
const DECAY_RATES = {
  food: 3.5 / 60,    // % per minute
  water: 5.0 / 60,   // % per minute
  energy: 4.0 / 60,  // % per minute (0 while sleeping)
};
const SMIN = 0.35;
const SMAX = 1.15;

export function calcWellbeing(food, water, energy) {
  return (food + water + energy) / 3;
}

export function calcScale(W) {
  return SMIN + (SMAX - SMIN) * Math.pow(W / 100, 2);
}

export function wellbeingTier(W) {
  if (W >= 85) return 'thriving';    // bouncy + hearts
  if (W >= 65) return 'happy';       // calm idle
  if (W >= 40) return 'okay';        // slow yawn
  if (W >= 15) return 'low';         // droopy, tiny blanket
  return 'critical';                  // pocket Kiro, sigh bubbles
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function applyDecay(stats, sleepMode, lastUpdated) {
  if (!lastUpdated) return stats;
  const now = Date.now();
  const minutesElapsed = (now - lastUpdated) / 60000;
  if (minutesElapsed < 0.1) return stats; // <6 seconds, skip

  const isSleeping = sleepMode?.is_sleeping;
  return {
    food:   Math.max(0, stats.food   - DECAY_RATES.food   * minutesElapsed),
    water:  Math.max(0, stats.water  - DECAY_RATES.water  * minutesElapsed),
    energy: Math.max(0, stats.energy - (isSleeping ? 0 : DECAY_RATES.energy) * minutesElapsed),
  };
}

// ─── STORE ───────────────────────────────────────────────────────────────────
export const useKiroStore = create((set, get) => ({
  // ── Pet state
  stats: { food: 70, water: 60, energy: 80 },
  sleepMode: { is_sleeping: false, sleep_start_time: null },
  lastUpdated: null,
  wellRestedUntil: null,
  treatPending: null,
  unlockedAccessories: [],
  logs: { water_glasses_today: 0, meals_today: 0, snacks_today: 0, log_date: todayStr() },

  // ── Init from Firebase ────────────────────────────────────────────────────
  initFromFirebase: (data) => {
    const decayed = applyDecay(data.stats, data.sleep_mode, data.last_updated?.toMillis?.() || data.last_updated);
    set({
      stats: decayed,
      sleepMode: data.sleep_mode || { is_sleeping: false, sleep_start_time: null },
      lastUpdated: Date.now(),
      wellRestedUntil: data.well_rested_until || null,
      treatPending: data.treat_pending || null,
      unlockedAccessories: data.unlocked_accessories || [],
      logs: data.logs || { water_glasses_today: 0, meals_today: 0, snacks_today: 0, log_date: todayStr() },
    });
  },

  // ── Sync to Firebase ─────────────────────────────────────────────────────
  syncToFirebase: async () => {
    const { stats, sleepMode, wellRestedUntil, unlockedAccessories, logs } = get();
    try {
      await setDoc(kiroRef(), {
        stats,
        sleep_mode: sleepMode,
        last_updated: Date.now(),
        well_rested_until: wellRestedUntil,
        treat_pending: null,
        unlocked_accessories: unlockedAccessories,
        logs,
      }, { merge: false });
    } catch (e) { console.warn('Kiro sync error', e); }
  },

  // ── Stat actions ──────────────────────────────────────────────────────────
  addWater: () => {
    const { stats, logs, syncToFirebase } = get();
    const today = todayStr();
    const glasses = logs.log_date === today ? logs.water_glasses_today : 0;
    if (glasses >= 8) return; // max 8 glasses
    set({
      stats: { ...stats, water: Math.min(100, stats.water + 15) },
      logs: { ...logs, water_glasses_today: glasses + 1, log_date: today },
      lastUpdated: Date.now(),
    });
    syncToFirebase();
  },

  addMeal: (type = 'meal') => {
    const { stats, logs, syncToFirebase } = get();
    const today = todayStr();
    const meals = logs.log_date === today ? logs.meals_today : 0;
    const snacks = logs.log_date === today ? logs.snacks_today : 0;
    if (type === 'snack' && snacks >= 2) return;
    if (type === 'meal' && meals >= 3) return;

    const gain = type === 'snack' ? 15 : 35;
    set({
      stats: { ...stats, food: Math.min(100, stats.food + gain) },
      logs: {
        ...logs,
        meals_today:  type === 'meal'  ? meals + 1 : meals,
        snacks_today: type === 'snack' ? snacks + 1 : snacks,
        log_date: today,
      },
      lastUpdated: Date.now(),
    });
    syncToFirebase();
  },

  startSleep: () => {
    const { stats, syncToFirebase } = get();
    const now = Date.now();
    set({
      sleepMode: { is_sleeping: true, sleep_start_time: now },
      lastUpdated: now,
    });
    syncToFirebase();
  },

  wakeUp: () => {
    const { sleepMode, stats, syncToFirebase } = get();
    if (!sleepMode.is_sleeping || !sleepMode.sleep_start_time) return;

    const hoursSlept = (Date.now() - sleepMode.sleep_start_time) / 3600000;
    let energy, wellRestedUntil = null;

    if (hoursSlept >= 7 && hoursSlept <= 9) {
      energy = 100;
      wellRestedUntil = Date.now() + 24 * 3600000; // 24h aura
    } else if (hoursSlept < 6) {
      energy = Math.min(100, hoursSlept * 12.5);
    } else {
      energy = 80; // oversleep
    }

    set({
      stats: { ...stats, energy },
      sleepMode: { is_sleeping: false, sleep_start_time: null },
      wellRestedUntil,
      lastUpdated: Date.now(),
    });
    syncToFirebase();
  },

  claimTreat: () => {
    const { treatPending, stats, syncToFirebase } = get();
    if (!treatPending) return;
    const field = treatPending.stat || 'food';
    set({
      stats: { ...stats, [field]: Math.min(100, stats[field] + 20) },
      treatPending: null,
      lastUpdated: Date.now(),
    });
    syncToFirebase();
  },

  // ── Tick decay every minute ───────────────────────────────────────────────
  tickDecay: () => {
    const { stats, sleepMode, lastUpdated } = get();
    if (!lastUpdated) return;
    const decayed = applyDecay(stats, sleepMode, lastUpdated);
    set({ stats: decayed, lastUpdated: Date.now() });
  },

  // ── Check weekly milestone unlocks ───────────────────────────────────────
  checkMilestones: () => {
    const { stats, unlockedAccessories } = get();
    const w = calcWellbeing(stats.food, stats.water, stats.energy);
    const unlocked = [...unlockedAccessories];
    let changed = false;
    if (w >= 75 && !unlocked.includes('string_lights')) { unlocked.push('string_lights'); changed = true; }
    if (w >= 75 && !unlocked.includes('flower_pot')) { unlocked.push('flower_pot'); changed = true; }
    if (changed) { set({ unlockedAccessories: unlocked }); get().syncToFirebase(); }
  },
}));
