// ZIP导入导出模块（需要引入JSZip库）

// ZIP导入
async function importFromZip(file) {
    try {
        showLoading('正在解压...');

        // 读取ZIP文件
        const zip = await JSZip.loadAsync(file);

        const products = {};
        const allFiles = Object.keys(zip.files);

        // 遍历ZIP文件
        for (const filename of allFiles) {
            const zipEntry = zip.files[filename];

            // 跳过文件夹和隐藏文件
            if (zipEntry.dir || filename.startsWith('__MACOSX') || filename.startsWith('.')) {
                continue;
            }

            // 解析路径：货号/图片文件名
            const pathParts = filename.split('/');
            if (pathParts.length < 2) continue;

            const productCode = pathParts[0];
            const imageName = pathParts[pathParts.length - 1];

            // 检查是否为图片文件
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.bmp'];
            const isImage = imageExtensions.some(ext =>
                imageName.toLowerCase().endsWith(ext)
            );

            if (!isImage) continue;

            // 提取文件
            const blob = await zipEntry.async('blob');

            // 初始化产品数组
            if (!products[productCode]) {
                products[productCode] = [];
            }

            products[productCode].push({
                name: imageName,
                blob: blob
            });
        }

        // 处理并保存每个产品
        const productCodes = Object.keys(products);
        let totalImported = 0;
        let totalImages = 0;

        for (let i = 0; i < productCodes.length; i++) {
            const productCode = productCodes[i];
            const images = products[productCode];

            updateLoadingText(`正在处理产品 ${i + 1}/${productCodes.length}...`);

            try {
                // 压缩图片
                const files = images.map(img => new File([img.blob], img.name));
                const compressedImages = await compressImages(files, (current, total) => {
                    updateLoadingText(`正在压缩图片... ${productCode} (${current}/${total})`);
                });

                // 保存到数据库
                if (compressedImages.length > 0) {
                    await db.saveProduct(productCode, compressedImages);
                    totalImported++;
                    totalImages += compressedImages.length;
                }
            } catch (error) {
                console.error(`处理产品 ${productCode} 失败:`, error);
            }
        }

        hideLoading();

        if (totalImported > 0) {
            showToast(`成功导入 ${totalImported} 个产品（${totalImages} 张图片）`);
            return { success: true, productCount: totalImported, imageCount: totalImages };
        } else {
            showAlert('导入失败', 'ZIP文件中没有找到有效的产品图片');
            return { success: false };
        }
    } catch (error) {
        hideLoading();
        console.error('导入ZIP失败:', error);
        showAlert('导入失败', '无法读取ZIP文件，请确保文件格式正确');
        return { success: false, error };
    }
}

// ZIP导出
async function exportToZip(products) {
    try {
        if (!products || products.length === 0) {
            showAlert('导出失败', '没有可导出的产品');
            return;
        }

        showLoading('正在导出...');

        const zip = new JSZip();

        // 遍历产品
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            updateLoadingText(`正在导出... (${i + 1}/${products.length})`);

            // 创建产品文件夹
            const folder = zip.folder(product.productCode);

            // 添加图片
            product.images.forEach((image, index) => {
                const filename = image.filename || `image_${index + 1}.jpg`;
                folder.file(filename, image.blob);
            });
        }

        // 生成ZIP文件
        updateLoadingText('正在生成ZIP文件...');
        const blob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        hideLoading();

        // 下载文件
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `products_export_${timestamp}.zip`;
        downloadFile(blob, filename);

        showToast(`导出成功：${products.length} 个货号`);
    } catch (error) {
        hideLoading();
        console.error('导出ZIP失败:', error);
        showAlert('导出失败', '无法生成ZIP文件');
    }
}
