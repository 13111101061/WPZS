/**
 * 边缘计算核心类型定义
 */

/**
 * 边缘节点位置
 */
export interface IEdgeLocation {
  region: string;                // 区域代码（如：us-east-1, ap-northeast-1）
  city?: string;                 // 城市名称
  country?: string;              // 国家代码
  latitude?: number;             // 纬度
  longitude?: number;            // 经度
  provider: string;              // 边缘服务提供商（Cloudflare, Fastly, AWS CloudFront等）
}

/**
 * 边缘节点状态
 */
export enum EdgeNodeStatus {
  ONLINE = 'online',
  DEGRADED = 'degraded',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
}

/**
 * 边缘节点信息
 */
export interface IEdgeNode {
  id: string;                    // 节点唯一标识
  name: string;                  // 节点名称
  location: IEdgeLocation;       // 节点位置
  status: EdgeNodeStatus;        // 节点状态
  capabilities: {
    compute: boolean;            // 是否支持计算
    storage: boolean;            // 是否支持存储
    cache: boolean;              // 是否支持缓存
    functions: boolean;          // 是否支持函数
  };
  resources: {
    cpu: {
      cores: number;
      frequency: number;         // MHz
    };
    memory: number;              // MB
    storage: number;             // GB
    bandwidth: number;           // Mbps
  };
  latency?: number;              // 到客户端的延迟（毫秒）
  loadAverage?: number;          // 负载平均值
  lastHealthCheck?: Date;        // 最后健康检查时间
}

/**
 * 边缘函数运行时
 */
export enum EdgeFunctionRuntime {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  RUST = 'rust',
  GO = 'go',
  PYTHON = 'python',
  WASM = 'wasm',
}

/**
 * 边缘函数触发器类型
 */
export enum EdgeFunctionTrigger {
  HTTP = 'http',                 // HTTP 请求
  SCHEDULE = 'schedule',         // 定时触发
  EVENT = 'event',               // 事件触发
  WEBHOOK = 'webhook',           // Webhook
  QUEUE = 'queue',               // 队列触发
}

/**
 * 边缘函数配置
 */
export interface IEdgeFunctionConfig {
  id: string;
  name: string;
  description?: string;
  runtime: EdgeFunctionRuntime;
  entryPoint: string;            // 入口文件/函数
  source: string;                // 源代码或源代码 URL
  triggers: EdgeFunctionTrigger[];
  environment: Record<string, string>; // 环境变量
  memory: number;                // 内存限制（MB）
  timeout: number;               // 超时时间（毫秒）
  maxInstances: number;          // 最大实例数
  minInstances: number;          // 最小实例数（保持热启动）
  regions: string[];             // 部署区域
  customDomains?: string[];      // 自定义域名
  enableCache: boolean;          // 是否启用响应缓存
  cacheTTL?: number;             // 缓存时间（秒）
  enableAuth: boolean;           // 是否启用认证
  authConfig?: any;              // 认证配置
  enableRateLimit: boolean;      // 是否启用速率限制
  rateLimit?: {
    requests: number;            // 请求数
    period: number;              // 时间窗口（秒）
  };
  enableLogs: boolean;           // 是否启用日志
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  enableMetrics: boolean;        // 是否启用指标收集
  tags?: Record<string, string>; // 标签
}

/**
 * 边缘函数执行结果
 */
export interface IEdgeFunctionResult {
  success: boolean;
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  executionTime: number;         // 执行时间（毫秒）
  memoryUsed: number;            // 使用的内存（MB）
  nodeId: string;                // 执行的节点 ID
  region: string;                // 执行的区域
  cached: boolean;               // 是否来自缓存
  error?: string;                // 错误信息
}

/**
 * 边缘函数调用选项
 */
export interface IEdgeFunctionInvokeOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  preferRegion?: string;         // 优先区域
  waitForResult?: boolean;       // 是否等待结果（fire and forget）
  timeout?: number;              // 调用超时
  idempotencyKey?: string;       // 幂等键
}

/**
 * 边缘存储类型
 */
export enum EdgeStorageType {
  KV = 'kv',                     // 键值存储
  DURABLE_OBJECT = 'durable_object', // 持久对象
  R2 = 'r2',                     // 对象存储（S3兼容）
  QUEUE = 'queue',               // 队列
  COUNTER = 'counter',           // 计数器
  D1 = 'd1',                     // SQL 数据库
}

/**
 * 边缘存储条目
 */
export interface IEdgeStorageEntry {
  key: string;
  value: any;
  metadata?: {
    contentType?: string;
    cacheTTL?: number;           // 缓存时间（秒）
    expiresIn?: number;          // 过期时间（秒）
    version?: number;            // 版本号
    tags?: string[];             // 标签
    size?: number;               // 大小（字节）
    checksum?: string;           // 校验和
  };
}

/**
 * 边缘存储配置
 */
export interface IEdgeStorageConfig {
  type: EdgeStorageType;
  namespace: string;             // 命名空间
  region?: string;               // 区域
  consistency?: 'strong' | 'eventual'; // 一致性级别
  replication?: number;          // 副本数量
  enableCache: boolean;          // 是否启用本地缓存
  cacheConfig?: {
    maxSize: number;             // 最大缓存大小
    maxAge: number;              // 最大缓存时间（秒）
  };
  enableEncryption: boolean;     // 是否启用加密
  encryptionKey?: string;        // 加密密钥
  enableVersioning: boolean;     // 是否启用版本控制
  maxVersions?: number;          // 最大版本数
  enableCompression: boolean;    // 是否启用压缩
  compressionThreshold?: number; // 压缩阈值（字节）
}

/**
 * 边缘路由规则
 */
export interface IEdgeRouteRule {
  id: string;
  name: string;
  pattern: string;               // URL 模式（支持通配符）
  methods: string[];             // HTTP 方法
  target: {
    type: 'function' | 'storage' | 'origin' | 'cache';
    id: string;                  // 函数 ID、存储 ID 或源服务器地址
  };
  cachePolicy?: {
    enabled: boolean;
    ttl: number;                 // 缓存时间（秒）
    staleWhileRevalidate?: number; // 过期后重新验证时间
    bypassCacheOn?: string[];    // 绕过缓存的条件
  };
  rateLimit?: {
    enabled: boolean;
    requests: number;
    period: number;
  };
  auth?: {
    enabled: boolean;
    type: 'jwt' | 'api-key' | 'oauth2' | 'basic';
    config: any;
  };
  transform?: {
    request?: any;               // 请求转换
    response?: any;              // 响应转换
  };
  conditions?: Array<{
    field: string;               // 字段（如：headers, query, path）
    operator: 'equals' | 'contains' | 'matches' | 'exists';
    value: any;
  }>;
  priority: number;              // 优先级
  enabled: boolean;
}

/**
 * 边缘缓存策略
 */
export interface IEdgeCachePolicy {
  id: string;
  name: string;
  rules: Array<{
    urlPattern: string;
    methods: string[];
    cacheKey: string;            // 缓存键生成规则
    ttl: number;                 // 默认 TTL
    staleWhileRevalidate?: number;
    serveStale?: boolean;        // 缓存过期时是否提供过期内容
    bypassConditions?: string[]; // 绕过条件
    purgeConditions?: string[];  // 清除条件
  }>;
  compressionEnabled: boolean;   // 是否启用压缩
  varyHeaders?: string[];        // Vary 头
  cacheableStatusCodes: number[]; // 可缓存的状态码
  respectOriginCacheControl: boolean; // 是否遵守源服务器的 Cache-Control
}

/**
 * 边缘部署配置
 */
export interface IEdgeDeploymentConfig {
  functions: IEdgeFunctionConfig[];
  storages: IEdgeStorageConfig[];
  routes: IEdgeRouteRule[];
  cachePolicies: IEdgeCachePolicy[];
  environment: 'development' | 'staging' | 'production';
  regions: string[];             // 全局部署区域
  defaultRegion: string;         // 默认区域
  enableMetrics: boolean;
  enableAlerts: boolean;
  alertConfig?: any;
}

/**
 * 边缘统计信息
 */
export interface IEdgeStatistics {
  nodes: {
    total: number;
    online: number;
    degraded: number;
    offline: number;
  };
  functions: {
    total: number;
    active: number;
    totalInvocations: number;
    totalErrors: number;
    averageExecutionTime: number;
    p95ExecutionTime: number;
    p99ExecutionTime: number;
  };
  storage: {
    totalEntries: number;
    totalSize: number;
    totalReads: number;
    totalWrites: number;
    averageReadLatency: number;
    averageWriteLatency: number;
    hitRate: number;
  };
  cache: {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    missRate: number;
    averageLatency: number;
  };
  bandwidth: {
    totalInbound: number;        // 入站流量（字节）
    totalOutbound: number;       // 出站流量（字节）
    averageBandwidth: number;    // 平均带宽（Mbps）
  };
}

/**
 * 边缘事件类型
 */
export enum EdgeEventType {
  NODE_UP = 'node_up',
  NODE_DOWN = 'node_down',
  NODE_DEGRADED = 'node_degraded',
  FUNCTION_DEPLOYED = 'function_deployed',
  FUNCTION_UPDATED = 'function_updated',
  FUNCTION_REMOVED = 'function_removed',
  FUNCTION_INVOKED = 'function_invoked',
  FUNCTION_ERROR = 'function_error',
  CACHE_HIT = 'cache_hit',
  CACHE_MISS = 'cache_miss',
  CACHE_PURGED = 'cache_purged',
  STORAGE_READ = 'storage_read',
  STORAGE_WRITE = 'storage_write',
  STORAGE_DELETE = 'storage_delete',
  ROUTE_MATCHED = 'route_matched',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
}
