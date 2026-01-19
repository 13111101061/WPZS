/**
 * 缓存管理器
 * 管理元数据、缩略图和内容的缓存
 */

import { LRUCache, ILRUCacheOptions } from './LRUCache';
import { IFileItem } from '../providers/base/IFileItem';
import { eventBus, CloudEventType } from '../events';

/**
 * 缓存类型枚举
 */
export enum CacheType {
  METADATA = 'metadata',         // 元数据缓存
  THUMBNAIL = 'thumbnail',       // 缩略图缓存
  CONTENT = 'content',           // 内容缓存
  LISTING = 'listing',           // 列表缓存
  SEARCH = 'search',             // 搜索结果缓存
}

/**
 * 缓存配置接口
 */
export interface ICacheConfig {
  enabled: boolean;
  metadata?: {
    maxSize: number;
    maxAge: number;
    maxSizeBytes?: number;
  };
  thumbnail?: {
    maxSize: number;
    maxAge: number;
    maxSizeBytes?: number;
  };
  content?: {
    maxSize: number;
    maxAge: number;
    maxSizeBytes?: number;
  };
  listing?: {
    maxSize: number;
    maxAge: number;
  };
  search?: {
    maxSize: number;
    maxAge: number;
  };
  storagePath?: string;          // IndexedDB数据库名称
}

/**
 * 缓存条目元数据
 */
interface ICacheEntryMetadata {
  key: string;
  type: CacheType;
  size: number;
  createdAt: number;
  accessedAt: number;
  expiresAt: number;
  accessCount: number;
}

/**
 * IndexedDB存储接口
 */
interface IIndexedDBStorage {
  get(key: string): Promise<any>;
  set(key: string, value: any, metadata: ICacheEntryMetadata): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
  getSize(): Promise<number>;
}

/**
 * IndexedDB存储实现
 */
class IndexedDBStorage implements IIndexedDBStorage {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null;

  constructor(dbName: string = 'cloud-cache', storeName: string = 'cache') {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  private async open(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName);
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
    });
  }

  async get(key: string): Promise<any> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.value);
    });
  }

  async set(key: string, value: any, metadata: ICacheEntryMetadata): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ key, value, metadata });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAllKeys(): Promise<string[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }

  async getSize(): Promise<number> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const countRequest = store.count();

      countRequest.onerror = () => reject(countRequest.error);
      countRequest.onsuccess = () => resolve(countRequest.result);
    });
  }
}

/**
 * 缓存管理器类
 */
export class CacheManager {
  private static instance: CacheManager;
  private config: ICacheConfig;
  private caches: Map<CacheType, LRUCache<string, any>> = new Map();
  private storage?: IIndexedDBStorage;
  private persistentTypes: Set<CacheType> = new Set();

  private constructor(config: ICacheConfig = { enabled: true }) {
    this.config = config;

    if (this.config.enabled) {
      this.initializeCaches();

      // 初始化持久化存储
      if (this.config.storagePath) {
        this.storage = new IndexedDBStorage(this.config.storagePath);
        this.persistentTypes.add(CacheType.THUMBNAIL);
        this.persistentTypes.add(CacheType.CONTENT);
      }
    }
  }

  /**
   * 获取缓存管理器单例
   */
  public static getInstance(config?: ICacheConfig): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(config);
    }
    return CacheManager.instance;
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<ICacheConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.enabled && this.caches.size === 0) {
      this.initializeCaches();
    } else if (!this.config.enabled) {
      this.clearAll();
    }
  }

  /**
   * 初始化所有缓存
   */
  private initializeCaches(): void {
    // 元数据缓存
    if (this.config.metadata) {
      this.caches.set(
        CacheType.METADATA,
        new LRUCache<string, IFileItem>({
          maxSize: this.config.metadata.maxSize,
          maxAge: this.config.metadata.maxAge,
          maxSizeBytes: this.config.metadata.maxSizeBytes,
          sizeCalculator: (key, value) => {
            return JSON.stringify(value).length * 2; // 粗略估算UTF-16编码的字节大小
          },
        })
      );
    }

    // 缩略图缓存
    if (this.config.thumbnail) {
      this.caches.set(
        CacheType.THUMBNAIL,
        new LRUCache<string, string>({
          maxSize: this.config.thumbnail.maxSize,
          maxAge: this.config.thumbnail.maxAge,
          maxSizeBytes: this.config.thumbnail.maxSizeBytes,
          sizeCalculator: (key, value) => {
            // 假设value是base64编码的图片
            return value.length * 0.75; // base64编码大约是原始大小的4/3
          },
        })
      );
    }

    // 内容缓存
    if (this.config.content) {
      this.caches.set(
        CacheType.CONTENT,
        new LRUCache<string, Blob>({
          maxSize: this.config.content.maxSize,
          maxAge: this.config.content.maxAge,
          maxSizeBytes: this.config.content.maxSizeBytes,
          sizeCalculator: (key, value) => {
            return value.size;
          },
        })
      );
    }

    // 列表缓存
    if (this.config.listing) {
      this.caches.set(
        CacheType.LISTING,
        new LRUCache<string, IFileItem[]>({
          maxSize: this.config.listing.maxSize,
          maxAge: this.config.listing.maxAge,
        })
      );
    }

    // 搜索缓存
    if (this.config.search) {
      this.caches.set(
        CacheType.SEARCH,
        new LRUCache<string, any>({
          maxSize: this.config.search.maxSize,
          maxAge: this.config.search.maxAge,
        })
      );
    }
  }

  /**
   * 获取缓存项
   */
  async get<T = any>(type: CacheType, key: string): Promise<T | undefined> {
    if (!this.config.enabled) {
      return undefined;
    }

    const cache = this.caches.get(type);
    if (!cache) {
      return undefined;
    }

    let value = cache.get(key);

    // 如果内存缓存未命中，尝试从持久化存储加载
    if (value === undefined && this.storage && this.persistentTypes.has(type)) {
      try {
        value = await this.storage.get(key);
        if (value !== undefined) {
          cache.set(key, value);
        }
      } catch (error) {
        console.error('Error loading from persistent storage:', error);
      }
    }

    if (value !== undefined) {
      eventBus.emit(CloudEventType.CACHE_HIT, { type, key });
    } else {
      eventBus.emit(CloudEventType.CACHE_MISS, { type, key });
    }

    return value;
  }

  /**
   * 设置缓存项
   */
  async set(type: CacheType, key: string, value: any, ttl?: number): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const cache = this.caches.get(type);
    if (!cache) {
      return;
    }

    cache.set(key, value, ttl);

    // 如果是持久化类型，同时保存到IndexedDB
    if (this.storage && this.persistentTypes.has(type)) {
      try {
        await this.storage.set(key, value, {
          key,
          type,
          size: this.calculateSize(value),
          createdAt: Date.now(),
          accessedAt: Date.now(),
          expiresAt: ttl ? Date.now() + ttl : Date.now() + (this.getMaxAge(type) || 0),
          accessCount: 0,
        });
      } catch (error) {
        console.error('Error saving to persistent storage:', error);
      }
    }
  }

  /**
   * 删除缓存项
   */
  async delete(type: CacheType, key: string): Promise<void> {
    const cache = this.caches.get(type);
    if (cache) {
      cache.delete(key);
    }

    if (this.storage && this.persistentTypes.has(type)) {
      try {
        await this.storage.delete(key);
      } catch (error) {
        console.error('Error deleting from persistent storage:', error);
      }
    }
  }

  /**
   * 清空特定类型的缓存
   */
  async clearType(type: CacheType): Promise<void> {
    const cache = this.caches.get(type);
    if (cache) {
      cache.clear();
    }

    if (this.storage && this.persistentTypes.has(type)) {
      try {
        await this.storage.clear();
      } catch (error) {
        console.error('Error clearing persistent storage:', error);
      }
    }

    eventBus.emit(CloudEventType.CACHE_CLEARED, { type });
  }

  /**
   * 清空所有缓存
   */
  async clearAll(): Promise<void> {
    for (const type of this.caches.keys()) {
      await this.clearType(type);
    }
  }

  /**
   * 检查缓存项是否存在
   */
  has(type: CacheType, key: string): boolean {
    const cache = this.caches.get(type);
    return cache ? cache.has(key) : false;
  }

  /**
   * 获取或设置缓存项
   */
  async getOrSet<T = any>(
    type: CacheType,
    key: string,
    factory: () => Promise<T> | T,
    ttl?: number
  ): Promise<T> {
    const value = await this.get<T>(type, key);
    if (value !== undefined) {
      return value;
    }

    const newValue = await factory();
    await this.set(type, key, newValue, ttl);
    return newValue;
  }

  /**
   * 批量获取
   */
  async getMany<T = any>(type: CacheType, keys: string[]): Promise<Map<string, T>> {
    const cache = this.caches.get(type);
    if (!cache) {
      return new Map();
    }

    return cache.getMany(keys);
  }

  /**
   * 批量设置
   */
  async setMany(type: CacheType, entries: Array<[string, any]>, ttl?: number): Promise<void> {
    const cache = this.caches.get(type);
    if (!cache) {
      return;
    }

    cache.setMany(entries, ttl);

    // 持久化
    if (this.storage && this.persistentTypes.has(type)) {
      for (const [key, value] of entries) {
        try {
          await this.storage.set(key, value, {
            key,
            type,
            size: this.calculateSize(value),
            createdAt: Date.now(),
            accessedAt: Date.now(),
            expiresAt: ttl ? Date.now() + ttl : Date.now() + (this.getMaxAge(type) || 0),
            accessCount: 0,
          });
        } catch (error) {
          console.error('Error saving to persistent storage:', error);
        }
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    global: {
      enabled: boolean;
      totalSize: number;
      persistentStorage: boolean;
    };
    byType: Record<
      CacheType,
      {
        size: number;
        hits: number;
        misses: number;
        hitRate: number;
      } | undefined
    >;
  } {
    const byType: Record<string, any> = {};

    for (const [type, cache] of this.caches.entries()) {
      const stats = cache.getStats();
      byType[type] = {
        size: stats.size,
        hits: stats.hits,
        misses: stats.misses,
        hitRate: stats.hitRate,
      };
    }

    return {
      global: {
        enabled: this.config.enabled,
        totalSize: Array.from(this.caches.values()).reduce((sum, cache) => sum + cache.size(), 0),
        persistentStorage: !!this.storage,
      },
      byType,
    };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    for (const cache of this.caches.values()) {
      cache.resetStats();
    }
  }

  /**
   * 预热缓存
   */
  async warmup(
    type: CacheType,
    entries: Array<[string, any]>,
    ttl?: number
  ): Promise<void> {
    await this.setMany(type, entries, ttl);
  }

  /**
   * 使缓存失效
   */
  async invalidate(
    type: CacheType,
    predicate?: (key: string, value: any) => boolean
  ): Promise<void> {
    const cache = this.caches.get(type);
    if (!cache) {
      return;
    }

    if (predicate) {
      const keysToDelete: string[] = [];
      cache.forEach((value, key) => {
        if (predicate(key, value)) {
          keysToDelete.push(key);
        }
      });
      cache.deleteMany(keysToDelete);

      if (this.storage && this.persistentTypes.has(type)) {
        for (const key of keysToDelete) {
          await this.storage.delete(key);
        }
      }
    } else {
      await this.clearType(type);
    }
  }

  /**
   * 获取缓存大小
   */
  getSize(type?: CacheType): number {
    if (type) {
      const cache = this.caches.get(type);
      return cache ? cache.size() : 0;
    }

    return Array.from(this.caches.values()).reduce((sum, cache) => sum + cache.size(), 0);
  }

  /**
   * 获取最大过期时间
   */
  private getMaxAge(type: CacheType): number | undefined {
    switch (type) {
      case CacheType.METADATA:
        return this.config.metadata?.maxAge;
      case CacheType.THUMBNAIL:
        return this.config.thumbnail?.maxAge;
      case CacheType.CONTENT:
        return this.config.content?.maxAge;
      case CacheType.LISTING:
        return this.config.listing?.maxAge;
      case CacheType.SEARCH:
        return this.config.search?.maxAge;
    }
  }

  /**
   * 计算值的大小
   */
  private calculateSize(value: any): number {
    if (value instanceof Blob) {
      return value.size;
    }
    if (typeof value === 'string') {
      return value.length * 2; // UTF-16
    }
    if (typeof value === 'object') {
      return JSON.stringify(value).length * 2;
    }
    return 0;
  }

  /**
   * 导出缓存数据
   */
  async exportData(type: CacheType): Promise<Array<[string, any]>> {
    const cache = this.caches.get(type);
    if (!cache) {
      return [];
    }

    return cache.entries();
  }

  /**
   * 导入缓存数据
   */
  async importData(type: CacheType, entries: Array<[string, any]>, ttl?: number): Promise<void> {
    await this.setMany(type, entries, ttl);
  }
}

/**
 * 缓存管理器单例导出
 */
export const cacheManager = CacheManager.getInstance();
