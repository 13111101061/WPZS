/**
 * 提供商配置接口
 * 定义云存储提供商的配置结构
 */

/**
 * 认证配置接口
 */
export interface IAuthConfig {
  // OAuth 2.0 配置
  oauth2?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
    authUrl: string;
    tokenUrl: string;
    refreshUrl?: string;
  };

  // API Key 配置
  apiKey?: {
    key: string;
    secret?: string;
    region?: string;
  };

  // Basic Auth 配置
  basic?: {
    username: string;
    password: string;
  };

  // 自定义认证配置
  custom?: {
    [key: string]: any;
  };
}

/**
 * 传输配置接口
 */
export interface ITransferConfig {
  // 上传配置
  upload: {
    chunkSize: number;           // 分片大小（字节）
    maxConcurrent: number;       // 最大并发数
    maxRetries: number;          // 最大重试次数
    retryDelay: number;          // 重试延迟（毫秒）
    timeout: number;             // 超时时间（毫秒）
    speedLimit?: number;         // 速度限制（字节/秒，0表示不限制）
    verifyIntegrity: boolean;    // 是否校验完整性
  };

  // 下载配置
  download: {
    chunkSize: number;
    maxConcurrent: number;
    maxRetries: number;
    retryDelay: number;
    timeout: number;
    speedLimit?: number;
    verifyIntegrity: boolean;
  };
}

/**
 * 缓存配置接口
 */
export interface ICacheConfig {
  enabled: boolean;              // 是否启用缓存
  metadataTTL: number;           // 元数据缓存时间（毫秒）
  thumbnailTTL: number;          // 缩略图缓存时间（毫秒）
  contentTTL: number;            // 内容缓存时间（毫秒）
  maxSize: number;               // 最大缓存大小（字节）
  maxItems: number;              // 最大缓存项数
  storagePath?: string;          // 缓存存储路径（IndexedDB或本地路径）
}

/**
 * 同步配置接口
 */
export interface ISyncConfig {
  enabled: boolean;              // 是否启用同步
  interval: number;              // 同步间隔（毫秒）
  direction: 'bidirectional' | 'upload' | 'download'; // 同步方向
  conflictResolution: 'keep_local' | 'keep_remote' | 'keep_newest' | 'manual'; // 冲突解决策略
  excludePatterns: string[];     // 排除模式（glob）
  includePatterns?: string[];    // 包含模式（glob）
  deleteBehavior: 'sync' | 'keep'; // 删除行为
}

/**
 * 区域配置接口
 */
export interface IRegionConfig {
  id: string;                    // 区域ID
  name: string;                  // 区域名称
  endpoint: string;              // API端点
  uploadEndpoint?: string;       // 上传端点
  downloadEndpoint?: string;     // 下载端点
  latency?: number;              // 延迟（毫秒）
  priority?: number;             // 优先级
}

/**
 * 代理配置接口
 */
export interface IProxyConfig {
  enabled: boolean;
  protocol: 'http' | 'https' | 'socks5';
  host: string;
  port: number;
  username?: string;
  password?: string;
}

/**
 * 限流配置接口
 */
export interface IRateLimitConfig {
  enabled: boolean;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstSize?: number;            // 突发大小
}

/**
 * 加密配置接口
 */
export interface IEncryptionConfig {
  enabled: boolean;
  algorithm: 'AES-256-GCM' | 'AES-256-CBC' | 'custom';
  keySize: number;               // 密钥大小（位）
  keyDerivation: 'PBKDF2' | 'Scrypt' | 'Argon2';
  iterations: number;            // 迭代次数
}

/**
 * 存储配额接口
 */
export interface IStorageQuota {
  total: number;                 // 总容量（字节）
  used: number;                  // 已使用（字节）
  remaining: number;             // 剩余（字节）
  usagePercentage: number;       // 使用百分比
}

/**
 * 提供商统计信息接口
 */
export interface IProviderStatistics {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  uploadCount: number;
  downloadCount: number;
  lastSyncTime?: Date;
  lastUploadTime?: Date;
  lastDownloadTime?: Date;
}

/**
 * 提供商状态接口
 */
export enum ProviderStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTH_ERROR = 'auth_error',
  NETWORK_ERROR = 'network_error',
  RATE_LIMITED = 'rate_limited',
  MAINTENANCE = 'maintenance',
}

/**
 * 提供商配置接口
 */
export interface IProviderConfig {
  // === 基础信息 ===
  id: string;                    // 唯一标识
  name: string;                  // 显示名称
  type: string;                  // 提供商类型
  enabled: boolean;              // 是否启用

  // === 认证配置 ===
  auth: IAuthConfig;             // 认证配置
  tokens?: {                     // 存储的令牌（加密）
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    tokenType?: string;
    scope?: string;
  };

  // === 连接配置 ===
  region?: string;               // 默认区域
  regions?: IRegionConfig[];     // 可用区域列表
  endpoint?: string;             // 自定义端点
  bucket?: string;               // 存储桶名称（S3类）
  container?: string;            // 容器名称（Azure类）
  workspace?: string;            // 工作空间ID

  // === 传输配置 ===
  transfer?: ITransferConfig;    // 传输配置

  // === 缓存配置 ===
  cache?: ICacheConfig;          // 缓存配置

  // === 同步配置 ===
  sync?: ISyncConfig;            // 同步配置

  // === 高级配置 ===
  proxy?: IProxyConfig;          // 代理配置
  rateLimit?: IRateLimitConfig;  // 限流配置
  encryption?: IEncryptionConfig; // 加密配置

  // === 存储根路径 ===
  rootPath?: string;             // 根路径（如：/或/My Files）

  // === 偏好设置 ===
  preferences: {
    autoSync: boolean;           // 自动同步
    showHiddenFiles: boolean;    // 显示隐藏文件
    preservePermissions: boolean;// 保留权限
    preserveTimestamps: boolean; // 保留时间戳
    calculateHash: boolean;      // 计算哈希值
    generateThumbnails: boolean; // 生成缩略图
  };

  // === 状态信息 ===
  status: ProviderStatus;        // 连接状态
  statusMessage?: string;        // 状态消息
  lastConnected?: Date;          // 最后连接时间
  lastError?: string;            // 最后错误
  lastErrorTime?: Date;          // 最后错误时间

  // === 配额和统计 ===
  quota?: IStorageQuota;         // 存储配额
  statistics?: IProviderStatistics; // 统计信息

  // === UI配置 ===
  ui: {
    icon: string;                // 图标（Font Awesome类名或emoji）
    color: string;               // 主题色
    order: number;               // 排序顺序
    showInQuickAccess: boolean;  // 在快速访问中显示
  };

  // === 元数据 ===
  metadata?: {
    [key: string]: any;
  };

  // === 创建和更新时间 ===
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 提供商预设模板接口
 */
export interface IProviderTemplate {
  id: string;
  name: string;
  type: string;
  description?: string;
  icon: string;
  color: string;
  defaultConfig: Partial<IProviderConfig>;
  requiredFields: (keyof IProviderConfig)[];
  optionalFields: (keyof IProviderConfig)[];
  helpUrl?: string;
}

/**
 * 提供商验证结果接口
 */
export interface IValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  suggestions?: string[];
}
