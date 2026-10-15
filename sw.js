// ===== NITSUH Hotel Tracker SW =====
const CACHE_NAME = 'nitsuh-hotel-v2';

self.addEventListener('install', event => {
  console.log('✅ SW Install');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('✅ SW Activate');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  if (url.includes('firebase') ||
      url.includes('gstatic') ||
      url.includes('firestore') ||
      url.includes('identitytoolkit')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
