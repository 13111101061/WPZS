import { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { cn } from "@/lib/utils";

// 导航项类型定义
interface NavItem {
  label: string;
  icon: string;
  path: string;
}

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // 计算存储使用率百分比
  const storagePercentage = Math.round((user.storageUsed / user.storageTotal) * 100);
  
  // 导航项配置
  const navItems: NavItem[] = [
    { label: "首页", icon: "fa-home", path: "/dashboard" },
    { label: "我的文件", icon: "fa-folder", path: "/files" },
    { label: "共享文件", icon: "fa-share-alt", path: "/shared" },
    { label: "最近文件", icon: "fa-clock", path: "/recent" },
    { label: "存储管理", icon: "fa-hdd", path: "/storage" },
  ];

  return (
    <aside 
      className={cn(
        "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* 折叠按钮 */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute right-0 top-4 -translate-x-1/2 bg-white dark:bg-gray-800 p-1 rounded-full shadow-md border border-gray-300 dark:border-gray-600 z-10"
          aria-label={isCollapsed ? "展开侧边栏" : "折叠侧边栏"}
        >
          <i className={`fa-solid ${isCollapsed ? "fa-angle-right" : "fa-angle-left"}`}></i>
        </button>
        
        {/* 用户信息区域 */}
        <div className="p-4 flex items-center space-x-3 border-b border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
            <i className="fa-solid fa-user text-lg"></i>
          </div>
          
          {!isCollapsed && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{user.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
          )}
        </div>
        
        {/* 存储信息区域 - 仅在展开状态显示 */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600 dark:text-gray-300">存储空间</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {user.storageUsed}GB / {user.storageTotal}GB
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${storagePercentage}%` }}
                aria-label={`存储空间使用: ${storagePercentage}%`}
              ></div>
            </div>
          </div>
        )}
        
        {/* 导航菜单 */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors duration-200",
                    location.pathname === item.path
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  )}
                >
                  <i className={`fa-solid ${item.icon} w-5 text-center`}></i>
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* 底部区域 - 退出登录 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={logout}
            className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-200"
          >
            <i className="fa-solid fa-sign-out-alt w-5 text-center"></i>
            {!isCollapsed && <span>退出登录</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;