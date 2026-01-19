/**
 * 边缘存储管理器
 * 支持多种边缘存储类型（KV、Durable Objects、R2、Queue等）
 */

import {
  IEdgeStorageConfig,
  IEdgeStorageEntry,
  EdgeStorageType,
  EdgeEventType,
} from './EdgeTypes';
import { eventBus } from '../events';

/**
 * 存储操作结果
 */
export interface IStorageOperationResult {
  success: boolean;
  error?: string;
  latency: number;               // 操作延迟（毫秒）
  region: string;                // 执行区域
  cached: boolean;               // 是否来自本地缓存
}

/**
 * 批量操作结果
 */
export interface IBatchOperationResult {
  successful: number;
  failed: number;
  results: IStorageOperationResult[];
}

/**
 * KV 存储实现
 */
class EdgeKVStore {
  private data: Map<string, { value: any; expiresAt?: number; version: number }> = new Map();
  private cache: Map<string, { value: any; expiresAt: number }> = new Map();
  private cacheMaxSize: number = 1000;
  private cacheMaxAge: number = 60000; // 60 秒

  async get(key: string, options?: { cache: boolean }): Promise<any> {
    // 检查缓存
    if (options?.cache) {
      const cached = this.cache.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
      }
    }

    // 从存储获取
    const entry = this.data.get(key);
    if (!entry) {
      return null;
    }

    // 检查过期
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.data.delete(key);
      return null;
    }

    // 更新缓存
    if (options?.cache) {
      this.updateCache(key, entry.value);
    }

    return entry.value;
  }

  async put(
    key: string,
    value: any,
    options?: {
      expirationTTL?: number;
      metadata?: any;
    }
  ): Promise<void> {
    const expiresAt = options?.expirationTTL
      ? Date.now() + options.expirationTTL * 1000
      : undefined;

    const currentVersion = this.data.get(key)?.version || 0;
    this.data.set(key, {
      value,
      expiresAt,
      version: currentVersion + 1,
    });

    // 更新缓存
    this.updateCache(key, value, options?.expirationTTL);
  }

  async delete(key: string): Promise<boolean> {
    this.cache.delete(key);
    return this.data.delete(key);
  }

  async list(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ keys: string[]; listComplete: boolean; cursor?: string }> {
    let keys = Array.from(this.data.keys());

    if (options?.prefix) {
      keys = keys.filter(k => k.startsWith(options.prefix!));
    }

    if (options?.limit) {
      const start = options.cursor ? parseInt(options.cursor) : 0;
      const end = start + options.limit;
      const paginatedKeys = keys.slice(start, end);
      const listComplete = end >= keys.length;
      return {
        keys: paginatedKeys,
        listComplete,
        cursor: listComplete ? undefined : end.toString(),
      };
    }

    return { keys, listComplete: true };
  }

  private updateCache(key: string, value: any, ttl?: number): void {
    // 限制缓存大小
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: ttl ? Date.now() + ttl * 1000 : Date.now() + this.cacheMaxAge,
    });
  }
}

/**
 * 边缘存储管理器类
 */
export class EdgeStorageManager {
  private static instance: EdgeStorageManager;
  private stores: Map<string, EdgeKVStore> = new Map();
  private configs: Map<string, IEdgeStorageConfig> = new Map();
  private metrics: Map<string, {
    reads: number;
    writes: number;
    deletes: number;
    totalLatency: number;
    cacheHits: number;
    cacheMisses: number;
  }> = new Map();

  private constructor() {
    // 私有构造函数，确保单例
  }

  /**
   * 获取边缘存储管理器单例
   */
  public static getInstance(): EdgeStorageManager {
    if (!EdgeStorageManager.instance) {
      EdgeStorageManager.instance = new EdgeStorageManager();
    }
    return EdgeStorageManager.instance;
  }

  /**
   * 创建存储命名空间
   */
  async createStore(config: IEdgeStorageConfig): Promise<string> {
    const storeId = `${config.type}-${config.namespace}`;

    if (this.stores.has(storeId)) {
      throw new Error(`Store already exists: ${storeId}`);
    }

    // 根据类型创建相应的存储
    switch (config.type) {
      case EdgeStorageType.KV:
        this.stores.set(storeId, new EdgeKVStore());
        break;
      // 其他类型的存储...
      default:
        throw new Error(`Unsupported storage type: ${config.type}`);
    }

    this.configs.set(storeId, config);
    this.initializeMetrics(storeId);

    return storeId;
  }

  /**
   * 获取存储
   */
  async get(
    namespace: string,
    key: string,
    options?: { type?: EdgeStorageType; cache?: boolean }
  ): Promise<any> {
    const storeId = this.getStoreId(namespace, options?.type);
    const store = this.stores.get(storeId);

    if (!store) {
      throw new Error(`Store not found: ${storeId}`);
    }

    const startTime = Date.now();
    const config = this.configs.get(storeId)!;
    const useCache = options?.cache ?? config.enableCache;

    try {
      const value = await store.get(key, { cache: useCache });
      const latency = Date.now() - startTime;

      this.updateMetrics(storeId, 'read', latency, useCache && value !== null);

      if (value !== null && useCache) {
        await eventBus.emit(EdgeEventType.CACHE_HIT, { storeId, key });
      } else if (useCache) {
        await eventBus.emit(EdgeEventType.CACHE_MISS, { storeId, key });
      }

      await eventBus.emit(EdgeEventType.STORAGE_READ, {
        storeId,
        key,
        latency,
      });

      return value;
    } catch (error) {
      throw new Error(`Failed to get value: ${(error as Error).message}`);
    }
  }

  /**
   * 设置存储
   */
  async put(
    namespace: string,
    key: string,
    value: any,
    options?: {
      type?: EdgeStorageType;
      expirationTTL?: number;
      metadata?: any;
    }
  ): Promise<void> {
    const storeId = this.getStoreId(namespace, options?.type);
    const store = this.stores.get(storeId);

    if (!store) {
      throw new Error(`Store not found: ${storeId}`);
    }

    const startTime = Date.now();

    try {
      await store.put(key, value, {
        expirationTTL: options?.expirationTTL,
        metadata: options?.metadata,
      });

      const latency = Date.now() - startTime;
      this.updateMetrics(storeId, 'write', latency, false);

      await eventBus.emit(EdgeEventType.STORAGE_WRITE, {
        storeId,
        key,
        latency,
        size: JSON.stringify(value).length,
      });
    } catch (error) {
      throw new Error(`Failed to put value: ${(error as Error).message}`);
    }
  }

  /**
   * 删除存储
   */
  async delete(
    namespace: string,
    key: string,
    options?: { type?: EdgeStorageType }
  ): Promise<boolean> {
    const storeId = this.getStoreId(namespace, options?.type);
    const store = this.stores.get(storeId);

    if (!store) {
      throw new Error(`Store not found: ${storeId}`);
    }

    const startTime = Date.now();

    try {
      const deleted = await store.delete(key);
      const latency = Date.now() - startTime;

      this.updateMetrics(storeId, 'delete', latency, false);

      await eventBus.emit(EdgeEventType.STORAGE_DELETE, {
        storeId,
        key,
        latency,
      });

      return deleted;
    } catch (error) {
      throw new Error(`Failed to delete value: ${(error as Error).message}`);
    }
  }

  /**
   * 批量获取
   */
  async getMany(
    namespace: string,
    keys: string[],
    options?: { type?: EdgeStorageType; cache?: boolean }
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    for (const key of keys) {
      try {
        const value = await this.get(namespace, key, options);
        if (value !== null) {
          results.set(key, value);
        }
      } catch (error) {
        console.error(`Failed to get key ${key}:`, error);
      }
    }

    return results;
  }

  /**
   * 批量设置
   */
  async putMany(
    namespace: string,
    entries: Array<{ key: string; value: any; expirationTTL?: number }>,
    options?: { type?: EdgeStorageType }
  ): Promise<IBatchOperationResult> {
    const results: IStorageOperationResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const entry of entries) {
      const startTime = Date.now();

      try {
        await this.put(namespace, entry.key, entry.value, {
          type: options?.type,
          expirationTTL: entry.expirationTTL,
        });

        results.push({
          success: true,
          latency: Date.now() - startTime,
          region: 'default',
          cached: false,
        });

        successful++;
      } catch (error) {
        results.push({
          success: false,
          error: (error as Error).message,
          latency: Date.now() - startTime,
          region: 'default',
          cached: false,
        });

        failed++;
      }
    }

    return { successful, failed, results };
  }

  /**
   * 批量删除
   */
  async deleteMany(
    namespace: string,
    keys: string[],
    options?: { type?: EdgeStorageType }
  ): Promise<IBatchOperationResult> {
    const results: IStorageOperationResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const key of keys) {
      const startTime = Date.now();

      try {
        await this.delete(namespace, key, options);
        results.push({
          success: true,
          latency: Date.now() - startTime,
          region: 'default',
          cached: false,
        });
        successful++;
      } catch (error) {
        results.push({
          success: false,
          error: (error as Error).message,
          latency: Date.now() - startTime,
          region: 'default',
          cached: false,
        });
        failed++;
      }
    }

    return { successful, failed, results };
  }

  /**
   * 列出键
   */
  async list(
    namespace: string,
    options?: {
      type?: EdgeStorageType;
      prefix?: string;
      limit?: number;
      cursor?: string;
    }
  ): Promise<{ keys: string[]; listComplete: boolean; cursor?: string }> {
    const storeId = this.getStoreId(namespace, options?.type);
    const store = this.stores.get(storeId);

    if (!store) {
      throw new Error(`Store not found: ${storeId}`);
    }

    return store.list({
      prefix: options?.prefix,
      limit: options?.limit,
      cursor: options?.cursor,
    });
  }

  /**
   * 清空存储
   */
  async clear(namespace: string, options?: { type?: EdgeStorageType }): Promise<void> {
    const storeId = this.getStoreId(namespace, options?.type);
    const store = this.stores.get(storeId);

    if (!store) {
      throw new Error(`Store not found: ${storeId}`);
    }

    // KV 存储的清空实现
    if (store instanceof EdgeKVStore) {
      const { keys } = await store.list();
      for (const key of keys) {
        await store.delete(key);
      }
    }

    // 清空指标
    this.initializeMetrics(storeId);

    await eventBus.emit(EdgeEventType.CACHE_PURGED, { storeId });
  }

  /**
   * 删除存储
   */
  async removeStore(namespace: string, type: EdgeStorageType): Promise<void> {
    const storeId = `${type}-${namespace}`;
    await this.clear(namespace, { type });
    this.stores.delete(storeId);
    this.configs.delete(storeId);
    this.metrics.delete(storeId);
  }

  /**
   * 获取存储配置
   */
  getStoreConfig(namespace: string, type?: EdgeStorageType): IEdgeStorageConfig | undefined {
    const storeId = this.getStoreId(namespace, type);
    return this.configs.get(storeId);
  }

  /**
   * 获取存储统计信息
   */
  getStoreStatistics(namespace: string, type?: EdgeStorageType): {
    totalReads: number;
    totalWrites: number;
    totalDeletes: number;
    totalOperations: number;
    averageLatency: number;
    cacheHitRate: number;
  } | undefined {
    const storeId = this.getStoreId(namespace, type);
    const metrics = this.metrics.get(storeId);

    if (!metrics) {
      return undefined;
    }

    const totalOperations = metrics.reads + metrics.writes + metrics.deletes;
    const cacheRequests = metrics.cacheHits + metrics.cacheMisses;

    return {
      totalReads: metrics.reads,
      totalWrites: metrics.writes,
      totalDeletes: metrics.deletes,
      totalOperations,
      averageLatency: totalOperations > 0
        ? metrics.totalLatency / totalOperations
        : 0,
      cacheHitRate: cacheRequests > 0
        ? metrics.cacheHits / cacheRequests
        : 0,
    };
  }

  /**
   * 获取所有存储的统计信息
   */
  getAllStatistics(): Map<string, {
    config: IEdgeStorageConfig;
    statistics: ReturnType<EdgeStorageManager['getStoreStatistics']>;
  }> {
    const allStats = new Map();

    for (const [storeId, config] of this.configs.entries()) {
      const namespace = config.namespace;
      const type = config.type;
      const statistics = this.getStoreStatistics(namespace, type);

      allStats.set(storeId, { config, statistics });
    }

    return allStats;
  }

  /**
   * 导出存储数据
   */
  async exportData(
    namespace: string,
    type?: EdgeStorageType
  ): Promise<Array<{ key: string; value: any }>> {
    const data: Array<{ key: string; value: any }> = [];
    let cursor: string | undefined;

    do {
      const result = await this.list(namespace, { type, limit: 100, cursor });
      for (const key of result.keys) {
        const value = await this.get(namespace, key, { type });
        data.push({ key, value });
      }
      cursor = result.cursor;
    } while (cursor);

    return data;
  }

  /**
   * 导入存储数据
   */
  async importData(
    namespace: string,
    data: Array<{ key: string; value: any; expirationTTL?: number }>,
    type?: EdgeStorageType
  ): Promise<IBatchOperationResult> {
    const entries = data.map(item => ({
      key: item.key,
      value: item.value,
      expirationTTL: item.expirationTTL,
    }));

    return this.putMany(namespace, entries, { type });
  }

  /**
   * 获取存储 ID
   */
  private getStoreId(namespace: string, type?: EdgeStorageType): string {
    const storageType = type || EdgeStorageType.KV;
    return `${storageType}-${namespace}`;
  }

  /**
   * 初始化指标
   */
  private initializeMetrics(storeId: string): void {
    this.metrics.set(storeId, {
      reads: 0,
      writes: 0,
      deletes: 0,
      totalLatency: 0,
      cacheHits: 0,
      cacheMisses: 0,
    });
  }

  /**
   * 更新指标
   */
  private updateMetrics(
    storeId: string,
    operation: 'read' | 'write' | 'delete',
    latency: number,
    cacheHit: boolean
  ): void {
    const metrics = this.metrics.get(storeId);

    if (!metrics) {
      return;
    }

    switch (operation) {
      case 'read':
        metrics.reads++;
        break;
      case 'write':
        metrics.writes++;
        break;
      case 'delete':
        metrics.deletes++;
        break;
    }

    metrics.totalLatency += latency;

    if (cacheHit) {
      metrics.cacheHits++;
    } else {
      metrics.cacheMisses++;
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    this.stores.clear();
    this.configs.clear();
    this.metrics.clear();
  }
}

/**
 * 边缘存储管理器单例导出
 */
export const edgeStorageManager = EdgeStorageManager.getInstance();
