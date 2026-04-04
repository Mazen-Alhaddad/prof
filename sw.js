const CACHE_NAME = 'prof-quiz-v5-force';
const ASSETS = [
  'index.html',
  'grammar.html',
  'vocab.html',
  'bio.html',
  'manifest.json'
];

// 1. تثبيت وحفظ الملفات في "الخزنة" (Cache)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 2. تفعيل وتنظيف أي نسخ قديمة
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
    ))
  );
  self.clients.claim();
});

// 3. الخدعة الكبرى: اعتراض التنقلات (Navigation Preload Bypass)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const fileName = url.pathname.split('/').pop() || 'index.html';

  // إذا كان الملف المطلوب واحد من ملفاتنا الأربعة
  if (ASSETS.includes(fileName)) {
    e.respondWith(
      caches.match(fileName).then(cachedResponse => {
        // أرجعه من الكاش فوراً، حتى لو كان الإنترنت متاحاً (سرعة خيالية + ضمان أوفلاين)
        return cachedResponse || fetch(e.request);
      })
    );
  } else {
    // لأي ملفات أخرى (صور خارجية مثلاً)
    e.respondWith(
      caches.match(e.request).then(res => res || fetch(e.request))
    );
  }
});

  }
});
 new URL(event.request.url);
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
