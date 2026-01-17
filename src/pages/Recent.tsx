import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/contexts/authContext";
import { cn } from "@/lib/utils";
import { Empty } from "@/components/Empty";

// 最近文件类型定义
interface RecentFileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: string;
  accessed: string;
  accessedAgo: string;
  location: string;
  icon: string;
  color: string;
}

// 模拟最近文件数据
const mockRecentFiles: RecentFileItem[] = [
  {
    id: "1",
    name: "项目计划书.docx",
    type: "file",
    size: "1.2MB",
    accessed: "今天 09:45",
    accessedAgo: "2小时前",
    location: "我的文件 > 工作文档",
    icon: "fa-file-word",
    color: "text-blue-500",
  },
  {
    id: "2",
    name: "产品设计稿.png",
    type: "file",
    size: "3.7MB",
    accessed: "今天 08:10",
    accessedAgo: "3小时前",
    location: "我的文件 > 设计资源",
    icon: "fa-file-image",
    color: "text-pink-500",
  },
  {
    id: "3",
    name: "会议记录.pdf",
    type: "file",
    size: "845KB",
    accessed: "昨天 16:20",
    accessedAgo: "1天前",
    location: "共享文件 > 团队会议",
    icon: "fa-file-pdf",
    color: "text-red-500",
  },
  {
    id: "4",
    name: "开发资源包",
    type: "folder",
    accessed: "昨天 14:35",
    accessedAgo: "1天前",
    location: "我的文件 > 项目资料",
    icon: "fa-folder",
    color: "text-yellow-500",
  },
  {
    id: "5",
    name: "项目预算.xlsx",
    type: "file",
    size: "876KB",
    accessed: "2023-06-20",
    accessedAgo: "2天前",
    location: "我的文件 > 财务文档",
    icon: "fa-file-excel",
    color: "text-green-500",
  },
  {
    id: "6",
    name: "演示文稿.pptx",
    type: "file",
    size: "5.3MB",
    accessed: "2023-06-19",
    accessedAgo: "3天前",
    location: "共享文件 > 产品演示",
    icon: "fa-file-powerpoint",
    color: "text-orange-500",
  },
  {
    id: "7",
    name: "架构设计图.png",
    type: "file",
    size: "2.8MB",
    accessed: "2023-06-18",
    accessedAgo: "4天前",
    location: "我的文件 > 设计资源",
    icon: "fa-file-image",
    color: "text-pink-500",
  },
  {
    id: "8",
    name: "需求规格说明书.docx",
    type: "file",
    size: "1.5MB",
    accessed: "2023-06-17",
    accessedAgo: "5天前",
    location: "共享文件 > 产品需求",
    icon: "fa-file-word",
    color: "text-blue-500",
  },
  {
    id: "9",
    name: "客户反馈汇总.xlsx",
    type: "file",
    size: "642KB",
    accessed: "2023-06-15",
    accessedAgo: "1周前",
    location: "我的文件 > 客户资料",
    icon: "fa-file-excel",
    color: "text-green-500",
  },
  {
    id: "10",
    name: "市场调研报告.pdf",
    type: "file",
    size: "2.4MB",
    accessed: "2023-06-10",
    accessedAgo: "2周前",
    location: "共享文件 > 市场部",
    icon: "fa-file-pdf",
    color: "text-red-500",
  },
];

const Recent = () => {
  const { user } = useContext(AuthContext);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [files, setFiles] = useState<RecentFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "yesterday" | "week" | "month">("all");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // 模拟数据加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setFiles(mockRecentFiles);
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  // 切换视图模式
  const toggleViewMode = (mode: "list" | "grid") => {
    setViewMode(mode);
  };
  
  // 切换文件选择状态
  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };
  
  // 全选/取消全选
  const toggleSelectAll = () => {
    const filtered = getFilteredFiles();
    if (selectedItems.length === filtered.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filtered.map(file => file.id));
    }
  };
  
  // 根据筛选条件过滤文件
  const getFilteredFiles = () => {
    let result = files.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // 根据时间筛选
    if (timeFilter === "today") {
      result = result.filter(file => file.accessed.startsWith("今天"));
    } else if (timeFilter === "yesterday") {
      result = result.filter(file => file.accessed.startsWith("昨天"));
    } else if (timeFilter === "week") {
      result = result.filter(file => 
        file.accessedAgo.endsWith("天前") && parseInt(file.accessedAgo) <= 7
      );
    } else if (timeFilter === "month") {
      result = result.filter(file => 
        (file.accessedAgo.endsWith("天前") && parseInt(file.accessedAgo) <= 30) || 
        file.accessedAgo.endsWith("周前")
      );
    }
    
    return result;
  };
  
  // 渲染文件列表视图
  const renderListView = () => {
    const filtered = getFilteredFiles();
    
    if (loading) {
      return (
        <div className="space-y-4">  
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center gap-3 px-6 py-4">
              <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6 animate-pulse"></div>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse hidden md:block"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse hidden md:block"></div>
            </div>
          ))}
        </div>
      );
    }
    
    if (filtered.length === 0) {
      return <Empty />;
    }
    
    return (
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {filtered.map((file) => (
          <div 
            key={file.id}
            className={`group relative flex items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors duration-200 ${
              selectedItems.includes(file.id) ? "bg-blue-50 dark:bg-blue-900/20" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={selectedItems.includes(file.id)}
              onChange={() => toggleSelectItem(file.id)}
              className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
            />
            
            <div className={`w-10 h-10 rounded flex items-center justify-center ${file.color} bg-gray-100 dark:bg-gray-700 cursor-pointer`}>
              <i className={`fa-solid ${file.icon}`}></i>
            </div>
            
            <div className="ml-4 flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {file.name}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                <span>{file.location}</span>
                <span className="hidden md:block">•</span>
                <span className="md:hidden">{file.size} · {file.accessed}</span>
              </div>
            </div>
            
            <div className="hidden md:block text-sm text-gray-600 dark:text-gray-300 min-w-[80px]">
              {file.size || "-"}
            </div>
            
            <div className="hidden md:block text-sm text-gray-600 dark:text-gray-300 min-w-[120px]">
              {file.accessed}
            </div>
            
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
              <button className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200" aria-label="下载">
                <i className="fa-solid fa-download text-sm"></i>
              </button>
              <button className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200" aria-label="更多选项">
                <i className="fa-solid fa-ellipsis-v text-sm"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // 渲染文件网格视图
  const renderGridView = () => {
    const filtered = getFilteredFiles();
    
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
              <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      );
    }
    
    if (filtered.length === 0) {
      return <Empty />;
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((file) => (
          <div 
            key={file.id}
            className={`group relative flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md ${
              selectedItems.includes(file.id) ? "ring-2 ring-blue-500 dark:ring-blue-400 border-transparent" : "hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <div className="relative p-6 flex justify-center items-center bg-gray-50 dark:bg-gray-900/50">
              <input
                type="checkbox"
                checked={selectedItems.includes(file.id)}
                onChange={() => toggleSelectItem(file.id)}
                className="absolute top-2 left-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
              />
              
              <div className={`w-16 h-16 rounded flex items-center justify-center ${file.color} bg-gray-100 dark:bg-gray-700`}>
                <i className={`fa-solid ${file.icon} text-2xl`}></i>
              </div>
              
              <div className="absolute right-2 top-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                {file.accessedAgo}
              </div>
            </div>
            
            <div className="p-3 flex flex-col flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">
                {file.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                {file.location}
              </p>
              <div className="flex justify-between items-center mt-auto">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {file.size || "-"}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {file.accessed}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">最近文件</h1>
        <p className="text-gray-600 dark:text-gray-300">查看和访问您最近使用的文件</p>
      </div>
      
      {/* 工具栏 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 搜索栏 */}
          <div className="relative w-full lg:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fa-solid fa-search text-gray-400"></i>
            </div>
            <input
              type="text"
              placeholder="搜索最近文件..."
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* 时间筛选和视图切换 */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between">
            {/* 时间筛选按钮组 */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTimeFilter("all")}
                className={cn(
                  "px-3 py-2 text-sm rounded-lg transition-colors duration-200",
                  timeFilter === "all"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                )}
              >
                全部
              </button>
              <button
                onClick={() => setTimeFilter("today")}
                className={cn(
                  "px-3 py-2 text-sm rounded-lg transition-colors duration-200",
                  timeFilter === "today"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                )}
              >
                今天
              </button>
              <button
                onClick={() => setTimeFilter("yesterday")}
                className={cn( 
                  "px-3 py-2 text-sm rounded-lg transition-colors duration-200",
                  timeFilter === "yesterday"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                )}
              >
                昨天
              </button>
              <button
                onClick={() => setTimeFilter("week")}
                className={cn(
                  "px-3 py-2 text-sm rounded-lg transition-colors duration-200",
                  timeFilter === "week"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-gray-100 text-gray-700 dark-bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                )}
              >
                本周
              </button>
              <button
                onClick={() => setTimeFilter("month")}
                className={cn(
                  "px-3 py-2 text-sm rounded-lg transition-colors duration-200",
                  timeFilter === "month"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                )}
              >
                本月
              </button>
            </div>
            
            {/* 视图切换 */}
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={()=> toggleViewMode("list")}
                className={cn(
                  "p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200",
                  viewMode === "list" ? "bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400" : ""
                )}
                aria-label="列表视图"
              >
                <i className="fa-solid fa-list"></i>
              </button>
              <button
                onClick={() => toggleViewMode("grid")}
                className={cn(
                  "p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200",
                  viewMode === "grid" ? "bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400" : ""
                )}
                aria-label="网格视图"
              >
                <i className="fa-solid fa-th"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 文件列表/网格 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* 列表视图标题行 */}
        {viewMode === "list" && (
          <div className="hidden md:grid grid-cols-[40px_1fr_100px_140px] px-6 py-3 bg-gray-50 dark:bg-gray-900/50 text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <div>
              <input
                type="checkbox"
                checked={selectedItems.length > 0 && selectedItems.length === getFilteredFiles().length}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>文件名</div>
            <div>大小</div>
            <div>访问时间</div>
          </div>
        )}
        
        {/* 文件内容区域 */}
        {viewMode === "list" ? renderListView() : renderGridView()}
        
        {/* 空状态或加载状态会在renderListView/renderGridView中处理 */}
      </div>
      
      {/* 选中项目操作栏 */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 px-6 flex items-center justify-between shadow-lg z-20">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              已选择 {selectedItems.length} 个项目
            </div>
            <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1">
              <i className="fa-solid fa-trash"></i> 删除
            </button>
            <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1">
              <i className="fa-solid fa-download"></i> 下载
            </button>
          </div>
          <button 
            onClick={() => setSelectedItems([])}
            className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200"
          >
            取消选择
          </button>
        </div>
      )}
    </div>
  );
}

export default Recent;