const CACHE_NAME = 'prof-quiz-final-v1';
const ASSETS = [
  'index.html',
  'grammar.html',
  'vocab.html',
  'bio.html',
  'manifest.json'
];

// تثبيت وحفظ كل الملفات
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
    ))
  );
  self.clients.claim();
});

// الاستراتيجية: الكاش أولاً للسرعة القصوى في الأوفلاين
self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => {
        // إذا فشل الإنترنت، ابحث عن الصفحة المحددة في الكاش
        const url = new URL(e.request.url);
        return caches.match(url.pathname.split('/').pop() || 'index.html');
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
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
