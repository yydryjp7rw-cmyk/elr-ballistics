// Offline support for ELR Ballistics.
// Change the version number whenever you upload new files, so phones pick up the update.
const CACHE = 'elr-ballistics-v2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Serve from the phone's saved copy first (works with no signal), and quietly refresh
// that copy in the background whenever there is a connection.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const refresh = fetch(req).then(async res => {
    if (res && res.ok) { const c = await caches.open(CACHE); await c.put(req, res.clone()); }
    return res;
  }).catch(() => null);
  e.waitUntil(refresh);
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit ||
      refresh.then(res => res ||
        (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
