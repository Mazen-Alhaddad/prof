const CACHE_NAME = 'prof-quiz-v11';

const URL_MAP = {
  '/':        '/index.html',
  '/index':   '/index.html',
  '/grammar': '/grammar.html',
  '/vocab':   '/vocab.html',
  '/bio':     '/bio.html',
};

// التثبيت: بدون pre-cache، نخزّن عند الطلب فقط
self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith(self.location.origin)) return;
  if (e.request.method !== 'GET') return;

  const pathname = new URL(e.request.url).pathname;
  const mapped = URL_MAP[pathname] || pathname;
  const finalUrl = self.location.origin + mapped;

  e.respondWith(
    caches.match(finalUrl).then(cached => {
      if (cached) {
        // رجّع من الكاش وحدّثه في الخلفية
        fetch(finalUrl).then(res => {
          if (res && res.status === 200)
            caches.open(CACHE_NAME).then(c => c.put(finalUrl, res));
        }).catch(() => {});
        return cached;
      }

      // غير موجود في الكاش، اجلبه واحفظه
      return fetch(finalUrl).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(finalUrl, clone));
        }
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
