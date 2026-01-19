# 边缘计算模块

分布式边缘计算系统，提供边缘函数、边缘存储、边缘路由、智能缓存和图片处理功能。

## 核心特性

### 边缘函数
- 多运行时支持 - JavaScript、TypeScript、Rust、Go、Python、WASM
- 全球部署 - 一键部署到全球边缘节点
- 自动扩缩容 - 根据请求量自动调整实例数量
- 冷启动优化 - 保持最小实例数实现零冷启动
- 版本管理 - 支持多版本部署和回滚

### 边缘存储
- 多种存储类型 - KV、Durable Objects、R2、Queue、Counter、D1
- 全球复制 - 数据自动复制到多个区域
- 强一致性 - 可选的强一致性或最终一致性
- 智能缓存 - 本地缓存层提升性能
- 数据加密 - 自动加密存储数据

### 边缘路由
- 智能路由 - 基于延迟、负载、区域的智能路由
- 请求转换 - 灵活的请求/响应转换
- 速率限制 - 内置速率限制保护
- 认证集成 - JWT、API Key、OAuth2、Basic Auth
- 条件路由 - 复杂的路由规则和条件匹配

### 边缘缓存
- 多层缓存 - 内存、边缘、源服务器多层缓存
- 智能预取 - 基于访问模式的智能预加载
- 缓存预热 - 批量预热热门内容
- 过期策略 - Stale-While-Revalidate 等高级策略
- 压缩支持 - 自动压缩减少传输量

### 图片处理
- 格式转换 - 支持 JPEG、PNG、WebP、AVIF、GIF、BMP、TIFF、ICO 等格式
- 图片裁剪 - 精确的图片裁剪功能
- 图片缩放 - 多种缩放模式（等比缩放、填充、拉伸等）
- 批量处理 - 支持批量处理多张图片
- 浏览器原生 - 使用 OffscreenCanvas API，无需外部依赖

## 模块结构

```
src/cloud-core/edge/
├── base/
│   └── EdgeTypes.ts            # 核心类型定义
├── EdgeFunctionManager.ts      # 边缘函数管理器
├── EdgeStorageManager.ts       # 边缘存储管理器
├── EdgeRouteManager.ts         # 边缘路由管理器
├── EdgeCacheManager.ts         # 边缘缓存管理器
├── EdgeImageProcessor.ts       # 图片处理器
├── EdgeManager.ts              # 统一管理器
├── hooks.ts                    # React Hooks
├── imageHooks.ts               # 图片处理 Hooks
└── index.ts                    # 统一导出
```

## 快速开始

### 部署边缘函数

```tsx
import { useEdgeDeployment } from '@/cloud-core';

const { deploy, loading } = useEdgeDeployment();

await deploy({
  functions: [{
    id: 'my-function',
    name: 'My Edge Function',
    runtime: 'javascript',
    entryPoint: 'index.js',
    source: 'export default { async fetch(request) { return new Response("Hello"); } }',
    triggers: ['http'],
    memory: 256,
    timeout: 5000,
    regions: ['us-east-1'],
  }],
  storages: [],
  routes: [],
});
```

### 使用边缘存储

```tsx
import { useEdgeStorage } from '@/cloud-core';

const { get, put, delete: deleteKey } = useEdgeStorage('my-app', 'kv');

// 保存数据
await put('user:123', { name: 'John', email: 'john@example.com' });

// 获取数据
const user = await get('user:123', { cache: true });

// 删除数据
await deleteKey('user:123');
```

### 配置边缘路由

```tsx
import { useEdgeRoute } from '@/cloud-core';

const { add } = useEdgeRoute();

await add({
  id: 'api-route',
  pattern: '/api/*',
  methods: ['GET', 'POST'],
  target: { type: 'function', id: 'my-function' },
  cachePolicy: { enabled: true, ttl: 300 },
  rateLimit: { enabled: true, requests: 100, period: 60 },
  enabled: true,
});
```

### 使用边缘缓存

```tsx
import { useEdgeCache } from '@/cloud-core';

const { get, set, warmup, getStats } = useEdgeCache();

// 设置缓存
await set('api:data', { data: 'value' }, { ttl: 3600 });

// 获取缓存
const result = await get('api:data');

// 预热缓存
await warmup([{ url: 'https://api.example.com/data' }]);

// 查看统计
const stats = getStats();
```

### 图片格式转换

```tsx
import { useImageConvert } from '@/cloud-core';

const { convert, processing } = useImageConvert();

// 转换图片格式
const result = await convert(imageBlob, {
  format: 'webp',
  quality: 0.9,
});

console.log('转换后大小:', result.size);
```

### 图片裁剪

```tsx
import { useImageCrop } from '@/cloud-core';

const { crop } = useImageCrop();

// 裁剪图片
const result = await crop(imageBlob, {
  x: 100,
  y: 100,
  width: 500,
  height: 500,
});
```

### 图片缩放

```tsx
import { useImageResize } from '@/cloud-core';

const { resize } = useImageResize();

// 等比缩放
const result = await resize(imageBlob, {
  width: 800,
  height: 600,
  mode: 'fit',
});
```

### 批量处理图片

```tsx
import { useBatchImageProcess } from '@/cloud-core';

const { process, progress } = useBatchImageProcess();

const results = await process([
  { blob: image1, operation: 'convert', options: { format: 'webp' } },
  { blob: image2, operation: 'resize', options: { width: 800, height: 600 } },
  { blob: image3, operation: 'crop', options: { x: 0, y: 0, width: 500, height: 500 } },
]);

console.log('处理进度:', progress);
```

## 核心 API

### 边缘函数管理器

```typescript
// 部署函数
await edgeManager.functions.deployFunction(config);

// 调用函数
const result = await edgeManager.functions.invokeFunction(functionId, {
  method: 'POST',
  body: { data: 'value' },
  preferRegion: 'ap-northeast-1',
});

// 获取统计
const stats = edgeManager.functions.getFunctionStatistics(functionId);
```

### 边缘存储管理器

```typescript
// 创建存储
const storeId = await edgeManager.storage.createStore({
  type: 'kv',
  namespace: 'my-app',
  enableCache: true,
  enableEncryption: true,
});

// 基本操作
await edgeManager.storage.put('my-app', 'key', 'value');
const value = await edgeManager.storage.get('my-app', 'key');
await edgeManager.storage.delete('my-app', 'key');

// 批量操作
const data = await edgeManager.storage.getMany('my-app', ['key1', 'key2']);
await edgeManager.storage.putMany('my-app', [
  { key: 'key1', value: 'value1' },
  { key: 'key2', value: 'value2' },
]);
```

### 边缘路由管理器

```typescript
// 添加路由
edgeManager.routes.addRoute({
  id: 'route-1',
  pattern: '/api/*',
  methods: ['GET', 'POST'],
  target: { type: 'function', id: 'api-function' },
  cachePolicy: { enabled: true, ttl: 300 },
  rateLimit: { enabled: true, requests: 100, period: 60 },
  priority: 100,
  enabled: true,
});

// 处理请求
const response = await edgeManager.routes.handleRequest({
  id: 'req-1',
  method: 'GET',
  url: '/api/data',
  headers: {},
  query: {},
  clientIP: '1.2.3.4',
  timestamp: new Date(),
});
```

### 边缘缓存管理器

```typescript
// 设置缓存
await edgeManager.cache.set('cache-key', data, {
  ttl: 3600,
  compress: true,
  tags: ['api', 'data'],
});

// 获取缓存
const result = await edgeManager.cache.get('cache-key', {
  staleWhileRevalidate: true,
});

// 预热缓存
await edgeManager.cache.warmupCache([
  { url: 'https://api.example.com/data1' },
  { url: 'https://api.example.com/data2' },
]);
```

### 图片处理器

```typescript
// 格式转换
const result = await edgeImageProcessor.convertImage(imageBlob, {
  format: 'webp',
  quality: 0.9,
});

// 裁剪图片
const result = await edgeImageProcessor.cropImage(imageBlob, {
  x: 100,
  y: 100,
  width: 500,
  height: 500,
});

// 缩放图片
const result = await edgeImageProcessor.resizeImage(imageBlob, {
  width: 800,
  height: 600,
  mode: 'fit', // 'fit' | 'fill' | 'stretch' | 'crop'
});

// 批量处理
const results = await edgeImageProcessor.batchProcess(images, (current, total) => {
  console.log(`进度: ${current}/${total}`);
});

// 获取图片信息
const info = await edgeImageProcessor.getImageInfo(imageBlob);
console.log('尺寸:', info.width, 'x', info.height);
```

## 配置选项

### 边缘函数配置

```typescript
interface IEdgeFunctionConfig {
  id: string;
  name: string;
  runtime: EdgeFunctionRuntime;
  entryPoint: string;
  source: string;
  triggers: EdgeFunctionTrigger[];
  environment: Record<string, string>;
  memory: number;                // 128-10240 MB
  timeout: number;               // 100-300000 ms
  maxInstances: number;
  minInstances: number;
  regions: string[];
  enableCache: boolean;
  cacheTTL?: number;
  enableAuth: boolean;
  enableRateLimit: boolean;
}
```

### 边缘存储配置

```typescript
interface IEdgeStorageConfig {
  type: EdgeStorageType;
  namespace: string;
  region?: string;
  consistency?: 'strong' | 'eventual';
  replication?: number;
  enableCache: boolean;
  enableEncryption: boolean;
  enableVersioning: boolean;
  enableCompression: boolean;
}
```

### 图片处理选项

```typescript
interface IImageConvertOptions {
  format: ImageFormat;           // 'jpeg' | 'png' | 'webp' | 'avif' | 'gif' | 'bmp' | 'tiff' | 'ico'
  quality?: number;              // 0-1，默认 0.92
}

interface IImageCropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface IImageResizeOptions {
  width: number;
  height: number;
  mode?: 'fit' | 'fill' | 'stretch' | 'crop';
  quality?: number;
}
```

## 使用场景

### API 加速

将 API 响应缓存在边缘，减少延迟和负载。

```tsx
const { get, set } = useEdgeCache();

async function fetchAPI(url: string) {
  const cached = await get(url);
  if (cached) return cached.value;

  const response = await fetch(url);
  const data = await response.json();
  await set(url, data, { ttl: 300 });
  return data;
}
```

### 动态内容生成

在边缘动态生成内容，减轻源服务器压力。

```tsx
const { invoke } = useEdgeFunction();

async function generateContent(params: any) {
  const result = await invoke('content-generator', { body: params });
  return result.body;
}
```

### 用户会话管理

在边缘存储用户会话，实现快速访问。

```tsx
const { put, get } = useEdgeStorage('sessions', 'kv');

async function saveSession(userId: string, session: any) {
  await put(`user:${userId}`, session, { expirationTTL: 3600 });
}

async function getSession(userId: string) {
  return await get(`user:${userId}`, { cache: true });
}
```

### 图片优化

在上传前优化图片，减少存储和带宽成本。

```tsx
const { convert, resize } = useImageProcessing();

async function optimizeImage(imageBlob: Blob) {
  // 转换为 WebP 格式
  const webp = await convert(imageBlob, { format: 'webp', quality: 0.85 });

  // 调整尺寸
  const resized = await resize(webp.blob, {
    width: 1920,
    height: 1080,
    mode: 'fit',
  });

  return resized.blob;
}
```

### 批量图片处理

处理用户上传的多张图片。

```tsx
const { batch, processing } = useBatchImageProcess();

async function handleUpload(images: File[]) {
  const operations = images.map(file => ({
    blob: file,
    operation: 'convert' as const,
    options: { format: 'webp', quality: 0.9 },
  }));

  const results = await batch(operations);

  return results.map(r => r.blob);
}
```

## 监控和统计

### 全局统计

```tsx
import { useEdgeStatistics } from '@/cloud-core';

function StatisticsDashboard() {
  const stats = useEdgeStatistics();

  return (
    <div>
      <h3>函数统计</h3>
      <p>总数: {stats.functions.total}</p>
      <p>调用次数: {stats.functions.totalInvocations}</p>
      <p>平均执行时间: {stats.functions.averageExecutionTime}ms</p>

      <h3>存储统计</h3>
      <p>读取次数: {stats.storage.totalReads}</p>
      <p>写入次数: {stats.storage.totalWrites}</p>
      <p>缓存命中率: {(stats.storage.hitRate * 100).toFixed(1)}%</p>

      <h3>缓存统计</h3>
      <p>条目数: {stats.cache.totalEntries}</p>
      <p>大小: {(stats.cache.totalSize / 1024 / 1024).toFixed(2)}MB</p>
      <p>命中率: {(stats.cache.hitRate * 100).toFixed(1)}%</p>
    </div>
  );
}
```

## 安全性

边缘计算模块内置多层安全保护：

- **认证** - 支持 JWT、API Key、OAuth2、Basic Auth
- **授权** - 基于角色的访问控制
- **加密** - 数据传输和存储加密
- **速率限制** - 防止 DDoS 攻击
- **输入验证** - 自动验证和清理输入

## 最佳实践

1. **合理设置 TTL** - 根据数据更新频率设置合适的过期时间
2. **使用缓存** - 充分利用边缘缓存提升性能
3. **监控指标** - 定期查看统计信息优化配置
4. **预热缓存** - 在流量高峰前预热热门内容
5. **区域部署** - 在用户密集区域部署更多节点
6. **图片优化** - 使用 WebP 格式减少文件大小
7. **批量处理** - 使用批量操作提高效率

## 相关文档

- [云存储核心模块](../README.md)
- [提供商接口](../providers/base/)
- [React Hooks](./hooks.ts)
- [图片处理 Hooks](./imageHooks.ts)
