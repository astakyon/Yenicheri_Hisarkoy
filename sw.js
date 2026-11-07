/* Yeniçeri: Hisarköy Muhafızı — çevrimdışı önbellek.
   Sürüm, kayıt adresindeki ?v= değerinden gelir (sw.js?v=v1.44); sürüm değişince eski önbellek silinir. */
const V = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = 'yenicheri-' + V;
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
  'icons/icon-maskable-512.png', 'icons/icon-96.png', 'icons/icon-180.png',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = e.request.url;
  // Çok oyunculu bağlantı (PeerJS, Supabase) ve POST istekleri önbelleğe girmez
  if (e.request.method !== 'GET' || /peerjs|supabase|cloudflare\.com\/(turn|api)/.test(u)) return;
  // Sayfa: önce ağ (güncel sürüm), ağ yoksa önbellek. Diğer dosyalar: önce önbellek.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
    if (res.ok && (u.startsWith(self.location.origin) || /cdnjs|fonts\.g/.test(u))) { const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); }
    return res;
  })));
});
