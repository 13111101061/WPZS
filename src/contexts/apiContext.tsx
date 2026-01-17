import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

// API上下文类型定义
interface ApiContextType {
  aid: string;
  key: string;
  authCode: string;
  isRefreshing: boolean;
  setAid: (aid: string) => void;
  setKey: (key: string) => void;
  generateAuthCode: () => Promise<boolean>;
  lastUsed: number;
  setLastUsed: (time: number) => void;
  apiRequest: <T>(endpoint: string, params?: Record<string, string>) => Promise<T | null>;
}

// 创建上下文
const ApiContext = createContext<ApiContextType | undefined>(undefined);

// API提供者组件
export const ApiProvider = ({ children }: { children: ReactNode }) => {
  // 状态定义
  const [aid, setAid] = useState('');
  const [key, setKey] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTimer, setRefreshTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [lastUsed, setLastUsed] = useState(0);

  // 从localStorage加载数据
  useEffect(() => {
    const savedAid = localStorage.getItem('api_aid');
    const savedKey = localStorage.getItem('api_key');
    const savedAuthCode = localStorage.getItem('api_authCode');
    const savedLastUsed = localStorage.getItem('api_lastUsed');
    
    if (savedAid) setAid(savedAid);
    if (savedKey) setKey(savedKey);
    if (savedAuthCode) setAuthCode(savedAuthCode);
    if (savedLastUsed) setLastUsed(parseInt(savedLastUsed));
  }, []);

  // 保存API ID和Key到localStorage
  useEffect(() => {
    if (aid) {
      localStorage.setItem('api_aid', aid);
    } else {
      localStorage.removeItem('api_aid');
    }
    
    if (key) {
      localStorage.setItem('api_key', key);
    } else {
      localStorage.removeItem('api_key');
    }
  }, [aid, key]);

  // 保存AuthCode到localStorage
  useEffect(() => {
    if (authCode) {
      localStorage.setItem('api_authCode', authCode);
    } else {
      localStorage.removeItem('api_authCode');
    }
  }, [authCode]);

  // 保存最后使用时间到localStorage
  useEffect(() => {
    localStorage.setItem('api_lastUsed', lastUsed.toString());
  }, [lastUsed]);

  // 生成/刷新AuthCode的函数
  const generateAuthCode = async () => {
    if (!aid || !key) {
      toast.error('请先输入API ID和Key');
      return;
    }
    
    setIsRefreshing(true);
    
    try {
      // 构建API请求URL
      const apiUrl = `https://api.snpan.com/opapi/GetAuthCode?aid=${encodeURIComponent(aid)}&key=${encodeURIComponent(key)}`;
      
      // 发起API请求
      const response = await fetch(apiUrl);
      const result = await response.json();
      
      if (response.ok && result.code === 200) {
        setAuthCode(result.data);
        toast.success('AuthCode生成成功');
        setLastUsed(Date.now());
        return true;
      } else {
        toast.error(`生成失败: ${result.msg || '未知错误'}`);
        return false;
      }
    } catch (error) {
      toast.error('API请求失败，请检查网络连接');
      console.error('AuthCode生成失败:', error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  // 设置定时刷新
  useEffect(() => {
    // 清除现有定时器
    if (refreshTimer) {
      clearInterval(refreshTimer);
      setRefreshTimer(null);
    }
    
    // 如果有有效的AuthCode、aid和key，并且最近30分钟内使用过，则设置定时器
    const shouldStartTimer = authCode && aid && key && (Date.now() - lastUsed < 30 * 60 * 1000);
    
    if (shouldStartTimer) {
      // 每28分钟刷新一次
      const timer = setInterval(async () => {
        console.log('自动刷新AuthCode');
        await generateAuthCode();
      }, 28 * 60 * 1000);
      
      setRefreshTimer(timer);
    }
    
    // 组件卸载时清除定时器
    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, [authCode, aid, key, lastUsed]);

  // 提供上下文值
  // 创建通用API请求函数
  const apiRequest = async <T = any>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> => {
    if (!authCode) {
      toast.error('请先生成API身份凭证');
      return null;
    }
    
    try {
      // 添加AuthCode到参数
      const requestParams = {
        authcode: authCode,
        ...params
      };
      
      // 构建URL
      const queryParams = new URLSearchParams(requestParams);
      const url = `https://api.snpan.com${endpoint}?${queryParams.toString()}`;
      
      // 发起请求
      const response = await fetch(url);
      const result = await response.json();
      
      // 更新最后使用时间
      setLastUsed(Date.now());
      
      if (response.ok && result.code === 200) {
        return result.data;
      } else {
        toast.error(`API请求失败: ${result.msg || '未知错误'}`);
        return null;
      }
    } catch (error) {
      toast.error('网络请求失败，请检查网络连接');
      console.error('API请求错误:', error);
      return null;
    }
  };

  const value = {
    aid,
    key,
    authCode,
    isRefreshing,
    setAid,
    setKey,
    generateAuthCode,
    lastUsed,
    setLastUsed,
    apiRequest
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

// 自定义Hook，方便组件使用API上下文
export const useApi = () => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};