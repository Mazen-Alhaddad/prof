// ====================================================\n//  Prof Quiz — Service Worker (V2)\n// ====================================================

const CACHE_NAME = 'prof-quiz-v2'; // تم تغيير الإصدار لإجبار المتصفح على مسح الكاش القديم

// أزلنا './' لأنها تسبب فشل العملية في بعض الاستضافات (مثل Cloudflare/GitHub)
const FILES_TO_CACHE = [
  './index.html',
  './grammar.html',
  './vocab.html',
  './bio.html'
];

// ── التثبيت: حفظ جميع الملفات الأساسية ──────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell');
      return cache.addAll(FILES_TO_CACHE);
    }).catch(err => console.error('[SW] Cache AddAll Failed:', err))
  );
  self.skipWaiting();
});

// ── التفعيل: حذف الكاش القديم ───────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ── الاعتراض: الكاش أولاً، ثم الشبكة ────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  // توجيه طلبات المسار الرئيسي (Root) إلى index.html حتى يعمل الأوفلاين
  let requestToMatch = event.request;
  const url = new URL(event.request.url);
  if (url.pathname === '/' || url.pathname.endsWith('/')) {
    requestToMatch = new Request('./index.html');
  }

  event.respondWith(
    caches.match(requestToMatch, { ignoreSearch: true }).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse; // إرجاع الملف من الكاش
      }

      // غير موجود بالـ Cache → جلبه من الإنترنت وتخزينه تلقائياً للمستقبل
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(error => {
        // إذا كان المستخدم أوفلاين والملف غير مخزن
        console.warn('[SW] Offline and file not in cache:', event.request.url);
        // يمكنك إرجاعه للصفحة الرئيسية كحل بديل في حال طلب صفحة HTML
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html', { ignoreSearch: true });
        }
        throw error;
      });
    })
  );
});
