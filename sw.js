const CACHE_NAME = 'prof-quiz-v9';

const ASSETS = [
  './',
  './index.html',
  './grammar.html',
  './vocab.html',
  './bio.html',
  './manifest.json'
];

const URL_MAP = {
  '/':          '/index.html',
  '/index':     '/index.html',
  '/index.html':'/index.html',
  '/grammar':   '/grammar.html',
  '/grammar.html':'/grammar.html',
  '/vocab':     '/vocab.html',
  '/vocab.html':'/vocab.html',
  '/bio':       '/bio.html',
  '/bio.html':  '/bio.html',
};

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log('[SW] تخزين الملفات...');
      // خزّن الملفات الأصلية
      for (const url of ASSETS) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            // خزّن الملف تحت المسار الأصلي وكذلك بدون .html
            await cache.put(url, res.clone());
            const noExt = url.replace('.html', '').replace('./', '/');
            await cache.put(noExt, res.clone());
            console.log('[SW] تم حفظ:', url, 'و', noExt);
          }
        } catch(err) {
          console.warn('[SW] فشل تخزين:', url, err);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith(self.location.origin)) return;

  const url = new URL(e.request.url);
  const pathname = url.pathname;

  // حوّل المسار للملف الفعلي
  const mapped = URL_MAP[pathname] || pathname;
  const resolvedUrl = new URL(mapped, self.location.origin).href;
  const resolvedRequest = new Request(resolvedUrl);

  e.respondWith(
    // جرّب المسار المحوَّل أولاً
    caches.match(resolvedRequest)
      .then(cached => cached || caches.match(e.request))
      .then(cached => {
        if (cached) return cached;

        // غير موجود في الكاش → اجلبه واحفظه
        return fetch(e.request).then(res => {
          if (res && res.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(resolvedRequest, res.clone());
              cache.put(e.request, res.clone());
            });
          }
          return res;
        }).catch(() => {
          if (e.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
