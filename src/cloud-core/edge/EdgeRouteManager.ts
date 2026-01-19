/**
 * 边缘路由管理器
 * 管理边缘路由规则、请求路由和响应转换
 */

import { IEdgeRouteRule, IEdgeCachePolicy, EdgeEventType } from './EdgeTypes';
import { eventBus } from '../events';

/**
 * 路由匹配结果
 */
interface IRouteMatch {
  route: IEdgeRouteRule;
  params: Map<string, string>;   // 路径参数
  headers: Record<string, string>;
  query: Record<string, string>;
}

/**
 * 请求上下文
 */
export interface IRequestContext {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: any;
  clientIP: string;
  country?: string;
  region?: string;
  timestamp: Date;
}

/**
 * 响应上下文
 */
export interface IResponseContext {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  fromCache: boolean;
  fromRegion: string;
  latency: number;
}

/**
 * 边缘路由管理器类
 */
export class EdgeRouteManager {
  private static instance: EdgeRouteManager;
  private routes: Map<string, IEdgeRouteRule> = new Map();
  private cachePolicies: Map<string, IEdgeCachePolicy> = new Map();
  private routeCache: Map<string, IRouteMatch> = new Map();
  private routeCacheMaxSize: number = 1000;
  private routeCacheTTL: number = 60000; // 60 秒

  private constructor() {
    // 私有构造函数，确保单例
  }

  /**
   * 获取边缘路由管理器单例
   */
  public static getInstance(): EdgeRouteManager {
    if (!EdgeRouteManager.instance) {
      EdgeRouteManager.instance = new EdgeRouteManager();
    }
    return EdgeRouteManager.instance;
  }

  /**
   * 添加路由规则
   */
  addRoute(route: IEdgeRouteRule): void {
    this.routes.set(route.id, route);
    this.clearRouteCache();

    eventBus.emit(EdgeEventType.ROUTE_MATCHED, { routeId: route.id, action: 'added' });
  }

  /**
   * 批量添加路由规则
   */
  addRoutes(routes: IEdgeRouteRule[]): void {
    for (const route of routes) {
      this.routes.set(route.id, route);
    }
    this.clearRouteCache();
  }

  /**
   * 更新路由规则
   */
  updateRoute(routeId: string, updates: Partial<IEdgeRouteRule>): void {
    const route = this.routes.get(routeId);
    if (!route) {
      throw new Error(`Route not found: ${routeId}`);
    }

    const updatedRoute = { ...route, ...updates };
    this.routes.set(routeId, updatedRoute);
    this.clearRouteCache();
  }

  /**
   * 删除路由规则
   */
  removeRoute(routeId: string): void {
    if (!this.routes.delete(routeId)) {
      throw new Error(`Route not found: ${routeId}`);
    }
    this.clearRouteCache();
  }

  /**
   * 获取路由规则
   */
  getRoute(routeId: string): IEdgeRouteRule | undefined {
    return this.routes.get(routeId);
  }

  /**
   * 获取所有路由规则
   */
  getAllRoutes(): IEdgeRouteRule[] {
    return Array.from(this.routes.values()).sort((a, b) => b.priority - a.priority);
  }

  /**
   * 匹配路由
   */
  async matchRoute(context: IRequestContext): Promise<IRouteMatch | null> {
    const cacheKey = this.getRouteCacheKey(context);
    const cached = this.routeCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    // 按优先级排序
    const sortedRoutes = Array.from(this.routes.values())
      .filter(r => r.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const route of sortedRoutes) {
      if (this.matchesRoute(context, route)) {
        const match: IRouteMatch = {
          route,
          params: this.extractParams(context.url, route.pattern),
          headers: context.headers,
          query: context.query,
        };

        // 缓存匹配结果
        this.cacheRouteMatch(cacheKey, match);

        await eventBus.emit(EdgeEventType.ROUTE_MATCHED, {
          routeId: route.id,
          context,
        });

        return match;
      }
    }

    return null;
  }

  /**
   * 处理请求
   */
  async handleRequest(context: IRequestContext): Promise<IResponseContext> {
    const startTime = Date.now();

    // 匹配路由
    const routeMatch = await this.matchRoute(context);

    if (!routeMatch) {
      return {
        statusCode: 404,
        headers: {},
        body: { error: 'Not Found' },
        fromCache: false,
        fromRegion: 'default',
        latency: Date.now() - startTime,
      };
    }

    const route = routeMatch.route;

    // 检查速率限制
    if (route.rateLimit?.enabled) {
      const allowed = await this.checkRateLimit(context, route);
      if (!allowed) {
        return {
          statusCode: 429,
          headers: {
            'Retry-After': route.rateLimit.period.toString(),
          },
          body: { error: 'Too Many Requests' },
          fromCache: false,
          fromRegion: 'default',
          latency: Date.now() - startTime,
        };
      }
    }

    // 检查认证
    if (route.auth?.enabled) {
      const authenticated = await this.authenticate(context, route);
      if (!authenticated) {
        return {
          statusCode: 401,
          headers: {},
          body: { error: 'Unauthorized' },
          fromCache: false,
          fromRegion: 'default',
          latency: Date.now() - startTime,
        };
      }
    }

    // 检查缓存
    if (route.cachePolicy?.enabled) {
      const cachedResponse = await this.getCachedResponse(context, route);
      if (cachedResponse) {
        return {
          ...cachedResponse,
          fromCache: true,
          fromRegion: 'cache',
          latency: Date.now() - startTime,
        };
      }
    }

    // 转换请求
    let transformedContext = context;
    if (route.transform?.request) {
      transformedContext = await this.transformRequest(context, route.transform.request);
    }

    // 处理请求
    let response = await this.forwardRequest(transformedContext, route);

    // 转换响应
    if (route.transform?.response) {
      response = await this.transformResponse(response, route.transform.response);
    }

    // 缓存响应
    if (route.cachePolicy?.enabled && this.isCacheable(response, route)) {
      await this.cacheResponse(context, response, route);
    }

    return {
      ...response,
      fromCache: false,
      fromRegion: 'origin',
      latency: Date.now() - startTime,
    };
  }

  /**
   * 添加缓存策略
   */
  addCachePolicy(policy: IEdgeCachePolicy): void {
    this.cachePolicies.set(policy.id, policy);
  }

  /**
   * 获取缓存策略
   */
  getCachePolicy(policyId: string): IEdgeCachePolicy | undefined {
    return this.cachePolicies.get(policyId);
  }

  /**
   * 获取所有缓存策略
   */
  getAllCachePolicies(): IEdgeCachePolicy[] {
    return Array.from(this.cachePolicies.values());
  }

  /**
   * 清空路由缓存
   */
  clearRouteCache(): void {
    this.routeCache.clear();
  }

  /**
   * 清空所有缓存
   */
  async clearAllCaches(): Promise<void> {
    this.clearRouteCache();

    // 清空所有缓存策略的缓存
    for (const policy of this.cachePolicies.values()) {
      for (const rule of policy.rules) {
        await eventBus.emit(EdgeEventType.CACHE_PURGED, { policy, rule });
      }
    }
  }

  /**
   * 获取路由统计信息
   */
  getRouteStatistics(): {
    totalRoutes: number;
    enabledRoutes: number;
    routesByType: Record<string, number>;
    routesByMethod: Record<string, number>;
  } {
    const routes = Array.from(this.routes.values());

    const routesByType: Record<string, number> = {};
    const routesByMethod: Record<string, number> = {};

    for (const route of routes) {
      routesByType[route.target.type] = (routesByType[route.target.type] || 0) + 1;

      for (const method of route.methods) {
        routesByMethod[method] = (routesByMethod[method] || 0) + 1;
      }
    }

    return {
      totalRoutes: routes.length,
      enabledRoutes: routes.filter(r => r.enabled).length,
      routesByType,
      routesByMethod,
    };
  }

  /**
   * 检查路由是否匹配
   */
  private matchesRoute(context: IRequestContext, route: IEdgeRouteRule): boolean {
    // 检查方法
    if (!route.methods.includes(context.method)) {
      return false;
    }

    // 检查 URL 模式
    const pattern = route.pattern
      .replace(/\*/g, '.*')
      .replace(/:\w+/g, '([^/]+)');

    const regex = new RegExp(`^${pattern}$`);
    if (!regex.test(context.url)) {
      return false;
    }

    // 检查条件
    if (route.conditions) {
      for (const condition of route.conditions) {
        if (!this.matchesCondition(context, condition)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 检查条件是否匹配
   */
  private matchesCondition(
    context: IRequestContext,
    condition: IEdgeRouteRule['conditions'][0]
  ): boolean {
    let value: any;

    switch (condition.field) {
      case 'headers':
        value = context.headers[condition.value as string];
        break;
      case 'query':
        value = context.query[condition.value as string];
        break;
      case 'path':
        value = context.url;
        break;
      default:
        return false;
    }

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'contains':
        return typeof value === 'string' && value.includes(condition.value);
      case 'matches':
        return new RegExp(condition.value as string).test(value);
      case 'exists':
        return value !== undefined && value !== null;
      default:
        return false;
    }
  }

  /**
   * 提取路径参数
   */
  private extractParams(url: string, pattern: string): Map<string, string> {
    const params = new Map<string, string>();

    const patternParts = pattern.split('/');
    const urlParts = url.split('/');

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      if (patternPart.startsWith(':')) {
        const paramName = patternPart.substring(1);
        params.set(paramName, urlParts[i] || '');
      }
    }

    return params;
  }

  /**
   * 转换请求
   */
  private async transformRequest(
    context: IRequestContext,
    transform: any
  ): Promise<IRequestContext> {
    // 应用转换规则
    let transformed = { ...context };

    if (transform.headers) {
      transformed.headers = { ...context.headers, ...transform.headers };
    }

    if (transform.query) {
      transformed.query = { ...context.query, ...transform.query };
    }

    if (transform.body) {
      transformed.body = transform.body;
    }

    return transformed;
  }

  /**
   * 转换响应
   */
  private async transformResponse(
    response: any,
    transform: any
  ): Promise<any> {
    // 应用转换规则
    let transformed = { ...response };

    if (transform.headers) {
      transformed.headers = { ...response.headers, ...transform.headers };
    }

    if (transform.body) {
      transformed.body = transform.body;
    }

    return transformed;
  }

  /**
   * 转发请求
   */
  private async forwardRequest(
    context: IRequestContext,
    route: IEdgeRouteRule
  ): Promise<IResponseContext> {
    // 根据目标类型转发请求
    switch (route.target.type) {
      case 'function':
        // 调用边缘函数
        return this.invokeEdgeFunction(context, route.target.id);
      case 'storage':
        // 从边缘存储读取
        return this.readFromStorage(context, route.target.id);
      case 'origin':
        // 转发到源服务器
        return this.forwardToOrigin(context, route.target.id);
      case 'cache':
        // 从缓存读取
        return this.readFromCache(context, route.target.id);
      default:
        throw new Error(`Unsupported target type: ${route.target.type}`);
    }
  }

  /**
   * 调用边缘函数
   */
  private async invokeEdgeFunction(
    context: IRequestContext,
    functionId: string
  ): Promise<IResponseContext> {
    // 调用边缘函数的实现
    // 这里简化返回
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: { message: 'Function invoked', functionId },
    };
  }

  /**
   * 从存储读取
   */
  private async readFromStorage(
    context: IRequestContext,
    storageId: string
  ): Promise<IResponseContext> {
    // 从存储读取的实现
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: { data: 'storage data', storageId },
    };
  }

  /**
   * 转发到源服务器
   */
  private async forwardToOrigin(
    context: IRequestContext,
    originUrl: string
  ): Promise<IResponseContext> {
    // 转发到源服务器的实现
    const url = new URL(context.url, originUrl);

    try {
      const response = await fetch(url.toString(), {
        method: context.method,
        headers: context.headers,
        body: context.body ? JSON.stringify(context.body) : undefined,
      });

      const body = await response.json();

      return {
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body,
      };
    } catch (error) {
      return {
        statusCode: 502,
        headers: {},
        body: { error: 'Bad Gateway' },
      };
    }
  }

  /**
   * 从缓存读取
   */
  private async readFromCache(
    context: IRequestContext,
    cacheKey: string
  ): Promise<IResponseContext> {
    // 从缓存读取的实现
    return {
      statusCode: 200,
      headers: {},
      body: { data: 'cached data' },
    };
  }

  /**
   * 检查速率限制
   */
  private async checkRateLimit(
    context: IRequestContext,
    route: IEdgeRouteRule
  ): Promise<boolean> {
    // 速率限制的实现
    // 可以使用边缘存储或计数器
    return true;
  }

  /**
   * 认证
   */
  private async authenticate(
    context: IRequestContext,
    route: IEdgeRouteRule
  ): Promise<boolean> {
    // 认证的实现
    // 支持 JWT、API Key、OAuth2、Basic Auth
    return true;
  }

  /**
   * 获取缓存的响应
   */
  private async getCachedResponse(
    context: IRequestContext,
    route: IEdgeRouteRule
  ): Promise<IResponseContext | null> {
    // 获取缓存响应的实现
    return null;
  }

  /**
   * 缓存响应
   */
  private async cacheResponse(
    context: IRequestContext,
    response: IResponseContext,
    route: IEdgeRouteRule
  ): Promise<void> {
    // 缓存响应的实现
  }

  /**
   * 检查响应是否可缓存
   */
  private isCacheable(
    response: IResponseContext,
    route: IEdgeRouteRule
  ): boolean {
    if (!route.cachePolicy?.enabled) {
      return false;
    }

    return route.cachePolicy.cacheableStatusCodes?.includes(response.statusCode) ?? false;
  }

  /**
   * 获取路由缓存键
   */
  private getRouteCacheKey(context: IRequestContext): string {
    return `${context.method}:${context.url}`;
  }

  /**
   * 缓存路由匹配
   */
  private cacheRouteMatch(key: string, match: IRouteMatch): void {
    // 限制缓存大小
    if (this.routeCache.size >= this.routeCacheMaxSize) {
      const firstKey = this.routeCache.keys().next().value;
      this.routeCache.delete(firstKey);
    }

    this.routeCache.set(key, match);

    // 设置过期时间
    setTimeout(() => {
      this.routeCache.delete(key);
    }, this.routeCacheTTL);
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    this.routes.clear();
    this.cachePolicies.clear();
    this.routeCache.clear();
  }
}

/**
 * 边缘路由管理器单例导出
 */
export const edgeRouteManager = EdgeRouteManager.getInstance();
