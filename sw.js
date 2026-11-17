const CACHE = 'tomortle-v4';
const SHELL = ['./', './index.html', './app.css', './app.js', './booth.html', './icon.svg', './icon-192.png', './icon-180.png', './manifest.webmanifest', './common.js', './watch.html', './draw.html', './games.html', './study.html', './letters.html', './fridge.html', './voice.html', './gifts.html'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting() });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())) });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {}); return r }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
