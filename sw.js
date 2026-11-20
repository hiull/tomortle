const CACHE = 'tomortle-v57';
const SHELL = ['./', './index.html', './app.css?v=16', './app.js?v=15', './booth.html', './icon.svg', './icon-192.png', './icon-180.png', './manifest.webmanifest', './common.js', './watch.html', './draw.html', './games.html', './study.html', './letters.html', './fridge.html', './voice.html', './gifts.html', './call.html', './room.html', './album.html', './daily.html', './calendar.html', './bucket.html', './fund.html', './map.html', './backup.html', './recap.html', './heart.html', './walk.html', './frames/frames.json', './market.js', './tiers.js', './nozoom.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting() });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())) });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {}); return r }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});

self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {} } catch (x) { d = { body: e.data && e.data.text() } }
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    const vis = cs.some(c => c.visibilityState === 'visible' && c.focused);
    if (vis) return; // app đang mở trước mặt → đã có chuông & toast trong app
    return self.registration.showNotification(d.title || 'Tomortle × Molly', { body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: d.tag || 'tmx', renotify: true, data: { url: d.url || './' }, vibrate: [80, 40, 80] });
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close(); const url = new URL(e.notification.data && e.notification.data.url || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => { for (const c of cs) { if ('focus' in c) { c.navigate && c.navigate(url); return c.focus() } } return self.clients.openWindow(url) }));
});
