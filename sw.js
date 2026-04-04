const CACHE_NAME = 'prof-quiz-v10'; // تم تغيير الإصدار لتحديث الكاش القديم

const ASSETS = [
  './',
  './index.html',
  './grammar.html',
  './vocab.html',
  './bio.html',
  './manifest.json'
];

// 1. تثبيت الخدمة وحفظ الملفات الأساسية
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] جاري تخزين الملفات الأساسية...');
      return cache.addAll(ASSETS);
    })
  );
  // إجبار المتصفح على تفعيل هذه النسخة فوراً
  self.skipWaiting(); 
});

// 2. تنظيف الكاش القديم عند التحديث
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[SW] تم مسح الكاش القديم:', key);
          return caches.delete(key);
        }
      })
    ))
  );
  self.clients.claim();
});

// 3. اعتراض الطلبات وجلبها من الكاش أوفلاين
self.addEventListener('fetch', e => {
  // تجاهل الطلبات التي ليست GET (مثل إرسال بيانات Form)
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cachedRes => {
      // وجدناه في الكاش؟ أرجعه فوراً
      if (cachedRes) return cachedRes;

      // لم نجده؟ اطلبه من الإنترنت، ثم احفظ نسخة منه في الكاش للمستقبل
      return fetch(e.request).then(fetchRes => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request.url, fetchRes.clone());
          return fetchRes;
        });
      }).catch(() => {
        // في حال انقطاع الإنترنت التام وعدم وجود الملف، أعد الصفحة الرئيسية
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
