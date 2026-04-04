const CACHE_NAME = 'prof-quiz-v6-ultimate';
const ASSETS = [
  'index.html',
  'grammar.html',
  'vocab.html',
  'bio.html',
  'manifest.json'
];

// التثبيت: حفظ الملفات واحد تلو الآخر لضمان عدم الفشل
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Installing Cache...');
      return Promise.all(
        ASSETS.map(url => {
          return cache.add(url).catch(err => console.log('فشل تخزين:', url));
        })
      );
    })
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

// الاستراتيجية: ابحث في الكاش أولاً دائماً لملفات الـ HTML
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHTML = e.request.mode === 'navigate' || url.pathname.endsWith('.html');

  if (isHTML) {
    e.respondWith(
      caches.match(e.request).then(res => {
        // إذا وجده في الكاش أرجعه فوراً، وإلا اطلبه من الشبكة
        return res || fetch(e.request);
      }).catch(() => fetch(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(res => res || fetch(e.request))
    );
  }
});

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
