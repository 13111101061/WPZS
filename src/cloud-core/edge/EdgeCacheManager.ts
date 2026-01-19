/**
 * 增强的边缘缓存管理器
 * 支持多层缓存、智能预加载、缓存预热等功能
 */

import { IEdgeCachePolicy, EdgeEventType } from './EdgeTypes';
import { eventBus } from '../events';
import { LRUCache } from '../cache/LRUCache';

/**
 * 缓存层级
 */
enum CacheLevel {
  MEMORY = 'memory',             // 内存缓存（最快）
  EDGE = 'edge',                 // 边缘缓存
  ORIGIN = 'origin',             // 源服务器缓存
}

/**
 * 缓存条目
 */
interface ICacheEntry {
  key: string;
  value: any;
  metadata: {
    contentType: string;
    size: number;
    checksum?: string;
    compressed: boolean;
    etag?: string;
    lastModified?: Date;
    tags?: string[];
  };
  timing: {
    createdAt: Date;
    expiresAt: Date;
    lastAccessedAt: Date;
    accessCount: number;
  };
  source: CacheLevel;
  stale?: boolean;               // 是否已过期但可使用
  mustRevalidate: boolean;       // 是否必须重新验证
}

/**
 * 缓存预热任务
 */
interface ICacheWarmupTask {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * 缓存预取配置
 */
interface ICachePrefetchConfig {
  enabled: boolean;
  patterns: string[];            // URL 模式
  threshold: number;             // 访问次数阈值
  window: number;                // 时间窗口（秒）
  prefetchCount: number;         // 预取数量
}

/**
 * 边缘缓存管理器类
 */
export class EdgeCacheManager {
  private static instance: EdgeCacheManager;
  private memoryCache: LRUCache<string, ICacheEntry>;
  private policies: Map<string, IEdgeCachePolicy> = new Map();
  private warmupTasks: Map<string, ICacheWarmupTask> = new Map();
  private prefetchConfig: ICachePrefetchConfig;
  private accessHistory: Map<string, Date[]> = new Map();
  private compressionEnabled: boolean = true;
  private compressionThreshold: number = 1024; // 1KB

  private constructor() {
    // 初始化内存缓存
    this.memoryCache = new LRUCache<string, ICacheEntry>({
      maxSize: 10000,
      maxAge: 3600000, // 1 小时
      maxSizeBytes: 100 * 1024 * 1024, // 100MB
      sizeCalculator: (key, value) => {
        return key.length + JSON.stringify(value).length;
      },
    });

    // 默认预取配置
    this.prefetchConfig = {
      enabled: true,
      patterns: ['*'],
      threshold: 3,
      window: 300, // 5 分钟
      prefetchCount: 5,
    };
  }

  /**
   * 获取边缘缓存管理器单例
   */
  public static getInstance(): EdgeCacheManager {
    if (!EdgeCacheManager.instance) {
      EdgeCacheManager.instance = new EdgeCacheManager();
    }
    return EdgeCacheManager.instance;
  }

  /**
   * 获取缓存
   */
  async get(
    key: string,
    options?: {
      level?: CacheLevel;
      staleWhileRevalidate?: boolean;
      mustRevalidate?: boolean;
    }
  ): Promise<{ value: any; hit: boolean; level: CacheLevel } | null> {
    // 尝试从内存缓存获取
    const memoryEntry = this.memoryCache.get(key);

    if (memoryEntry) {
      // 检查是否过期
      if (memoryEntry.timing.expiresAt > new Date()) {
        this.recordAccess(key);
        await eventBus.emit(EdgeEventType.CACHE_HIT, { key, level: CacheLevel.MEMORY });
        return { value: memoryEntry.value, hit: true, level: CacheLevel.MEMORY };
      }

      // 检查是否可以使用过期数据
      if (options?.staleWhileRevalidate && !memoryEntry.mustRevalidate) {
        memoryEntry.stale = true;
        this.recordAccess(key);
        await eventBus.emit(EdgeEventType.CACHE_HIT, { key, level: CacheLevel.MEMORY, stale: true });

        // 异步刷新
        this.refreshCache(key, memoryEntry);

        return { value: memoryEntry.value, hit: true, level: CacheLevel.MEMORY };
      }
    }

    await eventBus.emit(EdgeEventType.CACHE_MISS, { key });

    return null;
  }

  /**
   * 设置缓存
   */
  async set(
    key: string,
    value: any,
    options?: {
      ttl?: number;                  // 过期时间（秒）
      policy?: string;               // 缓存策略 ID
      metadata?: Partial<ICacheEntry['metadata']>;
      compress?: boolean;            // 是否压缩
      tags?: string[];               // 标签
    }
  ): Promise<void> {
    const policy = options?.policy ? this.policies.get(options.policy) : undefined;

    // 确定 TTL
    let ttl = options?.ttl || 3600; // 默认 1 小时
    if (policy) {
      const matchingRule = this.findMatchingPolicyRule(key, policy);
      if (matchingRule) {
        ttl = matchingRule.ttl;
      }
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    // 检查是否需要压缩
    const shouldCompress = options?.compress ?? this.shouldCompress(value);

    const entry: ICacheEntry = {
      key,
      value: shouldCompress ? await this.compress(value) : value,
      metadata: {
        contentType: 'application/json',
        size: JSON.stringify(value).length,
        compressed: shouldCompress,
        tags: options?.tags,
        ...options?.metadata,
      },
      timing: {
        createdAt: now,
        expiresAt,
        lastAccessedAt: now,
        accessCount: 0,
      },
      source: CacheLevel.MEMORY,
      mustRevalidate: false,
    };

    this.memoryCache.set(key, entry, ttl * 1000);

    // 记录访问（用于预取）
    this.recordAccess(key);

    // 检查是否需要预取
    if (this.prefetchConfig.enabled) {
      this.checkPrefetch(key);
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<boolean> {
    return this.memoryCache.delete(key);
  }

  /**
   * 批量删除缓存
   */
  async deleteMany(keys: string[]): Promise<number> {
    return this.memoryCache.deleteMany(keys);
  }

  /**
   * 按标签删除缓存
   */
  async deleteByTag(tag: string): Promise<number> {
    const keysToDelete: string[] = [];

    this.memoryCache.forEach((entry, key) => {
      if (entry.metadata.tags?.includes(tag)) {
        keysToDelete.push(key);
      }
    });

    return this.deleteMany(keysToDelete);
  }

  /**
   * 按模式删除缓存
   */
  async deleteByPattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    this.memoryCache.forEach((entry, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    return this.deleteMany(keysToDelete);
  }

  /**
   * 清空所有缓存
   */
  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    this.accessHistory.clear();
    await eventBus.emit(EdgeEventType.CACHE_PURGED, { all: true });
  }

  /**
   * 添加缓存策略
   */
  addCachePolicy(policy: IEdgeCachePolicy): void {
    this.policies.set(policy.id, policy);
  }

  /**
   * 移除缓存策略
   */
  removeCachePolicy(policyId: string): void {
    this.policies.delete(policyId);
  }

  /**
   * 获取缓存策略
   */
  getCachePolicy(policyId: string): IEdgeCachePolicy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * 预热缓存
   */
  async warmupCache(
    urls: Array<{ url: string; method?: string; headers?: Record<string, string> }>,
    options?: {
      priority?: number;
      parallel?: number;
    }
  ): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    const parallel = options?.parallel || 5;

    for (let i = 0; i < urls.length; i += parallel) {
      const batch = urls.slice(i, i + parallel);

      await Promise.all(
        batch.map(async (item) => {
          const task: ICacheWarmupTask = {
            id: `warmup-${Date.now()}-${Math.random()}`,
            url: item.url,
            method: item.method || 'GET',
            headers: item.headers || {},
            priority: options?.priority || 0,
            status: 'pending',
            scheduledAt: new Date(),
          };

          this.warmupTasks.set(task.id, task);

          try {
            task.status = 'running';
            task.startedAt = new Date();

            // 执行预热请求
            await this.fetchAndCache(item.url, {
              method: item.method,
              headers: item.headers,
            });

            task.status = 'completed';
            task.completedAt = new Date();
            results.set(item.url, true);
          } catch (error) {
            task.status = 'failed';
            task.completedAt = new Date();
            task.error = (error as Error).message;
            results.set(item.url, false);
          }
        })
      );
    }

    return results;
  }

  /**
   * 配置预取
   */
  configurePrefetch(config: Partial<ICachePrefetchConfig>): void {
    this.prefetchConfig = { ...this.prefetchConfig, ...config };
  }

  /**
   * 获取缓存统计信息
   */
  getStatistics(): {
    memory: {
      size: number;
      maxSize: number;
      sizeBytes: number;
      maxSizeBytes: number;
      hitRate: number;
      hits: number;
      misses: number;
    };
    policies: number;
    warmupTasks: {
      total: number;
      pending: number;
      running: number;
      completed: number;
      failed: number;
    };
    prefetch: ICachePrefetchConfig;
  } {
    const memoryStats = this.memoryCache.getStats();
    const total = memoryStats.hits + memoryStats.misses;

    const warmupTasks = Array.from(this.warmupTasks.values());

    return {
      memory: {
        size: memoryStats.size,
        maxSize: this.memoryCache['maxSize'],
        sizeBytes: memoryStats.sizeBytes,
        maxSizeBytes: this.memoryCache['maxSizeBytes'] || 0,
        hitRate: total > 0 ? memoryStats.hits / total : 0,
        hits: memoryStats.hits,
        misses: memoryStats.misses,
      },
      policies: this.policies.size,
      warmupTasks: {
        total: warmupTasks.length,
        pending: warmupTasks.filter(t => t.status === 'pending').length,
        running: warmupTasks.filter(t => t.status === 'running').length,
        completed: warmupTasks.filter(t => t.status === 'completed').length,
        failed: warmupTasks.filter(t => t.status === 'failed').length,
      },
      prefetch: this.prefetchConfig,
    };
  }

  /**
   * 获取热点数据
   */
  getHotData(limit?: number): Array<{ key: string; accessCount: number; lastAccessed: Date }> {
    const hotData: Array<{ key: string; accessCount: number; lastAccessed: Date }> = [];

    this.memoryCache.forEach((entry) => {
      hotData.push({
        key: entry.key,
        accessCount: entry.timing.accessCount,
        lastAccessed: entry.timing.lastAccessedAt,
      });
    });

    // 按访问次数和最近访问时间排序
    hotData.sort((a, b) => {
      if (a.accessCount !== b.accessCount) {
        return b.accessCount - a.accessCount;
      }
      return b.lastAccessed.getTime() - a.lastAccessed.getTime();
    });

    return limit ? hotData.slice(0, limit) : hotData;
  }

  /**
   * 获取冷数据（可清理）
   */
  getColdData(limit?: number): Array<{ key: string; accessCount: number; lastAccessed: Date; size: number }> {
    const coldData: Array<{ key: string; accessCount: number; lastAccessed: Date; size: number }> = [];

    this.memoryCache.forEach((entry) => {
      coldData.push({
        key: entry.key,
        accessCount: entry.timing.accessCount,
        lastAccessed: entry.timing.lastAccessedAt,
        size: entry.metadata.size,
      });
    });

    // 按访问次数和最近访问时间排序（升序）
    coldData.sort((a, b) => {
      if (a.accessCount !== b.accessCount) {
        return a.accessCount - b.accessCount;
      }
      return a.lastAccessed.getTime() - b.lastAccessed.getTime();
    });

    return limit ? coldData.slice(0, limit) : coldData;
  }

  /**
   * 压缩数据
   */
  private async compress(data: any): Promise<any> {
    // 简化实现，实际应该使用压缩算法
    return data;
  }

  /**
   * 解压数据
   */
  private async decompress(data: any): Promise<any> {
    // 简化实现
    return data;
  }

  /**
   * 判断是否应该压缩
   */
  private shouldCompress(value: any): boolean {
    if (!this.compressionEnabled) {
      return false;
    }

    const size = JSON.stringify(value).length;
    return size >= this.compressionThreshold;
  }

  /**
   * 查找匹配的策略规则
   */
  private findMatchingPolicyRule(key: string, policyId: string): IEdgeCachePolicy['rules'][0] | undefined {
    const policy = this.policies.get(policyId);
    if (!policy) {
      return undefined;
    }

    for (const rule of policy.rules) {
      const pattern = new RegExp(rule.urlPattern);
      if (pattern.test(key)) {
        return rule;
      }
    }

    return undefined;
  }

  /**
   * 记录访问
   */
  private recordAccess(key: string): void {
    const now = new Date();
    let history = this.accessHistory.get(key) || [];

    // 添加当前访问时间
    history.push(now);

    // 移除超出时间窗口的记录
    const cutoff = new Date(now.getTime() - this.prefetchConfig.window * 1000);
    history = history.filter(time => time > cutoff);

    this.accessHistory.set(key, history);
  }

  /**
   * 检查是否需要预取
   */
  private checkPrefetch(key: string): void {
    const history = this.accessHistory.get(key);
    if (!history) {
      return;
    }

    // 检查访问次数是否达到阈值
    if (history.length >= this.prefetchConfig.threshold) {
      // 触发预取
      this.triggerPrefetch(key);
    }
  }

  /**
   * 触发预取
   */
  private async triggerPrefetch(key: string): Promise<void> {
    // 解析相关 URL
    const relatedUrls = this.generateRelatedUrls(key);

    // 预取相关 URL
    for (const url of relatedUrls.slice(0, this.prefetchConfig.prefetchCount)) {
      try {
        await this.fetchAndCache(url);
      } catch (error) {
        console.error(`Prefetch failed for ${url}:`, error);
      }
    }
  }

  /**
   * 生成相关 URL
   */
  private generateRelatedUrls(key: string): string[] {
    // 简化实现，根据 key 生成相关 URL
    // 实际应该根据 URL 结构和访问模式生成
    return [];
  }

  /**
   * 获取并缓存
   */
  private async fetchAndCache(
    url: string,
    options?: { method?: string; headers?: Record<string, string> }
  ): Promise<void> {
    const response = await fetch(url, {
      method: options?.method || 'GET',
      headers: options?.headers,
    });

    if (response.ok) {
      const data = await response.json();
      await this.set(url, data, {
        metadata: {
          contentType: response.headers.get('content-type') || 'application/json',
          etag: response.headers.get('etag') || undefined,
          lastModified: response.headers.get('last-modified')
            ? new Date(response.headers.get('last-modified')!)
            : undefined,
        },
      });
    }
  }

  /**
   * 刷新缓存
   */
  private async refreshCache(key: string, entry: ICacheEntry): Promise<void> {
    try {
      // 异步刷新缓存
      this.fetchAndCache(key).catch(console.error);
    } catch (error) {
      console.error(`Cache refresh failed for ${key}:`, error);
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    this.memoryCache.clear();
    this.policies.clear();
    this.warmupTasks.clear();
    this.accessHistory.clear();
  }
}

/**
 * 边缘缓存管理器单例导出
 */
export const edgeCacheManager = EdgeCacheManager.getInstance();
