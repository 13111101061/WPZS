import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

// 对象存储提供商类型
export type OSSProvider = 'aliyun' | 'aws' | 'minio' | 'tencent' | 'custom';

// 对象存储配置类型
export interface OSSConfig {
  provider: OSSProvider;
  accessKeyId: string;
  accessKeySecret: string;
  bucketName: string;
  region: string;
  endpoint?: string; // 自定义端点，用于MinIO或私有云
  prefix?: string; // 文件前缀
  isConfigured: boolean;
}

// 对象存储上下文类型
interface OSSContextType {
  config: OSSConfig;
  setConfig: (config: Partial<OSSConfig>) => void;
  testConnection: () => Promise<boolean>;
  clearConfig: () => void;
  isConnected: boolean;
  isTesting: boolean;
}

const defaultConfig: OSSConfig = {
  provider: 'aliyun',
  accessKeyId: '',
  accessKeySecret: '',
  bucketName: '',
  region: '',
  endpoint: '',
  prefix: '',
  isConfigured: false,
};

const OSSContext = createContext<OSSContextType | undefined>(undefined);

export const OSSProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfigState] = useState<OSSConfig>(defaultConfig);
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // 从localStorage加载配置
  useEffect(() => {
    const savedConfig = localStorage.getItem('oss_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfigState(parsed);
        if (parsed.isConfigured) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Failed to parse OSS config:', error);
      }
    }
  }, []);

  // 保存配置到localStorage
  useEffect(() => {
    if (config.isConfigured) {
      localStorage.setItem('oss_config', JSON.stringify(config));
    } else {
      localStorage.removeItem('oss_config');
    }
  }, [config]);

  const setConfig = (newConfig: Partial<OSSConfig>) => {
    setConfigState(prev => ({
      ...prev,
      ...newConfig,
      isConfigured: !!(newConfig.accessKeyId && newConfig.accessKeySecret && newConfig.bucketName && newConfig.region),
    }));
  };

  const testConnection = async (): Promise<boolean> => {
    if (!config.accessKeyId || !config.accessKeySecret || !config.bucketName || !config.region) {
      toast.error('请先填写完整的配置信息');
      return false;
    }

    setIsTesting(true);

    try {
      // 模拟连接测试（实际项目中应该调用真实的API）
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 根据不同的提供商进行不同的测试逻辑
      const testMessage = {
        aliyun: '阿里云OSS',
        aws: 'AWS S3',
        minio: 'MinIO',
        tencent: '腾讯云COS',
        custom: '自定义对象存储',
      }[config.provider];

      // 这里应该添加实际的连接测试代码
      // 例如：使用阿里云OSS SDK测试连接
      // const OSS = require('ali-oss');
      // const client = new OSS({...config});
      // await client.list();

      toast.success(`成功连接到${testMessage}`);
      setIsConnected(true);
      setConfig({ isConfigured: true });
      return true;
    } catch (error) {
      toast.error('连接失败，请检查配置信息');
      console.error('OSS connection test failed:', error);
      setIsConnected(false);
      return false;
    } finally {
      setIsTesting(false);
    }
  };

  const clearConfig = () => {
    setConfigState(defaultConfig);
    setIsConnected(false);
    localStorage.removeItem('oss_config');
    toast.success('已清除对象存储配置');
  };

  const value: OSSContextType = {
    config,
    setConfig,
    testConnection,
    clearConfig,
    isConnected,
    isTesting,
  };

  return <OSSContext.Provider value={value}>{children}</OSSContext.Provider>;
};

export const useOSS = () => {
  const context = useContext(OSSContext);
  if (context === undefined) {
    throw new Error('useOSS must be used within an OSSProvider');
  }
  return context;
};
