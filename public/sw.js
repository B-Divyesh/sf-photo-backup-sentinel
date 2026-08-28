const VERSION = 'sentinel-v6';
const BUILD_ASSETS = /*__PRECACHE__*/[];
const SHELL = [
  '/', '/demo/', '/privacy/', '/terms/', '/offline.html', '/404.html', '/manifest.webmanifest', '/legal.css', '/favicon.svg',
  '/assets/sentinel-hero.webp', '/assets/sentinel-hero.avif',
  '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png',
  ...BUILD_ASSETS
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => Promise.all(SHELL.map(async url => {
    const response = await fetch(new Request(url, { cache: 'reload' }));
    if (!response.ok) throw new Error(`Could not precache ${url}`);
    await cache.put(url, response);
  }))));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(caches.match('/').then(cached => cached || fetch(request).catch(() => caches.match('/offline.html'))));
    return;
  }
  event.respondWith(caches.match(request, { ignoreSearch: true }).then(cached => cached || caches.match(url.pathname, { ignoreSearch: true })).then(cached => cached || fetch(request).then(response => {
    if (response.ok) event.waitUntil(caches.open(VERSION).then(cache => cache.put(request, response.clone())));
    return response;
  })));
});
