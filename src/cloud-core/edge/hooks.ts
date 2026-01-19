/**
 * 边缘计算 React Hooks
 * 提供便捷的边缘功能访问
 */

import { useState, useEffect, useCallback } from 'react';
import { edgeManager } from './EdgeManager';
import {
  IEdgeFunctionConfig,
  IEdgeFunctionInvokeOptions,
  IEdgeFunctionResult,
  IEdgeStorageConfig,
  EdgeStorageType,
  IEdgeRouteRule,
  EdgeFunctionRuntime,
} from './base/EdgeTypes';

/**
 * 使用边缘函数的 Hook
 */
export function useEdgeFunction(functionId?: string) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IEdgeFunctionResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const invoke = useCallback(async (
    id: string,
    options?: IEdgeFunctionInvokeOptions
  ) => {
    setLoading(true);
    setError(null);

    try {
      const res = await edgeManager.functions.invokeFunction(id, options);
      setResult(res);
      return res;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deploy = useCallback(async (config: IEdgeFunctionConfig) => {
    setLoading(true);
    setError(null);

    try {
      const id = await edgeManager.functions.deployFunction(config);
      return id;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (
    id: string,
    updates: Partial<IEdgeFunctionConfig>
  ) => {
    setLoading(true);
    setError(null);

    try {
      await edgeManager.functions.updateFunction(id, updates);
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await edgeManager.functions.removeFunction(id);
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStats = useCallback((id: string) => {
    return edgeManager.functions.getFunctionStatistics(id);
  }, []);

  const getHistory = useCallback((id: string, limit?: number) => {
    return edgeManager.functions.getInvocationHistory(id, limit);
  }, []);

  return {
    loading,
    result,
    error,
    invoke,
    deploy,
    update,
    remove,
    getStats,
    getHistory,
  };
}

/**
 * 使用边缘存储的 Hook
 */
export function useEdgeStorage(namespace?: string, type?: EdgeStorageType) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const get = useCallback(async (key: string, options?: { cache?: boolean }) => {
    if (!namespace) throw new Error('Namespace is required');
    setLoading(true);
    setError(null);

    try {
      const value = await edgeManager.storage.get(namespace, key, { type, ...options });
      return value;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [namespace, type]);

  const put = useCallback(async (key: string, value: any, options?: { expirationTTL?: number }) => {
    if (!namespace) throw new Error('Namespace is required');
    setLoading(true);
    setError(null);

    try {
      await edgeManager.storage.put(namespace, key, value, { type, ...options });
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [namespace, type]);

  const deleteKey = useCallback(async (key: string) => {
    if (!namespace) throw new Error('Namespace is required');
    setLoading(true);
    setError(null);

    try {
      await edgeManager.storage.delete(namespace, key, { type });
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [namespace, type]);

  const list = useCallback(async (options?: { prefix?: string; limit?: number }) => {
    if (!namespace) throw new Error('Namespace is required');
    setLoading(true);
    setError(null);

    try {
      const result = await edgeManager.storage.list(namespace, { type, ...options });
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [namespace, type]);

  const createStore = useCallback(async (config: IEdgeStorageConfig) => {
    setLoading(true);
    setError(null);

    try {
      const storeId = await edgeManager.storage.createStore(config);
      return storeId;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStats = useCallback(() => {
    if (!namespace) return undefined;
    return edgeManager.storage.getStoreStatistics(namespace, type);
  }, [namespace, type]);

  return {
    loading,
    error,
    get,
    put,
    delete: deleteKey,
    list,
    createStore,
    getStats,
  };
}

/**
 * 使用边缘路由的 Hook
 */
export function useEdgeRoute() {
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<IEdgeRouteRule[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setRoutes(edgeManager.routes.getAllRoutes());
  }, []);

  const add = useCallback((route: IEdgeRouteRule) => {
    setLoading(true);
    setError(null);

    try {
      edgeManager.routes.addRoute(route);
      setRoutes(edgeManager.routes.getAllRoutes());
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback((routeId: string, updates: Partial<IEdgeRouteRule>) => {
    setLoading(true);
    setError(null);

    try {
      edgeManager.routes.updateRoute(routeId, updates);
      setRoutes(edgeManager.routes.getAllRoutes());
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback((routeId: string) => {
    setLoading(true);
    setError(null);

    try {
      edgeManager.routes.removeRoute(routeId);
      setRoutes(edgeManager.routes.getAllRoutes());
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStats = useCallback(() => {
    return edgeManager.routes.getRouteStatistics();
  }, []);

  return {
    loading,
    routes,
    error,
    add,
    update,
    remove,
    getStats,
  };
}

/**
 * 使用边缘缓存的 Hook
 */
export function useEdgeCache() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const get = useCallback(async (key: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await edgeManager.cache.get(key);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const set = useCallback(async (key: string, value: any, options?: { ttl?: number }) => {
    setLoading(true);
    setError(null);

    try {
      await edgeManager.cache.set(key, value, options);
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteKey = useCallback(async (key: string) => {
    setLoading(true);
    setError(null);

    try {
      await edgeManager.cache.delete(key);
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const warmup = useCallback(async (urls: Array<{ url: string; method?: string }>) => {
    setLoading(true);
    setError(null);

    try {
      const results = await edgeManager.cache.warmupCache(urls);
      return results;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await edgeManager.cache.clearAll();
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStats = useCallback(() => {
    return edgeManager.cache.getStatistics();
  }, []);

  const getHotData = useCallback((limit?: number) => {
    return edgeManager.cache.getHotData(limit);
  }, []);

  const getColdData = useCallback((limit?: number) => {
    return edgeManager.cache.getColdData(limit);
  }, []);

  return {
    loading,
    error,
    get,
    set,
    delete: deleteKey,
    warmup,
    clearAll,
    getStats,
    getHotData,
    getColdData,
  };
}

/**
 * 使用边缘节点状态的 Hook
 */
export function useEdgeNodes() {
  const [nodes, setNodes] = useState(edgeManager.nodes.getAllNodes());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setNodes(edgeManager.nodes.getAllNodes());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStats = useCallback(() => {
    return edgeManager.nodes.getNodeStatistics();
  }, []);

  const getOptimalNode = useCallback((preferredRegion?: string) => {
    return edgeManager.nodes.getOptimalNode(preferredRegion);
  }, []);

  return {
    nodes,
    loading,
    getStats,
    getOptimalNode,
  };
}

/**
 * 使用全局边缘统计的 Hook
 */
export function useEdgeStatistics() {
  const [stats, setStats] = useState(edgeManager.getGlobalStatistics());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(edgeManager.getGlobalStatistics());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}

/**
 * 使用边缘部署的 Hook
 */
export function useEdgeDeployment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deploy = useCallback(async (config: {
    functions: IEdgeFunctionConfig[];
    storages: IEdgeStorageConfig[];
    routes: IEdgeRouteRule[];
  }) => {
    setLoading(true);
    setError(null);

    try {
      const result = await edgeManager.deploy({
        functions: config.functions || [],
        storages: config.storages || [],
        routes: config.routes || [],
        cachePolicies: [],
        environment: 'production',
        regions: [],
        defaultRegion: 'default',
        enableMetrics: true,
        enableAlerts: true,
      });

      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    deploy,
  };
}
