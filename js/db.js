// IndexedDB数据库模块

class ProductDB {
    constructor() {
        this.dbName = 'ProductGalleryDB';
        this.version = 1;
        this.db = null;
    }

    // 初始化数据库
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('数据库打开失败:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('数据库打开成功');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 创建产品对象存储
                if (!db.objectStoreNames.contains('products')) {
                    const objectStore = db.createObjectStore('products', { keyPath: 'productCode' });
                    objectStore.createIndex('createdAt', 'createdAt', { unique: false });
                    console.log('产品对象存储创建成功');
                }
            };
        });
    }

    // 获取所有产品
    async getAllProducts() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readonly');
            const objectStore = transaction.objectStore('products');
            const request = objectStore.getAll();

            request.onsuccess = () => {
                // 按创建时间倒序排序
                const products = request.result.sort((a, b) => b.createdAt - a.createdAt);
                resolve(products);
            };

            request.onerror = () => {
                console.error('获取产品列表失败:', request.error);
                reject(request.error);
            };
        });
    }

    // 搜索产品
    async searchProducts(query) {
        const allProducts = await this.getAllProducts();
        if (!query || query.trim() === '') {
            return allProducts;
        }

        const keyword = query.trim().toLowerCase();
        return allProducts.filter(product =>
            product.productCode.toLowerCase().includes(keyword)
        );
    }

    // 获取单个产品
    async getProduct(productCode) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readonly');
            const objectStore = transaction.objectStore('products');
            const request = objectStore.get(productCode);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('获取产品失败:', request.error);
                reject(request.error);
            };
        });
    }

    // 添加或更新产品
    async saveProduct(productCode, images, replace = false) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('=== saveProduct 开始 ===');
                console.log('原始 productCode:', productCode);
                console.log('原始 images:', images);

                // 验证参数
                if (!productCode || typeof productCode !== 'string' || productCode.trim() === '') {
                    const error = new Error('产品货号无效');
                    console.error(error);
                    reject(error);
                    return;
                }

                if (!Array.isArray(images) || images.length === 0) {
                    const error = new Error('图片列表无效');
                    console.error(error);
                    reject(error);
                    return;
                }

                const cleanCode = String(productCode).trim();
                console.log('清理后的 productCode:', cleanCode);

                // 获取现有产品
                const existingProduct = await this.getProduct(cleanCode);
                console.log('现有产品:', existingProduct);

                // 创建新的产品对象（不使用扩展运算符）
                let productToSave;

                if (existingProduct) {
                    // 如果 replace 为 true，则直接替换图片列表；否则追加
                    const updatedImages = replace ? images : existingProduct.images.concat(images);
                    productToSave = {
                        productCode: cleanCode,
                        createdAt: existingProduct.createdAt,
                        images: updatedImages
                    };
                } else {
                    // 创建新产品
                    productToSave = {
                        productCode: cleanCode,
                        createdAt: Date.now(),
                        images: images
                    };
                }

                console.log('=== 准备保存的对象 ===');
                console.log('productToSave:', productToSave);
                console.log('productToSave.productCode:', productToSave.productCode);
                console.log('typeof productToSave.productCode:', typeof productToSave.productCode);
                console.log('productToSave has productCode:', Object.prototype.hasOwnProperty.call(productToSave, 'productCode'));
                console.log('Object.keys:', Object.keys(productToSave));

                // 最终验证
                if (!productToSave.productCode) {
                    reject(new Error('最终验证失败: productCode不存在'));
                    return;
                }

                // 执行保存
                const transaction = this.db.transaction(['products'], 'readwrite');
                const objectStore = transaction.objectStore('products');
                console.log('ObjectStore keyPath:', objectStore.keyPath);

                const putRequest = objectStore.put(productToSave);

                putRequest.onsuccess = () => {
                    console.log('✅ 保存成功！');
                    resolve(productToSave);
                };

                putRequest.onerror = (event) => {
                    console.error('❌ put操作失败');
                    console.error('Error:', putRequest.error);
                    console.error('Error name:', putRequest.error.name);
                    console.error('Error message:', putRequest.error.message);
                    console.error('保存的对象:', productToSave);
                    reject(putRequest.error);
                };

                transaction.onerror = (event) => {
                    console.error('❌ 事务失败');
                    console.error('Transaction error:', transaction.error);
                    reject(transaction.error);
                };

            } catch (error) {
                console.error('❌ saveProduct异常:', error);
                console.error('Stack:', error.stack);
                reject(error);
            }
        });
    }

    // 删除产品
    async deleteProduct(productCode) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readwrite');
            const objectStore = transaction.objectStore('products');
            const request = objectStore.delete(productCode);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                console.error('删除产品失败:', request.error);
                reject(request.error);
            };
        });
    }

    // 批量删除产品
    async deleteProducts(productCodes) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readwrite');
            const objectStore = transaction.objectStore('products');

            let completed = 0;
            let errors = [];

            productCodes.forEach(code => {
                const request = objectStore.delete(code);

                request.onsuccess = () => {
                    completed++;
                    if (completed === productCodes.length) {
                        if (errors.length > 0) {
                            reject(errors);
                        } else {
                            resolve();
                        }
                    }
                };

                request.onerror = () => {
                    errors.push(request.error);
                    completed++;
                    if (completed === productCodes.length) {
                        reject(errors);
                    }
                };
            });
        });
    }

    // 删除图片
    async deleteImages(productCode, imageIds) {
        return new Promise(async (resolve, reject) => {
            try {
                const product = await this.getProduct(productCode);
                if (!product) {
                    reject(new Error('产品不存在'));
                    return;
                }

                // 过滤掉要删除的图片
                product.images = product.images.filter(img => !imageIds.includes(img.id));

                if (product.images.length === 0) {
                    // 如果没有图片了，删除整个产品
                    await this.deleteProduct(productCode);
                    resolve({ deletedProduct: true });
                } else {
                    // 更新产品
                    const transaction = this.db.transaction(['products'], 'readwrite');
                    const objectStore = transaction.objectStore('products');
                    const request = objectStore.put(product);

                    request.onsuccess = () => {
                        resolve({ deletedProduct: false, product });
                    };

                    request.onerror = () => {
                        reject(request.error);
                    };
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    // 获取存储空间使用情况（估算）
    async getStorageUsage() {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage,
                quota: estimate.quota,
                usageFormatted: formatFileSize(estimate.usage),
                quotaFormatted: formatFileSize(estimate.quota),
                percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2)
            };
        }
        return null;
    }

    // 获取数据库统计信息
    async getStats() {
        const products = await this.getAllProducts();
        let totalImages = 0;
        let totalSize = 0;

        products.forEach(product => {
            totalImages += product.images.length;
            product.images.forEach(img => {
                if (img.blob) {
                    totalSize += img.blob.size;
                }
            });
        });

        return {
            productCount: products.length,
            imageCount: totalImages,
            totalSize,
            totalSizeFormatted: formatFileSize(totalSize)
        };
    }
}

// 创建全局数据库实例
const db = new ProductDB();
