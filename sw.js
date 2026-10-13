// ===== Hotel Tracker Service Worker =====
const CACHE_NAME = 'hotel-tracker-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js'
];

// ===== Install: Assets Cache አድርግ =====
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching assets...');
        return cache.addAll(ASSETS);
      })
      .then(() => {
        console.log('✅ Assets cached');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('❌ Cache error:', err);
      })
  );
});

// ===== Activate: አሮጌ Cache አጥፋ =====
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('🗑️ Deleting old cache:', k);
          return caches.delete(k);
        })
      ))
      .then(() => self.clients.claim())
  );
});

// ===== Fetch: Cache First, Network Fallback =====
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Firebase API ጥሪዎችን አትጠልፍ
  if (url.includes('firestore.googleapis.com') ||
      url.includes('identitytoolkit.googleapis.com') ||
      url.includes('firebase') ||
      url.includes('gstatic.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) {
          return cached;
        }
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200) return response;
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
            return response;
          })
          .catch(() => {
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});
