// Service Worker - 离线缓存

const CACHE_NAME = 'product-gallery-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/reset.css',
    '/css/variables.css',
    '/css/layout.css',
    '/css/components.css',
    '/css/pages.css',
    '/css/animations.css',
    '/js/utils.js',
    '/js/db.js',
    '/js/image.js',
    '/js/zip.js',
    '/js/ui.js',
    '/js/app.js',
    '/js/pages/home.js',
    '/js/pages/add.js',
    '/js/pages/detail.js',
    '/js/pages/settings.js',
    '/lib/jszip.min.js'
];

// 安装Service Worker
self.addEventListener('install', (event) => {
    console.log('[Service Worker] 安装中...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] 缓存文件');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('[Service Worker] 安装完成');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] 缓存失败:', error);
            })
    );
});

// 激活Service Worker
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] 激活中...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] 删除旧缓存:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] 激活完成');
            return self.clients.claim();
        })
    );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
    // 只缓存同源请求
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 缓存命中，返回缓存
                if (response) {
                    return response;
                }

                // 未命中，发起网络请求
                return fetch(event.request).then((response) => {
                    // 检查是否有效响应
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // 克隆响应
                    const responseToCache = response.clone();

                    // 缓存响应
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
            .catch(() => {
                // 网络和缓存都失败，返回离线页面
                console.log('[Service Worker] 离线模式');
            })
    );
});
