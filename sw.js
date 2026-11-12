// Offline-Cache: App-Hülle sofort aus dem Cache, im Hintergrund aktualisieren
const C = 'lernstudio-v8';
const SHELL = ['./', 'index.html', 'app.css', 'app.js', 'icon.svg', 'themen/index.json', 'fonts/atkinson-400.woff2', 'fonts/atkinson-700.woff2', 'fonts/bricolage.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.open(C).then(async c => {
    const hit = await c.match(e.request);
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
