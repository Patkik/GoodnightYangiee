const CACHE_NAME = 'starlight-sanctuary-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  // Bypass cache completely for version check & GitHub API sync requests
  if (url.includes('version.json') || url.includes('api.github.com') || url.includes('raw.githubusercontent.com')) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }));
    return;
  }

  // Network first, falling back to cache for all other assets
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
