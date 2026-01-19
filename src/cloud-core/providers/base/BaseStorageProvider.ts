/**
 * 提供商基础抽象类
 * 实现通用功能，减少重复代码
 */

import {
  IStorageProvider,
  IListFilesOptions,
  IUploadOptions,
  IDownloadOptions,
  ISearchOptions,
  IShareOptions,
  IFileWatchCallbacks,
  ProviderEventType,
  IProviderEvent,
} from './IStorageProvider';
import { IFileItem, IFileListResponse, ISearchResult, IThumbnail, IPreviewInfo, IFileVersion } from './IFileItem';
import { IProviderConfig, ProviderStatus, IStorageQuota, IFileStatistics } from './IProviderConfig';
import {
  ITransferTask,
  ITransferOptions,
  TransferType,
  TransferStatus,
  ITransferProgress,
  ITransferSpeed,
  ITransferStatistics,
} from './ITransferOptions';
import { IProviderCapabilities } from './IProviderCapabilities';

/**
 * 事件监听器类型
 */
type EventListener = (event: IProviderEvent) => void;

/**
 * 提供商基础抽象类
 * 提供通用功能实现，子类只需实现特定提供商的逻辑
 */
export abstract class BaseStorageProvider implements IStorageProvider {
  // ============================================
  // 公共属性
  // ============================================

  public readonly id: string;
  public readonly name: string;
  public readonly type: string;
  public config: IProviderConfig;
  public readonly capabilities: IProviderCapabilities;

  protected _status: ProviderStatus = ProviderStatus.DISCONNECTED;
  protected _eventListeners: Map<ProviderEventType, Set<EventListener>> = new Map();
  protected _fileWatchers: Map<string, { callbacks: IFileWatchCallbacks; cleanup: () => void }> = new Map();

  // ============================================
  // 构造函数
  // ============================================

  constructor(
    id: string,
    name: string,
    type: string,
    config: IProviderConfig,
    capabilities: IProviderCapabilities
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.config = config;
    this.capabilities = capabilities;
  }

  // ============================================
  // 状态管理
  // ============================================

  get status(): ProviderStatus {
    return this._status;
  }

  protected setStatus(status: ProviderStatus, message?: string): void {
    const oldStatus = this._status;
    this._status = status;

    if (status !== oldStatus) {
      this.emit({
        type: status === ProviderStatus.CONNECTED
          ? ProviderEventType.CONNECTED
          : status === ProviderStatus.DISCONNECTED
          ? ProviderEventType.DISCONNECTED
          : status === ProviderStatus.AUTH_ERROR
          ? ProviderEventType.AUTH_ERROR
          : ProviderEventType.RATE_LIMITED,
        timestamp: new Date(),
        data: { oldStatus, newStatus: status, message },
      });
    }
  }

  // ============================================
  // 事件系统
  // ============================================

  public on(event: ProviderEventType, callback: EventListener): void {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, new Set());
    }
    this._eventListeners.get(event)!.add(callback);
  }

  public off(event: ProviderEventType, callback: EventListener): void {
    const listeners = this._eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  protected emit(event: IProviderEvent): void {
    const listeners = this._eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error);
        }
      });
    }
  }

  // ============================================
  // 初始化和连接（需要子类实现）
  // ============================================

  abstract initialize(): Promise<void>;
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract testConnection(): Promise<boolean>;
  abstract refreshAuth(): Promise<void>;

  // ============================================
  // 文件操作（需要子类实现）
  // ============================================

  abstract listFiles(options?: IListFilesOptions): Promise<IFileListResponse>;
  abstract getFileInfo(fileId: string): Promise<IFileItem>;
  abstract createFolder(name: string, parentId: string): Promise<IFileItem>;
  abstract renameFile(fileId: string, newName: string): Promise<IFileItem>;
  abstract moveFile(fileId: string, targetParentId: string): Promise<IFileItem>;
  abstract copyFile(fileId: string, targetParentId: string, newName?: string): Promise<IFileItem>;
  abstract deleteFile(fileId: string, permanent?: boolean): Promise<void>;

  // ============================================
  // 默认实现的文件操作
  // ============================================

  /**
   * 获取多个文件信息（默认批量调用getFileInfo）
   */
  public async getFilesInfo(fileIds: string[]): Promise<IFileItem[]> {
    const results = await Promise.allSettled(
      fileIds.map(id => this.getFileInfo(id))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<IFileItem> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  /**
   * 批量删除文件（默认批量调用deleteFile）
   */
  public async deleteFiles(fileIds: string[]): Promise<any> {
    const results = await Promise.allSettled(
      fileIds.map(id => this.deleteFile(id))
    );

    const successful: IFileItem[] = [];
    const failed: Array<{ file: IFileItem; error: string }> = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        // successful.push(); // 需要返回文件信息，但deleteFile不返回
      } else {
        failed.push({
          file: { id: fileIds[index], name: '', type: 'file' as any } as IFileItem,
          error: result.reason?.message || 'Unknown error',
        });
      }
    });

    return {
      successful,
      failed,
      total: fileIds.length,
      successCount: successful.length,
      failedCount: failed.length,
    };
  }

  /**
   * 清空回收站（默认实现）
   */
  public async emptyTrash(): Promise<void> {
    // 子类可以重写此方法
    throw new Error('Empty trash not implemented');
  }

  /**
   * 恢复文件（默认实现）
   */
  public async restoreFile(fileId: string): Promise<IFileItem> {
    // 子类可以重写此方法
    throw new Error('Restore file not implemented');
  }

  // ============================================
  // 搜索（需要子类实现）
  // ============================================

  abstract searchFiles(options: ISearchOptions): Promise<ISearchResult>;

  /**
   * 获取搜索建议（默认实现）
   */
  public async getSearchSuggestions(query: string): Promise<string[]> {
    // 子类可以重写以提供智能建议
    return [];
  }

  // ============================================
  // 上传和下载（需要子类实现）
  // ============================================

  abstract uploadFile(file: File | Blob, options: IUploadOptions): Promise<ITransferTask>;
  abstract downloadFile(fileId: string, options?: IDownloadOptions): Promise<ITransferTask>;

  /**
   * 上传多个文件（默认批量调用uploadFile）
   */
  public async uploadFiles(files: (File | Blob)[], options: IUploadOptions): Promise<ITransferTask[]> {
    return Promise.all(files.map(file => this.uploadFile(file, options)));
  }

  /**
   * 下载多个文件（默认批量调用downloadFile）
   */
  public async downloadFiles(fileIds: string[]): Promise<ITransferTask[]> {
    return Promise.all(fileIds.map(id => this.downloadFile(id)));
  }

  /**
   * 获取下载URL（默认实现）
   */
  public async getDownloadUrl(fileId: string, expiresIn: number = 3600): Promise<string> {
    const file = await this.getFileInfo(fileId);
    if (file.downloadUrl) {
      return file.downloadUrl;
    }
    throw new Error('Download URL not available');
  }

  /**
   * 获取上传URL（默认实现）
   */
  public async getUploadUrl(folderId: string, fileName: string, expiresIn: number = 3600): Promise<{
    uploadUrl: string;
    fileId?: string;
    headers?: Record<string, string>;
  }> {
    // 子类应该重写此方法以支持直接上传URL
    throw new Error('Upload URL not supported');
  }

  // ============================================
  // 缩略图和预览（默认实现）
  // ============================================

  /**
   * 获取缩略图（默认实现）
   */
  public async getThumbnail(fileId: string, size: number = 256): Promise<IThumbnail> {
    const file = await this.getFileInfo(fileId);
    if (file.thumbnailUrl) {
      const response = await fetch(file.thumbnailUrl);
      const blob = await response.blob();
      return {
        url: file.thumbnailUrl,
        width: size,
        height: size,
        size: blob.size,
        mimeType: blob.type,
      };
    }
    throw new Error('Thumbnail not available');
  }

  /**
   * 获取预览信息（默认实现）
   */
  public async getPreviewInfo(fileId: string): Promise<IPreviewInfo> {
    const file = await this.getFileInfo(fileId);
    return {
      url: file.previewUrl || file.downloadUrl || '',
      mimeType: file.mimeType || 'application/octet-stream',
      expiresAt: new Date(Date.now() + 3600000),
      canEmbed: false,
      downloadUrl: file.downloadUrl,
    };
  }

  /**
   * 获取预览URL（默认实现）
   */
  public async getPreviewUrl(fileId: string): Promise<string> {
    const preview = await this.getPreviewInfo(fileId);
    return preview.url;
  }

  // ============================================
  // 共享和协作（需要子类实现或抛出错误）
  // ============================================

  public async createShare(options: IShareOptions): Promise<{ shareId: string; shareUrl: string; expiresAt?: Date }> {
    throw new Error('Share not implemented');
  }

  public async getShareInfo(fileId: string): Promise<any> {
    throw new Error('Get share info not implemented');
  }

  public async updateShare(shareId: string, updates: any): Promise<void> {
    throw new Error('Update share not implemented');
  }

  public async deleteShare(shareId: string): Promise<void> {
    throw new Error('Delete share not implemented');
  }

  public async addCollaborator(fileId: string, collaborator: any): Promise<void> {
    throw new Error('Add collaborator not implemented');
  }

  public async removeCollaborator(fileId: string, userId: string): Promise<void> {
    throw new Error('Remove collaborator not implemented');
  }

  public async listCollaborators(fileId: string): Promise<any[]> {
    throw new Error('List collaborators not implemented');
  }

  // ============================================
  // 版本控制（需要子类实现或抛出错误）
  // ============================================

  public async getFileVersions(fileId: string): Promise<IFileVersion[]> {
    throw new Error('File versions not implemented');
  }

  public async getFileVersion(fileId: string, versionId: string): Promise<IFileVersion> {
    throw new Error('Get file version not implemented');
  }

  public async restoreFileVersion(fileId: string, versionId: string): Promise<void> {
    throw new Error('Restore file version not implemented');
  }

  public async deleteFileVersion(fileId: string, versionId: string): Promise<void> {
    throw new Error('Delete file version not implemented');
  }

  // ============================================
  // 存储配额（需要子类实现）
  // ============================================

  abstract getStorageQuota(): Promise<IStorageQuota>;

  /**
   * 获取文件统计信息（默认实现）
   */
  public async getFileStatistics(folderId?: string): Promise<IFileStatistics> {
    const response = await this.listFiles({ folderId });

    const stats: IFileStatistics = {
      totalFiles: 0,
      totalFolders: 0,
      totalSize: 0,
      byType: {},
      averageFileSize: 0,
    };

    for (const file of response.files) {
      if (file.type === 'folder') {
        stats.totalFolders++;
      } else {
        stats.totalFiles++;
        stats.totalSize += file.size;

        const fileType = file.fileType || file.type;
        stats.byType[fileType] = (stats.byType[fileType] || 0) + 1;
      }
    }

    if (stats.totalFiles > 0) {
      stats.averageFileSize = stats.totalSize / stats.totalFiles;
    }

    return stats;
  }

  // ============================================
  // 文件监视（需要子类实现或使用轮询）
  // ============================================

  public watchFiles(folderId: string, callbacks: IFileWatchCallbacks): () => void {
    // 默认实现：使用轮询
    const watcherId = `${folderId}-${Date.now()}`;

    let previousFiles = new Map<string, IFileItem>();

    const poll = async () => {
      try {
        const response = await this.listFiles({ folderId });
        const currentFiles = new Map(response.files.map(f => [f.id, f]));

        // 检测新增文件
        for (const [id, file] of currentFiles) {
          if (!previousFiles.has(id)) {
            callbacks.onCreated?.(file);
          } else {
            const prevFile = previousFiles.get(id)!;
            // 检测更新
            if (file.modifiedAt > prevFile.modifiedAt) {
              callbacks.onUpdated?.(file);
            }
          }
        }

        // 检测删除
        for (const [id] of previousFiles) {
          if (!currentFiles.has(id)) {
            callbacks.onDeleted?.(id);
          }
        }

        previousFiles = currentFiles;
      } catch (error) {
        callbacks.onError?.(error as Error);
      }
    };

    // 立即执行一次
    poll();

    // 设置定时轮询（每30秒）
    const intervalId = setInterval(poll, 30000);

    const cleanup = () => {
      clearInterval(intervalId);
      this._fileWatchers.delete(watcherId);
    };

    this._fileWatchers.set(watcherId, { callbacks, cleanup });

    return cleanup;
  }

  // ============================================
  // 实用方法
  // ============================================

  abstract normalizeFile(rawFile: any): IFileItem;
  abstract denormalizeFile(file: IFileItem): any;

  /**
   * 验证配置
   */
  public async validateConfig(config: IProviderConfig): Promise<{
    valid: boolean;
    errors?: string[];
  }> {
    const errors: string[] = [];

    // 基础验证
    if (!config.auth) {
      errors.push('Auth configuration is required');
    }

    // OAuth2 验证
    if (config.auth.oauth2) {
      const { clientId, clientSecret, redirectUri, scopes, authUrl, tokenUrl } = config.auth.oauth2;
      if (!clientId) errors.push('OAuth2 clientId is required');
      if (!clientSecret) errors.push('OAuth2 clientSecret is required');
      if (!redirectUri) errors.push('OAuth2 redirectUri is required');
      if (!scopes || scopes.length === 0) errors.push('OAuth2 scopes are required');
      if (!authUrl) errors.push('OAuth2 authUrl is required');
      if (!tokenUrl) errors.push('OAuth2 tokenUrl is required');
    }

    // API Key 验证
    if (config.auth.apiKey) {
      if (!config.auth.apiKey.key) {
        errors.push('API key is required');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 获取提供商特定功能
   */
  public getFeature(feature: string): any {
    throw new Error(`Feature '${feature}' not implemented`);
  }

  /**
   * 清理资源
   */
  public async cleanup(): Promise<void> {
    // 清理所有文件监视器
    for (const watcher of this._fileWatchers.values()) {
      watcher.cleanup();
    }
    this._fileWatchers.clear();

    // 清理事件监听器
    this._eventListeners.clear();
  }

  // ============================================
  // 受保护的辅助方法
  // ============================================

  /**
   * 创建传输任务对象
   */
  protected createTransferTask(
    type: TransferType,
    fileName: string,
    fileSize: number,
    source: any,
    destination: any,
    options: ITransferOptions
  ): ITransferTask {
    return {
      id: this.generateTaskId(),
      fileName,
      filePath: source.path || destination.path,
      fileSize,
      fileType: this.getFileType(fileName),
      mimeType: this.getMimeType(fileName),
      source,
      destination,
      type,
      status: TransferStatus.PENDING,
      priority: options.priority,
      progress: {
        transferred: 0,
        total: fileSize,
        percentage: 0,
        speed: {
          current: 0,
          average: 0,
          peak: 0,
        },
        elapsed: 0,
      },
      statistics: {
        totalBytes: fileSize,
        transferredBytes: 0,
        failedBytes: 0,
        chunkCount: 0,
        completedChunks: 0,
        failedChunks: 0,
        retriedChunks: 0,
        skippedChunks: 0,
      },
      chunkSize: options.chunkSize,
      options,
      createdAt: new Date(),
      errorCount: 0,
      retryCount: 0,
      maxRetries: options.maxRetries,
      events: [],
    };
  }

  /**
   * 生成任务ID
   */
  protected generateTaskId(): string {
    return `${this.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取文件类型
   */
  protected getFileType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const typeMap: Record<string, string> = {
      // 图片
      jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', bmp: 'image',
      svg: 'image', webp: 'image', ico: 'image',

      // 视频
      mp4: 'video', avi: 'video', mkv: 'video', mov: 'video', wmv: 'video',
      flv: 'video', webm: 'video', m4v: 'video',

      // 音频
      mp3: 'audio', wav: 'audio', flac: 'audio', aac: 'audio', ogg: 'audio',
      m4a: 'audio', wma: 'audio',

      // 文档
      pdf: 'document', doc: 'document', docx: 'document', xls: 'document',
      xlsx: 'document', ppt: 'document', pptx: 'document', txt: 'document',
      rtf: 'document', odt: 'document', ods: 'document', odp: 'document',

      // 压缩文件
      zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive',
      gz: 'archive', bz2: 'archive',

      // 代码
      js: 'code', ts: 'code', py: 'code', java: 'code', cpp: 'code',
      c: 'code', cs: 'code', php: 'code', rb: 'code', go: 'code',
      rs: 'code', kt: 'code', swift: 'code', html: 'code', css: 'code',
      json: 'code', xml: 'code', yaml: 'code', yml: 'code', md: 'code',
    };
    return typeMap[ext] || 'unknown';
  }

  /**
   * 获取MIME类型
   */
  protected getMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      gif: 'image/gif', bmp: 'image/bmp', svg: 'image/svg+xml',
      webp: 'image/webp', ico: 'image/x-icon',

      mp4: 'video/mp4', avi: 'video/x-msvideo', mkv: 'video/x-matroska',
      mov: 'video/quicktime', wmv: 'video/x-ms-wmv', flv: 'video/x-flv',
      webm: 'video/webm',

      mp3: 'audio/mpeg', wav: 'audio/wav', flac: 'audio/flac',
      aac: 'audio/aac', ogg: 'audio/ogg', m4a: 'audio/mp4',
      wma: 'audio/x-ms-wma',

      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',

      zip: 'application/zip', rar: 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed', tar: 'application/x-tar',
      gz: 'application/gzip', bz2: 'application/x-bzip2',

      json: 'application/json', xml: 'application/xml',
      js: 'application/javascript', ts: 'application/typescript',
      html: 'text/html', css: 'text/css', md: 'text/markdown',
    };
    return mimeMap[ext] || 'application/octet-stream';
  }

  /**
   * HTTP请求辅助方法
   */
  protected async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers);

    // 添加认证头
    if (this.config.tokens?.accessToken) {
      headers.set('Authorization', `Bearer ${this.config.tokens.accessToken}`);
    }

    // 添加超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.transfer?.upload.timeout || 30000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      // 检查是否需要刷新令牌
      if (response.status === 401 && this.config.tokens?.refreshToken) {
        await this.refreshAuth();
        // 重试请求
        headers.set('Authorization', `Bearer ${this.config.tokens.accessToken}`);
        return await fetch(url, { ...options, headers });
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
