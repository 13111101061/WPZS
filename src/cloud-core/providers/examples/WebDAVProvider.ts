/**
 * WebDAV 提供商实现
 * 一个完整的云存储提供商示例实现
 */

import {
  BaseStorageProvider,
  IFileItem,
  IFileListResponse,
  IStorageProvider,
  IProviderConfig,
  IProviderCapabilities,
  IListFilesOptions,
  IUploadOptions,
  IDownloadOptions,
  ISearchOptions,
  ITransferTask,
  ProviderStatus,
} from '../base';

/**
 * WebDAV 提供商能力声明
 */
const WEBDAV_CAPABILITIES: IProviderCapabilities = {
  supports: {
    listFiles: true,
    uploadFile: true,
    downloadFile: true,
    deleteFile: true,
    moveFile: true,
    copyFile: true,
    renameFile: true,
    createFolder: true,
    searchFiles: false,
    shareFile: false,
    getFileInfo: true,
    getFileThumbnail: false,
    getFilePreview: false,
    batchDelete: false,
    batchDownload: false,
    batchMove: false,
    batchCopy: false,
    chunkUpload: true,
    chunkDownload: true,
    resumableUpload: false,
    resumableDownload: true,
    uploadSpeedLimit: false,
    downloadSpeedLimit: false,
    sync: false,
    versioning: false,
    conflictResolution: false,
    metadataCache: true,
    thumbnailCache: false,
    encryption: false,
    twoFactorAuth: false,
  },
  limits: {
    maxFileSize: 0, // 无限制
    maxFolderDepth: 0,
    maxFileNameLength: 255,
    maxPathLength: 1024,
    maxUploadConnections: 3,
    maxDownloadConnections: 5,
    allowedFileTypes: [],
    blockedFileTypes: [],
  },
  performance: {
    recommendedChunkSize: 5 * 1024 * 1024, // 5MB
    maxChunkSize: 100 * 1024 * 1024, // 100MB
    minChunkSize: 1024 * 1024, // 1MB
    maxConcurrentRequests: 5,
    requestTimeout: 30000,
    apiRateLimit: 0,
  },
  authMethods: ['basic', 'custom'],
  regions: ['default'],
  customMetadata: true,
};

/**
 * WebDAV 响应接口
 */
interface IWebDAVResponse {
  href: string;
  propstat: {
    prop: {
      displayname?: string;
      getcontentlength?: number;
      getlastmodified?: string;
      resourcetype?: {
        collection?: any;
      };
      getcontenttype?: string;
    };
    status: string;
  };
}

/**
 * WebDAV 提供商类
 */
export class WebDAVProvider extends BaseStorageProvider {
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor(config: IProviderConfig) {
    super(
      config.id,
      config.name,
      'webdav',
      config,
      WEBDAV_CAPABILITIES
    );

    this.baseUrl = config.endpoint || '';
    this.username = config.auth.basic?.username || '';
    this.password = config.auth.basic?.password || '';

    // 添加用户名和密码到配置
    this.config.auth.basic = {
      username: this.username,
      password: this.password,
    };
  }

  /**
   * 初始化提供商
   */
  async initialize(): Promise<void> {
    this.setStatus(ProviderStatus.DISCONNECTED, 'Initialized');
  }

  /**
   * 连接到提供商
   */
  async connect(): Promise<void> {
    this.setStatus(ProviderStatus.CONNECTING, 'Connecting...');

    try {
      const success = await this.testConnection();
      if (success) {
        this.setStatus(ProviderStatus.CONNECTED, 'Connected');
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      this.setStatus(ProviderStatus.AUTH_ERROR, (error as Error).message);
      throw error;
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    this.setStatus(ProviderStatus.DISCONNECTED, 'Disconnected');
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.fetchWithAuth(this.baseUrl, {
        method: 'PROPFIND',
        headers: {
          'Depth': '0',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 刷新认证（WebDAV使用基本认证，不需要刷新）
   */
  async refreshAuth(): Promise<void> {
    // 基本认证不需要刷新
  }

  /**
   * 列出文件
   */
  async listFiles(options?: IListFilesOptions): Promise<IFileListResponse> {
    const path = options?.path || options?.folderId || '/';
    const url = this.baseUrl + path;

    const response = await this.fetchWithAuth(url, {
      method: 'PROPFIND',
      headers: {
        'Depth': '1',
        'Content-Type': 'application/xml',
      },
      body: `<?xml version="1.0"?>
        <D:propfind xmlns:D="DAV:">
          <D:prop>
            <D:displayname/>
            <D:getcontentlength/>
            <D:getlastmodified/>
            <D:resourcetype/>
            <D:getcontenttype/>
          </D:prop>
        </D:propfind>`,
    });

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }

    const text = await response.text();
    const files = this.parseWebDAVResponse(text, path);

    // 过滤掉父目录引用
    const filteredFiles = files.filter(f => f.path !== path);

    return {
      files: filteredFiles,
      total: filteredFiles.length,
      hasMore: false,
    };
  }

  /**
   * 解析WebDAV响应
   */
  private parseWebDAVResponse(xml: string, parentPath: string): IFileItem[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');
    const responses = xmlDoc.getElementsByTagNameNS('DAV:', 'response');

    return Array.from(responses).map(response => {
      const href = response.getElementsByTagNameNS('DAV:', 'href')[0]?.textContent || '';
      const props = response.getElementsByTagNameNS('DAV:', 'prop')[0];

      const displayName = props.getElementsByTagNameNS('DAV:', 'displayname')[0]?.textContent || '';
      const contentLength = props.getElementsByTagNameNS('DAV:', 'getcontentlength')[0]?.textContent;
      const lastModified = props.getElementsByTagNameNS('DAV:', 'getlastmodified')[0]?.textContent;
      const resourceType = props.getElementsByTagNameNS('DAV:', 'resourcetype')[0];
      const contentType = props.getElementsByTagNameNS('DAV:', 'getcontenttype')[0]?.textContent;

      const isFolder = resourceType?.getElementsByTagNameNS('DAV:', 'collection').length > 0;

      // 构建完整路径
      const fullPath = href.replace(this.baseUrl, '');
      const pathParts = fullPath.split('/').filter(Boolean);
      const name = pathParts[pathParts.length - 1] || '/';

      return {
        id: fullPath,
        providerId: this.id,
        parentId: parentPath,
        path: fullPath,
        name: name,
        type: isFolder ? ('folder' as any) : ('file' as any),
        fileType: isFolder ? ('folder' as any) : this.getFileTypeFromMime(contentType || ''),
        size: contentLength ? parseInt(contentLength) : 0,
        createdAt: new Date(),
        modifiedAt: lastModified ? new Date(lastModified) : new Date(),
        mimeType: contentType || undefined,
        permissions: {
          canRead: true,
          canWrite: true,
          canDelete: true,
          canShare: false,
          canRename: true,
          canMove: true,
          canCopy: true,
        },
        isFavorite: false,
        isOffline: false,
        isShared: false,
        isLocked: false,
        isHidden: name.startsWith('.'),
        isTrashed: false,
        isEncrypted: false,
        hasVersions: false,
        isCached: false,
      };
    });
  }

  /**
   * 从MIME类型获取文件类型
   */
  private getFileTypeFromMime(mimeType: string): any {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive';
    return 'file';
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(fileId: string): Promise<IFileItem> {
    const response = await this.listFiles({ path: fileId });
    if (response.files.length === 0) {
      throw new Error(`File not found: ${fileId}`);
    }
    return response.files[0];
  }

  /**
   * 创建文件夹
   */
  async createFolder(name: string, parentId: string): Promise<IFileItem> {
    const path = `${parentId.replace(/\/$/, '')}/${name}`;
    const url = this.baseUrl + path;

    const response = await this.fetchWithAuth(url, {
      method: 'MKCOL',
    });

    if (!response.ok) {
      throw new Error(`Failed to create folder: ${response.statusText}`);
    }

    return await this.getFileInfo(path);
  }

  /**
   * 重命名文件
   */
  async renameFile(fileId: string, newName: string): Promise<IFileItem> {
    const pathParts = fileId.split('/');
    pathParts[pathParts.length - 1] = newName;
    const newPath = pathParts.join('/');

    await this.moveFile(fileId, newPath);

    return await this.getFileInfo(newPath);
  }

  /**
   * 移动文件
   */
  async moveFile(fileId: string, targetParentId: string): Promise<IFileItem> {
    const sourceUrl = this.baseUrl + fileId;
    const destinationUrl = this.baseUrl + targetParentId;

    const response = await this.fetchWithAuth(sourceUrl, {
      method: 'MOVE',
      headers: {
        'Destination': destinationUrl,
        'Overwrite': 'T',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to move file: ${response.statusText}`);
    }

    return await this.getFileInfo(targetParentId);
  }

  /**
   * 复制文件
   */
  async copyFile(fileId: string, targetParentId: string, newName?: string): Promise<IFileItem> {
    const sourceUrl = this.baseUrl + fileId;
    const destinationPath = newName
      ? `${targetParentId.replace(/\/$/, '')}/${newName}`
      : targetParentId;
    const destinationUrl = this.baseUrl + destinationPath;

    const response = await this.fetchWithAuth(sourceUrl, {
      method: 'COPY',
      headers: {
        'Destination': destinationUrl,
        'Overwrite': 'F',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to copy file: ${response.statusText}`);
    }

    return await this.getFileInfo(destinationPath);
  }

  /**
   * 删除文件
   */
  async deleteFile(fileId: string, permanent?: boolean): Promise<void> {
    const url = this.baseUrl + fileId;

    const response = await this.fetchWithAuth(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }
  }

  /**
   * 搜索文件
   */
  async searchFiles(options: ISearchOptions): Promise<any> {
    // WebDAV不支持原生搜索，需要客户端实现
    const response = await this.listFiles();
    const query = options.query.toLowerCase();

    const filtered = response.files.filter(file =>
      file.name.toLowerCase().includes(query)
    );

    return {
      files: filtered,
      total: filtered.length,
      searchTime: 0,
    };
  }

  /**
   * 上传文件
   */
  async uploadFile(file: File | Blob, options: IUploadOptions): Promise<ITransferTask> {
    const path = `${options.targetPath.replace(/\/$/, '')}/${options.fileName}`;
    const url = this.baseUrl + path;

    const task = this.createTransferTask(
      'upload' as any,
      options.fileName,
      file.size,
      { providerId: 'local', path: options.fileName },
      { providerId: this.id, path },
      options
    );

    task.status = 'active' as any;

    try {
      const response = await this.fetchWithAuth(url, {
        method: 'PUT',
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      task.status = 'completed' as any;
      task.progress.transferred = file.size;
      task.progress.percentage = 100;
      task.completedAt = new Date();
    } catch (error) {
      task.status = 'failed' as any;
      task.error = error as Error;
      throw error;
    }

    return task;
  }

  /**
   * 下载文件
   */
  async downloadFile(fileId: string, options?: IDownloadOptions): Promise<ITransferTask> {
    const fileInfo = await this.getFileInfo(fileId);
    const url = this.baseUrl + fileId;

    const task = this.createTransferTask(
      'download' as any,
      fileInfo.name,
      fileInfo.size,
      { providerId: this.id, path: fileId },
      { providerId: 'local', path: '/' },
      options || {} as any
    );

    task.status = 'active' as any;

    try {
      const response = await this.fetchWithAuth(url);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();

      task.status = 'completed' as any;
      task.progress.transferred = fileInfo.size;
      task.progress.percentage = 100;
      task.completedAt = new Date();

      // 触发浏览器下载
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileInfo.name;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      task.status = 'failed' as any;
      task.error = error as Error;
      throw error;
    }

    return task;
  }

  /**
   * 获取下载URL
   */
  async getDownloadUrl(fileId: string, expiresIn?: number): Promise<string> {
    return this.baseUrl + fileId;
  }

  /**
   * 获取存储配额
   */
  async getStorageQuota(): Promise<any> {
    // WebDAV通常不提供配额信息
    return {
      total: 0,
      used: 0,
      remaining: 0,
      usagePercentage: 0,
    };
  }

  /**
   * 标准化文件项
   */
  normalizeFile(rawFile: any): IFileItem {
    return rawFile;
  }

  /**
   * 反标准化文件项
   */
  denormalizeFile(file: IFileItem): any {
    return file;
  }
}

/**
 * 创建WebDAV提供商实例
 */
export function createWebDAVProvider(config: IProviderConfig): IStorageProvider {
  return new WebDAVProvider(config);
}
