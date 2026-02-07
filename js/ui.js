// UI交互模块

// 全屏图片查看器
class ImageViewer {
    constructor() {
        this.viewer = document.getElementById('image-viewer');
        this.image = document.getElementById('viewer-image');
        this.counter = document.getElementById('viewer-counter');
        this.content = document.getElementById('viewer-content');

        this.images = [];
        this.currentIndex = 0;

        // 缩放和拖动相关
        this.scale = 1;
        this.posX = 0;
        this.posY = 0;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;

        this.initEvents();
    }

    initEvents() {
        // 关闭按钮
        document.getElementById('viewer-close').addEventListener('click', () => {
            this.close();
        });

        // 保存按钮
        document.getElementById('viewer-save').addEventListener('click', async () => {
            const currentImage = this.images[this.currentIndex];
            if (currentImage && currentImage.blob) {
                await saveImageToAlbum(currentImage.blob, currentImage.filename || 'image.jpg');
            }
        });

        // 分享按钮
        document.getElementById('viewer-share').addEventListener('click', async () => {
            const currentImage = this.images[this.currentIndex];
            if (currentImage && currentImage.blob) {
                await shareImage(currentImage.blob);
            }
        });

        // 双击缩放
        this.image.addEventListener('dblclick', (e) => {
            e.preventDefault();
            if (this.scale === 1) {
                this.scale = 2;
            } else {
                this.scale = 1;
                this.posX = 0;
                this.posY = 0;
            }
            this.updateTransform();
        });

        // 触摸事件（捏合缩放和拖动）
        let lastTouchDistance = 0;
        let lastTouchX = 0;
        let lastTouchY = 0;

        this.content.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                // 双指捏合
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                lastTouchDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
            } else if (e.touches.length === 1 && this.scale > 1) {
                // 单指拖动
                this.isDragging = true;
                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;
            }
        });

        this.content.addEventListener('touchmove', (e) => {
            e.preventDefault();

            if (e.touches.length === 2) {
                // 双指缩放
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const distance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );

                const delta = distance - lastTouchDistance;
                this.scale = Math.max(1, Math.min(5, this.scale + delta * 0.01));
                lastTouchDistance = distance;

                this.updateTransform();
            } else if (e.touches.length === 1 && this.isDragging) {
                // 单指拖动
                const deltaX = e.touches[0].clientX - lastTouchX;
                const deltaY = e.touches[0].clientY - lastTouchY;

                this.posX += deltaX;
                this.posY += deltaY;

                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;

                this.updateTransform();
            }
        });

        this.content.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
                lastTouchDistance = 0;
            }
            if (e.touches.length === 0) {
                this.isDragging = false;
            }
        });

        // 左右滑动切换图片
        let touchStartX = 0;
        let touchStartY = 0;

        this.viewer.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1 && this.scale === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }
        });

        this.viewer.addEventListener('touchend', (e) => {
            if (this.scale === 1) {
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;

                // 水平滑动大于垂直滑动
                if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                    if (deltaX > 0) {
                        this.previous();
                    } else {
                        this.next();
                    }
                }

                // 下滑关闭
                if (deltaY > 100 && Math.abs(deltaX) < 50) {
                    this.close();
                }
            }
        });
    }

    open(images, index = 0) {
        this.images = images;
        this.currentIndex = index;
        this.scale = 1;
        this.posX = 0;
        this.posY = 0;

        this.showImage();
        this.viewer.style.display = 'flex';

        // 防止背景滚动
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.viewer.style.display = 'none';
        document.body.style.overflow = '';

        // 释放图片URL
        if (this.image.src.startsWith('blob:')) {
            URL.revokeObjectURL(this.image.src);
        }
    }

    showImage() {
        const currentImage = this.images[this.currentIndex];
        if (!currentImage) return;

        // 释放旧的URL
        if (this.image.src.startsWith('blob:')) {
            URL.revokeObjectURL(this.image.src);
        }

        // 设置新图片
        this.image.src = createImageUrl(currentImage.blob);
        this.counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;

        // 重置变换
        this.scale = 1;
        this.posX = 0;
        this.posY = 0;
        this.updateTransform();
    }

    updateTransform() {
        this.image.style.transform = `translate(-50%, -50%) translate(${this.posX}px, ${this.posY}px) scale(${this.scale})`;
    }

    next() {
        if (this.currentIndex < this.images.length - 1) {
            this.currentIndex++;
            this.showImage();
        }
    }

    previous() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.showImage();
        }
    }
}

// 创建全局图片查看器实例
const imageViewer = new ImageViewer();


// 页面导航
function navigateToPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        if (page.id === `page-${pageId}`) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });
}

// 切换标签
function switchTab(tabName) {
    const tabItems = document.querySelectorAll('.tab-item');
    tabItems.forEach(item => {
        if (item.dataset.tab === tabName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    if (tabName === 'home') {
        navigateToPage('home');
    } else if (tabName === 'settings') {
        navigateToPage('settings');
    }
}
