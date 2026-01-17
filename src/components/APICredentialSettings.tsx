import { useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useApi } from '@/contexts/apiContext';

const APICredentialSettings = () => {
  const { 
    aid, 
    key, 
    authCode, 
    isRefreshing, 
    setAid, 
    setKey, 
    generateAuthCode 
  } = useApi();
  
  // 当组件挂载时检查是否有保存的AuthCode，如果有则启动定时器
  useEffect(() => {
    // 组件挂载时如果已有AuthCode，显示提示
    if (authCode) {
      toast.info('已加载保存的AuthCode');
    }
  }, [authCode]);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-md animate-on-load transition-all duration-700 delay-300 opacity-0 transform translate-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">API身份凭证设置</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">配置用于API请求的身份凭证</p>
      </div>
      
      <div className="space-y-4 mb-6">
        {/* API ID输入框 */}
        <div className="space-y-2">
          <label htmlFor="apiId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            API ID (aid)
          </label>
          <input
            id="apiId"
            type="text"
            value={aid}
            onChange={(e) => setAid(e.target.value)}
            placeholder="输入您的API ID"
            className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
            aria-describedby="apiIdHelp"
          />
          <p id="apiIdHelp" className="text-xs text-gray-500 dark:text-gray-400">API请求所需的ID参数</p>
        </div>
        
        {/* API Key输入框 */}
        <div className="space-y-2">
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            API Key
          </label>
          <div className="flex gap-2">
            <input
              id="apiKey"
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="输入您的API Key"
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
            />
            <button
              onClick={generateAuthCode}
              disabled={isRefreshing}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isRefreshing ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  生成中...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-key mr-2"></i>
                  生成
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* 自动刷新状态提示 */}
      {authCode && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200 flex items-center">
          <i className="fa-solid fa-info-circle mr-2 text-blue-500"></i>
          <span>AuthCode将在28分钟后自动刷新，确保API请求持续有效</span>
        </div>
      )}
      
      {/* API请求和AuthCode展示 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">AuthCode生成</h4>
          {authCode && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(authCode);
                toast.success('AuthCode已复制到剪贴板');
              }}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
            >
              <i className="fa-solid fa-copy mr-1"></i>复制
            </button>
          )}
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-sm font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">
          {authCode ? (
            <>
             <div className="mb-2 text-blue-600 dark:text-blue-400">https://api.snpan.com/opapi/GetAuthCode?aid={aid}&key={key}</div>
               <div className="mt-4 font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm break-all">{authCode}</div>
             </>
          ) : (
            <div className="text-gray-400 dark:text-gray-500 italic">
              输入API ID和Key并点击"生成"按钮获取AuthCode
            </div>
          )}
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400">
          全局API请求函数，将自动包含您设置的ID和Key参数，以及最新的AuthCode
        </p>
      </div>
    </div>
  );
};

export default APICredentialSettings;