/**
 * 边缘函数管理器
 * 管理边缘函数的部署、调用和监控
 */

import {
  IEdgeFunctionConfig,
  IEdgeFunctionResult,
  IEdgeFunctionInvokeOptions,
  EdgeFunctionRuntime,
  EdgeFunctionTrigger,
  EdgeEventType,
} from './EdgeTypes';
import { eventBus } from '../events';

/**
 * 边缘函数部署状态
 */
enum EdgeFunctionDeploymentStatus {
  PENDING = 'pending',
  BUILDING = 'building',
  DEPLOYING = 'deploying',
  DEPLOYED = 'deployed',
  FAILED = 'failed',
  ROLLING_BACK = 'rolling_back',
}

/**
 * 边缘函数部署信息
 */
interface IEdgeFunctionDeployment {
  functionId: string;
  version: string;
  status: EdgeFunctionDeploymentStatus;
  progress: number;
  startTime: Date;
  completedTime?: Date;
  regions: Map<string, boolean>; // 区域 -> 是否已部署
  error?: string;
}

/**
 * 边缘函数实例
 */
interface IEdgeFunctionInstance {
  id: string;
  functionId: string;
  region: string;
  nodeId: string;
  status: 'starting' | 'running' | 'stopping' | 'stopped';
  invocations: number;
  lastInvocation?: Date;
  memoryUsed: number;
  cpuUsage: number;
}

/**
 * 边缘函数管理器类
 */
export class EdgeFunctionManager {
  private static instance: EdgeFunctionManager;
  private functions: Map<string, IEdgeFunctionConfig> = new Map();
  private deployments: Map<string, IEdgeFunctionDeployment> = new Map();
  private instances: Map<string, IEdgeFunctionInstance[]> = new Map();
  private invocationHistory: Map<string, IEdgeFunctionResult[]> = new Map();
  private warmFunctions: Set<string> = new Set();

  private constructor() {
    // 私有构造函数，确保单例
  }

  /**
   * 获取边缘函数管理器单例
   */
  public static getInstance(): EdgeFunctionManager {
    if (!EdgeFunctionManager.instance) {
      EdgeFunctionManager.instance = new EdgeFunctionManager();
    }
    return EdgeFunctionManager.instance;
  }

  /**
   * 部署边缘函数
   */
  async deployFunction(config: IEdgeFunctionConfig): Promise<string> {
    const functionId = config.id || this.generateFunctionId();

    // 验证配置
    this.validateFunctionConfig(config);

    // 存储配置
    config.id = functionId;
    this.functions.set(functionId, config);

    // 创建部署任务
    const deployment: IEdgeFunctionDeployment = {
      functionId,
      version: this.generateVersion(),
      status: EdgeFunctionDeploymentStatus.PENDING,
      progress: 0,
      startTime: new Date(),
      regions: new Map(),
    };

    this.deployments.set(functionId, deployment);

    // 开始部署
    await this.executeDeployment(deployment);

    // 发出事件
    await eventBus.emit(EdgeEventType.FUNCTION_DEPLOYED, {
      functionId,
      config,
      deployment,
    });

    return functionId;
  }

  /**
   * 更新边缘函数
   */
  async updateFunction(
    functionId: string,
    updates: Partial<IEdgeFunctionConfig>
  ): Promise<void> {
    const config = this.functions.get(functionId);
    if (!config) {
      throw new Error(`Function not found: ${functionId}`);
    }

    const updatedConfig = { ...config, ...updates };
    this.functions.set(functionId, updatedConfig);

    // 重新部署
    await this.deployFunction(updatedConfig);

    await eventBus.emit(EdgeEventType.FUNCTION_UPDATED, {
      functionId,
      config: updatedConfig,
    });
  }

  /**
   * 删除边缘函数
   */
  async removeFunction(functionId: string): Promise<void> {
    const config = this.functions.get(functionId);
    if (!config) {
      throw new Error(`Function not found: ${functionId}`);
    }

    // 停止所有实例
    const instances = this.instances.get(functionId) || [];
    for (const instance of instances) {
      await this.stopInstance(instance);
    }

    // 清理
    this.functions.delete(functionId);
    this.deployments.delete(functionId);
    this.instances.delete(functionId);
    this.invocationHistory.delete(functionId);
    this.warmFunctions.delete(functionId);

    await eventBus.emit(EdgeEventType.FUNCTION_REMOVED, { functionId });
  }

  /**
   * 调用边缘函数
   */
  async invokeFunction(
    functionId: string,
    options: IEdgeFunctionInvokeOptions = {}
  ): Promise<IEdgeFunctionResult> {
    const config = this.functions.get(functionId);
    if (!config) {
      throw new Error(`Function not found: ${functionId}`);
    }

    const startTime = Date.now();
    const nodeId = await this.selectOptimalNode(config);
    const region = await this.getNodeRegion(nodeId);

    try {
      // 执行函数
      const result = await this.executeFunction(config, options, nodeId);

      result.executionTime = Date.now() - startTime;
      result.nodeId = nodeId;
      result.region = region;

      // 记录历史
      this.recordInvocation(functionId, result);

      // 发出事件
      await eventBus.emit(EdgeEventType.FUNCTION_INVOKED, {
        functionId,
        result,
      });

      return result;
    } catch (error) {
      const errorResult: IEdgeFunctionResult = {
        success: false,
        statusCode: 500,
        headers: {},
        body: null,
        executionTime: Date.now() - startTime,
        memoryUsed: 0,
        nodeId,
        region,
        cached: false,
        error: (error as Error).message,
      };

      await eventBus.emit(EdgeEventType.FUNCTION_ERROR, {
        functionId,
        error: errorResult,
      });

      return errorResult;
    }
  }

  /**
   * 批量调用边缘函数
   */
  async invokeFunctionBatch(
    functionId: string,
    optionsList: IEdgeFunctionInvokeOptions[]
  ): Promise<IEdgeFunctionResult[]> {
    const results: IEdgeFunctionResult[] = [];

    for (const options of optionsList) {
      const result = await this.invokeFunction(functionId, options);
      results.push(result);
    }

    return results;
  }

  /**
   * 预热函数（保持最小实例数）
   */
  async warmUpFunction(functionId: string): Promise<void> {
    const config = this.functions.get(functionId);
    if (!config) {
      throw new Error(`Function not found: ${functionId}`);
    }

    this.warmFunctions.add(functionId);

    // 启动最小实例数
    const instances = this.instances.get(functionId) || [];
    const runningInstances = instances.filter(i => i.status === 'running').length;
    const instancesToStart = config.minInstances - runningInstances;

    for (let i = 0; i < instancesToStart; i++) {
      const instance = await this.startInstance(config);
      instances.push(instance);
    }

    this.instances.set(functionId, instances);
  }

  /**
   * 获取函数配置
   */
  getFunction(functionId: string): IEdgeFunctionConfig | undefined {
    return this.functions.get(functionId);
  }

  /**
   * 获取所有函数
   */
  getAllFunctions(): IEdgeFunctionConfig[] {
    return Array.from(this.functions.values());
  }

  /**
   * 获取函数部署状态
   */
  getDeploymentStatus(functionId: string): IEdgeFunctionDeployment | undefined {
    return this.deployments.get(functionId);
  }

  /**
   * 获取函数实例
   */
  getFunctionInstances(functionId: string): IEdgeFunctionInstance[] {
    return this.instances.get(functionId) || [];
  }

  /**
   * 获取函数调用历史
   */
  getInvocationHistory(
    functionId: string,
    limit?: number
  ): IEdgeFunctionResult[] {
    const history = this.invocationHistory.get(functionId) || [];
    if (limit) {
      return history.slice(-limit);
    }
    return history;
  }

  /**
   * 获取函数统计信息
   */
  getFunctionStatistics(functionId: string): {
    totalInvocations: number;
    successfulInvocations: number;
    failedInvocations: number;
    averageExecutionTime: number;
    p95ExecutionTime: number;
    p99ExecutionTime: number;
    averageMemoryUsed: number;
    cacheHitRate: number;
    activeInstances: number;
  } {
    const history = this.invocationHistory.get(functionId) || [];
    const instances = this.instances.get(functionId) || [];

    const successful = history.filter(r => r.success);
    const failed = history.filter(r => !r.success);
    const cached = history.filter(r => r.cached);

    const executionTimes = successful.map(r => r.executionTime).sort((a, b) => a - b);
    const averageExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((sum, t) => sum + t, 0) / executionTimes.length
      : 0;

    const p95Index = Math.floor(executionTimes.length * 0.95);
    const p99Index = Math.floor(executionTimes.length * 0.99);

    return {
      totalInvocations: history.length,
      successfulInvocations: successful.length,
      failedInvocations: failed.length,
      averageExecutionTime,
      p95ExecutionTime: executionTimes[p95Index] || 0,
      p99ExecutionTime: executionTimes[p99Index] || 0,
      averageMemoryUsed: successful.length > 0
        ? successful.reduce((sum, r) => sum + r.memoryUsed, 0) / successful.length
        : 0,
      cacheHitRate: history.length > 0 ? cached.length / history.length : 0,
      activeInstances: instances.filter(i => i.status === 'running').length,
    };
  }

  /**
   * 执行部署
   */
  private async executeDeployment(
    deployment: IEdgeFunctionDeployment
  ): Promise<void> {
    const config = this.functions.get(deployment.functionId)!;

    deployment.status = EdgeFunctionDeploymentStatus.BUILDING;
    deployment.progress = 10;

    // 模拟构建
    await this.delay(1000);

    deployment.status = EdgeFunctionDeploymentStatus.DEPLOYING;
    deployment.progress = 30;

    // 部署到各个区域
    for (const region of config.regions) {
      await this.deployToRegion(deployment, region);
      deployment.regions.set(region, true);
      deployment.progress = 30 + (60 * deployment.regions.size / config.regions.length);
    }

    deployment.status = EdgeFunctionDeploymentStatus.DEPLOYED;
    deployment.progress = 100;
    deployment.completedTime = new Date();

    // 启动实例
    if (config.minInstances > 0) {
      await this.warmUpFunction(deployment.functionId);
    }
  }

  /**
   * 部署到指定区域
   */
  private async deployToRegion(
    deployment: IEdgeFunctionDeployment,
    region: string
  ): Promise<void> {
    // 模拟部署延迟
    await this.delay(500);
    // 实际实现会调用边缘提供商的 API
  }

  /**
   * 选择最优节点
   */
  private async selectOptimalNode(config: IEdgeFunctionConfig): Promise<string> {
    // 根据区域、延迟、负载选择最优节点
    // 这里简化实现
    return `node-${config.regions[0]}-${Date.now()}`;
  }

  /**
   * 获取节点区域
   */
  private async getNodeRegion(nodeId: string): Promise<string> {
    // 从节点 ID 解析区域
    const parts = nodeId.split('-');
    return parts[1] || 'default';
  }

  /**
   * 执行函数
   */
  private async executeFunction(
    config: IEdgeFunctionConfig,
    options: IEdgeFunctionInvokeOptions,
    nodeId: string
  ): Promise<IEdgeFunctionResult> {
    // 实际实现会：
    // 1. 检查缓存
    // 2. 执行函数代码
    // 3. 返回结果

    // 这里模拟执行
    await this.delay(100);

    return {
      success: true,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: {
        message: 'Function executed successfully',
        timestamp: new Date().toISOString(),
      },
      executionTime: 100,
      memoryUsed: config.memory * 0.5, // 模拟使用 50% 内存
      nodeId,
      region: await this.getNodeRegion(nodeId),
      cached: false,
    };
  }

  /**
   * 启动实例
   */
  private async startInstance(
    config: IEdgeFunctionConfig
  ): Promise<IEdgeFunctionInstance> {
    const instance: IEdgeFunctionInstance = {
      id: this.generateInstanceId(),
      functionId: config.id,
      region: config.regions[0],
      nodeId: `node-${config.regions[0]}-${Date.now()}`,
      status: 'running',
      invocations: 0,
      memoryUsed: 0,
      cpuUsage: 0,
    };

    return instance;
  }

  /**
   * 停止实例
   */
  private async stopInstance(instance: IEdgeFunctionInstance): Promise<void> {
    instance.status = 'stopped';
  }

  /**
   * 记录调用历史
   */
  private recordInvocation(
    functionId: string,
    result: IEdgeFunctionResult
  ): void {
    const history = this.invocationHistory.get(functionId) || [];
    history.push(result);

    // 限制历史记录大小
    const maxHistorySize = 1000;
    if (history.length > maxHistorySize) {
      history.splice(0, history.length - maxHistorySize);
    }

    this.invocationHistory.set(functionId, history);
  }

  /**
   * 验证函数配置
   */
  private validateFunctionConfig(config: IEdgeFunctionConfig): void {
    if (!config.name) {
      throw new Error('Function name is required');
    }

    if (!config.runtime) {
      throw new Error('Function runtime is required');
    }

    if (!config.entryPoint) {
      throw new Error('Function entry point is required');
    }

    if (!config.source) {
      throw new Error('Function source is required');
    }

    if (config.triggers.length === 0) {
      throw new Error('At least one trigger is required');
    }

    if (config.memory < 128 || config.memory > 10240) {
      throw new Error('Memory must be between 128 and 10240 MB');
    }

    if (config.timeout < 100 || config.timeout > 300000) {
      throw new Error('Timeout must be between 100 and 300000 ms');
    }
  }

  /**
   * 生成函数 ID
   */
  private generateFunctionId(): string {
    return `func-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成实例 ID
   */
  private generateInstanceId(): string {
    return `inst-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成版本号
   */
  private generateVersion(): string {
    return `v${Date.now()}`;
  }

  /**
   * 延迟辅助函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    // 停止所有实例
    for (const [functionId, instances] of this.instances.entries()) {
      for (const instance of instances) {
        await this.stopInstance(instance);
      }
    }

    // 清理所有数据
    this.functions.clear();
    this.deployments.clear();
    this.instances.clear();
    this.invocationHistory.clear();
    this.warmFunctions.clear();
  }
}

/**
 * 边缘函数管理器单例导出
 */
export const edgeFunctionManager = EdgeFunctionManager.getInstance();
