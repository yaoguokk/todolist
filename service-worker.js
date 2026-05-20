const CACHE_NAME = 'todolist-v2.1.7';
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// 安装：预缓存核心文件
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});

// 激活：清理旧版本缓存
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 请求拦截：缓存优先，API 请求走网络
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // DeepSeek API 请求：网络优先，不缓存
  if (url.hostname === 'api.deepseek.com') {
    return;
  }

  // config.json：网络优先（保证配置更新）
  if (url.pathname.endsWith('config.json')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // 其他请求：缓存优先，网络兜底
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      })
    )
  );
});
