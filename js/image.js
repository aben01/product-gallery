// 图片处理模块 - 压缩和优化

// 压缩图片到指定大小
async function compressImage(file, maxSize = 1024 * 1024, maxWidth = 1500, maxHeight = 1500) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                // 计算缩放后的尺寸
                let width = img.width;
                let height = img.height;

                // 等比缩放
                if (width > maxWidth || height > maxHeight) {
                    const aspectRatio = width / height;

                    if (width > height) {
                        width = Math.min(width, maxWidth);
                        height = width / aspectRatio;
                    } else {
                        height = Math.min(height, maxHeight);
                        width = height * aspectRatio;
                    }
                }

                // 创建Canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // 绘制图片
                ctx.drawImage(img, 0, 0, width, height);

                // 动态调整质量直到满足大小要求
                let quality = 0.9;
                const compress = () => {
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('图片压缩失败'));
                                return;
                            }

                            console.log(`压缩质量: ${quality}, 大小: ${formatFileSize(blob.size)}`);

                            // 如果大小满足要求或质量已经很低，返回结果
                            if (blob.size <= maxSize || quality <= 0.5) {
                                resolve(blob);
                            } else {
                                // 继续降低质量
                                quality -= 0.1;
                                compress();
                            }
                        },
                        'image/jpeg',
                        quality
                    );
                };

                compress();
            };

            img.onerror = () => {
                reject(new Error('图片加载失败'));
            };

            img.src = e.target.result;
        };

        reader.onerror = () => {
            reject(new Error('文件读取失败'));
        };

        reader.readAsDataURL(file);
    });
}

// 批量压缩图片
async function compressImages(files, onProgress) {
    const compressedImages = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
            updateLoadingText(`正在压缩图片... (${i + 1}/${total})`);

            const compressed = await compressImage(file);

            const imageData = {
                id: generateId(),
                blob: compressed,
                filename: file.name,
                size: compressed.size,
                createdAt: Date.now()
            };

            compressedImages.push(imageData);

            if (onProgress) {
                onProgress(i + 1, total);
            }
        } catch (error) {
            console.error('压缩图片失败:', file.name, error);
            // 继续处理其他图片
        }
    }

    return compressedImages;
}

// 从Blob创建Object URL
function createImageUrl(blob) {
    return URL.createObjectURL(blob);
}

// 释放Object URL
function revokeImageUrl(url) {
    if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
}

// 图片预加载
function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

// 修正图片方向（处理EXIF方向）
async function fixImageOrientation(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // 默认不旋转
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                canvas.toBlob(
                    (blob) => {
                        resolve(blob);
                    },
                    'image/jpeg',
                    0.95
                );
            };

            img.onerror = reject;
            img.src = e.target.result;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 生成缩略图
async function generateThumbnail(blob, size = 200) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // 计算缩略图尺寸（正方形裁剪）
                const minSize = Math.min(img.width, img.height);
                const sx = (img.width - minSize) / 2;
                const sy = (img.height - minSize) / 2;

                canvas.width = size;
                canvas.height = size;

                ctx.drawImage(img, sx, sy, minSize, minSize, 0, 0, size, size);

                canvas.toBlob(
                    (blob) => {
                        resolve(blob);
                    },
                    'image/jpeg',
                    0.8
                );
            };

            img.onerror = reject;
            img.src = e.target.result;
        };

        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
