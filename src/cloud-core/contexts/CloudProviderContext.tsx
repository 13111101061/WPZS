/**
 * 云存储提供商 React Context
 * 管理所有云存储提供商的状态和操作
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { IStorageProvider, IProviderConfig, ProviderStatus } from './providers/base';
import { providerRegistry } from './providers/registry/ProviderRegistry';
import { transferManager, TransferManager } from './transfer/TransferManager';
import { cacheManager, CacheManager } from './cache/CacheManager';
import { eventBus, CloudEventType } from './events';

/**
 * 提供商状态接口
 */
interface IProviderState {
  id: string;
  name: string;
  type: string;
  status: ProviderStatus;
  enabled: boolean;
  connected: boolean;
  config: IProviderConfig;
  quota?: {
    total: number;
    used: number;
    remaining: number;
    usagePercentage: number;
  };
}

/**
 * 云存储上下文接口
 */
interface ICloudContextType {
  // 提供商管理
  providers: IProviderState[];
  activeProvider: IStorageProvider | null;
  providerRegistry: typeof providerRegistry;

  // 核心管理器
  transferManager: TransferManager;
  cacheManager: CacheManager;

  // 操作方法
  addProvider: (type: string, config: IProviderConfig) => Promise<void>;
  removeProvider: (id: string) => Promise<void>;
  connectProvider: (id: string) => Promise<void>;
  disconnectProvider: (id: string) => Promise<void>;
  setActiveProvider: (id: string) => void;

  // 状态查询
  getProvider: (id: string) => IProviderState | undefined;
  isProviderConnected: (id: string) => boolean;

  // 加载状态
  isLoading: boolean;
  error: string | null;
}

/**
 * 创建云存储上下文
 */
const CloudContext = createContext<ICloudContextType | undefined>(undefined);

/**
 * 云存储提供者组件属性
 */
interface ICloudProviderProps {
  children: ReactNode;
  cacheConfig?: Parameters<typeof CacheManager.getInstance>[0];
  transferConfig?: Parameters<typeof TransferManager.getInstance>[0];
}

/**
 * 云存储提供者组件
 */
export const CloudProvider: React.FC<ICloudProviderProps> = ({
  children,
  cacheConfig,
  transferConfig,
}) => {
  const [providers, setProviders] = useState<IProviderState[]>([]);
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取活动提供商实例
  const activeProvider = activeProviderId
    ? providerRegistry.getInstance(activeProviderId)
    : null;

  /**
   * 从localStorage加载已保存的提供商配置
   */
  useEffect(() => {
    const loadProviders = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const savedProvidersJson = localStorage.getItem('cloud_providers');
        if (savedProvidersJson) {
          const savedConfigs: IProviderConfig[] = JSON.parse(savedProvidersJson);
          const providerStates: IProviderState[] = [];

          for (const config of savedConfigs) {
            try {
              // 恢复提供商实例
              const instance = providerRegistry.create(config.type, config);
              providerStates.push({
                id: config.id,
                name: config.name,
                type: config.type,
                status: config.status,
                enabled: config.enabled,
                connected: config.status === ProviderStatus.CONNECTED,
                config,
              });
            } catch (err) {
              console.error(`Failed to restore provider ${config.id}:`, err);
            }
          }

          setProviders(providerStates);
        }
      } catch (err) {
        setError((err as Error).message);
        console.error('Failed to load providers:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProviders();
  }, []);

  /**
   * 监听提供商事件并更新状态
   */
  useEffect(() => {
    const unsubscribeConnected = eventBus.on(
      CloudEventType.PROVIDER_CONNECTED,
      (data: { providerId: string }) => {
        updateProviderStatus(data.providerId, ProviderStatus.CONNECTED);
      }
    );

    const unsubscribeDisconnected = eventBus.on(
      CloudEventType.PROVIDER_DISCONNECTED,
      (data: { providerId: string }) => {
        updateProviderStatus(data.providerId, ProviderStatus.DISCONNECTED);
      }
    );

    const unsubscribeError = eventBus.on(
      CloudEventType.PROVIDER_ERROR,
      (data: { providerId: string; error: string }) => {
        updateProviderStatus(data.providerId, ProviderStatus.AUTH_ERROR);
        setError(data.error);
      }
    );

    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeError();
    };
  }, []);

  /**
   * 更新提供商状态
   */
  const updateProviderStatus = useCallback((providerId: string, status: ProviderStatus) => {
    setProviders(prev =>
      prev.map(p =>
        p.id === providerId
          ? { ...p, status, connected: status === ProviderStatus.CONNECTED }
          : p
      )
    );
  }, []);

  /**
   * 保存提供商配置到localStorage
   */
  const saveProviders = useCallback((updatedProviders: IProviderState[]) => {
    const configs = updatedProviders.map(p => p.config);
    localStorage.setItem('cloud_providers', JSON.stringify(configs));
  }, []);

  /**
   * 添加提供商
   */
  const addProvider = useCallback(async (type: string, config: IProviderConfig): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // 验证配置
      const validation = await providerRegistry.getMetadata(type)?.factory(config).validateConfig(config);
      if (validation && !validation.valid) {
        throw new Error(validation.errors?.join(', '));
      }

      // 创建提供商实例
      const instance = providerRegistry.create(type, config);
      await instance.initialize();

      // 添加到状态
      const newProvider: IProviderState = {
        id: config.id,
        name: config.name,
        type,
        status: ProviderStatus.DISCONNECTED,
        enabled: config.enabled,
        connected: false,
        config,
      };

      const updatedProviders = [...providers, newProvider];
      setProviders(updatedProviders);
      saveProviders(updatedProviders);

      // 自动连接
      if (config.enabled) {
        await instance.connect();
        updateProviderStatus(config.id, ProviderStatus.CONNECTED);
      }
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [providers, saveProviders, updateProviderStatus]);

  /**
   * 移除提供商
   */
  const removeProvider = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await providerRegistry.removeInstance(id);

      const updatedProviders = providers.filter(p => p.id !== id);
      setProviders(updatedProviders);
      saveProviders(updatedProviders);

      if (activeProviderId === id) {
        setActiveProviderId(null);
      }
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [providers, activeProviderId, saveProviders]);

  /**
   * 连接提供商
   */
  const connectProvider = useCallback(async (id: string): Promise<void> => {
    setError(null);

    try {
      const instance = providerRegistry.getInstance(id);
      if (!instance) {
        throw new Error(`Provider not found: ${id}`);
      }

      await instance.connect();
      updateProviderStatus(id, ProviderStatus.CONNECTED);

      // 更新配置中的连接状态
      const updatedProviders = providers.map(p =>
        p.id === id
          ? { ...p, status: ProviderStatus.CONNECTED, connected: true }
          : p
      );
      setProviders(updatedProviders);
      saveProviders(updatedProviders);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [providers, saveProviders, updateProviderStatus]);

  /**
   * 断开提供商连接
   */
  const disconnectProvider = useCallback(async (id: string): Promise<void> => {
    setError(null);

    try {
      const instance = providerRegistry.getInstance(id);
      if (!instance) {
        throw new Error(`Provider not found: ${id}`);
      }

      await instance.disconnect();
      updateProviderStatus(id, ProviderStatus.DISCONNECTED);

      // 更新配置中的连接状态
      const updatedProviders = providers.map(p =>
        p.id === id
          ? { ...p, status: ProviderStatus.DISCONNECTED, connected: false }
          : p
      );
      setProviders(updatedProviders);
      saveProviders(updatedProviders);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [providers, saveProviders, updateProviderStatus]);

  /**
   * 设置活动提供商
   */
  const setActiveProvider = useCallback((id: string) => {
    setActiveProviderId(id);
    localStorage.setItem('cloud_active_provider', id);
  }, []);

  /**
   * 获取提供商
   */
  const getProvider = useCallback((id: string): IProviderState | undefined => {
    return providers.find(p => p.id === id);
  }, [providers]);

  /**
   * 检查提供商是否已连接
   */
  const isProviderConnected = useCallback((id: string): boolean => {
    return providers.find(p => p.id === id)?.connected ?? false;
  }, [providers]);

  const value: ICloudContextType = {
    providers,
    activeProvider,
    providerRegistry,
    transferManager,
    cacheManager,
    addProvider,
    removeProvider,
    connectProvider,
    disconnectProvider,
    setActiveProvider,
    getProvider,
    isProviderConnected,
    isLoading,
    error,
  };

  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>;
};

/**
 * 使用云存储上下文的Hook
 */
export const useCloud = (): ICloudContextType => {
  const context = useContext(CloudContext);
  if (context === undefined) {
    throw new Error('useCloud must be used within a CloudProvider');
  }
  return context;
};

/**
 * 使用活动提供商的Hook
 */
export const useActiveProvider = (): IStorageProvider | null => {
  const { activeProvider } = useCloud();
  return activeProvider;
};

/**
 * 使用提供商列表的Hook
 */
export const useProviders = (): IProviderState[] => {
  const { providers } = useCloud();
  return providers;
};

/**
 * 使用传输管理器的Hook
 */
export const useTransfers = () => {
  const { transferManager } = useCloud();
  return transferManager;
};

/**
 * 使用缓存管理器的Hook
 */
export const useCache = () => {
  const { cacheManager } = useCloud();
  return cacheManager;
};

export default CloudContext;
