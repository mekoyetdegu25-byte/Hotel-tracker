// ===== NITSUH Hotel Tracker Service Worker =====
const CACHE_NAME = 'nitsuh-hotel-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png'
];

// ===== Install =====
self.addEventListener('install', event => {
  console.log('✅ SW Install');
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
      .catch(err => console.error('❌ Cache error:', err))
  );
});

// ===== Activate =====
self.addEventListener('activate', event => {
  console.log('✅ SW Activate');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('🗑️ Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ===== Fetch =====
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Firebase — አትጠልፍ
  if (url.includes('firebase') ||
      url.includes('gstatic') ||
      url.includes('firestore') ||
      url.includes('identitytoolkit') ||
      url.includes('googleapis')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/Hotel-tracker/index.html');
        }
      });
    })
  );
});
