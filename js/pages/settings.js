// 设置页面逻辑

// 初始化设置页面
async function initSettingsPage() {
    await updateStorageInfo();
    initSettingsEvents();
}

// 更新存储信息
async function updateStorageInfo() {
    try {
        const stats = await db.getStats();
        const storageUsage = document.getElementById('storage-usage');
        storageUsage.textContent = `${stats.productCount} 个产品，${stats.imageCount} 张图片，${stats.totalSizeFormatted}`;
    } catch (error) {
        console.error('获取存储信息失败:', error);
    }
}

// 初始化设置事件
function initSettingsEvents() {
    // 返回按钮
    const backBtn = document.getElementById('btn-settings-back');
    if (backBtn) {
        backBtn.onclick = () => {
            switchTab('home');
            vibrate();
        };
    }

    // 存储信息点击
    const storageInfoBtn = document.getElementById('btn-storage-info');
    storageInfoBtn.onclick = async () => {
        const stats = await db.getStats();
        const storage = await db.getStorageUsage();

        let message = `产品数量: ${stats.productCount}\n`;
        message += `图片数量: ${stats.imageCount}\n`;
        message += `数据大小: ${stats.totalSizeFormatted}\n`;

        if (storage) {
            message += `\n总使用: ${storage.usageFormatted}\n`;
            message += `总配额: ${storage.quotaFormatted}\n`;
            message += `使用率: ${storage.percentage}%`;
        }

        showAlert('存储信息', message);
    };

    // 清除缓存
    const clearCacheBtn = document.getElementById('btn-clear-cache');
    clearCacheBtn.onclick = () => {
        showConfirm(
            '清除缓存',
            '确定要清除缓存吗？这不会删除您的产品数据。',
            async () => {
                try {
                    // 清除Service Worker缓存
                    if ('caches' in window) {
                        const cacheNames = await caches.keys();
                        await Promise.all(
                            cacheNames.map(name => caches.delete(name))
                        );
                    }
                    showToast('缓存已清除，正在重新加载...');

                    // 刷新页面以释放可能的内存占用和更新Service Worker
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } catch (error) {
                    console.error('清除缓存失败:', error);
                    showToast('清除失败');
                }
            }
        );
    };
}
