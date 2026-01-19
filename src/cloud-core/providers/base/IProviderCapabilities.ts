/**
 * 云存储提供商能力声明
 * 定义每个提供商支持的功能和能力
 */
export interface IProviderCapabilities {
  // 基础能力
  supports: {
    // 文件操作
    listFiles: boolean;           // 列出文件
    uploadFile: boolean;           // 上传文件
    downloadFile: boolean;         // 下载文件
    deleteFile: boolean;           // 删除文件
    moveFile: boolean;             // 移动文件
    copyFile: boolean;             // 复制文件
    renameFile: boolean;           // 重命名文件
    createFolder: boolean;         // 创建文件夹

    // 高级能力
    searchFiles: boolean;          // 搜索文件
    shareFile: boolean;            // 分享文件
    getFileInfo: boolean;          // 获取文件详细信息
    getFileThumbnail: boolean;     // 获取缩略图
    getFilePreview: boolean;       // 获取预览

    // 批量操作
    batchDelete: boolean;          // 批量删除
    batchDownload: boolean;        // 批量下载
    batchMove: boolean;            // 批量移动
    batchCopy: boolean;            // 批量复制

    // 传输能力
    chunkUpload: boolean;          // 分片上传
    chunkDownload: boolean;        // 分片下载
    resumableUpload: boolean;      // 断点续传
    resumableDownload: boolean;    // 断点下载
    uploadSpeedLimit: boolean;     // 上传限速
    downloadSpeedLimit: boolean;   // 下载限速

    // 同步能力
    sync: boolean;                 // 文件同步
    versioning: boolean;           // 版本控制
    conflictResolution: boolean;   // 冲突解决

    // 缓存能力
    metadataCache: boolean;        // 元数据缓存
    thumbnailCache: boolean;       // 缩略图缓存

    // 安全能力
    encryption: boolean;           // 加密存储
    twoFactorAuth: boolean;        // 双因素认证
  };

  // 限制条件
  limits: {
    maxFileSize: number;           // 最大文件大小 (字节, 0表示无限制)
    maxFolderDepth: number;        // 最大文件夹深度
    maxFileNameLength: number;     // 最大文件名长度
    maxPathLength: number;         // 最大路径长度
    maxUploadConnections: number;  // 最大上传并发数
    maxDownloadConnections: number;// 最大下传并发数
    allowedFileTypes?: string[];   // 允许的文件类型 (空表示全部)
    blockedFileTypes?: string[];   // 禁止的文件类型
  };

  // 性能特性
  performance: {
    recommendedChunkSize: number;  // 推荐分片大小
    maxChunkSize: number;          // 最大分片大小
    minChunkSize: number;          // 最小分片大小
    maxConcurrentRequests: number; // 最大并发请求数
    requestTimeout: number;        // 请求超时时间 (毫秒)
    apiRateLimit: number;          // API速率限制 (请求/分钟)
  };

  // 认证方式
  authMethods: ('oauth2' | 'apikey' | 'basic' | 'custom')[];

  // 支持的区域
  regions: string[];

  // 自定义元数据
  customMetadata: boolean;
}
