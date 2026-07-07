self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(async () => {
      const cache = await caches.open('healthlink-static');
      const cachedResponse = await cache.match(e.request);
      return cachedResponse || new Response('Offline content not cached', { status: 503 });
    })
  );
});
