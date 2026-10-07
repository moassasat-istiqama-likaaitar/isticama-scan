// عامل الخدمة: يجعل التطبيق يُثبَّت ويفتح حتى بلا إنترنت
// غيّر الرقم عند كل تحديث كبير لإجبار الهواتف على أخذ الجديد
const CACHE = 'github-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
// مكتبات وخطوط من الإنترنت: تُحفظ من أول زيارة حتى تعمل الصفحة بلا اتصال
const EXTRA = ["https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js", "https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all([
    c.addAll(SHELL),
    ...EXTRA.map(u => fetch(u, { mode: 'no-cors' }).then(r => c.put(u, r)).catch(() => {}))
  ])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;                          // التسجيل والمسح يذهبان دائماً للشيت مباشرة
  if (url.hostname.endsWith('google.com') || url.hostname.endsWith('googleusercontent.com')) return;  // بيانات الشيت لا تُخزَّن

  // الصفحة نفسها: الشبكة أولاً (لتصل التحديثات فوراً)، وإن انقطعت ← النسخة المحفوظة
  if (req.mode === 'navigate' || (url.origin === location.origin && url.pathname.endsWith('.html'))) {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // الباقي (الأيقونات، الخطوط، مكتبات QR): المحفوظ أولاً ثم الشبكة
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
    return r;
  })));
});
