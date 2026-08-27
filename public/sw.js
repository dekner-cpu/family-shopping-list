// Minimal service worker: exists mainly to satisfy PWA installability
// criteria (Android/Chrome requires a registered service worker with a
// fetch handler for "Add to Home Screen" to offer a real app-like install).
// It intentionally caches only static assets, never pages or /api/* calls --
// approvals, the main list, and reports must always reflect the live server.
// Bump this string on every deploy that changes a cached asset (style.css in
// particular) -- otherwise a browser that already installed this service
// worker keeps serving whatever it cached under the old name forever, since
// the SW script itself rarely changes and nothing else invalidates the cache.
const CACHE_NAME = 'shopping-app-static-v2';
const STATIC_ASSETS = [
  '/css/style.css',
  '/js/myList.js',
  '/js/review.js',
  '/js/purchaseReport.js',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isCacheableStaticAsset =
    event.request.method === 'GET' && url.origin === self.location.origin && STATIC_ASSETS.includes(url.pathname);

  if (!isCacheableStaticAsset) return;

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'רשימת קניות', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      dir: 'rtl',
      data: { url: data.url || '/review' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/review';
  event.waitUntil(self.clients.openWindow(targetUrl));
});
