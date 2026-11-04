/* Offline shell. User measurements are never transmitted or stored in Cache Storage. */
const CACHE_NAME = 'interval-lab-shell-v1';
const SHELL = ['./', './index.html', './model.js', './app.js', './styles.css', './manifest.webmanifest', './icon.svg'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('interval-lab-shell-') && k !== CACHE_NAME).map(k => caches.delete(k)))), self.clients.claim()]));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  const u = new URL(event.request.url);
  if (!u.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(event.request, {ignoreSearch: true});
      if (cached) return cached;
      if (event.request.mode === 'navigate') return cache.match('./index.html');
      throw error;
    }
  })());
});
