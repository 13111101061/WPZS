/**
 * 统一的边缘计算管理器
 * 整合边缘函数、边缘存储、边缘路由和边缘缓存
 */

import { EdgeFunctionManager, edgeFunctionManager } from './EdgeFunctionManager';
import { EdgeStorageManager, edgeStorageManager } from './EdgeStorageManager';
import { EdgeRouteManager, edgeRouteManager } from './EdgeRouteManager';
import { EdgeCacheManager, edgeCacheManager } from './EdgeCacheManager';
import {
  IEdgeFunctionConfig,
  IEdgeStorageConfig,
  IEdgeRouteRule,
  IEdgeCachePolicy,
  IEdgeDeploymentConfig,
  IEdgeStatistics,
  IEdgeLocation,
  EdgeNodeStatus,
  EdgeEventType,
} from './base/EdgeTypes';
import { eventBus } from '../events';

/**
 * 边缘节点管理器
 */
class EdgeNodeManager {
  private nodes: Map<string, {
    id: string;
    name: string;
    location: IEdgeLocation;
    status: EdgeNodeStatus;
    capabilities: any;
    latency?: number;
    loadAverage?: number;
    lastHealthCheck?: Date;
  }> = new Map();

  /**
   * 添加边缘节点
   */
  addNode(node: {
    id: string;
    name: string;
    location: IEdgeLocation;
    capabilities: any;
  }): void {
    this.nodes.set(node.id, {
      ...node,
      status: EdgeNodeStatus.ONLINE,
    });

    eventBus.emit(EdgeEventType.NODE_UP, { nodeId: node.id });
  }

  /**
   * 移除边缘节点
   */
  removeNode(nodeId: string): void {
    if (this.nodes.delete(nodeId)) {
      eventBus.emit(EdgeEventType.NODE_DOWN, { nodeId });
    }
  }

  /**
   * 更新节点状态
   */
  updateNodeStatus(
    nodeId: string,
    status: EdgeNodeStatus,
    latency?: number,
    loadAverage?: number
  ): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.status = status;
      node.latency = latency;
      node.loadAverage = loadAverage;
      node.lastHealthCheck = new Date();

      if (status === EdgeNodeStatus.DEGRADED) {
        eventBus.emit(EdgeEventType.NODE_DEGRADED, { nodeId });
      }
    }
  }

  /**
   * 获取最优节点
   */
  getOptimalNode(preferredRegion?: string): string | null {
    const onlineNodes = Array.from(this.nodes.values()).filter(
      n => n.status === EdgeNodeStatus.ONLINE
    );

    if (onlineNodes.length === 0) {
      return null;
    }

    // 优先选择指定区域的节点
    if (preferredRegion) {
      const regionalNode = onlineNodes.find(
        n => n.location.region === preferredRegion
      );
      if (regionalNode) {
        return regionalNode.id;
      }
    }

    // 选择延迟最低的节点
    const sortedByLatency = onlineNodes
      .filter(n => n.latency !== undefined)
      .sort((a, b) => (a.latency || 0) - (b.latency || 0));

    if (sortedByLatency.length > 0) {
      return sortedByLatency[0].id;
    }

    // 选择负载最低的节点
    const sortedByLoad = onlineNodes
      .filter(n => n.loadAverage !== undefined)
      .sort((a, b) => (a.loadAverage || 0) - (b.loadAverage || 0));

    if (sortedByLoad.length > 0) {
      return sortedByLoad[0].id;
    }

    // 随机选择
    return onlineNodes[Math.floor(Math.random() * onlineNodes.length)].id;
  }

  /**
   * 获取所有节点
   */
  getAllNodes(): Array<{
    id: string;
    name: string;
    location: IEdgeLocation;
    status: EdgeNodeStatus;
    capabilities: any;
    latency?: number;
    loadAverage?: number;
    lastHealthCheck?: Date;
  }> {
    return Array.from(this.nodes.values());
  }

  /**
   * 获取节点统计信息
   */
  getNodeStatistics(): {
    total: number;
    online: number;
    degraded: number;
    offline: number;
    byRegion: Record<string, number>;
  } {
    const nodes = Array.from(this.nodes.values());
    const byRegion: Record<string, number> = {};

    for (const node of nodes) {
      const region = node.location.region;
      byRegion[region] = (byRegion[region] || 0) + 1;
    }

    return {
      total: nodes.length,
      online: nodes.filter(n => n.status === EdgeNodeStatus.ONLINE).length,
      degraded: nodes.filter(n => n.status === EdgeNodeStatus.DEGRADED).length,
      offline: nodes.filter(n => n.status === EdgeNodeStatus.OFFLINE).length,
      byRegion,
    };
  }
}

/**
 * 统一的边缘计算管理器类
 */
export class EdgeManager {
  private static instance: EdgeManager;
  private functionManager: EdgeFunctionManager;
  private storageManager: EdgeStorageManager;
  private routeManager: EdgeRouteManager;
  private cacheManager: EdgeCacheManager;
  private nodeManager: EdgeNodeManager;

  private constructor() {
    this.functionManager = edgeFunctionManager;
    this.storageManager = edgeStorageManager;
    this.routeManager = edgeRouteManager;
    this.cacheManager = edgeCacheManager;
    this.nodeManager = new EdgeNodeManager();
  }

  /**
   * 获取边缘管理器单例
   */
  public static getInstance(): EdgeManager {
    if (!EdgeManager.instance) {
      EdgeManager.instance = new EdgeManager();
    }
    return EdgeManager.instance;
  }

  /**
   * 部署边缘应用
   */
  async deploy(config: IEdgeDeploymentConfig): Promise<{
    success: boolean;
    functionIds: string[];
    storeIds: string[];
    routeIds: string[];
    policyIds: string[];
    errors: string[];
  }> {
    const result = {
      success: true,
      functionIds: [] as string[],
      storeIds: [] as string[],
      routeIds: [] as string[],
      policyIds: [] as string[],
      errors: [] as string[],
    };

    // 部署函数
    for (const func of config.functions) {
      try {
        const functionId = await this.functionManager.deployFunction(func);
        result.functionIds.push(functionId);
      } catch (error) {
        result.errors.push(`Function ${func.name}: ${(error as Error).message}`);
      }
    }

    // 创建存储
    for (const store of config.storages) {
      try {
        const storeId = await this.storageManager.createStore(store);
        result.storeIds.push(storeId);
      } catch (error) {
        result.errors.push(`Storage ${store.namespace}: ${(error as Error).message}`);
      }
    }

    // 添加路由
    for (const route of config.routes) {
      try {
        this.routeManager.addRoute(route);
        result.routeIds.push(route.id);
      } catch (error) {
        result.errors.push(`Route ${route.name}: ${(error as Error).message}`);
      }
    }

    // 添加缓存策略
    for (const policy of config.cachePolicies) {
      try {
        this.cacheManager.addCachePolicy(policy);
        result.policyIds.push(policy.id);
      } catch (error) {
        result.errors.push(`Cache policy ${policy.name}: ${(error as Error).message}`);
      }
    }

    result.success = result.errors.length === 0;
    return result;
  }

  /**
   * 获取全局统计信息
   */
  getGlobalStatistics(): IEdgeStatistics {
    const nodeStats = this.nodeManager.getNodeStatistics();

    // 聚合所有函数的统计信息
    const allFunctions = this.functionManager.getAllFunctions();
    let totalInvocations = 0;
    let totalErrors = 0;
    let totalExecutionTime = 0;

    for (const func of allFunctions) {
      const stats = this.functionManager.getFunctionStatistics(func.id);
      totalInvocations += stats.totalInvocations;
      totalErrors += stats.failedInvocations;
      totalExecutionTime += stats.averageExecutionTime * stats.totalInvocations;
    }

    // 获取存储统计信息
    const allStoreStats = this.storageManager.getAllStatistics();
    let totalReads = 0;
    let totalWrites = 0;
    let totalReadLatency = 0;
    let totalWriteLatency = 0;
    let totalCacheHits = 0;
    let totalCacheMisses = 0;

    for (const [, stats] of allStoreStats) {
      if (stats.statistics) {
        totalReads += stats.statistics.totalReads;
        totalWrites += stats.statistics.totalWrites;
        totalReadLatency += stats.statistics.averageLatency * stats.statistics.totalReads;
        totalWriteLatency += stats.statistics.averageLatency * stats.statistics.totalWrites;
        totalCacheHits += stats.statistics.cacheHitRate * stats.statistics.totalReads;
        totalCacheMisses += (1 - stats.statistics.cacheHitRate) * stats.statistics.totalReads;
      }
    }

    // 获取缓存统计信息
    const cacheStats = this.cacheManager.getStatistics();

    return {
      nodes: nodeStats,
      functions: {
        total: allFunctions.length,
        active: allFunctions.filter(f => {
          const stats = this.functionManager.getFunctionStatistics(f.id);
          return stats && stats.activeInstances > 0;
        }).length,
        totalInvocations,
        totalErrors,
        averageExecutionTime: totalInvocations > 0 ? totalExecutionTime / totalInvocations : 0,
        p95ExecutionTime: 0,
        p99ExecutionTime: 0,
      },
      storage: {
        totalEntries: 0,
        totalSize: 0,
        totalReads,
        totalWrites,
        averageReadLatency: totalReads > 0 ? totalReadLatency / totalReads : 0,
        averageWriteLatency: totalWrites > 0 ? totalWriteLatency / totalWrites : 0,
        hitRate: totalReads > 0 ? totalCacheHits / totalReads : 0,
      },
      cache: {
        totalEntries: cacheStats.memory.size,
        totalSize: cacheStats.memory.sizeBytes,
        hitRate: cacheStats.memory.hitRate,
        missRate: 1 - cacheStats.memory.hitRate,
        averageLatency: 0,
      },
      bandwidth: {
        totalInbound: 0,
        totalOutbound: 0,
        averageBandwidth: 0,
      },
    };
  }

  /**
   * 获取函数管理器
   */
  get functions(): EdgeFunctionManager {
    return this.functionManager;
  }

  /**
   * 获取存储管理器
   */
  get storage(): EdgeStorageManager {
    return this.storageManager;
  }

  /**
   * 获取路由管理器
   */
  get routes(): EdgeRouteManager {
    return this.routeManager;
  }

  /**
   * 获取缓存管理器
   */
  get cache(): EdgeCacheManager {
    return this.cacheManager;
  }

  /**
   * 获取节点管理器
   */
  get nodes(): EdgeNodeManager {
    return this.nodeManager;
  }

  /**
   * 清理所有资源
   */
  async cleanup(): Promise<void> {
    await this.functionManager.cleanup();
    await this.storageManager.cleanup();
    await this.routeManager.cleanup();
    await this.cacheManager.cleanup();
  }
}

/**
 * 边缘管理器单例导出
 */
export const edgeManager = EdgeManager.getInstance();
