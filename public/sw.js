const CACHE_NAME = 'edustream-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Do not intercept browser-native or cross-origin API requests (like Firestore)
  const isExternal = event.request.url.includes('firestore.googleapis.com') || 
                     event.request.url.includes('google.com') ||
                     event.request.url.includes('gstatic.com');
                     
  if (isExternal) {
    return; // Browser handles it normally
  }

  // Simple network-first strategy for app assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache the successful response
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If neither network nor cache works, and it's a navigation request, we could show an offline page
          // For now, let's just let it fail naturally or return a generic error if it's a response
          return new Response('Offline and not cached', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});
