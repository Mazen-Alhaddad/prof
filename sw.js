const CACHE_NAME = 'prof-quiz-v4-final';
const ASSETS = [
  'index.html',
  'grammar.html',
  'vocab.html',
  'bio.html',
  'manifest.json'
];

// 1. التثبيت وحفظ الملفات بقوة
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching all assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. تفعيل وتنظيف الكاش القديم
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

// 3. الاستراتيجية الذكية: اعتراض طلبات التنقل
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // إذا كان المستخدم يطلب إحدى صفحات التطبيق
  if (ASSETS.includes(url.pathname.split('/').pop())) {
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then(response => {
        // إذا وجدها في الكاش، أرجعها فوراً (حتى لو في إنترنت) لضمان السرعة والأوفلاين
        return response || fetch(e.request);
      })
    );
  } else {
    // باقي الملفات (صور، فونتات..)
    e.respondWith(
      caches.match(e.request).then(res => res || fetch(e.request))
    );
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
