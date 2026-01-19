/**
 * 传输选项接口
 * 定义文件上传下载的各种选项和配置
 */

/**
 * 传输类型枚举
 */
export enum TransferType {
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  MOVE = 'move',
  COPY = 'copy',
}

/**
 * 传输状态枚举
 */
export enum TransferStatus {
  PENDING = 'pending',           // 等待中
  PREPARING = 'preparing',       // 准备中（计算哈希、分片等）
  QUEUED = 'queued',             // 已排队
  ACTIVE = 'active',             // 进行中
  PAUSED = 'paused',             // 已暂停
  COMPLETED = 'completed',       // 已完成
  FAILED = 'failed',             // 已失败
  CANCELLED = 'cancelled',       // 已取消
  VERIFYING = 'verifying',       // 校验中
}

/**
 * 传输优先级枚举
 */
export enum TransferPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3,
}

/**
 * 分片信息接口
 */
export interface IChunkInfo {
  index: number;                 // 分片索引（从0开始）
  offset: number;                // 在文件中的偏移量
  size: number;                  // 分片大小
  currentSize?: number;          // 当前已传输大小
  status: TransferStatus;        // 分片状态
  retryCount: number;            // 重试次数
  startedAt?: Date;              // 开始时间
  completedAt?: Date;            // 完成时间
  error?: string;                // 错误信息
  uploadUrl?: string;            // 上传URL（针对分片上传）
  downloadUrl?: string;          // 下载URL
  etag?: string;                 // ETag（用于验证）
}

/**
 * 传输速度信息接口
 */
export interface ITransferSpeed {
  current: number;               // 当前速度（字节/秒）
  average: number;               // 平均速度（字节/秒）
  peak: number;                  // 峰值速度（字节/秒）
}

/**
 * 传输进度信息接口
 */
export interface ITransferProgress {
  transferred: number;           // 已传输字节数
  total: number;                 // 总字节数
  percentage: number;            // 百分比（0-100）
  speed: ITransferSpeed;         // 速度信息
  remainingTime?: number;        // 剩余时间（秒）
  elapsed: number;               // 已用时间（秒）
}

/**
 * 传输统计信息接口
 */
export interface ITransferStatistics {
  totalBytes: number;            // 总字节数
  transferredBytes: number;      // 已传输字节数
  failedBytes: number;           // 失败字节数
  chunkCount: number;            // 分片总数
  completedChunks: number;       // 已完成分片数
  failedChunks: number;          // 失败分片数
  retriedChunks: number;         // 重试分片数
  skippedChunks: number;         // 跳过分片数
}

/**
 * 传输事件接口
 */
export interface ITransferEvent {
  type: 'start' | 'progress' | 'pause' | 'resume' | 'complete' | 'error' | 'cancel';
  timestamp: Date;
  data?: any;
}

/**
 * 核心传输选项接口
 */
export interface ITransferOptions {
  // === 基础选项 ===
  type: TransferType;            // 传输类型
  priority: TransferPriority;    // 优先级

  // === 并发控制 ===
  maxConcurrentChunks: number;   // 最大并发分片数
  maxConcurrentFiles: number;    // 最大并发文件数

  // === 分片配置 ===
  chunkSize: number;             // 分片大小（字节）
  enableChunking: boolean;       // 是否启用分片
  minChunkSize?: number;         // 最小分片大小
  maxChunkSize?: number;         // 最大分片大小

  // === 重试配置 ===
  maxRetries: number;            // 最大重试次数
  retryDelay: number;            // 重试延迟（毫秒）
  exponentialBackoff: boolean;   // 指数退避
  maxRetryDelay?: number;        // 最大重试延迟

  // === 超时配置 ===
  timeout: number;               // 超时时间（毫秒）
  chunkTimeout?: number;         // 分片超时时间

  // === 速度限制 ===
  speedLimit?: number;           // 速度限制（字节/秒）
  uploadSpeedLimit?: number;     // 上传速度限制
  downloadSpeedLimit?: number;   // 下载速度限制

  // === 完整性验证 ===
  verifyHash: boolean;           // 是否验证哈希
  hashAlgorithm?: 'md5' | 'sha1' | 'sha256' | 'crc32';
  verifyOnComplete: boolean;     // 完成后验证
  verifyPerChunk: boolean;       // 每个分片验证

  // === 冲突处理 ===
  overwrite: boolean;            // 是否覆盖
  skipExisting: boolean;         // 跳过已存在
  renameIfExists: boolean;       // 存在时重命名
  versioning: boolean;           // 是否创建版本

  // === 权限和元数据 ===
  preservePermissions: boolean;  // 保留权限
  preserveTimestamps: boolean;   // 保留时间戳
  preserveMetadata: boolean;     // 保留元数据
  customMetadata?: Record<string, any>; // 自定义元数据

  // === 过滤器 ===
  includePatterns?: string[];    // 包含模式
  excludePatterns?: string[];    // 排除模式
  maxFileSize?: number;          // 最大文件大小
  minFileSize?: number;          // 最小文件大小
  fileTypes?: string[];          // 文件类型过滤

  // === 回调函数 ===
  onProgress?: (progress: ITransferProgress) => void;
  onComplete?: (file: any) => void;
  onError?: (error: Error) => void;
  onChunkStart?: (chunk: IChunkInfo) => void;
  onChunkComplete?: (chunk: IChunkInfo) => void;
  onChunkError?: (chunk: IChunkInfo, error: Error) => void;

  // === 通知选项 ===
  showNotification: boolean;     // 显示通知
  notifyOnComplete: boolean;     // 完成时通知
  notifyOnError: boolean;        // 错误时通知

  // === 缓存选项 ===
  useCache: boolean;             // 使用缓存
  cacheKey?: string;             // 缓存键
  bypassCache: boolean;          // 绕过缓存

  // === 加密选项 ===
  encrypt: boolean;              // 是否加密
  encryptionKey?: string;        // 加密密钥
  encryptionAlgorithm?: string;  // 加密算法

  // === 压缩选项 ===
  compress: boolean;             // 是否压缩
  compressionLevel?: number;     // 压缩级别（0-9）

  // === 日志选项 ===
  enableLogging: boolean;        // 启用日志
  logLevel?: 'debug' | 'info' | 'warn' | 'error';

  // === 其他选项 ===
  autoStart: boolean;            // 自动开始
  autoRetry: boolean;            // 自动重试
  sequential: boolean;           // 顺序传输
  deduplicate: boolean;          // 去重
}

/**
 * 传输任务接口
 */
export interface ITransferTask {
  // === 标识 ===
  id: string;                    // 任务ID
  groupId?: string;              // 任务组ID

  // === 文件信息 ===
  fileName: string;              // 文件名
  filePath: string;              // 文件路径
  fileSize: number;              // 文件大小
  fileType: string;              // 文件类型
  mimeType?: string;             // MIME类型

  // === 源和目标 ===
  source: {
    providerId: string;          // 源提供商ID
    path: string;                // 源路径
    url?: string;                // 源URL
    fileId?: string;             // 源文件ID
  };
  destination: {
    providerId: string;          // 目标提供商ID
    path: string;                // 目标路径
    url?: string;                // 目标URL
    fileId?: string;             // 目标文件ID
  };

  // === 传输信息 ===
  type: TransferType;            // 传输类型
  status: TransferStatus;        // 传输状态
  priority: TransferPriority;    // 优先级

  // === 进度信息 ===
  progress: ITransferProgress;   // 进度
  statistics: ITransferStatistics; // 统计

  // === 分片信息 ===
  chunks?: IChunkInfo[];         // 分片列表
  chunkSize: number;             // 分片大小

  // === 配置 ===
  options: ITransferOptions;     // 传输选项

  // === 时间信息 ===
  createdAt: Date;               // 创建时间
  startedAt?: Date;              // 开始时间
  completedAt?: Date;            // 完成时间
  pausedAt?: Date;               // 暂停时间
  resumedAt?: Date;              // 恢复时间
  estimatedCompletion?: Date;    // 预计完成时间

  // === 错误信息 ===
  error?: Error;                 // 错误对象
  errorMessage?: string;         // 错误消息
  errorCount: number;            // 错误次数

  // === 结果信息 ===
  result?: {
    success: boolean;
    fileId?: string;
    filePath?: string;
    fileUrl?: string;
    checksum?: string;
    metadata?: any;
  };

  // === 重试信息 ===
  retryCount: number;            // 重试次数
  maxRetries: number;            // 最大重试次数

  // === 用户数据 ===
  userData?: any;                // 用户自定义数据
  metadata?: Record<string, any>; // 元数据

  // === 事件历史 ===
  events: ITransferEvent[];      // 事件历史

  // === 操作方法（由TransferManager实现）===
  start?(): Promise<void>;
  pause?(): Promise<void>;
  resume?(): Promise<void>;
  cancel?(): Promise<void>;
  retry?(): Promise<void>;
}

/**
 * 传输队列配置接口
 */
export interface ITransferQueueConfig {
  maxConcurrent: number;         // 最大并发数
  maxUploadConcurrent: number;   // 最大上传并发数
  maxDownloadConcurrent: number; // 最大下传并发数
  maxQueueSize: number;          // 最大队列大小
  priorityMode: 'fifo' | 'priority' | 'smart'; // 队列模式
  autoStart: boolean;            // 自动开始
  throttleDelay?: number;        // 节流延迟
}

/**
 * 传输摘要接口
 */
export interface ITransferSummary {
  totalTasks: number;            // 总任务数
  activeTasks: number;           // 活动任务数
  completedTasks: number;        // 已完成任务数
  failedTasks: number;           // 失败任务数
  pausedTasks: number;           // 暂停任务数
  queuedTasks: number;           // 排队任务数
  totalBytes: number;            // 总字节数
  transferredBytes: number;      // 已传输字节数
  speed: ITransferSpeed;         // 整体速度
  percentage: number;            // 总体进度百分比
  estimatedTime?: number;        // 预计剩余时间（秒）
}

/**
 * 传输历史记录接口
 */
export interface ITransferHistory {
  taskId: string;
  type: TransferType;
  fileName: string;
  fileSize: number;
  status: TransferStatus;
  startedAt: Date;
  completedAt?: Date;
  duration: number;              // 持续时间（秒）
  averageSpeed: number;          // 平均速度
  success: boolean;
  error?: string;
}
