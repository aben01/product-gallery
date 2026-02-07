// 主页逻辑

let allProducts = [];
let filteredProducts = [];
let isEditMode = false;
let selectedProducts = new Set();

// 初始化主页
async function initHomePage() {
    await loadProducts();
    initHomeEvents();
}

// 加载产品列表
async function loadProducts() {
    try {
        allProducts = await db.getAllProducts();
        filteredProducts = allProducts;
        renderProductList();
    } catch (error) {
        console.error('加载产品列表失败:', error);
        showToast('加载失败');
    }
}

// 渲染产品列表
function renderProductList() {
    const productList = document.getElementById('product-list');
    const emptyState = document.getElementById('empty-state');

    if (filteredProducts.length === 0) {
        productList.innerHTML = '';
        emptyState.style.display = 'flex';
    } else {
        emptyState.style.display = 'none';
        productList.innerHTML = filteredProducts.map(product => createProductCard(product)).join('');

        // 添加点击事件
        const cards = productList.querySelectorAll('.product-card');
        cards.forEach((card, index) => {
            card.addEventListener('click', () => {
                if (isEditMode) {
                    // 编辑模式下切换选中状态
                    toggleProductSelection(filteredProducts[index].productCode);
                } else {
                    // 正常模式下打开详情
                    openProductDetail(filteredProducts[index].productCode);
                }
            });
        });
    }
}

// 创建产品卡片HTML
function createProductCard(product) {
    const firstImage = product.images[0];
    const imageUrl = firstImage ? createImageUrl(firstImage.blob) : '';
    const imageCount = product.images.length;
    const isSelected = selectedProducts.has(product.productCode);

    return `
        <div class="product-card ${isEditMode ? 'edit-mode' : ''}" data-product-code="${product.productCode}">
            ${isEditMode ? `
                <div class="product-checkbox ${isSelected ? 'checked' : ''}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
            ` : ''}
            <div class="product-card-image">
                ${imageUrl ? `<img src="${imageUrl}" alt="${product.productCode}">` : '<div class="no-image">无图片</div>'}
            </div>
            <div class="product-card-info">
                <div class="product-code">${product.productCode}</div>
                <div class="product-meta">${imageCount} 张图片</div>
            </div>
            ${!isEditMode ? '<div class="product-card-arrow">›</div>' : ''}
        </div>
    `;
}

// 初始化主页事件
function initHomeEvents() {
    // 搜索功能
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');

    searchInput.addEventListener('input', debounce(async (e) => {
        const query = e.target.value;

        if (query) {
            searchClear.style.display = 'block';
            filteredProducts = await db.searchProducts(query);
        } else {
            searchClear.style.display = 'none';
            filteredProducts = allProducts;
        }

        renderProductList();
    }, 300));

    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.style.display = 'none';
        filteredProducts = allProducts;
        renderProductList();
    });

    // 编辑按钮
    document.getElementById('btn-edit').addEventListener('click', () => {
        toggleEditMode();
        vibrate();
    });

    // 添加产品按钮
    document.getElementById('btn-add').addEventListener('click', () => {
        openAddPage();
    });

    document.getElementById('btn-add-first').addEventListener('click', () => {
        openAddPage();
    });

    // 导入ZIP
    const importZipBtn = document.getElementById('btn-import');
    const fileImportZip = document.getElementById('file-import-zip');

    importZipBtn.addEventListener('click', () => {
        fileImportZip.click();
    });

    fileImportZip.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const result = await importFromZip(file);
            if (result.success) {
                await loadProducts();
            }
        }
        e.target.value = ''; // 重置输入
    });

    // 导出ZIP
    document.getElementById('btn-export').addEventListener('click', async () => {
        if (filteredProducts.length === 0) {
            showAlert('导出失败', '没有可导出的产品');
            return;
        }

        await exportToZip(filteredProducts);
    });

    // 标签切换
    const tabItems = document.querySelectorAll('.tab-item');
    tabItems.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchTab(tabName);

            if (tabName === 'settings') {
                initSettingsPage();
            }
        });
    });
}

// 打开产品详情
function openProductDetail(productCode) {
    navigateToPage('detail');
    initDetailPage(productCode);
}

// 打开添加产品页面
function openAddPage() {
    navigateToPage('add');
    initAddPage();
}

// 切换编辑模式
function toggleEditMode() {
    isEditMode = !isEditMode;
    selectedProducts.clear();

    const editBtn = document.getElementById('btn-edit');
    const navbar = document.querySelector('#page-home .navbar');

    if (isEditMode) {
        editBtn.textContent = '取消';
        // 隐藏右上角按钮（不包括编辑按钮）
        document.querySelectorAll('#page-home .navbar-actions button:not(#btn-edit)').forEach(btn => {
            btn.style.display = 'none';
        });

        // 在导航栏添加删除按钮
        const navbarActions = document.querySelector('#page-home .navbar-actions');

        // 全选按钮
        const selectAllBtn = document.createElement('button');
        selectAllBtn.id = 'btn-select-all';
        selectAllBtn.className = 'navbar-btn';
        selectAllBtn.textContent = '全选';
        selectAllBtn.style.fontSize = '15px';
        selectAllBtn.style.marginRight = '8px';
        selectAllBtn.onclick = toggleSelectAll;
        navbarActions.appendChild(selectAllBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.id = 'btn-delete-nav';
        deleteBtn.className = 'navbar-btn';
        deleteBtn.textContent = '删除';
        deleteBtn.disabled = true;
        deleteBtn.style.color = 'var(--color-danger)';
        deleteBtn.style.opacity = '0.5';
        deleteBtn.onclick = deleteSelectedProducts;
        navbarActions.appendChild(deleteBtn);
    } else {
        editBtn.textContent = '编辑';
        // 显示右上角所有按钮
        document.querySelectorAll('#page-home .navbar-actions button').forEach(btn => {
            btn.style.display = '';
        });

        // 移除删除按钮
        const deleteBtn = document.getElementById('btn-delete-nav');
        if (deleteBtn) {
            deleteBtn.remove();
        }

        const selectAllBtn = document.getElementById('btn-select-all');
        if (selectAllBtn) selectAllBtn.remove();
    }

    renderProductList();
}

// 全选/取消全选
function toggleSelectAll() {
    const btn = document.getElementById('btn-select-all');
    if (!btn) return;

    // 检查是否已全部选中
    const isAllSelected = filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length;

    if (isAllSelected) {
        // 取消全选
        selectedProducts.clear();
        btn.textContent = '全选';
    } else {
        // 全选
        selectedProducts.clear();
        filteredProducts.forEach(p => selectedProducts.add(p.productCode));
        btn.textContent = '取消';
    }

    renderProductList();
    updateDeleteButton();
}

// 切换产品选中状态
function toggleProductSelection(productCode) {
    if (selectedProducts.has(productCode)) {
        selectedProducts.delete(productCode);
    } else {
        selectedProducts.add(productCode);
    }

    // 只更新对应卡片的checkbox状态，不重新渲染整个列表
    const card = document.querySelector(`.product-card[data-product-code="${productCode}"]`);
    if (card) {
        const checkbox = card.querySelector('.product-checkbox');
        if (checkbox) {
            if (selectedProducts.has(productCode)) {
                checkbox.classList.add('checked');
            } else {
                checkbox.classList.remove('checked');
            }
        }
    }

    updateDeleteButton();
}

// 显示删除工具栏
function showDeleteToolbar() {
    let toolbar = document.getElementById('delete-toolbar');
    if (!toolbar) {
        toolbar = document.createElement('div');
        toolbar.id = 'delete-toolbar';
        toolbar.className = 'delete-toolbar';
        toolbar.innerHTML = `
            <button class="btn-delete-selected" id="btn-delete-selected" disabled>
                删除 (0)
            </button>
        `;
        document.getElementById('page-home').appendChild(toolbar);

        toolbar.querySelector('#btn-delete-selected').addEventListener('click', deleteSelectedProducts);
    }
    toolbar.style.display = 'flex';
}

// 隐藏删除工具栏
function hideDeleteToolbar() {
    const toolbar = document.getElementById('delete-toolbar');
    if (toolbar) {
        toolbar.style.display = 'none';
    }
}

// 更新删除工具栏
function updateDeleteToolbar() {
    const deleteBtn = document.getElementById('btn-delete-selected');
    if (deleteBtn) {
        const count = selectedProducts.size;
        deleteBtn.textContent = `删除 (${count})`;
        deleteBtn.disabled = count === 0;
    }
}

// 更新导航栏删除按钮
function updateDeleteButton() {
    const deleteBtn = document.getElementById('btn-delete-nav');
    if (deleteBtn) {
        const count = selectedProducts.size;
        if (count > 0) {
            deleteBtn.textContent = `删除 (${count})`;
            deleteBtn.disabled = false;
            deleteBtn.style.opacity = '1';
        } else {
            deleteBtn.textContent = '删除';
            deleteBtn.disabled = true;
            deleteBtn.style.opacity = '0.5';
        }
    }
}

// 删除选中的产品
async function deleteSelectedProducts() {
    if (selectedProducts.size === 0) return;

    const count = selectedProducts.size;
    showConfirm(
        '删除产品',
        `确定要删除选中的 ${count} 个产品吗？`,
        async () => {
            try {
                showLoading('正在删除...');

                for (const productCode of selectedProducts) {
                    await db.deleteProduct(productCode);
                }

                showToast(`已删除 ${count} 个产品`);
                selectedProducts.clear();
                await loadProducts();
                toggleEditMode(); // 退出编辑模式

                hideLoading();
            } catch (error) {
                hideLoading();
                console.error('删除产品失败:', error);
                showToast('删除失败');
            }
        }
    );
}
