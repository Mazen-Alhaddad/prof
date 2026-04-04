const CACHE_NAME = 'prof-quiz-v10';

const ASSETS = [
  '/index.html',
  '/grammar.html',
  '/vocab.html',
  '/bio.html',
  '/manifest.json'
];

const URL_MAP = {
  '/':           '/index.html',
  '/index':      '/index.html',
  '/grammar':    '/grammar.html',
  '/vocab':      '/vocab.html',
  '/bio':        '/bio.html',
};

// التثبيت: cache.addAll هو الأضمن والأبسط
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// التفعيل: حذف الكاش القديم
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: الكاش أولاً مع تحويل المسارات
self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith(self.location.origin)) return;

  const pathname = new URL(e.request.url).pathname;
  const mapped = URL_MAP[pathname] || pathname;
  const finalUrl = self.location.origin + mapped;

  e.respondWith(
    caches.match(finalUrl)
      .then(cached => {
        if (cached) return cached;
        return fetch(e.request)
          .then(res => {
            if (res && res.status === 200) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then(c => c.put(finalUrl, clone));
            }
            return res;
          })
          .catch(() => caches.match('/index.html'));
      })
  );
});
