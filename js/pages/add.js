// 添加产品页面逻辑

let selectedImages = [];

// 初始化添加产品页面
async function initAddPage() {
    selectedImages = [];
    document.getElementById('input-product-code').value = '';
    renderImagePreview();
    initAddPageEvents();

    // 加载已有产品货号用于自动补全
    await loadExistingProductCodes();

    // 初始化拖拽上传
    initDragAndDrop();
}

// 加载已有产品货号
async function loadExistingProductCodes() {
    try {
        const products = await db.getAllProducts();
        const dataList = document.getElementById('product-code-list');
        // db.getAllProducts() returns objects with productCode
        dataList.innerHTML = products.map(p => `<option value="${p.productCode}">`).join('');
    } catch (error) {
        console.error('加载产品货号失败:', error);
    }
}

// 初始化拖动上传
function initDragAndDrop() {
    let dropZone = document.getElementById('drop-zone');
    // 克隆并替换以清除旧的事件监听器
    const newDropZone = dropZone.cloneNode(true);
    dropZone.replaceWith(newDropZone);
    dropZone = newDropZone;

    // 阻止默认行为
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // 高亮拖拽区域
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.borderColor = 'var(--color-primary)';
            dropZone.style.backgroundColor = 'rgba(0, 122, 255, 0.05)';
        }, false);
    });

    // 恢复拖拽区域
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.borderColor = 'var(--color-border)';
            dropZone.style.backgroundColor = 'transparent';
        }, false);
    });

    // 处理放置
    dropZone.addEventListener('drop', async (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files && files.length > 0) {
            // 过滤出图片文件
            const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

            if (imageFiles.length > 0) {
                // 将数组转为类似 FileList 的对象结构
                const dataTransfer = new DataTransfer();
                imageFiles.forEach(file => dataTransfer.items.add(file));
                await handleImageSelection(dataTransfer.files);
            } else {
                showToast('请拖拽图片文件');
            }
        }
    }, false);
}

// 初始化事件
function initAddPageEvents() {
    // 取消按钮
    const cancelBtn = document.getElementById('btn-add-cancel');
    const newCancelHandler = () => {
        navigateToPage('home');
    };
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    document.getElementById('btn-add-cancel').addEventListener('click', newCancelHandler);

    // 保存按钮
    const saveBtn = document.getElementById('btn-add-save');
    const newSaveHandler = async () => {
        await saveProduct();
    };
    saveBtn.replaceWith(saveBtn.cloneNode(true));
    document.getElementById('btn-add-save').addEventListener('click', newSaveHandler);

    // 拍照
    const fileCamera = document.getElementById('file-camera');
    const newCameraHandler = async (e) => {
        await handleImageSelection(e.target.files);
        e.target.value = '';
    };
    fileCamera.replaceWith(fileCamera.cloneNode(true));
    document.getElementById('file-camera').addEventListener('change', newCameraHandler);

    // 从相册选择
    const fileGallery = document.getElementById('file-gallery');
    const newGalleryHandler = async (e) => {
        await handleImageSelection(e.target.files);
        e.target.value = '';
    };
    fileGallery.replaceWith(fileGallery.cloneNode(true));
    document.getElementById('file-gallery').addEventListener('change', newGalleryHandler);
}

// 处理图片选择
async function handleImageSelection(files) {
    if (!files || files.length === 0) return;

    showLoading('正在处理图片...');

    try {
        const filesArray = Array.from(files);
        const compressedImages = await compressImages(filesArray);
        selectedImages.push(...compressedImages);
        renderImagePreview();
        hideLoading();
        showToast(`已添加 ${compressedImages.length} 张图片`);
    } catch (error) {
        hideLoading();
        console.error('处理图片失败:', error);
        showToast('处理图片失败');
    }
}

// 渲染图片预览
function renderImagePreview() {
    const previewGrid = document.getElementById('image-preview-grid');

    if (selectedImages.length === 0) {
        previewGrid.innerHTML = '';
        return;
    }

    previewGrid.innerHTML = selectedImages.map((img, index) => {
        const url = createImageUrl(img.blob);
        return `
            <div class="image-preview-item">
                <img src="${url}" alt="预览" class="image-preview-img">
                <button class="image-preview-remove" data-index="${index}">×</button>
            </div>
        `;
    }).join('');

    // 添加删除事件
    const removeButtons = previewGrid.querySelectorAll('.image-preview-remove');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            removeImage(index);
        });
    });
}

// 移除图片
function removeImage(index) {
    selectedImages.splice(index, 1);
    renderImagePreview();
}

// 保存产品
async function saveProduct() {
    const productCode = document.getElementById('input-product-code').value.trim();

    // 验证
    if (!productCode) {
        showAlert('提示', '请输入产品货号');
        return;
    }

    if (selectedImages.length === 0) {
        showAlert('提示', '请至少选择一张图片');
        return;
    }

    try {
        showLoading('正在保存...');
        await db.saveProduct(productCode, selectedImages);
        hideLoading();
        showToast('保存成功');

        // 返回主页并刷新
        navigateToPage('home');
        await loadProducts();
    } catch (error) {
        hideLoading();
        console.error('保存失败:', error);
        showAlert('保存失败', '请稍后重试');
    }
}
