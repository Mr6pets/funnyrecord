# 心情日记移动端打包指南

本指南将帮助您将心情日记Web应用打包成可在手机端安装的应用程序。

## 📱 支持的平台

- **PWA (渐进式Web应用)**: 支持所有现代浏览器
- **Android APK**: 原生Android应用
- **iOS App**: 原生iOS应用 (需要macOS和Xcode)

## 🚀 快速开始

### 方法一：PWA安装 (推荐)

PWA是最简单的安装方式，无需额外工具：

1. **在手机浏览器中访问应用**
   ```
   https://your-domain.com
   ```

2. **安装PWA**
   - **Chrome/Edge**: 点击地址栏右侧的"安装"图标
   - **Safari**: 点击分享按钮 → "添加到主屏幕"
   - **Firefox**: 点击菜单 → "安装"

3. **享受原生体验**
   - 独立应用图标
   - 全屏显示
   - 离线功能
   - 推送通知

### 方法二：Android APK打包

#### 环境要求
- Node.js 18+
- Android Studio
- Java JDK 17+

#### 打包步骤

1. **构建Web应用**
   ```bash
   pnpm build:mobile
   ```

2. **打开Android Studio**
   ```bash
   pnpm cap:open:android
   ```

3. **在Android Studio中构建APK**
   - 选择 `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - 等待构建完成
   - APK文件位置: `android/app/build/outputs/apk/debug/app-debug.apk`

4. **安装APK**
   - 将APK文件传输到Android设备
   - 启用"未知来源"安装
   - 点击APK文件进行安装

#### 发布版本构建

1. **生成签名密钥**
   ```bash
   keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **配置签名**
   在 `android/app/build.gradle` 中添加签名配置

3. **构建发布版本**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

### 方法三：iOS App打包 (需要macOS)

#### 环境要求
- macOS
- Xcode 14+
- iOS Developer Account (发布到App Store需要)

#### 打包步骤

1. **构建Web应用**
   ```bash
   pnpm build:mobile
   ```

2. **打开Xcode**
   ```bash
   pnpm cap:open:ios
   ```

3. **在Xcode中构建**
   - 选择目标设备或模拟器
   - 点击 `Product` → `Build`
   - 运行: `Product` → `Run`

4. **发布到App Store**
   - 配置App Store Connect
   - 创建Archive: `Product` → `Archive`
   - 上传到App Store

## 🛠️ 可用的构建命令

```bash
# 基础命令
pnpm build              # 构建Web应用
pnpm build:mobile       # 构建并同步到移动端
pnpm cap:sync           # 同步Web资源到原生项目

# Android开发
pnpm android:dev        # 构建并在Android设备上运行
pnpm android:build      # 构建Android应用
pnpm cap:open:android   # 打开Android Studio

# iOS开发
pnpm ios:dev            # 构建并在iOS设备上运行
pnpm ios:build          # 构建iOS应用
pnpm cap:open:ios       # 打开Xcode
```

## 📋 配置文件说明

### capacitor.config.ts
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mooddiary.app',     // 应用包名
  appName: '心情日记',             // 应用名称
  webDir: 'dist'                  // Web构建输出目录
};

export default config;
```

### PWA配置 (vite.config.ts)
- 自动生成Service Worker
- 离线缓存策略
- Web App Manifest
- 应用图标和启动画面

## 🎨 应用资源

已配置的应用资源：
- `pwa-192x192.png` - PWA图标 (192x192)
- `pwa-512x512.png` - PWA图标 (512x512)
- `apple-touch-icon.png` - iOS图标 (180x180)
- `masked-icon.svg` - Safari固定标签图标
- `favicon.svg` - 网站图标

## 🔧 故障排除

### 常见问题

1. **构建失败**
   ```bash
   # 清理缓存
   pnpm clean
   rm -rf node_modules
   pnpm install
   ```

2. **Android构建错误**
   - 检查Java版本 (需要JDK 17+)
   - 更新Android SDK
   - 清理Android项目: `cd android && ./gradlew clean`

3. **iOS构建错误**
   - 更新Xcode到最新版本
   - 检查iOS部署目标版本
   - 清理Xcode缓存: `Product` → `Clean Build Folder`

4. **PWA不能安装**
   - 检查HTTPS连接
   - 确认Service Worker正常工作
   - 验证Web App Manifest配置

### 调试技巧

1. **查看构建日志**
   ```bash
   pnpm build:mobile --verbose
   ```

2. **检查Capacitor状态**
   ```bash
   npx cap doctor
   ```

3. **实时调试**
   ```bash
   # Android
   chrome://inspect
   
   # iOS
   Safari → 开发 → 设备名称
   ```

## 📱 测试建议

1. **功能测试**
   - 所有页面正常显示
   - 数据保存和读取
   - 离线功能
   - 推送通知

2. **性能测试**
   - 启动速度
   - 页面切换流畅度
   - 内存使用情况

3. **兼容性测试**
   - 不同屏幕尺寸
   - 不同操作系统版本
   - 横竖屏切换

## 🚀 发布流程

### PWA发布
1. 部署到HTTPS服务器
2. 配置域名和SSL证书
3. 测试PWA安装功能

### Android发布
1. 生成签名APK
2. 上传到Google Play Console
3. 填写应用信息和截图
4. 提交审核

### iOS发布
1. 配置App Store Connect
2. 创建应用记录
3. 上传构建版本
4. 提交审核

## 📞 技术支持

如果在打包过程中遇到问题，请检查：
1. [Capacitor官方文档](https://capacitorjs.com/docs)
2. [PWA开发指南](https://web.dev/progressive-web-apps/)
3. 项目GitHub Issues

---

**祝您打包顺利！** 🎉