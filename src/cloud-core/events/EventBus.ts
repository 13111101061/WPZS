/**
 * 事件系统
 * 提供类型安全的事件发布订阅机制
 */

/**
 * 事件类型枚举
 */
export enum CloudEventType {
  // 提供商事件
  PROVIDER_CONNECTED = 'provider_connected',
  PROVIDER_DISCONNECTED = 'provider_disconnected',
  PROVIDER_ERROR = 'provider_error',
  PROVIDER_AUTH_REFRESHED = 'provider_auth_refreshed',

  // 文件事件
  FILE_CREATED = 'file_created',
  FILE_UPDATED = 'file_updated',
  FILE_DELETED = 'file_deleted',
  FILE_MOVED = 'file_moved',
  FILE_COPIED = 'file_copied',
  FILE_RENAMED = 'file_renamed',

  // 传输事件
  UPLOAD_STARTED = 'upload_started',
  UPLOAD_PROGRESS = 'upload_progress',
  UPLOAD_COMPLETED = 'upload_completed',
  UPLOAD_FAILED = 'upload_failed',
  UPLOAD_PAUSED = 'upload_paused',
  UPLOAD_RESUMED = 'upload_resumed',
  UPLOAD_CANCELLED = 'upload_cancelled',

  DOWNLOAD_STARTED = 'download_started',
  DOWNLOAD_PROGRESS = 'download_progress',
  DOWNLOAD_COMPLETED = 'download_completed',
  DOWNLOAD_FAILED = 'download_failed',
  DOWNLOAD_PAUSED = 'download_paused',
  DOWNLOAD_RESUMED = 'download_resumed',
  DOWNLOAD_CANCELLED = 'download_cancelled',

  // 同步事件
  SYNC_STARTED = 'sync_started',
  SYNC_PROGRESS = 'sync_progress',
  SYNC_COMPLETED = 'sync_completed',
  SYNC_FAILED = 'sync_failed',
  SYNC_CONFLICT = 'sync_conflict',

  // 缓存事件
  CACHE_HIT = 'cache_hit',
  CACHE_MISS = 'cache_miss',
  CACHE_CLEARED = 'cache_cleared',

  // UI事件
  VIEW_CHANGED = 'view_changed',
  SELECTION_CHANGED = 'selection_changed',
  NAVIGATION_CHANGED = 'navigation_changed',

  // 系统事件
  SYSTEM_ERROR = 'system_error',
  SYSTEM_WARNING = 'system_warning',
  SYSTEM_INFO = 'system_info',
}

/**
 * 事件监听器类型
 */
export type EventListener<T = any> = (data: T) => void | Promise<void>;

/**
 * 事件监听器选项
 */
export interface IEventListenerOptions {
  once?: boolean;                // 只执行一次
  priority?: number;             // 优先级（数字越大优先级越高）
  filter?: (data: any) => boolean; // 数据过滤器
}

/**
 * 事件监听器包装器
 */
interface IEventListenerWrapper<T = any> {
  listener: EventListener<T>;
  options: IEventListenerOptions;
  id: string;
}

/**
 * 事件上下文接口
 */
export interface IEventContext {
  type: CloudEventType;
  timestamp: Date;
  source?: string;               // 事件源
  correlationId?: string;        // 关联ID（用于追踪相关事件）
}

/**
 * 完整的事件接口
 */
export interface ICloudEvent<T = any> {
  context: IEventContext;
  data: T;
  error?: Error;
}

/**
 * 事件总线类
 */
export class EventBus {
  private static instance: EventBus;
  private listeners: Map<CloudEventType, Map<string, IEventListenerWrapper>> = new Map();
  private eventHistory: ICloudEvent[] = [];
  private maxHistorySize: number = 1000;
  private middleware: Array<(event: ICloudEvent, next: () => void) => void> = [];

  private constructor() {
    // 私有构造函数，确保单例
  }

  /**
   * 获取事件总线单例
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * 添加中间件
   */
  public use(middleware: (event: ICloudEvent, next: () => void) => void): void {
    this.middleware.push(middleware);
  }

  /**
   * 订阅事件
   */
  public on<T = any>(
    type: CloudEventType,
    listener: EventListener<T>,
    options: IEventListenerOptions = {}
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Map());
    }

    const id = this.generateListenerId();
    const typeListeners = this.listeners.get(type)!;

    typeListeners.set(id, { listener, options, id });

    // 返回取消订阅函数
    return () => this.off(type, id);
  }

  /**
   * 订阅一次性事件
   */
  public once<T = any>(type: CloudEventType, listener: EventListener<T>): () => void {
    return this.on(type, listener, { once: true });
  }

  /**
   * 取消订阅事件
   */
  public off(type: CloudEventType, listenerId: string): void {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.delete(listenerId);
      if (typeListeners.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  /**
   * 取消某个类型的所有订阅
   */
  public offAll(type: CloudEventType): void {
    this.listeners.delete(type);
  }

  /**
   * 发布事件
   */
  public async emit<T = any>(
    type: CloudEventType,
    data: T,
    source?: string,
    correlationId?: string
  ): Promise<void> {
    const event: ICloudEvent<T> = {
      context: {
        type,
        timestamp: new Date(),
        source,
        correlationId,
      },
      data,
    };

    // 添加到历史记录
    this.addToHistory(event);

    // 执行中间件
    let middlewareIndex = 0;
    const executeMiddleware = () => {
      if (middlewareIndex < this.middleware.length) {
        const middleware = this.middleware[middlewareIndex++];
        middleware(event, executeMiddleware);
      } else {
        // 所有中间件执行完毕，执行监听器
        this.executeListeners(event);
      }
    };

    executeMiddleware();
  }

  /**
   * 执行事件监听器
   */
  private async executeListeners<T = any>(event: ICloudEvent<T>): Promise<void> {
    const typeListeners = this.listeners.get(event.context.type);
    if (!typeListeners || typeListeners.size === 0) {
      return;
    }

    // 按优先级排序
    const sortedListeners = Array.from(typeListeners.values()).sort(
      (a, b) => (b.options.priority || 0) - (a.options.priority || 0)
    );

    for (const wrapper of sortedListeners) {
      try {
        // 检查过滤器
        if (wrapper.options.filter && !wrapper.options.filter(event.data)) {
          continue;
        }

        // 执行监听器
        await wrapper.listener(event.data);

        // 如果是一次性监听器，移除它
        if (wrapper.options.once) {
          typeListeners.delete(wrapper.id);
        }
      } catch (error) {
        console.error(`Error in event listener for ${event.context.type}:`, error);
        // 可以选择发布一个错误事件
        await this.emit(CloudEventType.SYSTEM_ERROR, error, 'EventBus');
      }
    }
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(event: ICloudEvent): void {
    this.eventHistory.push(event);

    // 限制历史记录大小
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * 获取事件历史记录
   */
  public getHistory(type?: CloudEventType, limit?: number): ICloudEvent[] {
    let history = this.eventHistory;

    if (type) {
      history = history.filter(event => event.context.type === type);
    }

    if (limit) {
      history = history.slice(-limit);
    }

    return history;
  }

  /**
   * 清空事件历史记录
   */
  public clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * 清空所有监听器
   */
  public clear(): void {
    this.listeners.clear();
  }

  /**
   * 获取监听器数量
   */
  public getListenerCount(type?: CloudEventType): number {
    if (type) {
      return this.listeners.get(type)?.size || 0;
    }

    let total = 0;
    for (const listeners of this.listeners.values()) {
      total += listeners.size;
    }
    return total;
  }

  /**
   * 获取统计信息
   */
  public getStatistics(): {
    totalListeners: number;
    listenersByType: Record<string, number>;
    historySize: number;
    middlewareCount: number;
  } {
    const listenersByType: Record<string, number> = {};

    for (const [type, listeners] of this.listeners.entries()) {
      listenersByType[type] = listeners.size;
    }

    return {
      totalListeners: this.getListenerCount(),
      listenersByType,
      historySize: this.eventHistory.length,
      middlewareCount: this.middleware.length,
    };
  }

  /**
   * 生成监听器ID
   */
  private generateListenerId(): string {
    return `listener-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 等待事件
   */
  public waitFor<T = any>(
    type: CloudEventType,
    filter?: (data: T) => boolean,
    timeout: number = 30000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        reject(new Error(`Timeout waiting for event: ${type}`));
      }, timeout);

      const unsubscribe = this.once<T>(type, (data) => {
        clearTimeout(timeoutId);
        if (!filter || filter(data)) {
          resolve(data);
        } else {
          // 如果过滤器不匹配，继续等待
          this.waitFor(type, filter, timeout - 100).then(resolve).catch(reject);
        }
      });
    });
  }

  /**
   * 批量等待事件
   */
  public waitForMany<T = any>(
    types: CloudEventType[],
    timeout: number = 30000
  ): Promise<Map<CloudEventType, T>> {
    return new Promise((resolve, reject) => {
      const results = new Map<CloudEventType, T>();
      const remaining = new Set(types);

      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Timeout waiting for events'));
      }, timeout);

      const unsubscribers = types.map(type =>
        this.once<T>(type, (data) => {
          results.set(type, data);
          remaining.delete(type);

          if (remaining.size === 0) {
            cleanup();
            resolve(results);
          }
        })
      );

      const cleanup = () => {
        clearTimeout(timeoutId);
        unsubscribers.forEach(unsub => unsub());
      };
    });
  }

  /**
   * 创建事件通道
   */
  public createChannel<T = any>(...types: CloudEventType[]): {
    subscribe: (callback: (type: CloudEventType, data: T) => void) => () => void;
    publish: (type: CloudEventType, data: T) => Promise<void>;
  } {
    const subscriptions = new Set<(type: CloudEventType, data: T) => void>();

    const unsubscribers = types.map(type =>
      this.on<T>(type, (data) => {
        subscriptions.forEach(callback => callback(type, data));
      })
    );

    return {
      subscribe: (callback) => {
        subscriptions.add(callback);
        return () => {
          subscriptions.delete(callback);
        };
      },
      publish: async (type, data) => {
        if (!types.includes(type)) {
          throw new Error(`Event type ${type} is not in this channel`);
        }
        await this.emit(type, data);
      },
    };
  }
}

/**
 * 事件总线单例导出
 */
export const eventBus = EventBus.getInstance();

/**
 * 便捷的订阅函数
 */
export function on<T = any>(
  type: CloudEventType,
  listener: EventListener<T>,
  options?: IEventListenerOptions
): () => void {
  return eventBus.on(type, listener, options);
}

/**
 * 便捷的一次性订阅函数
 */
export function once<T = any>(type: CloudEventType, listener: EventListener<T>): () => void {
  return eventBus.once(type, listener);
}

/**
 * 便捷的发布函数
 */
export function emit<T = any>(
  type: CloudEventType,
  data: T,
  source?: string
): Promise<void> {
  return eventBus.emit(type, data, source);
}

/**
 * 便捷的等待函数
 */
export function waitFor<T = any>(
  type: CloudEventType,
  filter?: (data: T) => boolean,
  timeout?: number
): Promise<T> {
  return eventBus.waitFor(type, filter, timeout);
}
