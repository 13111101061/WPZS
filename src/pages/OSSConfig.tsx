import { useState } from "react";
import { toast } from "sonner";
import { useOSS, OSSProvider } from "@/contexts/ossContext";
import { cn } from "@/lib/utils";

// 对象存储提供商信息
const providers = [
  {
    id: 'aliyun' as const,
    name: '阿里云 OSS',
    icon: 'fa-cloud',
    color: 'bg-orange-500',
    description: '阿里云对象存储服务',
    defaultRegion: 'oss-cn-hangzhou',
  },
  {
    id: 'aws' as const,
    name: 'AWS S3',
    icon: 'fa-brands fa-aws',
    color: 'bg-yellow-500',
    description: 'Amazon Simple Storage Service',
    defaultRegion: 'us-east-1',
  },
  {
    id: 'tencent' as const,
    name: '腾讯云 COS',
    icon: 'fa-cloud',
    color: 'bg-blue-500',
    description: '腾讯云对象存储服务',
    defaultRegion: 'ap-guangzhou',
  },
  {
    id: 'minio' as const,
    name: 'MinIO',
    icon: 'fa-server',
    color: 'bg-red-500',
    description: '自托管对象存储',
    defaultRegion: 'us-east-1',
  },
  {
    id: 'custom' as const,
    name: '自定义',
    icon: 'fa-cog',
    color: 'bg-gray-500',
    description: '兼容S3 API的对象存储',
    defaultRegion: '',
  },
];

// 配置表单组件
const ConfigForm = () => {
  const { config, setConfig, testConnection, clearConfig, isConnected, isTesting } = useOSS();
  const [showSecret, setShowSecret] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(config.provider);

  const handleProviderChange = (providerId: typeof config.provider) => {
    setSelectedProvider(providerId);
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      setConfig({
        provider: providerId,
        region: provider.defaultRegion,
      });
    }
  };

  const handleSaveAndTest = async () => {
    await testConnection();
  };

  const handleClearConfig = () => {
    if (confirm('确定要清除对象存储配置吗？')) {
      clearConfig();
      setSelectedProvider('aliyun');
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">对象存储配置</h1>
        <p className="text-gray-600 dark:text-gray-300">配置对象存储服务以扩展您的存储空间</p>
      </div>

      {/* 配置状态卡片 */}
      <div className={cn(
        "rounded-xl border p-6 transition-all duration-300",
        isConnected
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            isConnected ? "bg-green-500" : "bg-yellow-500"
          )}>
            <i className={cn(
              "fa-solid text-white text-lg",
              isConnected ? "fa-check" : "fa-exclamation-triangle"
            )}></i>
          </div>
          <div className="flex-1">
            <h3 className={cn(
              "font-semibold",
              isConnected ? "text-green-900 dark:text-green-100" : "text-yellow-900 dark:text-yellow-100"
            )}>
              {isConnected ? '对象存储已连接' : '对象存储未配置'}
            </h3>
            <p className={cn(
              "text-sm",
              isConnected ? "text-green-700 dark:text-green-300" : "text-yellow-700 dark:text-yellow-300"
            )}>
              {isConnected
                ? `已连接到 ${providers.find(p => p.id === config.provider)?.name} - ${config.bucketName}`
                : '请配置对象存储以使用相关功能'
              }
            </p>
          </div>
          {isConnected && (
            <button
              onClick={handleClearConfig}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              清除配置
            </button>
          )}
        </div>
      </div>

      {/* 提供商选择 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">选择存储提供商</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleProviderChange(provider.id)}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all duration-200",
                selectedProvider === provider.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  provider.color
                )}>
                  <i className={cn("fa-solid text-white", provider.icon)}></i>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{provider.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{provider.description}</p>
                </div>
              </div>
              {selectedProvider === provider.id && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-check text-white text-xs"></i>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 配置表单 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">连接配置</h3>

        <div className="space-y-4">
          {/* Access Key ID */}
          <div className="space-y-2">
            <label htmlFor="accessKeyId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Access Key ID <span className="text-red-500">*</span>
            </label>
            <input
              id="accessKeyId"
              type="text"
              value={config.accessKeyId}
              onChange={(e) => setConfig({ accessKeyId: e.target.value })}
              placeholder="输入您的Access Key ID"
              className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
            />
          </div>

          {/* Access Key Secret */}
          <div className="space-y-2">
            <label htmlFor="accessKeySecret" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Access Key Secret <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="accessKeySecret"
                type={showSecret ? "text" : "password"}
                value={config.accessKeySecret}
                onChange={(e) => setConfig({ accessKeySecret: e.target.value })}
                placeholder="输入您的Access Key Secret"
                className="block w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <i className={cn("fa-solid", showSecret ? "fa-eye-slash" : "fa-eye")}></i>
              </button>
            </div>
          </div>

          {/* Bucket Name */}
          <div className="space-y-2">
            <label htmlFor="bucketName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bucket 名称 <span className="text-red-500">*</span>
            </label>
            <input
              id="bucketName"
              type="text"
              value={config.bucketName}
              onChange={(e) => setConfig({ bucketName: e.target.value })}
              placeholder="输入存储桶名称"
              className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
            />
          </div>

          {/* Region */}
          <div className="space-y-2">
            <label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              区域/Region <span className="text-red-500">*</span>
            </label>
            <input
              id="region"
              type="text"
              value={config.region}
              onChange={(e) => setConfig({ region: e.target.value })}
              placeholder="例如: oss-cn-hangzhou"
              className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedProvider === 'aliyun' && '例如: oss-cn-hangzhou, oss-cn-beijing'}
              {selectedProvider === 'aws' && '例如: us-east-1, eu-west-1'}
              {selectedProvider === 'tencent' && '例如: ap-guangzhou, ap-beijing'}
              {selectedProvider === 'minio' && 'MinIO默认使用 us-east-1'}
              {selectedProvider === 'custom' && '根据您的服务提供商填写'}
            </p>
          </div>

          {/* Endpoint - 仅对MinIO和自定义显示 */}
          {(selectedProvider === 'minio' || selectedProvider === 'custom') && (
            <div className="space-y-2">
              <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                自定义端点 <span className="text-red-500">*</span>
              </label>
              <input
                id="endpoint"
                type="text"
                value={config.endpoint || ''}
                onChange={(e) => setConfig({ endpoint: e.target.value })}
                placeholder="例如: https://minio.example.com"
                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                对于自托管或兼容S3的服务，请输入完整的API端点URL
              </p>
            </div>
          )}

          {/* Prefix - 可选 */}
          <div className="space-y-2">
            <label htmlFor="prefix" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              文件前缀（可选）
            </label>
            <input
              id="prefix"
              type="text"
              value={config.prefix || ''}
              onChange={(e) => setConfig({ prefix: e.target.value })}
              placeholder="例如: uploads/"
              className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              所有文件将存储在此前缀下，便于组织管理
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleSaveAndTest}
            disabled={isTesting}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200",
              isTesting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow"
            )}
          >
            {isTesting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>测试连接中...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-plug"></i>
                <span>测试连接</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 帮助信息 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-info text-white"></i>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">配置说明</h4>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>• 请确保您的存储桶已创建并具有适当的访问权限</li>
              <li>• Access Key需要具有读取和写入对象的权限</li>
              <li>• 配置信息将安全地存储在本地浏览器中</li>
              <li>• 连接成功后，您可以在文件管理中直接上传到对象存储</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// 主页面组件，包裹OSS Provider
const OSSConfigPage = () => {
  return (
    <OSSProvider>
      <ConfigForm />
    </OSSProvider>
  );
};

export default OSSConfigPage;
