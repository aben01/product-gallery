// 应用主入口

// 应用程序类
class App {
    constructor() {
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            // 强制调整编辑按钮位置（绕过HTML缓存）
            const editBtn = document.getElementById('btn-edit');
            const navbarActions = document.querySelector('#page-home .navbar-actions');
            if (editBtn && navbarActions && editBtn.parentElement !== navbarActions) {
                // 将编辑按钮移到右侧按钮组
                navbarActions.insertBefore(editBtn, navbarActions.firstChild);
                editBtn.style.marginRight = '4px';
            }

            // 修复标签栏样式（绕过CSS缓存）- Dock风格
            const tabbar = document.querySelector('.tabbar');
            if (tabbar) {
                tabbar.style.position = 'fixed';
                tabbar.style.bottom = 'max(20px, env(safe-area-inset-bottom))';
                tabbar.style.left = '50%';
                tabbar.style.transform = 'translateX(-50%)';
                tabbar.style.right = 'auto';
                tabbar.style.width = 'calc(100% - 32px)';
                tabbar.style.maxWidth = '380px';
                tabbar.style.borderRadius = '32px';
                tabbar.style.zIndex = '100';
                tabbar.style.padding = '0';
                tabbar.style.height = '64px';
                tabbar.style.alignItems = 'center';
                tabbar.style.border = '1px solid rgba(255,255,255,0.2)';
                tabbar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
            }

            // 显示加载
            showLoading('正在初始化...');

            // 初始化数据库
            await db.init();
            console.log('数据库初始化成功');

            // 初始化主页
            await initHomePage();

            // 注册Service Worker
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.register('/service-worker.js');
                    console.log('[App] Service Worker 注册成功');

                    // 监听更新
                    registration.onupdatefound = () => {
                        const installingWorker = registration.installing;
                        console.log('[App] 发现 Service Worker 新版本正在安装...');

                        installingWorker.onstatechange = () => {
                            if (installingWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    console.log('[App] 新版本已安装并准备就绪（等待激活）');
                                    this.showUpdatePrompt(registration);
                                } else {
                                    console.log('[App] 首次安装完成，内容已缓存');
                                }
                            }
                        };
                    };

                    // 处理已经处于等待状态的更新
                    if (registration.waiting) {
                        console.log('[App] 发现已有新版本在后台等待激活');
                        this.showUpdatePrompt(registration);
                    }
                } catch (error) {
                    console.log('[App] Service Worker 注册失败:', error);
                }
            }

            // 追踪版本并提示更新成功
            const currentVersion = '1.1.1';
            const lastVersion = localStorage.getItem('app_version');
            if (lastVersion && lastVersion !== currentVersion) {
                showToast(`应用已升级至 v${currentVersion}`);
            }
            localStorage.setItem('app_version', currentVersion);

            // 检查更新按钮
            const btnCheckUpdate = document.getElementById('btn-check-update');
            if (btnCheckUpdate) {
                btnCheckUpdate.addEventListener('click', () => this.checkForUpdates());
            }

            // 初始化主题
            this.initTheme();

            this.initialized = true;
            hideLoading();
            console.log('应用初始化完成');
        } catch (error) {
            hideLoading();
            console.error('应用初始化失败:', error);
            showAlert('初始化失败', '应用启动失败，请刷新页面重试');
        }
    }

    initTheme() {
        const theme = localStorage.getItem('theme') || 'system';
        this.setTheme(theme);
    }

    setTheme(theme) {
        // 保存设置
        localStorage.setItem('theme', theme);

        // 应用主题
        if (theme === 'system') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }

        // 更新UI选中状态
        this.updateThemeUI(theme);
    }

    updateThemeUI(theme) {
        // 重置所有checkmarks
        document.querySelectorAll('.theme-check').forEach(el => el.style.display = 'none');

        // 显示选中的checkmark
        const check = document.getElementById(`check-${theme}`);
        if (check) {
            check.style.display = 'block';
        }
    }

    showUpdatePrompt(registration) {
        showConfirm(
            '发现新版本',
            '应用有新版本可用，是否立即更新并重启应用？',
            () => {
                if (registration.waiting) {
                    console.log('[App] 正在发送 SKIP_WAITING 指令...');
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

                    // 只有当新 Service Worker 接管后才刷新
                    navigator.serviceWorker.addEventListener('controllerchange', () => {
                        console.log('[App] 控制权已变更，应用即将重启...');
                        window.location.reload();
                    });
                } else {
                    window.location.reload();
                }
            }
        );
    }

    async checkForUpdates() {
        if (!('serviceWorker' in navigator)) {
            showToast('当前环境不支持检查更新');
            return;
        }

        try {
            showToast('正在检查更新...');
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                // 强制 SW 去服务器拉取最新的 service-worker.js
                await registration.update();

                // 如果发现有 waiting 的，onupdatefound 或 registration.waiting 会触发 showUpdatePrompt
                // 我们稍微延迟检查状态，如果状态没变，说明是最新版
                setTimeout(() => {
                    if (!registration.waiting && !registration.installing) {
                        showToast('当前已是最新版本');
                    }
                }, 1500);
            } else {
                showToast('未发现新版本');
            }
        } catch (error) {
            console.error('[App] 检查更新失败:', error);
            showToast('检查更新失败，请稍后重试');
        }
    }
}

// 创建应用实例
const app = new App();

// DOMContentLoaded事件
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// 页面显示时检查更新
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && app.initialized) {
        // 页面从后台切换回来时，可以检查数据更新
        console.log('页面重新激活');
    }
});

// 监听在线/离线状态
window.addEventListener('online', () => {
    showToast('网络已连接');
});

window.addEventListener('offline', () => {
    showToast('网络已断开，离线模式');
});

// 阻止iOS的默认下拉刷新
document.body.addEventListener('touchmove', (e) => {
    if (e.target.closest('.content-container') || e.target.closest('.image-viewer')) {
        return; // 允许可滚动容器滚动
    }
    // 阻止顶层body的滚动
    if (e.touches.length === 1) {
        e.preventDefault();
    }
}, { passive: false });

// 阻止双指缩放整个页面
document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
});

document.addEventListener('gesturechange', (e) => {
    e.preventDefault();
});

document.addEventListener('gestureend', (e) => {
    e.preventDefault();
});

// PWA安装提示
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('PWA安装提示已准备。。。');

    // 可以在这里显示自定义的安装提示
    // showToast('可以添加到主屏幕');
});

window.addEventListener('appinstalled', () => {
    console.log('PWA已安装');
    deferredPrompt = null;
});

// 导出全局API（用于调试）
window.appDebug = {
    db,
    app,
    navigateToPage,
    showToast,
    showAlert,
    showConfirm
};

// 全局主题切换函数
window.setTheme = (theme) => {
    app.setTheme(theme);
    if (typeof vibrate === 'function') {
        vibrate();
    }
};
