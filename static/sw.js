// Adventures in Claude - Service Worker for Offline Reading
// Version 1.0

const CACHE_VERSION = 'aic-v1';
const PRECACHE_URLS = [
  '/',
  '/css/extended/themes.css',
  '/css/main.min.css'
];
const MAX_CACHED_PAGES = 50;
const RUNTIME_CACHE = 'aic-runtime';

// Install: precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first for static, network-first for HTML
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests
  if (url.origin !== location.origin) return;

  // Cache-first strategy for static assets (CSS, JS, fonts, images)
  if (request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'font' ||
      request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          return caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // Network-first strategy for HTML pages
  if (request.destination === 'document' || request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the page for offline reading
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
            // Enforce max cache size
            cache.keys().then((keys) => {
              if (keys.length > MAX_CACHED_PAGES) {
                cache.delete(keys[0]); // Delete oldest
              }
            });
          });
          return response;
        })
        .catch(() => {
          // Offline: serve from cache if available
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            // No cache available - return offline message
            return new Response(
              '<html><body style="font-family:sans-serif;text-align:center;padding:2em;">' +
              '<h1>Offline</h1>' +
              '<p>This page is not available offline.</p>' +
              '<p><a href="/">Return to home</a></p>' +
              '</body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          });
        })
    );
  }
});
