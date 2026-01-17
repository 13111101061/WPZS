import { useContext, useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AuthContext } from "@/contexts/authContext";
import { cn } from "@/lib/utils";
import { Empty } from "@/components/Empty";
import APICredentialSettings from "@/components/APICredentialSettings";
import { toast } from "sonner";

// 模拟存储使用历史数据
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
  { name: "文档", value: 35, color: "#3b82f6" }, // 蓝色
  { name: "图片", value: 28, color: "#ec4899" }, // 粉色
  { name: "视频", value: 22, color: "#10b981" }, // 绿色
  { name: "音频", value: 10, color: "#f59e0b" }, // 橙色
  { name: "其他", value: 5, color: "#6b7280" }, // 灰色
];

// 模拟最近文件数据
const recentFiles = [
  {
    id: 1,
    name: "项目计划书.docx",
    type: "document",
    size: "1.2MB",
    modified: "今天 09:45",
    icon: "fa-file-word",
    color: "text-blue-500",
  },
  {
    id: 2,
    name: "产品设计稿.png",
    type: "image",
    size: "3.7MB",
    modified: "昨天 16:20",
    icon: "fa-file-image",
    color: "text-pink-500",
  },
  {
    id: 3,
    name: "会议记录.pdf",
    type: "pdf",
    size: "845KB",
    modified: "2023-06-15",
    icon: "fa-file-pdf",
    color: "text-red-500",
  },
  {
    id: 4,
    name: "开发资源包",
    type: "folder",
    size: "12个文件",
    modified: "2023-06-10",
    icon: "fa-folder",
    color: "text-yellow-500",
  },
];

// 模拟最近共享文件数据
const recentSharedFiles = [
  {
    id: 101,
    name: "季度报告.xlsx",
    sharedWith: "张三, 李四",
    modified: "今天 11:20",
    icon: "fa-file-excel",
    color: "text-green-500",
  },
  {
    id: 102,
    name: "产品原型图.fig",
    sharedWith: "设计团队",
    modified: "昨天 14:35",
    icon: "fa-file-image",
    color: "text-pink-500",
  },
];

const Home = () => {
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 计算存储使用率百分比
  const storagePercentage = Math.round((user.storageUsed / user.storageTotal) * 100);
  const storageRemaining = (user.storageTotal - user.storageUsed).toFixed(1);
  
  // 快速操作按钮点击处理
  const handleQuickAction = (action: string) => {
    setIsLoading(true);
    // 模拟操作延迟
    setTimeout(() => {
      setIsLoading(false);
      toast.success(action === "upload" ? "文件上传功能已激活" : "新建文件夹功能已激活");
    }, 800);
  };
  
  // 处理拖放事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files.length > 0) {
      toast.success(`检测到 ${e.dataTransfer.files.length} 个文件，准备上传`);
      // 这里会处理文件上传逻辑
    }
  };
  
  // 触发文件选择对话框
  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      toast.success(`已选择 ${e.target.files.length} 个文件`);
      // 重置input值，允许重复选择相同文件
      e.target.value = '';
    }
  };
  
  // 搜索处理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.info(`搜索内容: ${searchQuery}`);
      // 这里会处理搜索逻辑
    }
  };
  
  // 添加页面载入动画效果
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('.animate-on-load').forEach(el => {
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.transform = 'translateY(0)';
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8 px-4 py-6">
      {/* Hero区域 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 shadow-xl transform transition-all duration-500 hover:shadow-2xl">
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-white dark:bg-blue-900 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-64 h-64 bg-white dark:bg-indigo-900 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="relative z-10 max-w-2xl animate-on-load transition-all duration-700 opacity-0 transform translate-y-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">欢迎回来，{user.name}</h1>
          <p className="text-blue-100 mb-6 max-w-lg">继续您的工作或浏览最近文件，所有内容安全存储</p>
          
          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fa-solid fa-search text-blue-300"></i>
              </div>
              <input
                type="text"
                placeholder="搜索文件和文件夹..."
                className="block w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-white/30 focus:border-transparent outline-none transition-all duration-300 transform hover:scale-[1.02] focus:scale-[1.02]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit"
                className="absolute inset-y-0 right-0 px-4 flex items-center bg-white/20 hover:bg-white/30 transition-colors duration-300 rounded-r-xl"
              >
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* 快速上传区域 */}
      <div 
        className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
          isDragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-[1.01]' 
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
        } animate-on-load transition-all duration-700 delay-100 opacity-0 transform translate-y-4 bg-white dark:bg-gray-800`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileUploadClick}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple
          onChange={handleFileSelect}
        />
        
        <div className="flex flex-col items-center justify-center">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${isDragOver ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'} transition-all duration-300 transform hover:scale-110`}>
            <i className="fa-solid fa-cloud-upload-alt text-2xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1 mt-4">拖放文件到此处上传</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            或点击此区域选择文件，支持多种格式
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuickAction("upload");
              }}
              disabled={isLoading}className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                <i className="fa-solid fa-upload"></i>
              )}
              <span>上传文件</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuickAction("new-folder");
              }}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 font-medium rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-folder-plus"></i>
              <span>新建文件夹</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* 存储和快速访问区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 存储状态卡片 */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-xl animate-on-load transition-all duration-700 delay-100 opacity-0 transform translate-y-4">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">存储空间</h3>
            <p className="text-gray-600 dark:text-gray-300">管理您的存储空间使用情况</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">使用趋势</h4>
                <div className="h-60 w-full bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={storageHistoryData}>
                      <defs>
                        <linearGradient id="storageGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" tickFormatter={(value) => `${value} GB`} />
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
              </div>
              
              <div className="flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">文件类型分布</h4>
                  <div className="h-48 w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={fileTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
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
                          formatter={(value) => [`${value}%`, '占比']}
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">已使用 / 总容量</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.storageUsed}GB / {user.storageTotal}GB</p>
                  </div>
                  <Link 
                    to="/storage" 
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-all duration-200 hover:translate-x-1"
                  >
                    查看详情 <i className="fa-solid fa-angle-right ml-1 text-xs"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 快速访问卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-xl animate-on-load transition-all duration-700 delay-300 opacity-0 transform translate-y-4">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">快速访问</h3>
            <p className="text-gray-600 dark:text-gray-300">快速跳转到常用功能</p>
          </div>
          
          <div className="p-4">
            <div className="space-y-3">
              <Link
                to="/recent"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                  <i className="fa-solid fa-clock text-xl"></i>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">最近文件</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">查看最近访问的文件</p>
                </div>
              </Link>
              
              <Link
                to="/shared"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300">
                  <i className="fa-solid fa-share-alt text-xl"></i>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">共享文件</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">查看共享的文件和文件夹</p>
                </div>
              </Link>
              
              <Link
                to="/files?type=starred"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform duration-300">
                  <i className="fa-solid fa-star text-xl"></i>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">已收藏</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">查看您收藏的项目</p>
                </div>
              </Link>
              
              <Link
                to="/storage"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
                  <i className="fa-solid fa-database text-xl"></i>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">存储管理</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">管理您的存储空间</p>
                </div>
              </Link>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">存储空间提示</h4>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 transform transition-all duration-300 hover:shadow-md">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <i className="fa-solid fa-lightbulb mr-2 text-blue-500"></i>
                  您可以通过删除不需要的大文件来释放存储空间
                </p>
              </div>
            </div>
          </div>
         </div>
      </div>
      
      {/* API凭证设置区域 */}
      <div className="grid grid-cols-1 gap-8">
        <APICredentialSettings />
      </div>
      
      {/* 最近文件和最近共享区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 最近文件列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-xl animate-on-load transition-all duration-700 delay-400 opacity-0 transform translate-y-4">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">最近文件</h3>
              <p className="text-gray-600 dark:text-gray-300">您最近访问的文件</p>
            </div>
            <Link 
              to="/recent" 
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-200 hover:translate-x-1"
            >
              查看全部
            </Link>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentFiles.map((file) => (
              <div 
                key={file.id}
                className="group relative flex items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all duration-200 cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${file.color} bg-gray-100 dark:bg-gray-700 group-hover:scale-110 transition-transform duration-300`}>
                  <i className={`fa-solid ${file.icon} text-xl`}></i>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate">
                    {file.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {file.size} · {file.modified}
                  </p>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2 translate-x-4 group-hover:translate-x-0">
                  <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 transform hover:scale-110" aria-label="下载" title="下载">
                    <i className="fa-solid fa-download"></i>
                  </button>
                  <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 transform hover:scale-110" aria-label="分享" title="分享">
                    <i className="fa-solid fa-share-alt"></i>
                  </button>
                  <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 transform hover:scale-110" aria-label="更多选项" title="更多选项">
                    <i className="fa-solid fa-ellipsis-v"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <Link 
              to="/files" 
              className="block text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium py-2 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
            >
              浏览所有文件
            </Link>
          </div>
        </div>
        
        {/* 最近共享文件 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-xl animate-on-load transition-all duration-700 delay-500 opacity-0 transform translate-y-4">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">最近共享</h3>
              <p className="text-gray-600 dark:text-gray-300">您最近共享的文件</p>
            </div>
            <Link 
              to="/shared" 
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-200 hover:translate-x-1"
            >
              查看全部
            </Link>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentSharedFiles.map((file) => (
              <div 
                key={file.id}
                className="group relative flex items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all duration-200 cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${file.color} bg-gray-100 dark:bg-gray-700 group-hover:scale-110 transition-transform duration-300`}>
                  <i className={`fa-solid ${file.icon} text-xl`}></i>
                </div>
                
                <div className="ml-4 flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate">
                    {file.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    共享给: {file.sharedWith} · {file.modified}
                  </p>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2 translate-x-4 group-hover:translate-x-0">
                  <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 transform hover:scale-110" aria-label="管理共享" title="管理共享">
                    <i className="fa-solid fa-user-plus"></i>
                  </button>
                  <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 transform hover:scale-110" aria-label="更多选项" title="更多选项">
                    <i className="fa-solid fa-ellipsis-v"></i>
                  </button>
                </div>
              </div>
            ))}
            
            {/* 添加空状态 */}
            {recentSharedFiles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 mb-4 transform transition-all duration-300 hover:scale-110">
                  <i className="fa-solid fa-share-alt text-2xl"></i>
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-1">暂无共享文件</h4>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs">您还没有共享任何文件，点击下方按钮开始共享</p>
                <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  <i className="fa-solid fa-share-alt"></i>
                  <span>新建共享</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 隐藏的文件上传input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        multiple
        onChange={handleFileSelect}
      />
    </div>
  );
}

export default Home;