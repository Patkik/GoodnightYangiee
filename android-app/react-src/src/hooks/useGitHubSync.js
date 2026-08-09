import { useEffect } from 'react';
import { useAppStore } from '../store/appStore.js';

const GITHUB_REPO_OWNER = 'Patkik';
const GITHUB_REPO_NAME = 'GoodnightYangiee';

export function useGitHubSync() {
  const showWeatherBanner = useAppStore(s => s.showWeatherBanner);

  useEffect(() => {
    async function checkSync() {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/main/version.json?t=${Date.now()}`;
        const res = await fetch(rawUrl, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const remoteCommit = data.commit;
          const storedCommit = localStorage.getItem('gn_sync_commit');

          if (!storedCommit) {
            localStorage.setItem('gn_sync_commit', remoteCommit || 'ca263fc');
          } else if (remoteCommit && storedCommit !== remoteCommit) {
            showWeatherBanner(`✨ New Update Available on GitHub! (${data.releaseNotes || 'Tap to sync'})`);
          }
        }
      } catch (e) {
        console.warn('React GitHub sync check error:', e);
      }
    }

    checkSync();
    const interval = setInterval(checkSync, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [showWeatherBanner]);
}
