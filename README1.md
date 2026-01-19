# Nexus Pro - 个人网盘可视化系统

一个强大的个人网盘接入系统，专为无图形化的云端网盘和对象存储提供可视化的 Web 体验。

## 核心特性

### 统一接口系统
- 提供商适配器模式 - 统一的 API 接口支持多种云存储
- 虚拟文件系统 - 抽象的文件操作，隐藏底层差异
- 类型安全 - 完整的 TypeScript 类型定义

### 高性能架构
- 智能缓存系统 - LRU 缓存 + IndexedDB 持久化
- 分片传输引擎 - 支持大文件分片上传/下载
- 并发控制 - 智能的队列管理和并发限制
- 断点续传 - 自动重试和指数退避

### 可扩展设计
- 插件化架构 - 轻松添加新的存储提供商
- 事件驱动系统 - 完整的事件系统，支持中间件
- 丰富的 Hooks - 20+ 自定义 React Hooks 集成

### 边缘计算
- 边缘函数 - 全球分布式函数计算，支持 JS/TS/Rust/Go/Python/WASM
- 边缘存储 - KV、对象存储、队列、计数器等多种存储类型
- 边缘路由 - 智能路由匹配、请求转换、速率限制
- 边缘缓存 - 多层缓存、智能预取、缓存预热
- 图片处理 - 格式转换、裁剪、缩放、批量处理

### 企业级特性
- OAuth 2.0 - 标准的认证流程支持
- Token 自动刷新 - 无缝的会话管理
- 错误恢复 - 自动重试机制
- 安全加密 - 凭证加密存储

## 支持的云存储

### 个人网盘
- 阿里云盘、百度网盘、OneDrive、Google Drive、Dropbox

### 对象存储
- AWS S3、阿里云 OSS、腾讯云 COS、MinIO、任意 S3 兼容存储

### 协议支持
- WebDAV（通用协议）、S3 Protocol、自定义协议（插件扩展）

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动开发服务器

```bash
pnpm run dev
```

### 3. 基础配置

使用 CloudProvider 包裹应用：

```tsx
import { CloudProvider } from '@/cloud-core';

function App() {
  return (
    <CloudProvider
      cacheConfig={{ enabled: true, metadata: { maxSize: 1000 } }}
      transferConfig={{ maxConcurrent: 3 }}
    >
      <YourApp />
    </CloudProvider>
  );
}
```

### 4. 使用示例

```tsx
// 文件操作
const { files } = useFileList(folderId);

// 上传文件
const { upload } = useFileUpload();
await upload(files, targetPath);

// 边缘存储
const { get, put } = useEdgeStorage('app', 'kv');
await put('key', data);
const value = await get('key');

// 边缘函数
const { deploy } = useEdgeDeployment();
await deploy({ functions: [config], storages: [], routes: [] });

// 图片格式转换
const { convert } = useImageConvert();
const result = await convert(imageBlob, { format: 'webp', quality: 0.9 });

// 图片裁剪
const { crop } = useImageCrop();
const cropped = await crop(imageBlob, { x: 100, y: 100, width: 500, height: 500 });

// 图片缩放
const { resize } = useImageResize();
const resized = await resize(imageBlob, { width: 1920, height: 1080, mode: 'fit' });
```

## 核心 API

### 文件操作 Hooks

| Hook | 功能 |
|------|------|
| useFileList | 获取文件列表 |
| useFile | 获取文件详情 |
| useFileSearch | 搜索文件 |
| useFileUpload | 上传文件 |
| useFileDownload | 下载文件 |
| useFileDrop | 文件拖放 |
| useFilePreview | 文件预览 |

### 传输管理 Hooks

| Hook | 功能 |
|------|------|
| useTransfers | 管理传输任务，支持暂停/恢复/取消 |

### 边缘计算 Hooks

| Hook | 功能 |
|------|------|
| useEdgeFunction | 边缘函数管理，支持部署/调用/更新 |
| useEdgeStorage | 边缘存储操作，支持 get/put/delete/list |
| useEdgeRoute | 边缘路由配置，支持智能路由匹配 |
| useEdgeCache | 边缘缓存控制，支持多层缓存和预热 |
| useEdgeNodes | 边缘节点状态，查看全球节点健康度 |
| useEdgeStatistics | 全局统计信息，聚合所有边缘指标 |
| useEdgeDeployment | 一键部署函数、存储、路由到边缘节点 |
| useImageConvert | 图片格式转换，支持 JPEG/PNG/WebP/AVIF 等 |
| useImageCrop | 图片裁剪，精确裁剪指定区域 |
| useImageResize | 图片缩放，支持多种缩放模式 |
| useImageInfo | 获取图片尺寸、大小等信息 |
| useBatchImageProcess | 批量处理多张图片，支持进度回调 |
| useImageProcessing | 组合所有图片处理功能的 Hook |

### 提供商接口

所有云存储提供商必须实现 IStorageProvider 接口，包含：

- 初始化和连接：initialize()、connect()、disconnect()、testConnection()
- 文件操作：listFiles()、getFileInfo()、createFolder()、renameFile()、moveFile()、deleteFile()
- 搜索：searchFiles()
- 上传下载：uploadFile()、downloadFile()
- 存储配额：getStorageQuota()

### 事件系统

```typescript
import { eventBus, CloudEventType } from '@/cloud-core';

// 监听事件
eventBus.on(CloudEventType.FILE_CREATED, (data) => {});

// 发布事件
eventBus.emit(CloudEventType.FILE_CREATED, { fileId, name });

// 等待事件
const result = await eventBus.waitFor(CloudEventType.UPLOAD_COMPLETED);
```

## 自定义提供商

继承 BaseStorageProvider 并实现必需方法：

```typescript
import { BaseStorageProvider } from '@/cloud-core';

export class MyProvider extends BaseStorageProvider {
  constructor(config) {
    super(config.id, config.name, 'myprovider', config, MY_CAPABILITIES);
  }

  async initialize() { }
  async connect() { }
  async listFiles(options) { }
  // ... 其他方法
}

// 注册提供商
registerProvider({
  type: 'myprovider',
  name: 'My Provider',
  factory: (config) => new MyProvider(config),
  template: { /* 配置模板 */ }
});
```

## 功能模块

- 工作台 - 总览存储使用情况和快速访问
- 我的文件 - 文件浏览、上传、下载、管理
- 团队共享 - 团队文件共享与协作
- 最近访问 - 快速访问最近使用的文件
- 对象存储 - 配置和管理对象存储服务
- 存储空间 - 详细的存储使用统计和分析

## 技术栈

- React 18.3.1 + TypeScript 5.7.2
- Vite 6.3.5
- React Router DOM 7.5.3
- Tailwind CSS 3.4.17
- Framer Motion 12.10.0
- Recharts 2.15.3

## 详细文档

- [核心模块文档](./src/cloud-core/README.md)
- [边缘计算模块](./src/cloud-core/edge/README.md)
- [API 参考文档](./src/cloud-core/providers/base/)
- [示例代码](./src/cloud-core/providers/examples/)

## 扩展接口

系统预留了大量扩展接口：

1. 提供商特定功能 - getFeature() 方法
2. 自定义元数据 - metadata 和 extensionStatus 字段
3. 事件中间件 - eventBus.use() 添加中间件
4. 传输回调 - onChunkStart、onProgress 等
5. 缓存策略 - 可自定义缓存行为
6. 认证方式 - 支持多种认证模式

## 贡献

欢迎贡献！请确保：
1. 感谢 构建“本项目由阿里云ESA提供加速、计算和保护
![alt text](image.png)

## 许可证

MIT License

---

Nexus Pro - 让云端存储触手可及
