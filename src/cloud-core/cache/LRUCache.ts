/**
 * LRU (Least Recently Used) 缓存实现
 */

/**
 * 缓存节点接口
 */
interface ICacheNode<K, V> {
  key: K;
  value: V;
  prev: ICacheNode<K, V> | null;
  next: ICacheNode<K, V> | null;
  expiresAt?: number;            // 过期时间戳
  accessCount: number;           // 访问计数
}

/**
 * LRU缓存选项
 */
export interface ILRUCacheOptions {
  maxSize: number;               // 最大缓存项数
  maxAge?: number;               // 默认过期时间（毫秒）
  updateAgeOnGet?: boolean;      // 获取时是否更新过期时间
  maxSizeBytes?: number;         // 最大字节大小（需要提供sizeCalculator）
  sizeCalculator?: (key: any, value: any) => number; // 计算大小的函数
}

/**
 * LRU缓存统计信息
 */
export interface ILRUCacheStats {
  size: number;                  // 当前项数
  sizeBytes: number;             // 当前字节大小
  hits: number;                  // 命中次数
  misses: number;                // 未命中次数
  hitRate: number;               // 命中率
  evictions: number;             // 驱逐次数
  expirations: number;           // 过期次数
}

/**
 * LRU缓存类
 */
export class LRUCache<K = any, V = any> {
  private maxSize: number;
  private maxAge?: number;
  private updateAgeOnGet: boolean;
  private maxSizeBytes?: number;
  private sizeCalculator?: (key: any, value: any) => number;

  private cache: Map<K, ICacheNode<K, V>>;
  private head: ICacheNode<K, V> | null;
  private tail: ICacheNode<K, V> | null;
  private currentSizeBytes: number;

  // 统计信息
  private hits: number = 0;
  private misses: number = 0;
  private evictions: number = 0;
  private expirations: number = 0;

  constructor(options: ILRUCacheOptions) {
    this.maxSize = options.maxSize;
    this.maxAge = options.maxAge;
    this.updateAgeOnGet = options.updateAgeOnGet || false;
    this.maxSizeBytes = options.maxSizeBytes;
    this.sizeCalculator = options.sizeCalculator;

    this.cache = new Map();
    this.head = null;
    this.tail = null;
    this.currentSizeBytes = 0;
  }

  /**
   * 获取缓存项
   */
  get(key: K): V | undefined {
    const node = this.cache.get(key);

    if (!node) {
      this.misses++;
      return undefined;
    }

    // 检查是否过期
    if (node.expiresAt && Date.now() > node.expiresAt) {
      this.delete(key);
      this.expirations++;
      this.misses++;
      return undefined;
    }

    // 移动到头部（最近使用）
    this.moveToHead(node);
    this.hits++;

    // 更新过期时间
    if (this.updateAgeOnGet && this.maxAge) {
      node.expiresAt = Date.now() + this.maxAge;
    }

    node.accessCount++;

    return node.value;
  }

  /**
   * 设置缓存项
   */
  set(key: K, value: V, ttl?: number): boolean {
    // 检查是否已存在
    const existingNode = this.cache.get(key);
    const existingSize = existingNode
      ? this.calculateSize(key, existingNode.value)
      : 0;

    // 计算新值的大小
    const newSize = this.calculateSize(key, value);

    // 检查是否超过单个项大小限制
    if (this.maxSizeBytes && newSize > this.maxSizeBytes) {
      return false;
    }

    // 如果已存在，更新
    if (existingNode) {
      existingNode.value = value;
      existingNode.expiresAt = ttl ? Date.now() + ttl : this.maxAge ? Date.now() + this.maxAge : undefined;
      this.moveToHead(existingNode);

      // 更新字节大小
      this.currentSizeBytes = this.currentSizeBytes - existingSize + newSize;
    } else {
      // 创建新节点
      const newNode: ICacheNode<K, V> = {
        key,
        value,
        prev: null,
        next: null,
        expiresAt: ttl ? Date.now() + ttl : this.maxAge ? Date.now() + this.maxAge : undefined,
        accessCount: 0,
      };

      this.cache.set(key, newNode);
      this.addToHead(newNode);
      this.currentSizeBytes += newSize;

      // 检查是否超过限制
      this.evictIfNeeded();
    }

    return true;
  }

  /**
   * 删除缓存项
   */
  delete(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }

    this.removeNode(node);
    this.cache.delete(key);
    this.currentSizeBytes -= this.calculateSize(key, node.value);

    return true;
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.currentSizeBytes = 0;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    this.expirations = 0;
  }

  /**
   * 检查缓存项是否存在
   */
  has(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }

    // 检查是否过期
    if (node.expiresAt && Date.now() > node.expiresAt) {
      this.delete(key);
      this.expirations++;
      return false;
    }

    return true;
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    // 清理过期项
    this.cleanExpired();
    return this.cache.size;
  }

  /**
   * 获取所有键
   */
  keys(): K[] {
    this.cleanExpired();
    return Array.from(this.cache.keys());
  }

  /**
   * 获取所有值
   */
  values(): V[] {
    this.cleanExpired();
    return Array.from(this.cache.values()).map(node => node.value);
  }

  /**
   * 获取所有条目
   */
  entries(): Array<[K, V]> {
    this.cleanExpired();
    return Array.from(this.cache.values()).map(node => [node.key, node.value]);
  }

  /**
   * 获取统计信息
   */
  getStats(): ILRUCacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      sizeBytes: this.currentSizeBytes,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      evictions: this.evictions,
      expirations: this.expirations,
    };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    this.expirations = 0;
  }

  /**
   * 获取或设置缓存项
   */
  getOrSet(key: K, factory: () => V, ttl?: number): V {
    const value = this.get(key);
    if (value !== undefined) {
      return value;
    }

    const newValue = factory();
    this.set(key, newValue, ttl);
    return newValue;
  }

  /**
   * 批量获取
   */
  getMany(keys: K[]): Map<K, V> {
    const result = new Map<K, V>();
    for (const key of keys) {
      const value = this.get(key);
      if (value !== undefined) {
        result.set(key, value);
      }
    }
    return result;
  }

  /**
   * 批量设置
   */
  setMany(entries: Array<[K, V]>, ttl?: number): void {
    for (const [key, value] of entries) {
      this.set(key, value, ttl);
    }
  }

  /**
   * 批量删除
   */
  deleteMany(keys: K[]): number {
    let count = 0;
    for (const key of keys) {
      if (this.delete(key)) {
        count++;
      }
    }
    return count;
  }

  /**
   * 查找匹配的缓存项
   */
  find(predicate: (key: K, value: V) => boolean): [K, V] | undefined {
    for (const node of this.cache.values()) {
      if (predicate(node.key, node.value)) {
        return [node.key, node.value];
      }
    }
    return undefined;
  }

  /**
   * 查找所有匹配的缓存项
   */
  findAll(predicate: (key: K, value: V) => boolean): Array<[K, V]> {
    const results: Array<[K, V]> = [];
    for (const node of this.cache.values()) {
      if (predicate(node.key, node.value)) {
        results.push([node.key, node.value]);
      }
    }
    return results;
  }

  /**
   * 清理过期项
   */
  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, node] of this.cache.entries()) {
      if (node.expiresAt && now > node.expiresAt) {
        this.delete(key);
        this.expirations++;
      }
    }
  }

  /**
   * 添加节点到头部
   */
  private addToHead(node: ICacheNode<K, V>): void {
    node.prev = null;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * 移除节点
   */
  private removeNode(node: ICacheNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  /**
   * 移动节点到头部
   */
  private moveToHead(node: ICacheNode<K, V>): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  /**
   * 驱逐最久未使用的项
   */
  private evictIfNeeded(): void {
    // 检查项数限制
    while (this.cache.size > this.maxSize) {
      if (this.tail) {
        this.delete(this.tail.key);
        this.evictions++;
      }
    }

    // 检查字节大小限制
    if (this.maxSizeBytes) {
      while (this.currentSizeBytes > this.maxSizeBytes && this.tail) {
        this.delete(this.tail.key);
        this.evictions++;
      }
    }
  }

  /**
   * 计算项的大小
   */
  private calculateSize(key: K, value: V): number {
    if (this.sizeCalculator) {
      return this.sizeCalculator(key, value);
    }
    return 1; // 默认每项大小为1
  }

  /**
   * 创建快照
   */
  snapshot(): Map<K, { value: V; expiresAt?: number; accessCount: number }> {
    const snapshot = new Map();
    for (const node of this.cache.values()) {
      snapshot.set(node.key, {
        value: node.value,
        expiresAt: node.expiresAt,
        accessCount: node.accessCount,
      });
    }
    return snapshot;
  }

  /**
   * 从快照恢复
   */
  restore(snapshot: Map<K, { value: V; expiresAt?: number }>): void {
    this.clear();
    for (const [key, data] of snapshot.entries()) {
      this.set(key, data.value, data.expiresAt ? data.expiresAt - Date.now() : undefined);
    }
  }

  /**
   * 遍历缓存项
   */
  forEach(callback: (value: V, key: K, cache: this) => void): void {
    this.cleanExpired();
    for (const node of this.cache.values()) {
      callback(node.value, node.key, this);
    }
  }

  /**
   * 获取最老的项（最近最少使用）
   */
  getOldest(): [K, V] | undefined {
    if (!this.tail) {
      return undefined;
    }
    return [this.tail.key, this.tail.value];
  }

  /**
   * 获取最新的项（最近最多使用）
   */
  getNewest(): [K, V] | undefined {
    if (!this.head) {
      return undefined;
    }
    return [this.head.key, this.head.value];
  }

  /**
   * 随机获取一个项
   */
  getRandom(): [K, V] | undefined {
    const keys = this.keys();
    if (keys.length === 0) {
      return undefined;
    }
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const value = this.get(randomKey);
    return value !== undefined ? [randomKey, value] : undefined;
  }
}
