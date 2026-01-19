/**
 * 提供商注册表
 * 管理所有云存储提供商的注册、创建和实例管理
 */

import { IStorageProvider, IStorageProviderFactory } from './base';
import { IProviderConfig, IProviderTemplate } from './base/IProviderConfig';

/**
 * 提供商元数据接口
 */
interface IProviderMetadata {
  type: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'personal' | 'professional' | 'object-storage' | 'protocol';
  factory: (config: IProviderConfig) => IStorageProvider;
  template: IProviderTemplate;
  isAvailable: boolean;
}

/**
 * 提供商注册表类
 */
export class ProviderRegistry implements IStorageProviderFactory {
  private static instance: ProviderRegistry;
  private providers: Map<string, IProviderMetadata> = new Map();
  private instances: Map<string, IStorageProvider> = new Map();

  private constructor() {
    // 私有构造函数，确保单例
  }

  /**
   * 获取注册表单例
   */
  public static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  /**
   * 注册提供商
   */
  public register(metadata: IProviderMetadata): void {
    if (this.providers.has(metadata.type)) {
      throw new Error(`Provider '${metadata.type}' is already registered`);
    }
    this.providers.set(metadata.type, metadata);
  }

  /**
   * 注销提供商
   */
  public unregister(type: string): void {
    this.providers.delete(type);

    // 清理相关实例
    for (const [id, instance] of this.instances.entries()) {
      if (instance.type === type) {
        instance.cleanup().catch(console.error);
        this.instances.delete(id);
      }
    }
  }

  /**
   * 检查提供商是否已注册
   */
  public isRegistered(type: string): boolean {
    return this.providers.has(type);
  }

  /**
   * 获取提供商元数据
   */
  public getMetadata(type: string): IProviderMetadata | undefined {
    return this.providers.get(type);
  }

  /**
   * 获取所有已注册的提供商类型
   */
  public getSupportedTypes(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 检查是否支持特定类型
   */
  public isSupported(type: string): boolean {
    return this.isRegistered(type);
  }

  /**
   * 创建提供商实例
   */
  public create(type: string, config: IProviderConfig): IStorageProvider {
    const metadata = this.providers.get(type);
    if (!metadata) {
      throw new Error(`Provider '${type}' is not registered`);
    }

    if (!metadata.isAvailable) {
      throw new Error(`Provider '${type}' is not available`);
    }

    const instance = metadata.factory(config);
    this.instances.set(config.id, instance);

    return instance;
  }

  /**
   * 获取现有实例
   */
  public getInstance(id: string): IStorageProvider | undefined {
    return this.instances.get(id);
  }

  /**
   * 移除实例
   */
  public async removeInstance(id: string): Promise<void> {
    const instance = this.instances.get(id);
    if (instance) {
      await instance.cleanup();
      this.instances.delete(id);
    }
  }

  /**
   * 获取所有实例
   */
  public getAllInstances(): IStorageProvider[] {
    return Array.from(this.instances.values());
  }

  /**
   * 按类型获取实例
   */
  public getInstancesByType(type: string): IStorageProvider[] {
    return Array.from(this.instances.values()).filter(instance => instance.type === type);
  }

  /**
   * 获取所有可用的提供商模板
   */
  public getTemplates(): IProviderTemplate[] {
    return Array.from(this.providers.values())
      .filter(metadata => metadata.isAvailable)
      .map(metadata => metadata.template);
  }

  /**
   * 按分类获取提供商模板
   */
  public getTemplatesByCategory(category: IProviderMetadata['category']): IProviderTemplate[] {
    return Array.from(this.providers.values())
      .filter(metadata => metadata.isAvailable && metadata.category === category)
      .map(metadata => metadata.template);
  }

  /**
   * 获取提供商模板
   */
  public getTemplate(type: string): IProviderTemplate | undefined {
    return this.providers.get(type)?.template;
  }

  /**
   * 搜索提供商
   */
  public searchProviders(query: string): IProviderMetadata[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.providers.values()).filter(metadata =>
      metadata.name.toLowerCase().includes(lowerQuery) ||
      metadata.description.toLowerCase().includes(lowerQuery) ||
      metadata.type.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 清理所有实例
   */
  public async cleanupAll(): Promise<void> {
    const cleanupPromises = Array.from(this.instances.values()).map(instance =>
      instance.cleanup().catch(console.error)
    );
    await Promise.all(cleanupPromises);
    this.instances.clear();
  }

  /**
   * 获取注册表统计信息
   */
  public getStatistics(): {
    registeredProviders: number;
    activeInstances: number;
    instancesByType: Record<string, number>;
  } {
    const instancesByType: Record<string, number> = {};

    for (const instance of this.instances.values()) {
      instancesByType[instance.type] = (instancesByType[instance.type] || 0) + 1;
    }

    return {
      registeredProviders: this.providers.size,
      activeInstances: this.instances.size,
      instancesByType,
    };
  }
}

/**
 * 提供商注册表辅助函数
 */
export const providerRegistry = ProviderRegistry.getInstance();

/**
 * 注册提供商的便捷函数
 */
export function registerProvider(
  type: string,
  name: string,
  description: string,
  icon: string,
  color: string,
  category: IProviderMetadata['category'],
  factory: (config: IProviderConfig) => IStorageProvider,
  template: IProviderTemplate,
  isAvailable: boolean = true
): void {
  providerRegistry.register({
    type,
    name,
    description,
    icon,
    color,
    category,
    factory,
    template,
    isAvailable,
  });
}

/**
 * 创建提供商实例的便捷函数
 */
export function createProvider(type: string, config: IProviderConfig): IStorageProvider {
  return providerRegistry.create(type, config);
}

/**
 * 获取提供商模板的便捷函数
 */
export function getProviderTemplate(type: string): IProviderTemplate | undefined {
  return providerRegistry.getTemplate(type);
}

/**
 * 获取所有提供商模板的便捷函数
 */
export function getAllProviderTemplates(): IProviderTemplate[] {
  return providerRegistry.getTemplates();
}
