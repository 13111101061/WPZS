/**
 * 云存储自定义 React Hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCloud, useActiveProvider } from '../contexts/CloudProviderContext';
import { IFileItem, IFileListResponse } from '../providers/base/IFileItem';
import { ITransferTask, TransferStatus } from '../providers/base/ITransferOptions';
import { CloudEventType } from '../events';
import { eventBus } from '../events/EventBus';

/**
 * 使用文件列表的Hook
 */
export const useFileList = (folderId?: string, options?: any) => {
  const activeProvider = useActiveProvider();
  const [files, setFiles] = useState<IFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadFiles = useCallback(async () => {
    if (!activeProvider) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result: IFileListResponse = await activeProvider.listFiles({
        folderId,
        ...options,
      });
      setFiles(result.files);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [activeProvider, folderId, options]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return { files, loading, error, refresh: loadFiles };
};

/**
 * 使用文件详情的Hook
 */
export const useFile = (fileId: string) => {
  const activeProvider = useActiveProvider();
  const [file, setFile] = useState<IFileItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!activeProvider || !fileId) {
      return;
    }

    setLoading(true);
    activeProvider.getFileInfo(fileId)
      .then(setFile)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [activeProvider, fileId]);

  return { file, loading, error };
};

/**
 * 使用文件搜索的Hook
 */
export const useFileSearch = () => {
  const activeProvider = useActiveProvider();
  const [results, setResults] = useState<IFileItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(async (query: string, options?: any) => {
    if (!activeProvider || !query) {
      setResults([]);
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const result = await activeProvider.searchFiles({
        query,
        ...options,
      });
      setResults(result.files);
    } catch (err) {
      setError(err as Error);
    } finally {
      setSearching(false);
    }
  }, [activeProvider]);

  return { results, searching, error, search };
};

/**
 * 使用文件上传的Hook
 */
export const useFileUpload = () => {
  const activeProvider = useActiveProvider();
  const { transferManager } = useCloud();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tasks, setTasks] = useState<ITransferTask[]>([]);

  const upload = useCallback(async (
    files: File[],
    targetPath: string,
    options?: any
  ) => {
    if (!activeProvider) {
      throw new Error('No active provider');
    }

    setUploading(true);
    setProgress(0);

    const uploadTasks: ITransferTask[] = [];

    for (const file of files) {
      const task = await transferManager.addTask(
        activeProvider,
        'upload' as any,
        file,
        {
          targetPath,
          ...options,
          onProgress: (progress) => {
            setProgress(progress.percentage);
          },
        }
      );
      uploadTasks.push(task);
    }

    setTasks(prev => [...prev, ...uploadTasks]);
    setUploading(false);

    return uploadTasks;
  }, [activeProvider, transferManager]);

  return { uploading, progress, tasks, upload };
};

/**
 * 使用文件下载的Hook
 */
export const useFileDownload = () => {
  const activeProvider = useActiveProvider();
  const { transferManager } = useCloud();
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tasks, setTasks] = useState<ITransferTask[]>([]);

  const download = useCallback(async (
    fileIds: string[],
    options?: any
  ) => {
    if (!activeProvider) {
      throw new Error('No active provider');
    }

    setDownloading(true);
    setProgress(0);

    const downloadTasks: ITransferTask[] = [];

    for (const fileId of fileIds) {
      const task = await transferManager.addTask(
        activeProvider,
        'download' as any,
        fileId,
        {
          ...options,
          onProgress: (progress) => {
            setProgress(progress.percentage);
          },
        }
      );
      downloadTasks.push(task);
    }

    setTasks(prev => [...prev, ...downloadTasks]);
    setDownloading(false);

    return downloadTasks;
  }, [activeProvider, transferManager]);

  return { downloading, progress, tasks, download };
};

/**
 * 使用传输任务的Hook
 */
export const useTransfers = () => {
  const { transferManager } = useCloud();
  const [tasks, setTasks] = useState<ITransferTask[]>([]);
  const [summary, setSummary] = useState(transferManager.getSummary());

  useEffect(() => {
    // 初始加载
    setTasks(transferManager.getAllTasks());

    // 监听传输事件
    const unsubscribes = [
      eventBus.on(CloudEventType.UPLOAD_PROGRESS, () => {
        setTasks(transferManager.getAllTasks());
        setSummary(transferManager.getSummary());
      }),
      eventBus.on(CloudEventType.DOWNLOAD_PROGRESS, () => {
        setTasks(transferManager.getAllTasks());
        setSummary(transferManager.getSummary());
      }),
      eventBus.on(CloudEventType.UPLOAD_COMPLETED, () => {
        setTasks(transferManager.getAllTasks());
        setSummary(transferManager.getSummary());
      }),
      eventBus.on(CloudEventType.DOWNLOAD_COMPLETED, () => {
        setTasks(transferManager.getAllTasks());
        setSummary(transferManager.getSummary());
      }),
      eventBus.on(CloudEventType.UPLOAD_FAILED, () => {
        setTasks(transferManager.getAllTasks());
        setSummary(transferManager.getSummary());
      }),
      eventBus.on(CloudEventType.DOWNLOAD_FAILED, () => {
        setTasks(transferManager.getAllTasks());
        setSummary(transferManager.getSummary());
      }),
    ];

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [transferManager]);

  const pauseTask = useCallback((taskId: string) => {
    return transferManager.pauseTask(taskId);
  }, [transferManager]);

  const resumeTask = useCallback((taskId: string) => {
    return transferManager.resumeTask(taskId);
  }, [transferManager]);

  const cancelTask = useCallback((taskId: string) => {
    return transferManager.cancelTask(taskId);
  }, [transferManager]);

  const retryTask = useCallback((taskId: string) => {
    return transferManager.retryTask(taskId);
  }, [transferManager]);

  const clearCompleted = useCallback(() => {
    transferManager.clearCompleted();
    setTasks(transferManager.getAllTasks());
  }, [transferManager]);

  return {
    tasks,
    summary,
    pauseTask,
    resumeTask,
    cancelTask,
    retryTask,
    clearCompleted,
  };
};

/**
 * 使用存储配额的Hook
 */
export const useStorageQuota = () => {
  const activeProvider = useActiveProvider();
  const [quota, setQuota] = useState<{
    total: number;
    used: number;
    remaining: number;
    usagePercentage: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadQuota = useCallback(async () => {
    if (!activeProvider) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const quotaData = await activeProvider.getStorageQuota();
      setQuota(quotaData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [activeProvider]);

  useEffect(() => {
    loadQuota();
  }, [loadQuota]);

  return { quota, loading, error, refresh: loadQuota };
};

/**
 * 使用文件拖放的Hook
 */
export const useFileDrop = (
  onDrop: (files: File[]) => void,
  options?: { accept?: string; multiple?: boolean }
) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);

    if (options?.accept) {
      const acceptedFiles = files.filter(file => {
        // 简单的MIME类型检查
        return file.type.startsWith(options.accept);
      });
      onDrop(acceptedFiles);
    } else if (!options?.multiple) {
      onDrop([files[0]]);
    } else {
      onDrop(files);
    }
  }, [onDrop, options]);

  const dropHandlers = {
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  };

  return { isDragging, dropHandlers };
};

/**
 * 使用文件选择的Hook
 */
export const useFileSelect = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const selectFiles = useCallback((options?: {
    accept?: string;
    multiple?: boolean;
  }) => {
    if (inputRef.current) {
      inputRef.current.accept = options?.accept || '*';
      inputRef.current.multiple = options?.multiple || false;
      inputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      return Array.from(files);
    }
    return [];
  }, []);

  return { selectFiles, inputRef, handleFileChange };
};

/**
 * 使用文件预览的Hook
 */
export const useFilePreview = (fileId?: string) => {
  const activeProvider = useActiveProvider();
  const [preview, setPreview] = useState<{
    url: string;
    mimeType: string;
    expiresAt: Date;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!activeProvider || !fileId) {
      return;
    }

    setLoading(true);
    activeProvider.getPreviewInfo(fileId)
      .then(info => {
        setPreview({
          url: info.url,
          mimeType: info.mimeType,
          expiresAt: info.expiresAt,
        });
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [activeProvider, fileId]);

  return { preview, loading, error };
};

/**
 * 使用文件缩略图的Hook
 */
export const useFileThumbnail = (fileId?: string, size: number = 256) => {
  const activeProvider = useActiveProvider();
  const [thumbnail, setThumbnail] = useState<{
    url: string;
    width: number;
    height: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!activeProvider || !fileId) {
      return;
    }

    setLoading(true);
    activeProvider.getThumbnail(fileId, size)
      .then(thumb => {
        setThumbnail({
          url: thumb.url,
          width: thumb.width,
          height: thumb.height,
        });
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [activeProvider, fileId, size]);

  return { thumbnail, loading, error };
};

/**
 * 使用提供商配置的Hook
 */
export const useProviderConfig = () => {
  const { providers, addProvider, removeProvider, connectProvider, disconnectProvider } = useCloud();

  return {
    providers,
    addProvider,
    removeProvider,
    connectProvider,
    disconnectProvider,
  };
};

/**
 * 使用云存储事件的Hook
 */
export const useCloudEvent = (
  eventType: CloudEventType,
  callback: (data: any) => void,
  deps: any[] = []
) => {
  useEffect(() => {
    const unsubscribe = eventBus.on(eventType, callback);
    return unsubscribe;
  }, [eventType, callback, ...deps]);
};

/**
 * 使用云存储统计的Hook
 */
export const useCloudStats = () => {
  const { cacheManager } = useCloud();
  const [stats, setStats] = useState(cacheManager.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(cacheManager.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, [cacheManager]);

  return stats;
};
