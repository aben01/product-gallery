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
        const isSelected = selectedDetailImages.has(index);

        return `
            <div class="image-grid-item ${isDetailEditMode && isSelected ? 'selected' : ''}" data-index="${index}">
                <img src="${url}" alt="产品图片" class="image-grid-img">
                ${isDetailEditMode ? `
                    <div class="product-select-overlay">
                        ${isSelected ? `
                            <svg class="product-select-icon checked" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        ` : `
                            <div class="product-select-icon empty"></div>
                        `}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    // 添加点击事件
    const items = imageGrid.querySelectorAll('.image-grid-item');
    items.forEach((item, index) => {
        item.addEventListener('click', () => {
            if (isDetailEditMode) {
                // 编辑模式下选中/取消选中
                const isSelected = selectedDetailImages.has(index);
                if (isSelected) {
                    selectedDetailImages.delete(index);
                    item.classList.remove('selected');
                    // 更新覆盖层显示为空圆圈
                    const overlay = item.querySelector('.product-select-overlay');
                    if (overlay) {
                        overlay.innerHTML = '<div class="product-select-icon empty"></div>';
                    }
                } else {
                    selectedDetailImages.add(index);
                    item.classList.add('selected');
                    // 更新覆盖层显示勾选图标
                    const overlay = item.querySelector('.product-select-overlay');
                    if (overlay) {
                        overlay.innerHTML = `
                            <svg class="product-select-icon checked" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        `;
                    }
                }

                // 更新删除按钮状态
                updateDeleteButtonState();
            } else {
                // 普通模式全屏查看
                openImageViewer(index);
            }
        });
    });
}

// 打开图片查看器
function openImageViewer(index) {
    imageViewer.open(currentProduct.images, index);
}

let isDetailEditMode = false;
let selectedDetailImages = new Set(); // 存储选中的图片索引以供删除

// 初始化详情页事件
function initDetailEvents() {
    // 返回按钮
    const backBtn = document.getElementById('btn-detail-back');
    const newBackHandler = () => {
        if (isDetailEditMode) {
            toggleDetailEditMode();
            return;
        }
        navigateToPage('home');
    };
    backBtn.replaceWith(backBtn.cloneNode(true));
    document.getElementById('btn-detail-back').addEventListener('click', newBackHandler);

    // 删除当前整个产品按钮
    const deleteBtn = document.getElementById('btn-delete-product');
    const newDeleteHandler = () => {
        deleteCurrentProduct();
    };
    deleteBtn.replaceWith(deleteBtn.cloneNode(true));
    document.getElementById('btn-delete-product').addEventListener('click', newDeleteHandler);

    // 编辑按钮
    const editBtn = document.getElementById('btn-detail-edit');
    const newEditHandler = () => toggleDetailEditMode();
    editBtn.replaceWith(editBtn.cloneNode(true));
    document.getElementById('btn-detail-edit').addEventListener('click', newEditHandler);

    // 取消编辑按钮
    const cancelBtn = document.getElementById('btn-detail-cancel');
    const newCancelEditHandler = () => toggleDetailEditMode();
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    document.getElementById('btn-detail-cancel').addEventListener('click', newCancelEditHandler);

    // 添加图片按钮 (展开/收起添加区域)
    const addBtn = document.getElementById('btn-detail-add');
    const newAddHandler = () => {
        const addZone = document.getElementById('detail-add-zone');
        addZone.style.display = addZone.style.display === 'none' ? 'block' : 'none';
        // 如果处于编辑模式，则退出编辑模式
        if (isDetailEditMode) toggleDetailEditMode();
    };
    addBtn.replaceWith(addBtn.cloneNode(true));
    document.getElementById('btn-detail-add').addEventListener('click', newAddHandler);

    // 删除选中的图片
    const deleteMultipleBtn = document.getElementById('btn-detail-delete-multiple');
    const newDeleteMultipleHandler = async () => {
        if (selectedDetailImages.size === 0) return;
        if (confirm(`确定要删除选中的 ${selectedDetailImages.size} 张图片吗？`)) {
            await deleteSelectedImages();
        }
    };
    deleteMultipleBtn.replaceWith(deleteMultipleBtn.cloneNode(true));
    document.getElementById('btn-detail-delete-multiple').addEventListener('click', newDeleteMultipleHandler);

    // 绑定添加图片事件
    initDetailAddImageEvents();
}

function toggleDetailEditMode() {
    isDetailEditMode = !isDetailEditMode;
    selectedDetailImages.clear();

    document.getElementById('btn-detail-edit').style.display = isDetailEditMode ? 'none' : 'block';
    document.getElementById('btn-detail-cancel').style.display = isDetailEditMode ? 'block' : 'none';
    document.getElementById('btn-detail-add').style.display = isDetailEditMode ? 'none' : 'block';
    document.getElementById('btn-delete-product').style.display = isDetailEditMode ? 'none' : 'block';
    document.getElementById('btn-detail-delete-multiple').style.display = isDetailEditMode ? 'block' : 'none';

    // 隐藏添加区域
    document.getElementById('detail-add-zone').style.display = 'none';

    renderDetailImages(); // 重新渲染以显示/隐藏选中状态
    updateDeleteButtonState(); // 更新按钮状态
}

// 更新删除按钮状态
function updateDeleteButtonState() {
    const btn = document.getElementById('btn-detail-delete-multiple');
    if (!btn) return;

    if (selectedDetailImages.size > 0) {
        btn.style.opacity = '1';
        btn.disabled = false;
    } else {
        btn.style.opacity = '0.3';
        btn.disabled = true;
    }
}

function initDetailAddImageEvents() {
    const handleFiles = async (files) => {
        if (!files || files.length === 0) return;
        showLoading('正在处理图片...');
        try {
            const filesArray = Array.from(files);
            const compressedImages = await compressImages(filesArray);

            // 将新图片追加到当前产品
            currentProduct.images = [...currentProduct.images, ...compressedImages];
            await db.saveProduct(currentProduct.productCode, currentProduct.images);

            // 重新渲染UI
            renderDetailImages();
            document.getElementById('detail-add-zone').style.display = 'none'; // 添加成功后收起
            showToast(`已成功添加 ${compressedImages.length} 张图片`);
        } catch (error) {
            console.error('处理图片失败:', error);
            showToast('处理图片失败');
        } finally {
            hideLoading();
        }
    };

    // 拍照和相册
    document.getElementById('detail-file-camera').addEventListener('change', (e) => {
        handleFiles(e.target.files);
        e.target.value = '';
    });
    document.getElementById('detail-file-gallery').addEventListener('change', (e) => {
        handleFiles(e.target.files);
        e.target.value = '';
    });

    // 拖拽
    const dropZone = document.getElementById('detail-drop-zone');
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => dropZone.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); }));
    ['dragenter', 'dragover'].forEach(evt => dropZone.addEventListener(evt, () => dropZone.style.borderColor = 'var(--color-primary)'));
    ['dragleave', 'drop'].forEach(evt => dropZone.addEventListener(evt, () => dropZone.style.borderColor = 'rgba(255, 255, 255, 0.4)'));
    dropZone.addEventListener('drop', (e) => {
        const imageFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (imageFiles.length > 0) {
            const dt = new DataTransfer();
            imageFiles.forEach(f => dt.items.add(f));
            handleFiles(dt.files);
        } else {
            showToast('请拖拽图片文件');
        }
    });
}

async function deleteSelectedImages() {
    showLoading('正在删除...');
    try {
        const indexesToDelete = Array.from(selectedDetailImages).sort((a, b) => b - a); // 倒序删除避免索引错乱
        indexesToDelete.forEach(index => {
            currentProduct.images.splice(index, 1);
        });

        if (currentProduct.images.length === 0) {
            // 如果删光了直接删除该商品
            await db.deleteProduct(currentProduct.productCode);
            showToast('产品已删除');
            navigateToPage('home');
        } else {
            // 保存剩余图片
            await db.saveProduct(currentProduct.productCode, currentProduct.images);
            showToast('删除成功');
            toggleDetailEditMode(); // 退出编辑模式
        }
    } catch (error) {
        console.error('删除失败:', error);
        showToast('删除失败');
    } finally {
        hideLoading();
    }
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
