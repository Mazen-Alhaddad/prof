// ══════════════════════════════════════════════════
//  Service Worker — Prof Quiz App
//  الإصدار: v3 — Network First للصفحات، Cache First للملفات
// ══════════════════════════════════════════════════

const CACHE_NAME = 'prof-quiz-v3';

const PAGES = [
  './index.html',
  './grammar.html',
  './vocab.html',
  './bio.html',
  './manifest.json'
];

// ── التثبيت: حفظ كل ملف بشكل منفرد (لا يفشل لو ملف واحد غير موجود) ──
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

// ── التفعيل: حذف الكاشات القديمة ──────────────────────────────────────
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

// ── الاعتراض ───────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // صفحات HTML: الشبكة أولاً ← كاش ← index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(event.request)
            .then(cached => cached || caches.match('./index.html'))
        )
    );
    return;
  }

  // باقي الملفات: كاش أولاً ← شبكة
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return res;
      });
    })
  );
});
