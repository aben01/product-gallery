// Service Worker - 离线缓存
const VERSION = '1.0.1'; // 每次发布新版本时修改此处
const CACHE_NAME = `product-gallery-${VERSION}`;

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
    '/css/compatibility.css',
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
    console.log(`[Service Worker ${VERSION}] 安装中...`);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log(`[Service Worker ${VERSION}] 正在缓存基础文件`);
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log(`[Service Worker ${VERSION}] 安装并缓存完成`);
            })
            .catch((error) => {
                console.error(`[Service Worker ${VERSION}] 缓存失败:`, error);
            })
    );
});

// 激活Service Worker
self.addEventListener('activate', (event) => {
    console.log(`[Service Worker ${VERSION}] 激活中...`);
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log(`[Service Worker ${VERSION}] 删除旧缓存:`, cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log(`[Service Worker ${VERSION}] 激活完成，开始接管客户端`);
            return self.clients.claim();
        })
    );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }

                return fetch(event.request).then((response) => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
            .catch(() => {
                console.log(`[Service Worker ${VERSION}] 离线模式且无缓存`);
            })
    );
});

// 监听消息，用于应用内更新
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log(`[Service Worker ${VERSION}] 收到跳过等待指令，准备更新...`);
        self.skipWaiting();
    }
});
