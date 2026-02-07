# 产品图库管理系统 (iOS WebClip版)

一个专为iOS设备设计的产品图库管理Web应用，支持离线使用，可通过WebClip安装到主屏幕。

## ✨ 特性

- 📱 **iOS原生体验** - 遵循iOS设计规范，支持安全区域适配
- 🎨 **现代化UI** - 毛玻璃效果、渐变色彩、流畅动画
- 📦 **ZIP导入导出** - 批量导入导出产品图片
- 🖼️ **图片自动压缩** - 所有图片自动压缩到1MB以内
- 🔍 **实时搜索** - 快速搜索产品货号
- 📸 **多种添加方式** - 支持拍照、相册选择
- 🌙 **深色模式** - 自动跟随系统主题
- 💾 **完全离线** - 所有数据存储在本地，支持离线使用
- 🚀 **PWA支持** - 可安装到主屏幕，类原生应用体验

## 📋 系统要求

- iOS 14.0+
- Safari 或其他iOS浏览器
- 建议使用HTTPS访问

## 🚀 快速开始

### 方式一：Web访问

1. 使用Safari浏览器访问应用URL
2. 点击分享按钮 → "添加到主屏幕"
3. 输入名称（如"产品图库"）并添加

### 方式二：通过mobileconfig安装（推荐）

1. 下载 `ProductGallery.mobileconfig` 文件
2. Safari中打开该文件
3. iOS会提示"安装描述文件"
4. 按照提示完成安装
5. 应用图标会出现在主屏幕

## 📖 使用说明

### 添加产品

1. 点击右上角"+"按钮
2. 输入产品货号
3. 选择图片（拍照或从相册选择）
4. 图片会自动压缩到1MB以内
5. 点击"保存"

### ZIP批量导入

1. 准备ZIP文件，结构如下：
   ```
   products.zip
   ├── 货号001/
   │   ├── 图片1.jpg
   │   ├── 图片2.jpg
   │   └── ...
   ├── 货号002/
   │   ├── 图片1.jpg
   │   └── ...
   ```
2. 点击导入按钮
3. 选择ZIP文件
4. 等待处理完成（会自动压缩图片）

### ZIP导出

1. 使用搜索功能筛选需要导出的产品（可选）
2. 点击导出按钮
3. 等待生成ZIP文件
4. 下载或分享ZIP文件

### 查看和管理

- **搜索**：在搜索框输入货号进行实时搜索
- **查看详情**：点击产品卡片进入详情页
- **全屏查看**：点击图片进入全屏查看器
  - 双指捏合缩放  
  - 单指拖动平移
  - 左右滑动切换图片
  - 下滑关闭查看器
- **保存图片**：在全屏查看器中点击"保存"按钮
- **分享图片**：在全屏查看器中点击"分享"按钮
- **删除产品**：在详情页点击删除按钮

## 🛠️ 技术栈

- **前端**: HTML5, CSS3, JavaScript (原生)
- **数据存储**: IndexedDB
- **离线缓存**: Service Worker
- **图片处理**: Canvas API
- **ZIP处理**: JSZip
- **PWA**: Web App Manifest

## 📁 目录结构

```
product-gallery-ios/
├── index.html              # 主页面
├── manifest.json           # PWA配置
├── service-worker.js       # Service Worker
├── ProductGallery.mobileconfig  # iOS配置描述文件
├── css/                    # 样式文件
│   ├── reset.css
│   ├── variables.css
│   ├── layout.css
│   ├── components.css
│   ├── pages.css
│   └── animations.css
├── js/                     # JavaScript模块
│   ├── app.js              # 应用主入口
│   ├── db.js               # 数据库操作
│   ├── image.js            # 图片处理
│   ├── zip.js              # ZIP处理
│   ├── ui.js               # UI交互
│   ├── utils.js            # 工具函数
│   └── pages/              # 页面逻辑
│       ├── home.js
│       ├── add.js
│       ├── detail.js
│       └── settings.js
├── lib/                    # 第三方库
│   └── jszip.min.js
└── assets/                 # 资源文件
    └── icons/              # 应用图标
        ├── icon-180.png
        ├── icon-120.png
        ├── icon-192.png
        └── icon-512.png
```

## 🔧 本地开发

### 启动开发服务器

```bash
# 使用Python启动简单HTTP服务器
python3 -m http.server 8000

# 或使用Node.js的http-server
npx http-server -p 8000
```

然后访问 `http://localhost:8000`

### HTTPS本地测试（推荐）

PWA和某些iOS功能需要HTTPS环境：

```bash
# 使用ngrok创建HTTPS隧道
npx ngrok http 8000
```

## 📝 数据说明

- 所有数据存储在浏览器的IndexedDB中
- 图片以Blob格式存储
- 数据仅存在于本地设备，不会上传到服务器
- 清除浏览器数据会删除所有产品信息

## ⚠️ 注意事项

1. **图片压缩**：所有导入的图片会自动压缩到1MB以内
2. **存储限制**：浏览器存储空间有限，建议定期导出备份
3. **浏览器兼容**：主要针对iOS Safari优化
4. **离线使用**：首次访问后即可离线使用
5. **数据备份**：建议定期使用ZIP导出功能备份数据

## 🐛 故障排除

### 应用无法安装
- 确保使用Safari浏览器
- 检查是否允许安装描述文件（设置 → 通用 → VPN与设备管理）

### 图片无法加载
- 检查浏览器存储空间是否充足
- 尝试清除缓存后重新导入

### 导入ZIP失败
- 确保ZIP文件结构正确（货号/图片.jpg）
- 检查图片格式是否支持（JPEG、PNG等）

## 📜 许可证

MIT License

## 👨‍💻 开发者

由Antigravity AI Assistant开发
创建时间：2026年2月7日

---

**版本**: 1.0.0
**最后更新**: 2026年2月7日
