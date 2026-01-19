/**
 * 文件项接口
 * 统一表示不同提供商的文件/文件夹
 */

/**
 * 文件类型枚举
 */
export enum FileType {
  FILE = 'file',
  FOLDER = 'folder',
  // 特殊文件类型
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  ARCHIVE = 'archive',
  CODE = 'code',
  // 其他
  UNKNOWN = 'unknown',
  SYMLINK = 'symlink',
}

/**
 * 分享权限类型
 */
export enum SharePermission {
  OWNER = 'owner',
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
}

/**
 * 分享信息接口
 */
export interface IShareInfo {
  id: string;
  shareUrl: string;
  shareType: 'link' | 'email' | 'user';
  permission: SharePermission;
  expiresAt?: Date;
  password?: string;
  allowDownload: boolean;
  visitCount?: number;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
}

/**
 * 协作者信息接口
 */
export interface ICollaborator {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  permission: SharePermission;
  addedAt: Date;
}

/**
 * 文件版本信息接口
 */
export interface IFileVersion {
  id: string;
  versionNumber: number;
  modifiedAt: Date;
  modifiedBy: {
    id: string;
    name: string;
  };
  size: number;
  thumbnailUrl?: string;
  downloadUrl: string;
  isCurrent: boolean;
}

/**
 * 文件缩略图接口
 */
export interface IThumbnail {
  url: string;
  width: number;
  height: number;
  size: number; // 缩略图文件大小
  mimeType: string;
}

/**
 * 文件预览信息接口
 */
export interface IPreviewInfo {
  url: string;
  mimeType: string;
  expiresAt: Date;
  canEmbed: boolean;
  downloadUrl?: string;
}

/**
 * 文件哈希信息接口
 */
export interface IFileHash {
  md5?: string;
  sha1?: string;
  sha256?: string;
  crc32?: string;
}

/**
 * 自定义元数据接口
 */
export interface ICustomMetadata {
  [key: string]: string | number | boolean | null;
}

/**
 * 文件扩展状态接口
 * 针对不同提供商的扩展字段
 */
export interface IFileExtensionStatus {
  // 阿里云盘特定字段
  aliDrive?: {
    category: string;
    thumbnail?: string;
    videoPreviewMetadata?: any;
    punishmentFlag?: number;
  };

  // 百度网盘特定字段
  baiduDrive?: {
    category: number;
    fs_id?: number;
    md5?: string;
  };

  // OneDrive 特定字段
  oneDrive?: {
    shareId?: string;
    webUrl?: string;
  };

  // Google Drive 特定字段
  googleDrive?: {
    webViewLink?: string;
    webContentLink?: string;
    thumbnailLink?: string;
    modifiedByMeTime?: string;
    sharingUser?: any;
  };

  // Dropbox 特定字段
  dropbox?: {
    isFile?: boolean;
    sharingInfo?: any;
  };

  // S3 特定字段
  s3?: {
    etag?: string;
    versionId?: string;
    storageClass?: string;
  };

  // 自定义字段
  custom?: { [key: string]: any };
}

/**
 * 核心文件项接口
 */
export interface IFileItem {
  // === 基础标识 ===
  id: string;                      // 文件唯一标识
  providerId: string;              // 所属提供商ID
  parentId: string;                // 父文件夹ID
  path: string;                    // 完整路径

  // === 基本信息 ===
  name: string;                    // 文件名
  type: FileType;                  // 文件类型
  fileType: FileType;              // 详细文件类型（可能包含具体分类）

  // === 大小和时间 ===
  size: number;                    // 文件大小（字节）
  createdAt: Date;                 // 创建时间
  modifiedAt: Date;                // 修改时间
  accessedAt?: Date;               // 访问时间

  // === URL相关 ===
  downloadUrl?: string;            // 下载链接
  previewUrl?: string;             // 预览链接
  thumbnailUrl?: string;           // 缩略图链接
  streamUrl?: string;              // 流媒体链接

  // === MIME和图标 ===
  mimeType?: string;               // MIME类型
  icon?: string;                   // 图标名称或URL
  thumbnail?: IThumbnail;          // 缩略图详情

  // === 哈希和校验 ===
  hash?: IFileHash;                // 文件哈希值

  // === 权限和共享 ===
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canShare: boolean;
    canRename: boolean;
    canMove: boolean;
    canCopy: boolean;
  };
  shareInfo?: IShareInfo;          // 分享信息
  collaborators?: ICollaborator[]; // 协作者列表

  // === 版本控制 ===
  hasVersions: boolean;            // 是否有版本历史
  versionCount?: number;           // 版本数量
  currentVersionId?: string;       // 当前版本ID

  // === 状态标记 ===
  isFavorite: boolean;             // 是否收藏
  isOffline: boolean;              // 是否离线可用
  isShared: boolean;               // 是否已分享
  isLocked: boolean;               // 是否锁定
  isHidden: boolean;               // 是否隐藏
  isTrashed: boolean;              // 是否在回收站
  isEncrypted: boolean;            // 是否加密

  // === 扩展字段 ===
  tags?: string[];                 // 文件标签
  description?: string;            // 描述信息
  metadata?: ICustomMetadata;      // 自定义元数据
  extensionStatus?: IFileExtensionStatus; // 提供商特定扩展字段

  // === 文件夹特定 ===
  childCount?: number;             // 子项数量（仅文件夹）
  isEmpty?: boolean;               // 是否为空文件夹（仅文件夹）

  // === 同步状态 ===
  syncStatus?: 'synced' | 'syncing' | 'pending' | 'conflict' | 'error';
  lastSyncTime?: Date;             // 最后同步时间

  // === 缓存状态 ===
  isCached: boolean;               // 是否已缓存
  cachePath?: string;              // 本地缓存路径
  cacheSize?: number;              // 缓存大小
  cacheExpiry?: Date;              // 缓存过期时间

  // === 原始数据 ===
  raw?: any;                       // 提供商返回的原始数据
}

/**
 * 文件列表响应接口
 */
export interface IFileListResponse {
  files: IFileItem[];
  total?: number;
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * 文件搜索结果接口
 */
export interface ISearchResult {
  files: IFileItem[];
  total: number;
  searchTime: number; // 搜索耗时（毫秒）
  suggestions?: string[]; // 搜索建议
}

/**
 * 文件批量操作结果接口
 */
export interface IBatchOperationResult {
  successful: IFileItem[];
  failed: Array<{
    file: IFileItem;
    error: string;
  }>;
  total: number;
  successCount: number;
  failedCount: number;
}

/**
 * 文件统计信息接口
 */
export interface IFileStatistics {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  byType: {
    [key in FileType]?: number;
  };
  largestFile?: IFileItem;
  averageFileSize: number;
}
