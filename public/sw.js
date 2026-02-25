// SELF-DESTRUCTING SERVICE WORKER
// This SW clears all caches and unregisters itself
// to fix the stale cache problem causing React Error #310

self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 1. Clear ALL caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => {
          console.log('[SW] Deleting cache:', name);
          return caches.delete(name);
        })
      );

      // 2. Unregister this service worker
      const registration = await self.registration;
      await registration.unregister();
      console.log('[SW] Service worker unregistered');

      // 3. Force all clients to reload with fresh content
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => {
        client.navigate(client.url);
      });
    })()
  );
});

// Do NOT intercept any fetch requests - let everything go to network
self.addEventListener('fetch', (event) => {
  // Pass through - do nothing
  return;
});
