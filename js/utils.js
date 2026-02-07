// 工具函数模块

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

// 格式化日期
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 显示Toast提示
function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';

    // 触发重排以启动动画
    toast.offsetHeight;

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.style.display = 'none';
        }, 250);
    }, duration);
}

// 显示加载指示器
function showLoading(text = '加载中...') {
    const loading = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    loadingText.textContent = text;
    loading.style.display = 'flex';
}

// 隐藏加载指示器
function hideLoading() {
    const loading = document.getElementById('loading-overlay');
    loading.style.display = 'none';
}

// 更新加载文本
function updateLoadingText(text) {
    const loadingText = document.getElementById('loading-text');
    loadingText.textContent = text;
}

// 显示确认对话框
function showConfirm(title, message, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';

    const alertBox = document.createElement('div');
    alertBox.className = 'alert-box zoom-in';

    alertBox.innerHTML = `
        <div class="alert-header">
            <div class="alert-title">${title}</div>
            <div class="alert-message">${message}</div>
        </div>
        <div class="alert-actions">
            <button class="alert-btn cancel-btn">取消</button>
            <button class="alert-btn danger confirm-btn">确认</button>
        </div>
    `;

    overlay.appendChild(alertBox);
    document.body.appendChild(overlay);

    const cancelBtn = alertBox.querySelector('.cancel-btn');
    const confirmBtn = alertBox.querySelector('.confirm-btn');

    function close() {
        overlay.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 250);
    }

    cancelBtn.addEventListener('click', () => {
        close();
        if (onCancel) onCancel();
    });

    confirmBtn.addEventListener('click', () => {
        close();
        if (onConfirm) onConfirm();
    });

    // 点击背景关闭
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            close();
            if (onCancel) onCancel();
        }
    });
}

// 显示提示对话框
function showAlert(title, message, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';

    const alertBox = document.createElement('div');
    alertBox.className = 'alert-box zoom-in';

    alertBox.innerHTML = `
        <div class="alert-header">
            <div class="alert-title">${title}</div>
            <div class="alert-message">${message}</div>
        </div>
        <div class="alert-actions">
            <button class="alert-btn">确定</button>
        </div>
    `;

    overlay.appendChild(alertBox);
    document.body.appendChild(overlay);

    const closeBtn = alertBox.querySelector('.alert-btn');

    function close() {
        overlay.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 250);
    }

    closeBtn.addEventListener('click', () => {
        close();
        if (onClose) onClose();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            close();
            if (onClose) onClose();
        }
    });
}

// 震动反馈
function vibrate(pattern = 10) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

// Blob转Base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Base64转Blob
function base64ToBlob(base64, type = 'image/jpeg') {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type });
}

// 下载文件
function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 保存图片到相册（使用下载方式）
async function saveImageToAlbum(blob, filename = 'image.jpg') {
    try {
        // iOS Safari支持下载
        downloadFile(blob, filename);
        showToast('图片已保存');
    } catch (error) {
        console.error('保存图片失败:', error);
        showToast('保存失败');
    }
}

// 分享图片
async function shareImage(blob, title = '产品图片') {
    if (navigator.share && navigator.canShare) {
        try {
            const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: title,
                    files: [file]
                });
            } else {
                // 降级：下载图片
                downloadFile(blob, 'image.jpg');
                showToast('已下载图片');
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('分享失败:', error);
            }
        }
    } else {
        // 不支持分享API，使用下载
        downloadFile(blob, 'image.jpg');
        showToast('已下载图片');
    }
}
