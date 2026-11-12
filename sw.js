// Offline-Cache: App-Hülle sofort aus dem Cache, im Hintergrund aktualisieren
const C = 'lernstudio-v18';
const SHELL = ['./', 'index.html', 'app.css', 'app.js', 'fsrs.js', 'figuren.js', 'icon.svg', 'themen/index.json', 'themen/strahlentherapie.json', 'themen/chromatographie.json', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'fonts/atkinson-400.woff2', 'fonts/atkinson-400i.woff2', 'fonts/atkinson-700.woff2', 'fonts/bricolage.woff2'];
// cache: 'reload' – nach einem Versionssprung nicht die alte Datei aus dem HTTP-Cache (GitHub Pages ~10 min) übernehmen
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))); self.skipWaiting(); });
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
