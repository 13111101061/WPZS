/**
 * 传输管理器
 * 管理文件上传下载任务队列
 */

import {
  ITransferTask,
  ITransferOptions,
  TransferType,
  TransferStatus,
  TransferPriority,
  ITransferProgress,
  ITransferSpeed,
  IChunkInfo,
  ITransferSummary,
  TransferQueueConfig,
} from '../providers/base/ITransferOptions';
import { IFileItem } from '../providers/base/IFileItem';
import { IStorageProvider } from '../providers/base/IStorageProvider';
import { eventBus, CloudEventType } from '../events';
import { cacheManager, CacheType } from '../cache';

/**
 * 传输队列默认配置
 */
const DEFAULT_QUEUE_CONFIG: TransferQueueConfig = {
  maxConcurrent: 3,
  maxUploadConcurrent: 2,
  maxDownloadConcurrent: 3,
  maxQueueSize: 100,
  priorityMode: 'priority',
  autoStart: true,
  throttleDelay: 100,
};

/**
 * 传输管理器类
 */
export class TransferManager {
  private static instance: TransferManager;
  private queue: Map<string, ITransferTask> = new Map();
  private activeTransfers: Set<string> = new Set();
  private config: TransferQueueConfig;
  private processingInterval?: NodeJS.Timeout;
  private paused: boolean = false;

  // 统计信息
  private totalUploadSpeed: ITransferSpeed = { current: 0, average: 0, peak: 0 };
  private totalDownloadSpeed: ITransferSpeed = { current: 0, average: 0, peak: 0 };

  private constructor(config: Partial<TransferQueueConfig> = {}) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };

    if (this.config.autoStart) {
      this.startProcessing();
    }
  }

  /**
   * 获取传输管理器单例
   */
  public static getInstance(config?: Partial<TransferQueueConfig>): TransferManager {
    if (!TransferManager.instance) {
      TransferManager.instance = new TransferManager(config);
    }
    return TransferManager.instance;
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<TransferQueueConfig>): void {
    this.config = { ...this.config, ...config };

    if (!this.processingInterval && this.config.autoStart && !this.paused) {
      this.startProcessing();
    }
  }

  /**
   * 添加传输任务
   */
  public async addTask(
    provider: IStorageProvider,
    type: TransferType,
    fileOrPath: File | Blob | string,
    options: Partial<ITransferOptions> = {}
  ): Promise<ITransferTask> {
    const defaultOptions: ITransferOptions = {
      type,
      priority: TransferPriority.NORMAL,
      maxConcurrentChunks: 3,
      maxConcurrentFiles: 1,
      chunkSize: 5 * 1024 * 1024, // 5MB
      enableChunking: true,
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true,
      timeout: 30000,
      verifyHash: true,
      overwrite: false,
      skipExisting: false,
      renameIfExists: false,
      preservePermissions: false,
      preserveTimestamps: false,
      preserveMetadata: false,
      onProgress: undefined,
      onComplete: undefined,
      onError: undefined,
      showNotification: true,
      notifyOnComplete: true,
      notifyOnError: true,
      useCache: true,
      autoStart: this.config.autoStart,
      autoRetry: true,
      sequential: false,
      deduplicate: false,
      compress: false,
      enableLogging: false,
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // 创建任务
    let task: ITransferTask;

    if (type === TransferType.UPLOAD) {
      if (typeof fileOrPath === 'string') {
        throw new Error('Upload requires File or Blob');
      }

      task = await this.createUploadTask(provider, fileOrPath, mergedOptions);
    } else if (type === TransferType.DOWNLOAD) {
      if (typeof fileOrPath !== 'string') {
        throw new Error('Download requires file path or ID');
      }

      task = await this.createDownloadTask(provider, fileOrPath, mergedOptions);
    } else {
      throw new Error(`Transfer type ${type} not implemented`);
    }

    // 添加到队列
    this.queue.set(task.id, task);

    // 发出事件
    await eventBus.emit(
      type === TransferType.UPLOAD ? CloudEventType.UPLOAD_STARTED : CloudEventType.DOWNLOAD_STARTED,
      task,
      'TransferManager'
    );

    return task;
  }

  /**
   * 批量添加任务
   */
  public async addTasks(
    provider: IStorageProvider,
    type: TransferType,
    filesOrPaths: Array<File | Blob | string>,
    options: Partial<ITransferOptions> = {}
  ): Promise<ITransferTask[]> {
    const tasks: ITransferTask[] = [];

    for (const fileOrPath of filesOrPaths) {
      try {
        const task = await this.addTask(provider, type, fileOrPath, options);
        tasks.push(task);
      } catch (error) {
        console.error('Error adding transfer task:', error);
        if (options.onError) {
          options.onError(error as Error);
        }
      }
    }

    return tasks;
  }

  /**
   * 创建上传任务
   */
  private async createUploadTask(
    provider: IStorageProvider,
    file: File | Blob,
    options: ITransferOptions
  ): Promise<ITransferTask> {
    const fileName = (file as File).name || 'unnamed';
    const fileSize = file.size;
    const fileId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 如果启用分片，创建分片信息
    let chunks: IChunkInfo[] | undefined;
    if (options.enableChunking && fileSize > options.chunkSize) {
      chunks = this.createChunks(fileSize, options.chunkSize);
    }

    const task: ITransferTask = {
      id: fileId,
      fileName,
      filePath: options.targetPath || '/',
      fileSize,
      fileType: this.getFileType(fileName),
      mimeType: (file as File).type || 'application/octet-stream',
      source: {
        providerId: 'local',
        path: (file as File).name || '',
      },
      destination: {
        providerId: provider.id,
        path: options.targetPath || '/',
      },
      type: TransferType.UPLOAD,
      status: options.autoStart ? TransferStatus.QUEUED : TransferStatus.PENDING,
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
        chunkCount: chunks?.length || 1,
        completedChunks: 0,
        failedChunks: 0,
        retriedChunks: 0,
        skippedChunks: 0,
      },
      chunks,
      chunkSize: options.chunkSize,
      options,
      createdAt: new Date(),
      errorCount: 0,
      retryCount: 0,
      maxRetries: options.maxRetries,
      events: [],

      // 添加方法
      start: () => this.startTask(fileId),
      pause: () => this.pauseTask(fileId),
      resume: () => this.resumeTask(fileId),
      cancel: () => this.cancelTask(fileId),
      retry: () => this.retryTask(fileId),
    };

    return task;
  }

  /**
   * 创建下载任务
   */
  private async createDownloadTask(
    provider: IStorageProvider,
    fileIdOrPath: string,
    options: ITransferOptions
  ): Promise<ITransferTask> {
    // 获取文件信息
    let fileInfo: IFileItem;
    try {
      fileInfo = await provider.getFileInfo(fileIdOrPath);
    } catch {
      // 尝试通过路径查找
      const result = await provider.listFiles({ path: fileIdOrPath });
      if (result.files.length === 0) {
        throw new Error(`File not found: ${fileIdOrPath}`);
      }
      fileInfo = result.files[0];
    }

    const taskId = `download-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 如果启用分片，创建分片信息
    let chunks: IChunkInfo[] | undefined;
    if (options.enableChunking && fileInfo.size > options.chunkSize) {
      chunks = this.createChunks(fileInfo.size, options.chunkSize);
    }

    const task: ITransferTask = {
      id: taskId,
      fileName: fileInfo.name,
      filePath: fileInfo.path,
      fileSize: fileInfo.size,
      fileType: fileInfo.type,
      mimeType: fileInfo.mimeType,
      source: {
        providerId: provider.id,
        path: fileInfo.path,
        fileId: fileInfo.id,
      },
      destination: {
        providerId: 'local',
        path: '/', // 浏览器下载会自动处理
      },
      type: TransferType.DOWNLOAD,
      status: options.autoStart ? TransferStatus.QUEUED : TransferStatus.PENDING,
      priority: options.priority,
      progress: {
        transferred: 0,
        total: fileInfo.size,
        percentage: 0,
        speed: {
          current: 0,
          average: 0,
          peak: 0,
        },
        elapsed: 0,
      },
      statistics: {
        totalBytes: fileInfo.size,
        transferredBytes: 0,
        failedBytes: 0,
        chunkCount: chunks?.length || 1,
        completedChunks: 0,
        failedChunks: 0,
        retriedChunks: 0,
        skippedChunks: 0,
      },
      chunks,
      chunkSize: options.chunkSize,
      options,
      createdAt: new Date(),
      errorCount: 0,
      retryCount: 0,
      maxRetries: options.maxRetries,
      events: [],

      start: () => this.startTask(taskId),
      pause: () => this.pauseTask(taskId),
      resume: () => this.resumeTask(taskId),
      cancel: () => this.cancelTask(taskId),
      retry: () => this.retryTask(taskId),
    };

    return task;
  }

  /**
   * 创建分片信息
   */
  private createChunks(fileSize: number, chunkSize: number): IChunkInfo[] {
    const chunks: IChunkInfo[] = [];
    const numChunks = Math.ceil(fileSize / chunkSize);

    for (let i = 0; i < numChunks; i++) {
      const offset = i * chunkSize;
      const size = Math.min(chunkSize, fileSize - offset);

      chunks.push({
        index: i,
        offset,
        size,
        status: TransferStatus.PENDING,
        retryCount: 0,
      });
    }

    return chunks;
  }

  /**
   * 启动任务
   */
  public async startTask(taskId: string): Promise<void> {
    const task = this.queue.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (task.status === TransferStatus.ACTIVE) {
      return; // 已经在运行
    }

    task.status = TransferStatus.QUEUED;
    task.startedAt = new Date();

    await this.processQueue();
  }

  /**
   * 暂停任务
   */
  public async pauseTask(taskId: string): Promise<void> {
    const task = this.queue.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (task.status === TransferStatus.ACTIVE) {
      task.status = TransferStatus.PAUSED;
      task.pausedAt = new Date();
      this.activeTransfers.delete(taskId);

      await eventBus.emit(
        task.type === TransferType.UPLOAD ? CloudEventType.UPLOAD_PAUSED : CloudEventType.DOWNLOAD_PAUSED,
        task,
        'TransferManager'
      );
    }
  }

  /**
   * 恢复任务
   */
  public async resumeTask(taskId: string): Promise<void> {
    const task = this.queue.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (task.status === TransferStatus.PAUSED) {
      task.status = TransferStatus.QUEUED;
      task.resumedAt = new Date();

      await eventBus.emit(
        task.type === TransferType.UPLOAD ? CloudEventType.UPLOAD_RESUMED : CloudEventType.DOWNLOAD_RESUMED,
        task,
        'TransferManager'
      );
    }
  }

  /**
   * 取消任务
   */
  public async cancelTask(taskId: string): Promise<void> {
    const task = this.queue.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    task.status = TransferStatus.CANCELLED;
    this.activeTransfers.delete(taskId);

    await eventBus.emit(
      task.type === TransferType.UPLOAD ? CloudEventType.UPLOAD_CANCELLED : CloudEventType.DOWNLOAD_CANCELLED,
      task,
      'TransferManager'
    );

    this.queue.delete(taskId);
  }

  /**
   * 重试任务
   */
  public async retryTask(taskId: string): Promise<void> {
    const task = this.queue.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // 重置任务状态
    task.status = TransferStatus.PENDING;
    task.errorCount = 0;
    task.retryCount++;
    task.progress.transferred = 0;
    task.progress.percentage = 0;

    // 重置分片
    if (task.chunks) {
      for (const chunk of task.chunks) {
        chunk.status = TransferStatus.PENDING;
        chunk.retryCount = 0;
      }
    }

    await this.startTask(taskId);
  }

  /**
   * 开始处理队列
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(
      () => {
        this.processQueue().catch(console.error);
      },
      this.config.throttleDelay
    );
  }

  /**
   * 停止处理队列
   */
  private stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }

  /**
   * 处理队列
   */
  private async processQueue(): Promise<void> {
    if (this.paused) {
      return;
    }

    // 检查并发限制
    const activeUploads = Array.from(this.activeTransfers).filter(
      id => this.queue.get(id)?.type === TransferType.UPLOAD
    ).length;

    const activeDownloads = Array.from(this.activeTransfers).filter(
      id => this.queue.get(id)?.type === TransferType.DOWNLOAD
    ).length;

    if (
      activeUploads >= this.config.maxUploadConcurrent ||
      activeDownloads >= this.config.maxDownloadConcurrent ||
      this.activeTransfers.size >= this.config.maxConcurrent
    ) {
      return;
    }

    // 获取待处理的任务
    const pendingTasks = Array.from(this.queue.values()).filter(
      task => task.status === TransferStatus.QUEUED
    );

    if (pendingTasks.length === 0) {
      return;
    }

    // 根据优先级排序
    pendingTasks.sort((a, b) => b.priority - a.priority);

    // 启动可以启动的任务
    for (const task of pendingTasks) {
      if (task.type === TransferType.UPLOAD && activeUploads >= this.config.maxUploadConcurrent) {
        continue;
      }
      if (task.type === TransferType.DOWNLOAD && activeDownloads >= this.config.maxDownloadConcurrent) {
        continue;
      }
      if (this.activeTransfers.size >= this.config.maxConcurrent) {
        break;
      }

      // 启动任务
      this.executeTask(task).catch(console.error);
      this.activeTransfers.add(task.id);
      task.status = TransferStatus.ACTIVE;
      task.startedAt = task.startedAt || new Date();
    }
  }

  /**
   * 执行传输任务
   */
  private async executeTask(task: ITransferTask): Promise<void> {
    try {
      if (task.type === TransferType.UPLOAD) {
        await this.executeUpload(task);
      } else if (task.type === TransferType.DOWNLOAD) {
        await this.executeDownload(task);
      }
    } catch (error) {
      task.error = error as Error;
      task.errorMessage = (error as Error).message;
      task.errorCount++;

      // 检查是否可以重试
      if (task.retryCount < task.maxRetries && task.options.autoRetry) {
        await this.retryTask(task.id);
      } else {
        task.status = TransferStatus.FAILED;
        this.activeTransfers.delete(task.id);

        await eventBus.emit(
          task.type === TransferType.UPLOAD ? CloudEventType.UPLOAD_FAILED : CloudEventType.DOWNLOAD_FAILED,
          task,
          'TransferManager'
        );

        if (task.options.onError) {
          task.options.onError(error as Error);
        }
      }
    }
  }

  /**
   * 执行上传任务
   */
  private async executeUpload(task: ITransferTask): Promise<void> {
    // 这里简化实现，实际应该支持分片上传
    // 真正的实现会调用provider的uploadFile方法

    task.status = TransferStatus.ACTIVE;

    // 模拟上传进度
    const startTime = Date.now();
    const updateInterval = setInterval(() => {
      if (task.status !== TransferStatus.ACTIVE) {
        clearInterval(updateInterval);
        return;
      }

      const elapsed = (Date.now() - startTime) / 1000;
      task.progress.elapsed = elapsed;

      // 模拟进度
      const progress = Math.min((elapsed / 10) * 100, 100); // 假设10秒完成
      task.progress.transferred = (task.fileSize * progress) / 100;
      task.progress.percentage = progress;
      task.progress.speed.current = task.progress.transferred / elapsed;

      if (task.options.onProgress) {
        task.options.onProgress(task.progress);
      }

      await eventBus.emit(
        CloudEventType.UPLOAD_PROGRESS,
        { task, progress: task.progress },
        'TransferManager'
      );
    }, 100);

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 10000));

    clearInterval(updateInterval);

    // 完成
    task.progress.transferred = task.fileSize;
    task.progress.percentage = 100;
    task.status = TransferStatus.COMPLETED;
    task.completedAt = new Date();
    this.activeTransfers.delete(task.id);

    await eventBus.emit(CloudEventType.UPLOAD_COMPLETED, task, 'TransferManager');

    if (task.options.onComplete) {
      task.options.onComplete(task);
    }
  }

  /**
   * 执行下载任务
   */
  private async executeDownload(task: ITransferTask): Promise<void> {
    // 类似上传的实现
    task.status = TransferStatus.ACTIVE;

    const startTime = Date.now();
    const updateInterval = setInterval(() => {
      if (task.status !== TransferStatus.ACTIVE) {
        clearInterval(updateInterval);
        return;
      }

      const elapsed = (Date.now() - startTime) / 1000;
      task.progress.elapsed = elapsed;

      const progress = Math.min((elapsed / 10) * 100, 100);
      task.progress.transferred = (task.fileSize * progress) / 100;
      task.progress.percentage = progress;
      task.progress.speed.current = task.progress.transferred / elapsed;

      if (task.options.onProgress) {
        task.options.onProgress(task.progress);
      }

      await eventBus.emit(
        CloudEventType.DOWNLOAD_PROGRESS,
        { task, progress: task.progress },
        'TransferManager'
      );
    }, 100);

    await new Promise(resolve => setTimeout(resolve, 10000));

    clearInterval(updateInterval);

    task.progress.transferred = task.fileSize;
    task.progress.percentage = 100;
    task.status = TransferStatus.COMPLETED;
    task.completedAt = new Date();
    this.activeTransfers.delete(task.id);

    await eventBus.emit(CloudEventType.DOWNLOAD_COMPLETED, task, 'TransferManager');

    if (task.options.onComplete) {
      task.options.onComplete(task);
    }
  }

  /**
   * 获取任务
   */
  public getTask(taskId: string): ITransferTask | undefined {
    return this.queue.get(taskId);
  }

  /**
   * 获取所有任务
   */
  public getAllTasks(): ITransferTask[] {
    return Array.from(this.queue.values());
  }

  /**
   * 按状态获取任务
   */
  public getTasksByStatus(status: TransferStatus): ITransferTask[] {
    return Array.from(this.queue.values()).filter(task => task.status === status);
  }

  /**
   * 按类型获取任务
   */
  public getTasksByType(type: TransferType): ITransferTask[] {
    return Array.from(this.queue.values()).filter(task => task.type === type);
  }

  /**
   * 获取传输摘要
   */
  public getSummary(): ITransferSummary {
    const tasks = Array.from(this.queue.values());

    return {
      totalTasks: tasks.length,
      activeTasks: tasks.filter(t => t.status === TransferStatus.ACTIVE).length,
      completedTasks: tasks.filter(t => t.status === TransferStatus.COMPLETED).length,
      failedTasks: tasks.filter(t => t.status === TransferStatus.FAILED).length,
      pausedTasks: tasks.filter(t => t.status === TransferStatus.PAUSED).length,
      queuedTasks: tasks.filter(t => t.status === TransferStatus.QUEUED).length,
      totalBytes: tasks.reduce((sum, t) => sum + t.fileSize, 0),
      transferredBytes: tasks.reduce((sum, t) => sum + t.progress.transferred, 0),
      speed: {
        current: this.totalUploadSpeed.current + this.totalDownloadSpeed.current,
        average: this.totalUploadSpeed.average + this.totalDownloadSpeed.average,
        peak: this.totalUploadSpeed.peak + this.totalDownloadSpeed.peak,
      },
      percentage: tasks.length > 0
        ? tasks.reduce((sum, t) => sum + t.progress.percentage, 0) / tasks.length
        : 0,
    };
  }

  /**
   * 清空已完成的任务
   */
  public clearCompleted(): void {
    for (const [id, task] of this.queue.entries()) {
      if (
        task.status === TransferStatus.COMPLETED ||
        task.status === TransferStatus.FAILED ||
        task.status === TransferStatus.CANCELLED
      ) {
        this.queue.delete(id);
      }
    }
  }

  /**
   * 清空所有任务
   */
  public clearAll(): void {
    this.queue.clear();
    this.activeTransfers.clear();
  }

  /**
   * 暂停所有任务
   */
  public pauseAll(): void {
    this.paused = true;

    for (const task of this.queue.values()) {
      if (task.status === TransferStatus.ACTIVE || task.status === TransferStatus.QUEUED) {
        this.pauseTask(task.id).catch(console.error);
      }
    }
  }

  /**
   * 恢复所有任务
   */
  public resumeAll(): void {
    this.paused = false;

    for (const task of this.queue.values()) {
      if (task.status === TransferStatus.PAUSED) {
        this.resumeTask(task.id).catch(console.error);
      }
    }
  }

  /**
   * 获取文件类型
   */
  private getFileType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const typeMap: Record<string, string> = {
      jpg: 'image', jpeg: 'image', png: 'image', gif: 'image',
      mp4: 'video', avi: 'video', mkv: 'video',
      mp3: 'audio', wav: 'audio', flac: 'audio',
      pdf: 'document', doc: 'document', docx: 'document',
      zip: 'archive', rar: 'archive',
      js: 'code', ts: 'code', py: 'code',
    };
    return typeMap[ext] || 'file';
  }

  /**
   * 清理资源
   */
  public async cleanup(): Promise<void> {
    this.stopProcessing();
    this.pauseAll();
    await this.clearAll();
  }
}

/**
 * 传输管理器单例导出
 */
export const transferManager = TransferManager.getInstance();
