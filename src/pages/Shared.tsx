import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/contexts/authContext";
import { cn } from "@/lib/utils";
import { Empty } from "@/components/Empty";

// 共享文件类型定义
interface SharedFileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: string;
  modified: string;
  sharedWith: string[];
  sharedBy: string;
  accessLevel: "view" | "edit" | "owner";
  icon: string;
  color: string;
}

// 模拟共享文件数据
const mockSharedFiles: SharedFileItem[] = [
  {
    id: "1",
    name: "项目计划书.docx",
    type: "file",
    size: "1.2MB",
    modified: "今天 09:45",
    sharedWith: ["张三", "李四", "王五"],
    sharedBy: "我",
    accessLevel: "owner",
    icon: "fa-file-word",
    color: "text-blue-500",
  },
  {
    id: "2",
    name: "产品设计稿.png",
    type: "file",
    size: "3.7MB",
    modified: "昨天 16:20",
    sharedWith: ["设计团队"],
    sharedBy: "我",
    accessLevel: "owner",
    icon: "fa-file-image",
    color: "text-pink-500",
  },
  {
    id: "3",
    name: "市场调研报告.pdf",
    type: "file",
    size: "2.4MB",
    modified: "2023-06-18",
    sharedWith: [],
    sharedBy: "赵六",
    accessLevel: "edit",
    icon: "fa-file-pdf",
    color: "text-red-500",
  },
  {
    id: "4",
    name: "开发资源库",
    type: "folder",
    modified: "2023-06-15",
    sharedWith: ["开发团队", "测试团队"],
    sharedBy: "我",
    accessLevel: "owner",
    icon: "fa-folder",
    color: "text-yellow-500",
  },
  {
    id: "5",
    name: "季度财务报表.xlsx",
    type: "file",
    size: "876KB",
    modified: "2023-06-12",
    sharedWith: [],
    sharedBy: "财务部门",
    accessLevel: "view",
    icon: "fa-file-excel",
    color: "text-green-500",
  },
  {
    id: "6",
    name: "产品需求文档.docx",
    type: "file",
    size: "1.5MB",
    modified: "2023-06-10",
    sharedWith: ["产品经理", "开发主管"],
    sharedBy: "我",
    accessLevel: "owner",
    icon: "fa-file-word",
    color: "text-blue-500",
  },
];

const Shared = () => {
  const { user } = useContext(AuthContext);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [files, setFiles] = useState<SharedFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "sharedByMe" | "sharedWithMe">("all");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // 模拟数据加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setFiles(mockSharedFiles);
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
    
    if (filter === "sharedByMe") {
      result = result.filter(file => file.sharedBy === "我");
    } else if (filter === "sharedWithMe") {
      result = result.filter(file => file.sharedBy !== "我");
    }
    
    return result;
  };
  
  // 获取访问权限标签样式
  const getAccessLevelBadge = (level: string) => {
    switch (level) {
      case "owner":
        return (
          <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
            所有者
          </span>
        );
      case "edit":
        return (
          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
            可编辑
          </span>
        );
      case "view":
        return (
          <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
            仅查看
          </span>
        );
      default:
        return null;
    }
  };
  
  // 渲染共享者列表
  const renderSharedWith = (sharedWith: string[]) => {
    if (sharedWith.length === 0) return null;
    
    return (
      <div className="flex -space-x-2">
        {sharedWith.slice(0, 3).map((person, index) => (
          <div 
            key={index}
            className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-xs flex items-center justify-center border-2 border-white dark:border-gray-800"
            title={person}
          >
            {person.charAt(0)}
          </div>
        ))}
        {sharedWith.length > 3 && (
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-xs flex items-center justify-center border-2 border-white dark:border-gray-800">
            +{sharedWith.length - 3}
          </div>
        )}
      </div>
    );
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
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
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
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {file.name}
                </h3>
                {getAccessLevelBadge(file.accessLevel)}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {file.sharedBy === "我" ? "共享给:" : "共享者:"} {file.sharedBy === "我" ? file.sharedWith.join(", ") : file.sharedBy}
                </span>
                <span className="hidden md:inline">•</span>
                <span className="md:hidden">{file.size} · {file.modified}</span>
              </div>
            </div>
            
            <div className="hidden md:block text-sm text-gray-600 dark:text-gray-300 min-w-[80px]">
              {file.size || "-"}
            </div>
            
            <div className="hidden md:block text-sm text-gray-600 dark:text-gray-300 min-w-[120px]">
              {file.modified}
            </div>
            
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
              <button className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200" aria-label="管理共享">
                <i className="fa-solid fa-share-alt text-sm"></i>
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
              
              <div className="absolute right-2 bottom-2 flex gap-1">
                {renderSharedWith(file.sharedWith)}
              </div>
            </div>
            
            <div className="p-3 flex flex-col flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {file.name}
                </h3>
                {getAccessLevelBadge(file.accessLevel)}
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {file.sharedBy === "我" ? "共享给:" : "共享者:"} {file.sharedBy === "我" ? file.sharedWith.slice(0, 2).join(", ") + (file.sharedWith.length > 2 ? ` 等${file.sharedWith.length}人` : "") : file.sharedBy}
              </div>
              
              <div className="flex justify-between items-center mt-auto">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {file.modified}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {file.size || "-"}
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">共享文件</h1>
        <p className="text-gray-600 dark:text-gray-300">管理您的共享文件和权限</p>
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
              placeholder="搜索共享文件..."
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* 筛选和视图切换 */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between">
            {/* 筛选下拉菜单 */}
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="appearance-none bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full lg:w-auto px-4 py-3 pr-10 outline-none transition-all duration-200"
              >
                <option value="all">所有共享文件</option>
                <option value="sharedByMe">我共享的文件</option>
                <option value="sharedWithMe">共享给我的文件</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
              </div>
            </div>
            
            {/* 视图切换 */}
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleViewMode("list")}
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
            
            {/* 新建共享按钮 */}
            
            <button className="inline-flex items-center gap-2 px-3 py-２ bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow">
              <i className="fa-solid fa-share-alt"></i>
              <span className="hidden sm:inline">新建共享</span>
            </button>
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
            <div>修改日期</div>
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
              <i className="fa-solid fa-share-alt"></i> 管理共享
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

export default Shared;