import { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { AuthContext } from "@/contexts/authContext";
import { cn } from "@/lib/utils";
import { Empty } from "@/components/Empty";

// 存储使用历史数据
const storageHistoryData = [
  { name: "1月", usage: 0.5 },
  { name: "2月", usage: 0.7 },
  { name: "3月", usage: 0.9 },
  { name: "4月", usage: 1.0 },
  { name: "5月", usage: 1.1 },
  { name: "6月", usage: 1.2 },
];

// 文件类型分布数据
const fileTypeData = [
  { name: "文档", value: 350, color: "#3b82f6" }, // 蓝色
  { name: "图片", value: 280, color: "#ec4899" }, // 粉色
  { name: "视频", value: 220, color: "#10b981" }, // 绿色
  { name: "音频", value: 100, color: "#f59e0b" }, // 橙色{ name: "其他", value: 50, color: "#6b7280" }, // 灰色
];

// 存储使用明细数据
const storageDetails = [
  { id: 1, name: "项目资料", size: "450MB", percentage: 45 },
  { id: 2, name: "个人照片", size: "320MB", percentage: 32 },
  { id: 3, name: "视频文件", size: "210MB", percentage: 21 },
  { id: 4, name: "音乐收藏", size: "95MB", percentage: 9.5 },
  { id: 5, name: "其他文件", size: "25MB", percentage: 2.5 },
];

const Storage = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  
  // 计算存储使用率百分比
  const storagePercentage = Math.round((user.storageUsed / user.storageTotal) * 100);
  const storageRemaining = (user.storageTotal - user.storageUsed).toFixed(1);
  
  // 模拟数据加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">存储空间</h1>
        <p className="text-gray-600 dark:text-gray-300">管理您的存储空间和查看使用情况</p>
      </div>
      
      {/* 存储概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">总存储空间</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{user.storageTotal} GB</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <i className="fa-solid fa-hdd"></i>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">已使用</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{user.storageUsed} GB</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{storagePercentage}% 已使用</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <i className="fa-solid fa-chart-line"></i>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">剩余空间</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{storageRemaining} GB</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">尚可存储约 {Math.round(parseFloat(storageRemaining) * 1024)} MB</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
              <i className="fa-solid fa-chart-pie"></i>
            </div>
          </div>
        </div>
      </div>
      
      {/* 存储使用进度 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-md">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-40 h-40 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 16 * storagePercentage / 100} ${2 * Math.PI * 16 * (100 - storagePercentage) / 100}`}
                strokeDashoffset={0}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{storagePercentage}%</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">已使用</span>
            </div>
          </div>
          
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">存储空间使用情况</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200">
                升级存储空间
              </button>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${storagePercentage}%` }}
                aria-label={`存储空间使用: ${storagePercentage}%`}
              ></div>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">已使用: {user.storageUsed} GB</span>
              <span className="text-gray-600 dark:text-gray-300">总容量: {user.storageTotal} GB</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 存储使用趋势图表 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">存储使用趋势</h3>
          
          {loading ? (
            <div className="h-64 w-full bg-gray-100 dark:bg-gray-900/50 rounded-lg animate-pulse"></div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={storageHistoryData}>
                  <defs>
                    <linearGradient id="storageGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9ca3af" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value} GB`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [`${value} GB`, '使用量']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="usage" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#storageGradient)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        
        {/* 文件类型分布图表 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">文件类型分布</h3>
          
          {loading ? (
            <div className="h-64 w-full bg-gray-100 dark:bg-gray-900/50 rounded-lg animate-pulse"></div>
          ) : (
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fileTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    animationDuration={1500}
                    animationBegin={300}
                  >
                    {fileTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} MB`, '大小']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingLeft: '20px' }}
                    formatter={(value) => <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
      
      {/* 存储使用明细 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">存储使用明细</h3>
        </div>
        
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/8 animate-pulse"></div>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {storageDetails.map((item) => (
              <div key={item.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors duration-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{item.size} ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200">
            查看全部存储明细
          </button>
        </div>
      </div>
      
      {/* 升级存储空间卡片 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md overflow-hidden">
        <div className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold text-white mb-2">需要更多存储空间?</h3>
            <p className="text-blue-100 max-w-md">
              升级您的存储空间计划，获取更多容量、高级功能和优先支持
            </p>
          </div>
          <button className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-6 py-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2">
            <i className="fa-solid fa-rocket"></i>
            <span>查看升级方案</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Storage;