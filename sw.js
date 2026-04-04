// ══════════════════════════════════════════════════
//  Service Worker — Prof Quiz App
//  الإصدار: v4 — Cache First لجميع الملفات والصفحات
// ══════════════════════════════════════════════════

const CACHE_NAME = 'prof-quiz-v4';

const PAGES = [
  './index.html',
  './grammar.html',
  './vocab.html',
  './bio.html',
  './manifest.json'
];

// ── التثبيت: حفظ كل ملف بشكل منفرد ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        PAGES.map(page =>
          cache.add(page).catch(err =>
            console.warn('[SW] Could not cache:', page, err)
          )
        )
      )
    )
  );
  self.skipWaiting();
});

// ── التفعيل: حذف الكاشات القديمة ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── الاعتراض (Cache First Strategy) ──
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // 1. إذا كان الملف في الكاش، اعرضه فوراً (بدون إنترنت للأبد)
      if (cached) return cached;

      // 2. إذا لم يكن في الكاش (أول زيارة)، اجلبه من الإنترنت واحفظه
      return fetch(event.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => {
        // 3. في حالة فشل الإنترنت والملف غير موجود أصلاً، حاول إعادة الشاشة الرئيسية
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
