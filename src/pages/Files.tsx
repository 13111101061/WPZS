import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
  import { useApi } from "@/contexts/apiContext";
  import { toast } from 'sonner';
  import { cn } from "@/lib/utils";
import { Empty } from "@/components/Empty";

// 文件/文件夹类型定义
interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: string;
  modified: string;
  icon: string;
  color: string;
  path: string;
}

// 模拟文件夹路径数据
const folderPath = ["我的文件", "工作文档", "项目A"];

// 模拟文件数据
const mockFiles: FileItem[] = [
  {
    id: "1",
    name: "设计资源",
    type: "folder",
    modified: "2023-06-20",
    icon: "fa-folder",
    color: "text-yellow-500",
    path: "/我的文件/工作文档/项目A/设计资源",
  },
  {
    id: "2",
    name: "开发文档",
    type: "folder",
    modified: "2023-06-18",
    icon: "fa-folder",
    color: "text-yellow-500",
    path: "/我的文件/工作文档/项目A/开发文档",
  },
  {
    id: "3",
    name: "项目计划书.docx",
    type: "file",
    size: "1.2MB",
    modified: "2023-06-20 14:30",
    icon: "fa-file-word",
    color: "text-blue-500",
    path: "/我的文件/工作文档/项目A/项目计划书.docx",
  },
  {
    id: "4",
    name: "需求规格说明书.pdf",
    type: "file",
    size: "2.5MB",
    modified: "2023-06-19 09:15",
    icon: "fa-file-pdf",
    color: "text-red-500",
    path: "/我的文件/工作文档/项目A/需求规格说明书.pdf",
  },
  {
    id: "5",
    name: "会议记录.txt",
    type: "file",
    size: "45KB",
    modified: "2023-06-18 16:45",
    icon: "fa-file-alt",
    color: "text-gray-500",
    path: "/我的文件/工作文档/项目A/会议记录.txt",
  },
  {
    id: "6",
    name: "项目预算.xlsx",
    type: "file",
    size: "876KB",
    modified: "2023-06-17 11:20",
    icon: "fa-file-excel",
    color: "text-green-500",
    path: "/我的文件/工作文档/项目A/项目预算.xlsx",
  },
  {
    id: "7",
    name: "演示文稿.pptx",
    type: "file",
    size: "5.3MB",
    modified: "2023-06-16 15:10",
    icon: "fa-file-powerpoint",
    color: "text-orange-500",
    path: "/我的文件/工作文档/项目A/演示文稿.pptx",
  },
  {
    id: "8",
    name: "架构设计图.png",
    type: "file",
    size: "2.8MB",
    modified: "2023-06-15 10:05",
    icon: "fa-file-image",
    color: "text-pink-500",
    path: "/我的文件/工作文档/项目A/架构设计图.png",
  },
];

const Files = () => {
  const { user } = useContext(AuthContext);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // 模拟数据加载
  useEffect(() => {
    const timer = setTimeout(() => {
     setFiles(mockFiles);
     setLoading(false);
   }, 800);
   
   return () => clearTimeout(timer);
 }, []);
 
 // 文件列表加载函数
 const fetchFileList = () => {
   setLoading(true);
   setError(null);
   
   // 模拟API请求
   setTimeout(() => {
     try {
       setFiles(mockFiles);
       setLoading(false);
     } catch (err) {
       setError('加载文件列表失败，请重试');
       setLoading(false);
     }
   }, 800);
  };
  
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
    if (selectedItems.length === files.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(files.map(file => file.id));
    }
  };
  
  // 过滤文件
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // 处理文件夹导航
  const navigateToFolder = (index: number) => {
    // 在实际应用中，这里会导航到相应文件夹
    console.log("导航到:", folderPath.slice(0, index + 1).join("/"));
  };
  
  // 处理文件/文件夹点击
   const { authCode, setLastUsed } = useApi();
  
  const handleItemClick = (item: FileItem, e: React.MouseEvent) => {
    if (!authCode) {
      toast.warning('请先生成API身份凭证以访问文件');
      return;
    }
    
    // 更新最后使用时间，确保AuthCode持续刷新
    setLastUsed(Date.now());
    
    if (item.type === "folder") {
      // 在实际应用中，这里会导航到相应文件夹
      console.log("打开文件夹:", item.name);
    } else {
      // 在实际应用中，这里会打开文件预览或下载文件
      console.log("打开文件:", item.name);
    }
  };
  
  // 处理文件操作
  const handleFileAction = (action: string, fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // 阻止事件冒泡，避免触发文件点击
    e.preventDefault();
    
    switch (action) {
      case "download":
        console.log("下载文件:", fileId);
        break;
      case "rename":
        console.log("重命名文件:", fileId);
        break;
      case "delete":
        console.log("删除文件:", fileId);
        setFiles(files.filter(file => file.id !== fileId));
        break;
      case "share":
        console.log("共享文件:", fileId);
        break;
      default:
        break;
    }
  };
  
  // 渲染面包屑导航
  const renderBreadcrumbs = () => {
    return (
      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-6">
        {folderPath.map((folder, index) => (
          <React.Fragment key={index}>
            <button
              onClick={() => navigateToFolder(index)}
              className="hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200"
            >
              {folder}
            </button>
            {index < folderPath.length - 1 && (
              <i className="fa-solid fa-angle-right mx-2 text-xs text-gray-400"></i>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };
  
  // 渲染文件列表视图
  const renderListView = () => {
    if (loading) {
      return (
        <div className="space-y-4">  
          {[...Array(files.length > 0 ? files.length : 5)].map((_, index) => (
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
    
    if (filteredFiles.length === 0) {
      return <Empty />;
    }
    
    return (
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {filteredFiles.map((file) => (
          <div 
            key={file.id}
            onClick={(e) => handleItemClick(file, e)}
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
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate cursor-pointer">
                {file.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate md:hidden">
                {file.size} · {file.modified}
              </p>
            </div>
            
            <div className="hidden md:block text-sm text-gray-600 dark:text-gray-300 min-w-[80px]">
              {file.size || "-"}
            </div>
            
            <div className="hidden md:block text-sm text-gray-600 dark:text-gray-300 min-w-[120px]">
              {file.modified}
            </div>
            
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
              <button 
                onClick={(e) => handleFileAction("download", file.id, e)}
                className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200" 
                aria-label="下载"
              >
                <i className="fa-solid fa-download text-sm"></i>
              </button>
              <button 
                onClick={(e) => handleFileAction("share", file.id, e)}
                className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200" 
                aria-label="分享"
              >
                <i className="fa-solid fa-share-alt text-sm"></i>
              </button>
              <button 
                onClick={(e) => handleFileAction("rename", file.id, e)}
                className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200" 
                aria-label="重命名"
              >
                <i className="fa-solid fa-pen text-sm"></i>
              </button>
              <button 
                onClick={(e) => handleFileAction("delete", file.id, e)}
                className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200" 
                aria-label="删除"
              >
                <i className="fa-solid fa-trash text-sm"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // 渲染文件网格视图
  const renderGridView = () => {
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
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-500 dark:text-red-400 mb-4">
            <i className="fa-solid fa-exclamation-circle text-2xl"></i>
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{error}</h4>
          <button 
            onClick={fetchFileList}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow"
          >
            <i className="fa-solid fa-refresh"></i>
            <span>重试</span>
          </button>
        </div>
      );
    }
    
    if (filteredFiles.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 mb-4">
            <i className="fa-solid fa-folder-open text-2xl"></i>
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-1">当前目录为空</h4>
          <p className="text-gray-500 dark:text-gray-400 max-w-xs">在此目录中没有找到任何文件或文件夹</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredFiles.map((file) => (
          <div 
            key={file.id}
            onClick={(e) => handleItemClick(file, e)}
            className="group relative flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer"
          >
            <div className="relative p-6 flex justify-center items-center bg-gray-50 dark:bg-gray-900/50">
              <div className={`w-16 h-16 rounded flex items-center justify-center ${file.color} bg-gray-100 dark:bg-gray-700`}>
                <i className={`fa-solid ${file.icon} text-2xl`}></i>
              </div>
              
              {file.type === "folder" && (
                <div className="absolute top-2 right-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full">
                  文件夹
                </div>
              )}
            </div>
            
            <div className="p-3 flex flex-col flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">
                {file.name}
              </h3>
              <div className="flex justify-between items-center mt-auto text-xs text-gray-500 dark:text-gray-400">
                <span>{file.size || "-"}</span>
                <span>{file.modified}</span>
              </div>
            </div>
            
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-200">
                {file.type === "file" && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.info(`准备下载文件: ${file.name}`);
                    }}
                    className="p-2 rounded-full bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 shadow-sm" 
                    aria-label="下载"
                  >
                    <i className="fa-solid fa-download text-sm"></i>
                  </button>
                )}
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.info(`准备分享: ${file.name}`);
                  }}
                  className="p-2 rounded-full bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 shadow-sm" 
                  aria-label="分享"
                >
                  <i className="fa-solid fa-share-alt text-sm"></i>
                </button>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.info(`准备重命名: ${file.name}`);
                  }}
                  className="p-2 rounded-full bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 shadow-sm" 
                  aria-label="重命名"
                >
                  <i className="fa-solid fa-pen text-sm"></i>
                </button>
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">我的文件</h1>
        {renderBreadcrumbs()}
      </div>
      
      {/* 工具栏 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* 搜索栏 */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fa-solid fa-search text-gray-400"></i>
            </div>
            <input
              type="text"
              placeholder="搜索文件和文件夹..."
              className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* 操作按钮区 */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
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
            
            {/* 新建文件夹按钮 */}
            <button className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow">
              <i className="fa-solid fa-folder-plus"></i>
              <span className="hidden sm:inline">新建文件夹</span>
            </button>
            
            {/* 上传按钮 */}
            <button className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow">
              <i className="fa-solid fa-upload"></i>
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
                checked={selectedItems.length > 0 && selectedItems.length === files.length}
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
              <i className="fa-solid fa-share-alt"></i> 共享
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

export default Files;