// 产品详情页面逻辑

let currentProduct = null;

// 初始化详情页
async function initDetailPage(productCode) {
    try {
        currentProduct = await db.getProduct(productCode);

        if (!currentProduct) {
            showAlert('错误', '产品不存在');
            navigateToPage('home');
            return;
        }

        // 设置标题
        document.getElementById('detail-product-code').textContent = currentProduct.productCode;

        // 渲染图片
        renderDetailImages();
        initDetailEvents();
    } catch (error) {
        console.error('加载产品详情失败:', error);
        showAlert('错误', '加载失败');
        navigateToPage('home');
    }
}

// 渲染详情图片
function renderDetailImages() {
    const imageGrid = document.getElementById('detail-image-grid');

    imageGrid.innerHTML = currentProduct.images.map((img, index) => {
        const url = createImageUrl(img.blob);
        return `
            <div class="image-grid-item" data-index="${index}">
                <img src="${url}" alt="产品图片" class="image-grid-img">
            </div>
        `;
    }).join('');

    // 添加点击事件
    const items = imageGrid.querySelectorAll('.image-grid-item');
    items.forEach((item, index) => {
        item.addEventListener('click', () => {
            openImageViewer(index);
        });
    });
}

// 打开图片查看器
function openImageViewer(index) {
    imageViewer.open(currentProduct.images, index);
}

// 初始化详情页事件
function initDetailEvents() {
    // 返回按钮
    const backBtn = document.getElementById('btn-detail-back');
    const newBackHandler = () => {
        navigateToPage('home');
    };
    backBtn.replaceWith(backBtn.cloneNode(true));
    document.getElementById('btn-detail-back').addEventListener('click', newBackHandler);

    // 删除产品按钮
    const deleteBtn = document.getElementById('btn-delete-product');
    const newDeleteHandler = () => {
        deleteCurrentProduct();
    };
    deleteBtn.replaceWith(deleteBtn.cloneNode(true));
    document.getElementById('btn-delete-product').addEventListener('click', newDeleteHandler);
}

// 删除当前产品
function deleteCurrentProduct() {
    showConfirm(
        '删除产品',
        `确定要删除产品"${currentProduct.productCode}"吗？此操作不可恢复。`,
        async () => {
            try {
                showLoading('正在删除...');
                await db.deleteProduct(currentProduct.productCode);
                hideLoading();
                showToast('删除成功');
                vibrate(20);

                // 返回主页并刷新
                navigateToPage('home');
                await loadProducts();
            } catch (error) {
                hideLoading();
                console.error('删除失败:', error);
                showAlert('删除失败', '请稍后重试');
            }
        }
    );
}
