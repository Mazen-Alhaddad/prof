const CACHE_NAME = 'prof-quiz-v8';

// الملفات الأساسية للتخزين المسبق
const ASSETS = [
  './',
  './index.html',
  './grammar.html',
  './vocab.html',
  './bio.html',
  './manifest.json'
];

// خريطة تحويل مسارات Cloudflare → الملف الفعلي
const URL_MAP = {
  '/':        './index.html',
  '/index':   './index.html',
  '/grammar': './grammar.html',
  '/vocab':   './vocab.html',
  '/bio':     './bio.html',
};

// التثبيت: حفظ جميع الملفات في الكاش
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] تخزين الملفات...');
      return Promise.all(
        ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('[SW] فشل تخزين:', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

// التفعيل: حذف الكاش القديم
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[SW] حذف كاش قديم:', key);
          return caches.delete(key);
        }
      }))
    )
  );
  self.clients.claim();
});

// دالة تحويل المسار: /grammar → ./grammar.html
function resolveUrl(request) {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/$/, '') || '/';

  if (URL_MAP[pathname]) {
    return new Request(new URL(URL_MAP[pathname], self.location.origin).href);
  }
  return request;
}

// الاستراتيجية: الكاش أولاً دائماً (Cache First)
self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith(self.location.origin)) return;

  const resolvedRequest = resolveUrl(e.request);

  e.respondWith(
    caches.match(resolvedRequest).then(cached => {
      if (cached) return cached;

      // جرّب المسار الأصلي أيضاً
      return caches.match(e.request).then(cached2 => {
        if (cached2) return cached2;

        // غير موجود → اجلبه من الإنترنت واحفظه
        return fetch(resolvedRequest).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(resolvedRequest, clone));
          }
          return res;
        }).catch(() => {
          if (e.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      });
    })
  );
});
