const CACHE_NAME = 'prof-quiz-v7';
const ASSETS = [
  './',
  './index.html',
  './grammar.html',
  './vocab.html',
  './bio.html',
  './manifest.json'
];

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
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] حذف كاش قديم:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// الاستراتيجية: الكاش أولاً دائماً (Cache First)
self.addEventListener('fetch', e => {
  // تجاهل الطلبات من خارج الموقع
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // إذا كان الملف في الكاش → أرجعه فوراً بدون إنترنت
      if (cached) return cached;

      // إذا لم يكن في الكاش → اجلبه من الإنترنت واحفظه للمرة القادمة
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // إذا فشل الإنترنت والملف غير موجود → أعد الصفحة الرئيسية
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
