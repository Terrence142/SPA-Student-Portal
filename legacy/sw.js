const CACHE_NAME = 'spa-portal-v3'; // Bumped version to force update
const urlsToCache = [
  '/',
  '/index.html',
  '/studentportal.html',
  '/style.css',
  '/logo.png',
  '/bg.jpg'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // Delete old caches
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all clients immediately
      .then(() => {
        // Force all currently open tabs to reload so they get the new updates immediately!
        return self.clients.matchAll({ type: 'window' }).then(windowClients => {
          for (let client of windowClients) {
            // navigate() forces the browser to reload the page
            client.navigate(client.url);
          }
        });
      })
  );
});

// Network First, falling back to cache strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response and cache it
        var responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(event.request);
      })
  );
});
