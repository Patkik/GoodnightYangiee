import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore.js';

import { syncPSTNetworkTime } from '../store/appStore.js';

async function fetchPSTNetworkTime() {
  try {
    const res = await fetch('https://timeapi.io/api/v1/time/current/zone?timeZone=Asia/Manila');
    if (res.ok) {
      const data = await res.json();
      if (data.dateTime) {
        const remoteDate = new Date(data.dateTime + '+08:00');
        syncPSTNetworkTime(remoteDate.getTime());
        return;
      }
    }
  } catch (e) {}

  try {
    const res2 = await fetch('https://worldtimeapi.org/api/timezone/Asia/Manila');
    if (res2.ok) {
      const d2 = await res2.json();
      if (d2.datetime) {
        const remoteDate = new Date(d2.datetime);
        syncPSTNetworkTime(remoteDate.getTime());
      }
    }
  } catch (e2) {}
}

/** Provides a live PST clock tick and triggers 6 AM, 12 PM, 9 PM meal reminders. */
export function usePSTClock() {
  const tickClock = useAppStore(s => s.tickClock);
  const showToast = useAppStore(s => s.showToast);
  const lastRemindKey = useRef('');

  useEffect(() => {
    // Fetch live atomic PST network time
    fetchPSTNetworkTime().then(() => tickClock());
    const apiInterval = setInterval(fetchPSTNetworkTime, 10 * 60 * 1000); // sync API every 10 min

    const checkMealReminders = () => {
      tickClock();
      const pstDate = useAppStore.getState().pstDate;
      const hours = pstDate.getHours();
      const minutes = pstDate.getMinutes();


      let reminderTitle = '';
      let reminderMsg = '';

      if (hours === 6 && minutes === 0) {
        reminderTitle = 'Almusal Time 🍳';
        reminderMsg = "Yangiee, kain ka na dyan ng almusal ha! Don't skip breakfast 💖";
      } else if (hours === 12 && minutes === 0) {
        reminderTitle = 'Tanghalian Time 🍲';
        reminderMsg = "Yangiee, kain ka na dyan ng tanghalian! Take a break & eat well 💕";
      } else if (hours === 21 && minutes === 0) {
        reminderTitle = 'Hapunan Time 🌙';
        reminderMsg = "Yangiee, kain ka na dyan ng hapunan ha! Eat well before resting ✨";
      }


      if (reminderTitle) {
        const key = `${pstDate.toDateString()}-${hours}`;
        if (lastRemindKey.current !== key) {
          lastRemindKey.current = key;
          showToast(`🍲 ${reminderTitle}: ${reminderMsg}`);

          // Trigger real Android phone notification
          try {
            if (window.AndroidHost?.sendNotification) {
              window.AndroidHost.sendNotification(reminderTitle, reminderMsg);
            }
          } catch(e){}
        }
      }
    };

    // Background ntfy sync so she gets notified if Patrick sends a message
    const syncNtfy = useAppStore.getState().syncNtfyToMailbox;
    syncNtfy();
    const ntfyInterval = setInterval(syncNtfy, 30_000);

    checkMealReminders();
    const id = setInterval(checkMealReminders, 20_000); // Check every 20 seconds
    return () => {
      clearInterval(id);
      clearInterval(apiInterval);
      clearInterval(ntfyInterval);
    };
  }, [tickClock, showToast]);
}



