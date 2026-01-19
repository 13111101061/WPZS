/**
 * 云存储提供商核心接口
 * 所有云存储提供商必须实现此接口
 */

import {
  IFileItem,
  IFileListResponse,
  ISearchResult,
  IBatchOperationResult,
  IFileStatistics,
  IThumbnail,
  IPreviewInfo,
  IFileVersion,
} from './IFileItem';
import { IProviderConfig, IStorageQuota, ProviderStatus } from './IProviderConfig';
import {
  ITransferOptions,
  ITransferTask,
  TransferType,
} from './ITransferOptions';
import { IProviderCapabilities } from './IProviderCapabilities';

/**
 * 文件列表选项接口
 */
export interface IListFilesOptions {
  folderId?: string;             // 文件夹ID
  path?: string;                 // 路径
  recursive?: boolean;           // 是否递归
  limit?: number;                // 限制数量
  offset?: number;               // 偏移量
  sortBy?: 'name' | 'size' | 'modified' | 'created'; // 排序字段
  sortOrder?: 'asc' | 'desc';    // 排序顺序
  filter?: {
    type?: string;               // 文件类型过滤
    minSize?: number;            // 最小大小
    maxSize?: number;            // 最大大小
    modifiedSince?: Date;        // 修改时间起始
    modifiedBefore?: Date;       // 修改时间结束
  };
  includeDeleted?: boolean;      // 包含已删除
  searchQuery?: string;          // 搜索查询
}

/**
 * 上传选项接口
 */
export interface IUploadOptions extends ITransferOptions {
  fileName: string;              // 文件名
  targetPath: string;            // 目标路径
  parentId?: string;             // 父文件夹ID
  overwrite?: boolean;           // 是否覆盖
  resumable?: boolean;           // 是否支持断点续传
  chunkSize?: number;            // 分片大小
  metadata?: Record<string, any>; // 自定义元数据
}

/**
 * 下载选项接口
 */
export interface IDownloadOptions extends ITransferOptions {
  fileId: string;                // 文件ID
  range?: {                      // 下载范围
    start: number;
    end: number;
  };
  format?: string;               // 转换格式（如导出为其他格式）
}

/**
 * 搜索选项接口
 */
export interface ISearchOptions {
  query: string;                 // 搜索查询
  folderId?: string;             // 搜索范围（文件夹）
  fileTypes?: string[];          // 文件类型过滤
  modifiedAfter?: Date;          // 修改时间过滤
  modifiedBefore?: Date;
  minSize?: number;              // 大小过滤
  maxSize?: number;
  limit?: number;                // 结果限制
  offset?: number;
}

/**
 * 共享选项接口
 */
export interface IShareOptions {
  fileId: string;                // 文件ID
  shareType: 'link' | 'email' | 'user';
  permission: 'read' | 'write' | 'admin';
  expiresAt?: Date;              // 过期时间
  password?: string;             // 密码保护
  allowDownload: boolean;        // 允许下载
  notify?: boolean;              // 通知
  message?: string;              // 附加消息
}

/**
 * 文件监视回调接口
 */
export interface IFileWatchCallbacks {
  onCreated?: (file: IFileItem) => void;
  onUpdated?: (file: IFileItem) => void;
  onDeleted?: (fileId: string) => void;
  onMoved?: (fileId: string, newParentId: string) => void;
  onError?: (error: Error) => void;
}

/**
 * 提供商事件类型
 */
export enum ProviderEventType {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  AUTH_ERROR = 'auth_error',
  TOKEN_REFRESHED = 'token_refreshed',
  RATE_LIMITED = 'rate_limited',
  QUOTA_EXCEEDED = 'quota_exceeded',
  SYNC_STARTED = 'sync_started',
  SYNC_COMPLETED = 'sync_completed',
  SYNC_ERROR = 'sync_error',
}

/**
 * 提供商事件接口
 */
export interface IProviderEvent {
  type: ProviderEventType;
  timestamp: Date;
  data?: any;
  error?: Error;
}

/**
 * 云存储提供商核心接口
 * 所有云存储提供商必须实现此接口
 */
export interface IStorageProvider {
  // ============================================
  // 基础信息
  // ============================================

  /**
   * 提供商唯一标识
   */
  readonly id: string;

  /**
   * 提供商名称
   */
  readonly name: string;

  /**
   * 提供商类型（如：alidrive, baidu, onedrive等）
   */
  readonly type: string;

  /**
   * 提供商配置
   */
  config: IProviderConfig;

  /**
   * 提供商能力声明
   */
  readonly capabilities: IProviderCapabilities;

  /**
   * 当前连接状态
   */
  readonly status: ProviderStatus;

  /**
   * 事件监听器
   */
  on(event: ProviderEventType, callback: (event: IProviderEvent) => void): void;
  off(event: ProviderEventType, callback: (event: IProviderEvent) => void): void;

  // ============================================
  // 初始化和连接
  // ============================================

  /**
   * 初始化提供商
   */
  initialize(): Promise<void>;

  /**
   * 连接到提供商
   */
  connect(): Promise<void>;

  /**
   * 断开连接
   */
  disconnect(): Promise<void>;

  /**
   * 测试连接
   */
  testConnection(): Promise<boolean>;

  /**
   * 刷新认证令牌
   */
  refreshAuth(): Promise<void>;

  // ============================================
  // 文件操作
  // ============================================

  /**
   * 列出文件
   * @param options - 列表选项
   */
  listFiles(options?: IListFilesOptions): Promise<IFileListResponse>;

  /**
   * 获取文件信息
   * @param fileId - 文件ID
   */
  getFileInfo(fileId: string): Promise<IFileItem>;

  /**
   * 获取多个文件信息
   * @param fileIds - 文件ID列表
   */
  getFilesInfo(fileIds: string[]): Promise<IFileItem[]>;

  /**
   * 创建文件夹
   * @param name - 文件夹名称
   * @param parentId - 父文件夹ID
   */
  createFolder(name: string, parentId: string): Promise<IFileItem>;

  /**
   * 重命名文件
   * @param fileId - 文件ID
   * @param newName - 新名称
   */
  renameFile(fileId: string, newName: string): Promise<IFileItem>;

  /**
   * 移动文件
   * @param fileId - 文件ID
   * @param targetParentId - 目标父文件夹ID
   */
  moveFile(fileId: string, targetParentId: string): Promise<IFileItem>;

  /**
   * 复制文件
   * @param fileId - 文件ID
   * @param targetParentId - 目标父文件夹ID
   * @param newName - 新名称（可选）
   */
  copyFile(fileId: string, targetParentId: string, newName?: string): Promise<IFileItem>;

  /**
   * 删除文件
   * @param fileId - 文件ID
   * @param permanent - 是否永久删除
   */
  deleteFile(fileId: string, permanent?: boolean): Promise<void>;

  /**
   * 批量删除文件
   * @param fileIds - 文件ID列表
   */
  deleteFiles(fileIds: string[]): Promise<IBatchOperationResult>;

  /**
   * 清空回收站
   */
  emptyTrash(): Promise<void>;

  /**
   * 恢复文件
   * @param fileId - 文件ID
   */
  restoreFile(fileId: string): Promise<IFileItem>;

  // ============================================
  // 搜索
  // ============================================

  /**
   * 搜索文件
   * @param options - 搜索选项
   */
  searchFiles(options: ISearchOptions): Promise<ISearchResult>;

  /**
   * 获取搜索建议
   * @param query - 搜索查询
   */
  getSearchSuggestions(query: string): Promise<string[]>;

  // ============================================
  // 上传和下载
  // ============================================

  /**
   * 上传文件
   * @param file - 文件对象或Blob
   * @param options - 上传选项
   */
  uploadFile(file: File | Blob, options: IUploadOptions): Promise<ITransferTask>;

  /**
   * 上传多个文件
   * @param files - 文件列表
   * @param options - 上传选项
   */
  uploadFiles(files: (File | Blob)[], options: IUploadOptions): Promise<ITransferTask[]>;

  /**
   * 下载文件
   * @param fileId - 文件ID
   * @param options - 下载选项
   */
  downloadFile(fileId: string, options?: IDownloadOptions): Promise<ITransferTask>;

  /**
   * 下载多个文件
   * @param fileIds - 文件ID列表
   */
  downloadFiles(fileIds: string[]): Promise<ITransferTask[]>;

  /**
   * 获取下载URL
   * @param fileId - 文件ID
   * @param expiresIn - URL过期时间（秒）
   */
  getDownloadUrl(fileId: string, expiresIn?: number): Promise<string>;

  /**
   * 获取上传URL
   * @param folderId - 目标文件夹ID
   * @param fileName - 文件名
   * @param expiresIn - URL过期时间（秒）
   */
  getUploadUrl(folderId: string, fileName: string, expiresIn?: number): Promise<{
    uploadUrl: string;
    fileId?: string;
    headers?: Record<string, string>;
  }>;

  // ============================================
  // 缩略图和预览
  // ============================================

  /**
   * 获取缩略图
   * @param fileId - 文件ID
   * @param size - 缩略图尺寸
   */
  getThumbnail(fileId: string, size?: number): Promise<IThumbnail>;

  /**
   * 获取预览信息
   * @param fileId - 文件ID
   */
  getPreviewInfo(fileId: string): Promise<IPreviewInfo>;

  /**
   * 获取预览URL
   * @param fileId - 文件ID
   */
  getPreviewUrl(fileId: string): Promise<string>;

  // ============================================
  // 共享和协作
  // ============================================

  /**
   * 创建分享链接
   * @param options - 分享选项
   */
  createShare(options: IShareOptions): Promise<{
    shareId: string;
    shareUrl: string;
    expiresAt?: Date;
  }>;

  /**
   * 获取文件共享信息
   * @param fileId - 文件ID
   */
  getShareInfo(fileId: string): Promise<any>;

  /**
   * 更新共享设置
   * @param shareId - 分享ID
   * @param updates - 更新内容
   */
  updateShare(shareId: string, updates: any): Promise<void>;

  /**
   * 删除分享
   * @param shareId - 分享ID
   */
  deleteShare(shareId: string): Promise<void>;

  /**
   * 添加协作者
   * @param fileId - 文件ID
   * @param collaborator - 协作者信息
   */
  addCollaborator(fileId: string, collaborator: any): Promise<void>;

  /**
   * 移除协作者
   * @param fileId - 文件ID
   * @param userId - 用户ID
   */
  removeCollaborator(fileId: string, userId: string): Promise<void>;

  /**
   * 列出协作者
   * @param fileId - 文件ID
   */
  listCollaborators(fileId: string): Promise<any[]>;

  // ============================================
  // 版本控制
  // ============================================

  /**
   * 获取文件版本列表
   * @param fileId - 文件ID
   */
  getFileVersions(fileId: string): Promise<IFileVersion[]>;

  /**
   * 获取特定版本
   * @param fileId - 文件ID
   * @param versionId - 版本ID
   */
  getFileVersion(fileId: string, versionId: string): Promise<IFileVersion>;

  /**
   * 恢复到特定版本
   * @param fileId - 文件ID
   * @param versionId - 版本ID
   */
  restoreFileVersion(fileId: string, versionId: string): Promise<void>;

  /**
   * 删除版本
   * @param fileId - 文件ID
   * @param versionId - 版本ID
   */
  deleteFileVersion(fileId: string, versionId: string): Promise<void>;

  // ============================================
  // 存储配额
  // ============================================

  /**
   * 获取存储配额信息
   */
  getStorageQuota(): Promise<IStorageQuota>;

  /**
   * 获取文件统计信息
   * @param folderId - 文件夹ID（可选，用于统计特定文件夹）
   */
  getFileStatistics(folderId?: string): Promise<IFileStatistics>;

  // ============================================
  // 文件监视
  // ============================================

  /**
   * 监视文件变化
   * @param folderId - 文件夹ID
   * @param callbacks - 回调函数
   * @returns 取消监视的函数
   */
  watchFiles(folderId: string, callbacks: IFileWatchCallbacks): () => void;

  // ============================================
  // 实用方法
  // ============================================

  /**
   * 将提供商特定的文件转换为标准文件项
   * @param rawFile - 提供商返回的原始文件数据
   */
  normalizeFile(rawFile: any): IFileItem;

  /**
   * 将标准文件项转换为提供商特定格式
   * @param file - 标准文件项
   */
  denormalizeFile(file: IFileItem): any;

  /**
   * 验证配置
   * @param config - 配置对象
   */
  validateConfig(config: IProviderConfig): Promise<{
    valid: boolean;
    errors?: string[];
  }>;

  /**
   * 获取提供商特定功能
   * @param feature - 功能名称
   */
  getFeature(feature: string): any;

  /**
   * 清理资源
   */
  cleanup(): Promise<void>;

  /**
   * 获取提供商日志（用于调试）
   */
  getLogs?(): Promise<any[]>;
}

/**
 * 提供商工厂接口
 */
export interface IStorageProviderFactory {
  /**
   * 创建提供商实例
   * @param type - 提供商类型
   * @param config - 配置对象
   */
  create(type: string, config: IProviderConfig): IStorageProvider;

  /**
   * 获取所有支持的提供商类型
   */
  getSupportedTypes(): string[];

  /**
   * 检查是否支持特定类型
   * @param type - 提供商类型
   */
  isSupported(type: string): boolean;
}
