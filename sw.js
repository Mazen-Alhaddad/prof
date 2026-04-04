// ══════════════════════════════════════════════
//  Service Worker — Prof Quiz App
//  استراتيجية: Cache First → Network Fallback
// ══════════════════════════════════════════════

const CACHE_NAME = 'prof-quiz-v2';

const ASSETS = [
  './',
  './index.html',
  './grammar.html',
  './vocab.html',
  './bio.html',
  './manifest.json'
];

// ── التثبيت: تخزين جميع الملفات الأساسية ────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  // تفعيل SW الجديد فوراً دون انتظار إغلاق التبويبات
  self.skipWaiting();
});

// ── التفعيل: حذف النسخ القديمة من الكاش ─────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] حذف كاش قديم:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  // التحكم الفوري في جميع الصفحات المفتوحة
  self.clients.claim();
});

// ── الاعتراض: Cache First مع Network Fallback ────────────
self.addEventListener('fetch', event => {
  // تجاهل الطلبات غير GET
  if (event.request.method !== 'GET') return;
  // تجاهل الطلبات الخارجية (مثل CDN أيقونات)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {

      // ✅ موجود في الكاش → أرجعه فوراً (أسرع، يعمل أوفلاين)
      if (cachedResponse) return cachedResponse;

      // ❌ غير موجود → اجلبه من الإنترنت وخزّنه للمستقبل
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        // أوفلاين والملف غير مخزن → أعد توجيه لـ index.html
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html', { ignoreSearch: true });
        }
      });
    })
  );
});
