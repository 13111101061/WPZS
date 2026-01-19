# 个人网盘接入系统

> 一个功能完整、接口丰富、扩展性强的云存储接入系统，专为无图形化的云端网盘和对象存储提供可视化的 Web 体验。

## ✨ 核心特性

### 🎯 统一接口
- **提供商适配器模式** - 统一的 API 接口支持多种云存储
- **虚拟文件系统** - 抽象的文件操作，隐藏底层差异
- **类型安全** - 完整的 TypeScript 类型定义

### 🚀 高性能
- **智能缓存系统** - LRU 缓存 + IndexedDB 持久化
- **分片传输** - 支持大文件分片上传/下载
- **并发控制** - 智能的队列管理和并发限制

### 🔌 可扩展
- **插件化架构** - 轻松添加新的存储提供商
- **事件驱动** - 完整的事件系统，支持中间件
- **钩子系统** - 丰富的 React Hooks 集成

### 🛡️ 企业级
- **OAuth 2.0** - 标准的认证流程
- **Token 自动刷新** - 无缝的会话管理
- **错误恢复** - 自动重试和指数退避

## 📦 架构概览

```
src/cloud-core/
├── providers/              # 提供商系统
│   ├── base/              # 基础接口
│   │   ├── IStorageProvider.ts      # 核心接口
│   │   ├── IFileItem.ts            # 文件项接口
│   │   ├── IProviderConfig.ts      # 配置接口
│   │   ├── ITransferOptions.ts     # 传输选项
│   │   ├── IProviderCapabilities.ts # 能力声明
│   │   ├── BaseStorageProvider.ts  # 基类实现
│   │   └── index.ts
│   ├── registry/           # 提供商注册表
│   │   └── ProviderRegistry.ts
│   └── examples/           # 示例实现
│       └── WebDAVProvider.ts
│
├── vfs/                    # 虚拟文件系统 (TODO)
├── transfer/               # 传输引擎
│   ├── TransferManager.ts  # 传输管理器
│   └── index.ts
│
├── cache/                  # 缓存系统
│   ├── LRUCache.ts         # LRU 缓存实现
│   ├── CacheManager.ts     # 缓存管理器
│   └── index.ts
│
├── auth/                   # 认证管理 (TODO)
├── sync/                   # 同步引擎 (TODO)
├── events/                 # 事件系统
│   ├── EventBus.ts         # 事件总线
│   └── index.ts
│
├── contexts/               # React Context
│   └── CloudProviderContext.tsx
│
├── hooks/                  # React Hooks
│   └── index.ts
│
└── index.ts                # 统一导出
```

## 🚀 快速开始

### 1. 基础设置

首先，用 `CloudProvider` 包裹你的应用：

```tsx
import { CloudProvider } from '@/cloud-core';

function App() {
  return (
    <CloudProvider
      cacheConfig={{
        enabled: true,
        metadata: { maxSize: 1000, maxAge: 5 * 60 * 1000 },
        thumbnail: { maxSize: 500, maxAge: 30 * 60 * 1000 },
      }}
      transferConfig={{
        maxConcurrent: 3,
        maxUploadConcurrent: 2,
        maxDownloadConcurrent: 3,
      }}
    >
      <YourApp />
    </CloudProvider>
  );
}
```

### 2. 添加云存储提供商

```tsx
import { useCloud, registerProvider } from '@/cloud-core';
import { WebDAVProvider } from '@/cloud-core/providers/examples/WebDAVProvider';

// 注册 WebDAV 提供商
registerProvider({
  type: 'webdav',
  name: 'WebDAV',
  description: '通用 WebDAV 协议支持',
  icon: 'fa-cloud',
  color: '#3B82F6',
  category: 'protocol',
  factory: (config) => new WebDAVProvider(config),
  template: {
    id: 'webdav',
    name: 'WebDAV',
    type: 'webdav',
    description: '连接到任何 WebDAV 兼容的存储服务',
    icon: 'fa-cloud',
    color: '#3B82F6',
    defaultConfig: {
      auth: {
        basic: {
          username: '',
          password: '',
        },
      },
      preferences: {
        autoSync: true,
        showHiddenFiles: false,
        preservePermissions: true,
        preserveTimestamps: true,
      },
      ui: {
        icon: 'fa-cloud',
        color: '#3B82F6',
        order: 1,
        showInQuickAccess: true,
      },
      status: 'disconnected' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      enabled: true,
      id: '',
      name: '',
      type: 'webdav',
    },
    requiredFields: ['auth.basic.username', 'auth.basic.password', 'endpoint'],
    optionalFields: ['preferences', 'ui'],
  },
  isAvailable: true,
});

// 在组件中使用
function AddProvider() {
  const { addProvider } = useCloud();

  const handleAdd = async () => {
    await addProvider('webdav', {
      id: 'my-webdav',
      name: 'My WebDAV',
      type: 'webdav',
      enabled: true,
      endpoint: 'https://dav.example.com/',
      auth: {
        basic: {
          username: 'user@example.com',
          password: 'password',
        },
      },
      preferences: {
        autoSync: true,
        showHiddenFiles: false,
        preservePermissions: true,
        preserveTimestamps: true,
        calculateHash: true,
        generateThumbnails: true,
      },
      ui: {
        icon: 'fa-cloud',
        color: '#3B82F6',
        order: 1,
        showInQuickAccess: true,
      },
      status: 'disconnected' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  return <button onClick={handleAdd}>Add WebDAV</button>;
}
```

### 3. 浏览文件

```tsx
import { useFileList } from '@/cloud-core';

function FileBrowser({ folderId }: { folderId?: string }) {
  const { files, loading, error, refresh } = useFileList(folderId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {files.map(file => (
        <div key={file.id}>
          <span>{file.name}</span>
          <span>{file.size}</span>
          <span>{file.modifiedAt.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
```

### 4. 上传文件

```tsx
import { useFileUpload, useFileDrop } from '@/cloud-core';

function FileUpload({ targetPath }: { targetPath: string }) {
  const { upload, uploading, progress } = useFileUpload();
  const { isDragging, dropHandlers } = useFileDrop(async (files) => {
    await upload(files, targetPath);
  });

  return (
    <div
      {...dropHandlers}
      className={isDragging ? 'dragging' : ''}
    >
      {uploading ? `Uploading... ${progress}%` : 'Drop files here'}
    </div>
  );
}
```

### 5. 下载文件

```tsx
import { useFileDownload } from '@/cloud-core';

function FileDownload({ fileId }: { fileId: string }) {
  const { download, downloading, progress } = useFileDownload();

  return (
    <button onClick={() => download([fileId])}>
      {downloading ? `Downloading... ${progress}%` : 'Download'}
    </button>
  );
}
```

### 6. 管理传输任务

```tsx
import { useTransfers } from '@/cloud-core';

function TransferPanel() {
  const { tasks, summary, pauseTask, resumeTask, cancelTask, retryTask } = useTransfers();

  return (
    <div>
      <h3>Transfer Summary</h3>
      <p>Active: {summary.activeTasks}</p>
      <p>Completed: {summary.completedTasks}</p>
      <p>Progress: {summary.percentage.toFixed(1)}%</p>

      <h3>Tasks</h3>
      {tasks.map(task => (
        <div key={task.id}>
          <span>{task.fileName}</span>
          <span>{task.status}</span>
          <span>{task.progress.percentage.toFixed(1)}%</span>
          <button onClick={() => pauseTask(task.id)}>Pause</button>
          <button onClick={() => resumeTask(task.id)}>Resume</button>
          <button onClick={() => cancelTask(task.id)}>Cancel</button>
          <button onClick={() => retryTask(task.id)}>Retry</button>
        </div>
      ))}
    </div>
  );
}
```

## 📚 核心 API

### 提供商接口 (IStorageProvider)

所有云存储提供商必须实现的核心接口：

```typescript
interface IStorageProvider {
  // 初始化和连接
  initialize(): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  testConnection(): Promise<boolean>;

  // 文件操作
  listFiles(options?: IListFilesOptions): Promise<IFileListResponse>;
  getFileInfo(fileId: string): Promise<IFileItem>;
  createFolder(name: string, parentId: string): Promise<IFileItem>;
  renameFile(fileId: string, newName: string): Promise<IFileItem>;
  moveFile(fileId: string, targetParentId: string): Promise<IFileItem>;
  deleteFile(fileId: string): Promise<void>;

  // 搜索
  searchFiles(options: ISearchOptions): Promise<ISearchResult>;

  // 上传和下载
  uploadFile(file: File | Blob, options: IUploadOptions): Promise<ITransferTask>;
  downloadFile(fileId: string): Promise<ITransferTask>;

  // 存储配额
  getStorageQuota(): Promise<IStorageQuota>;
}
```

### React Hooks

可用的自定义 Hooks：

```typescript
// 文件操作
useFileList(folderId, options)      // 获取文件列表
useFile(fileId)                     // 获取文件详情
useFileSearch()                     // 搜索文件

// 传输操作
useFileUpload()                     // 上传文件
useFileDownload()                   // 下载文件
useTransfers()                      // 管理传输任务

// 其他
useStorageQuota()                   // 获取存储配额
useFileDrop(onDrop)                 // 文件拖放
useFileSelect()                     // 文件选择
useFilePreview(fileId)              // 文件预览
useProviderConfig()                 // 提供商配置
useCloudEvent(event, callback)      // 监听云事件
```

### 事件系统

```typescript
import { eventBus, CloudEventType } from '@/cloud-core';

// 监听事件
eventBus.on(CloudEventType.FILE_CREATED, (data) => {
  console.log('File created:', data);
});

// 发布事件
eventBus.emit(CloudEventType.FILE_CREATED, { fileId, name });

// 等待事件
const result = await eventBus.waitFor(CloudEventType.UPLOAD_COMPLETED);
```

## 🔌 创建自定义提供商

### 1. 继承基类

```typescript
import { BaseStorageProvider } from '@/cloud-core';

export class MyProvider extends BaseStorageProvider {
  constructor(config: IProviderConfig) {
    super(
      config.id,
      config.name,
      'myprovider',
      config,
      MY_CAPABILITIES
    );
  }

  // 实现必需的方法
  async initialize(): Promise<void> {
    // 初始化逻辑
  }

  async connect(): Promise<void> {
    // 连接逻辑
  }

  async listFiles(options?: IListFilesOptions): Promise<IFileListResponse> {
    // 列出文件
  }

  // ... 其他方法
}
```

### 2. 声明能力

```typescript
const MY_CAPABILITIES: IProviderCapabilities = {
  supports: {
    listFiles: true,
    uploadFile: true,
    downloadFile: true,
    // ... 其他能力
  },
  limits: {
    maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
    maxFileNameLength: 255,
    // ... 其他限制
  },
  performance: {
    recommendedChunkSize: 5 * 1024 * 1024,
    maxConcurrentRequests: 3,
    // ... 其他性能参数
  },
  authMethods: ['oauth2'],
  regions: ['us-east-1', 'eu-west-1'],
  customMetadata: true,
};
```

### 3. 注册提供商

```typescript
import { registerProvider } from '@/cloud-core';

registerProvider({
  type: 'myprovider',
  name: 'My Provider',
  description: 'My custom storage provider',
  icon: 'fa-cloud',
  color: '#10B981',
  category: 'personal',
  factory: (config) => new MyProvider(config),
  template: { /* ... */ },
  isAvailable: true,
});
```

## 🎨 UI 组件集成

### 示例：文件浏览器组件

```tsx
import { useState } from 'react';
import { useFileList, useFileUpload, useFileDrop } from '@/cloud-core';

export function FileExplorer() {
  const [currentFolder, setCurrentFolder] = useState<string>('/');
  const { files, loading, refresh } = useFileList(currentFolder);
  const { upload, uploading, progress } = useFileUpload();
  const { isDragging, dropHandlers } = useFileDrop(async (files) => {
    await upload(files, currentFolder);
    refresh();
  });

  return (
    <div className="file-explorer">
      {/* 拖放上传区域 */}
      <div
        {...dropHandlers}
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
      >
        {uploading ? `Uploading... ${progress}%` : 'Drop files to upload'}
      </div>

      {/* 文件列表 */}
      <div className="file-list">
        {loading ? (
          <div>Loading...</div>
        ) : (
          files.map(file => (
            <div key={file.id} className="file-item">
              <span className="file-icon">{file.type === 'folder' ? '📁' : '📄'}</span>
              <span className="file-name">{file.name}</span>
              <span className="file-size">{formatSize(file.size)}</span>
              <span className="file-date">{file.modifiedAt.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

## 🔧 高级配置

### 缓存配置

```typescript
const cacheConfig = {
  enabled: true,
  metadata: {
    maxSize: 1000,           // 最多缓存 1000 个元数据
    maxAge: 5 * 60 * 1000,   // 5 分钟过期
    maxSizeBytes: 50 * 1024 * 1024, // 最大 50MB
  },
  thumbnail: {
    maxSize: 500,
    maxAge: 30 * 60 * 1000,  // 30 分钟
    maxSizeBytes: 100 * 1024 * 1024, // 最大 100MB
  },
  content: {
    maxSize: 100,
    maxAge: 60 * 60 * 1000,  // 1 小时
    maxSizeBytes: 500 * 1024 * 1024, // 最大 500MB
  },
  storagePath: 'cloud-cache', // IndexedDB 数据库名
};
```

### 传输配置

```typescript
const transferConfig = {
  maxConcurrent: 3,           // 最大并发传输数
  maxUploadConcurrent: 2,     // 最大上传并发
  maxDownloadConcurrent: 3,   // 最大下载并发
  maxQueueSize: 100,          // 队列最大长度
  priorityMode: 'priority',   // 队列模式
  autoStart: true,            // 自动开始
  throttleDelay: 100,         // 节流延迟（毫秒）
};
```

## 🎯 最佳实践

### 1. 错误处理

```tsx
function FileComponent() {
  const { files, loading, error } = useFileList();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <FileList files={files} />;
}
```

### 2. 进度反馈

```tsx
function UploadComponent() {
  const { upload, progress, uploading } = useFileUpload();

  return (
    <>
      <button
        onClick={() => upload(files, path)}
        disabled={uploading}
      >
        Upload
      </button>
      {uploading && (
        <ProgressBar value={progress} max={100} />
      )}
    </>
  );
}
```

### 3. 资源清理

```tsx
useEffect(() => {
  const unsubscribe = eventBus.on(CloudEventType.FILE_CREATED, handleCreate);

  return () => {
    unsubscribe(); // 清理订阅
  };
}, []);
```

## 🌟 扩展接口

系统预留了大量扩展接口：

### 提供商扩展
- `getFeature(featureName)` - 获取提供商特定功能
- `extensionStatus` - 提供商特定扩展字段

### 事件钩子
- `onChunkStart` - 分片开始
- `onChunkComplete` - 分片完成
- `onProgress` - 进度更新

### 自定义元数据
- `metadata` - 文件自定义元数据
- `customMetadata` - 提供商配置元数据

## 📋 TODO

- [ ] 虚拟文件系统 (VFS)
- [ ] 认证管理器 (OAuth2 流程)
- [ ] 同步引擎
- [ ] 更多内置提供商 (阿里云盘、百度网盘、OneDrive 等)
- [ ] UI 组件库
- [ ] 单元测试

## 🤝 贡献

欢迎贡献！请确保：
1. 遵循现有的代码风格
2. 添加类型定义
3. 更新文档
4. 编写测试

## 📄 许可

MIT License
