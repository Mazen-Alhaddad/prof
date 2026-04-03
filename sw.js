// ====================================================
//  Prof Quiz — Service Worker
//  يخزّن جميع ملفات التطبيق في الكاش ويشغّلها offline
// ====================================================

const CACHE_NAME = 'prof-quiz-v1';

// جميع الملفات التي يجب تخزينها
const FILES_TO_CACHE = [
  './',
  './index.html',
  './grammar.html',
  './vocab.html',
  './bio.html'
];

// ── التثبيت: حفظ جميع الملفات في الكاش ──────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  // تفعيل فوري بدون انتظار إغلاق التبويبات القديمة
  self.skipWaiting();
});

// ── التفعيل: حذف الكاش القديم إن وُجد ───────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(
        keyList
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  // السيطرة على جميع الصفحات المفتوحة فوراً
  self.clients.claim();
});

// ── الاعتراض: الكاش أولاً، ثم الشبكة كاحتياط ────────
self.addEventListener('fetch', event => {
  // تجاهل الطلبات غير GET وطلبات الـ chrome-extension
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // الملف موجود في الكاش → أرجعه فوراً (بدون إنترنت)
        return cachedResponse;
      }
      // غير موجود → حاول من الشبكة وخزّنه
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // لا إنترنت ولا كاش → أرجع صفحة index كـ fallback
        return caches.match('./index.html');
      });
    })
  );
});
