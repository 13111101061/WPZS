import { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// --- DESIGN PHILOSOPHY: "Crafted Utility" ---
// moving away from "Generic Bootstrap/Tailwind" to "Linear/Vercel-like" aesthetics.
// Key changes:
// 1. Subtlety over Contrast: No more jarring blue backgrounds.
// 2. Typography: Inter/Sans-serif, smaller sizes, heavier weights for hierarchy.
// 3. Spacing: Condensed but breathable.
// 4. Micro-interactions: Spring animations for hover/active states.

interface NavItem {
  label: string;
  icon: string;
  path: string;
  shortcut?: string; // Simulated keyboard shortcut
}

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Storage Calculation
  const storagePercentage = Math.min(100, Math.round((user.storageUsed / user.storageTotal) * 100));
  const isStorageWarning = storagePercentage > 90;
  
  const navItems: NavItem[] = [
    { label: "工作台", icon: "fa-layer-group", path: "/dashboard", shortcut: "⌘1" },
    { label: "我的文件", icon: "fa-folder-open", path: "/files", shortcut: "⌘2" },
    { label: "团队共享", icon: "fa-users", path: "/shared", shortcut: "⌘3" },
    { label: "最近访问", icon: "fa-clock", path: "/recent", shortcut: "⌘4" },
    { label: "对象存储", icon: "fa-cloud-arrow-up", path: "/oss-config", shortcut: "⌘5" },
    { label: "存储空间", icon: "fa-database", path: "/storage", shortcut: "⌘6" },
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative h-screen bg-[#FBFBFB] dark:bg-[#0F0F0F] border-r border-gray-200/60 dark:border-gray-800/60 flex flex-col z-40 select-none"
    >
      {/* --- HEADER: BRAND / WORKSPACE --- */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100 dark:border-gray-800/40">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 shadow-sm">
            <i className="fa-solid fa-cube text-sm"></i>
          </div>
          
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col"
              >
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">Nexus Pro</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-500 mt-1 font-medium tracking-wide">ENTERPRISE</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- COLLAPSE TOGGLE --- */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white shadow-sm hover:scale-110 transition-all z-50 group"
      >
        <i className={cn("fa-solid text-[10px] transition-transform duration-300", isCollapsed ? "fa-chevron-right" : "fa-chevron-left")}></i>
      </button>
      
      {/* --- NAVIGATION --- */}
      <div className="flex-1 py-6 px-3 overflow-y-auto space-y-1">
        <div className="mb-2 px-3 text-[10px] font-bold text-gray-400/80 uppercase tracking-wider">
          {!isCollapsed ? "Menu" : "•"}
        </div>
        
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="group relative flex items-center outline-none"
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-sm z-0"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              
              <div className={cn(
                "relative z-10 w-full flex items-center px-3 py-2.5 rounded-lg transition-colors duration-200",
                isActive 
                  ? "text-gray-900 dark:text-white" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/30"
              )}>
                <div className="w-5 flex justify-center shrink-0">
                  <i className={cn(
                    "fa-solid text-sm transition-colors duration-200", 
                    item.icon,
                    isActive ? "text-gray-900 dark:text-white" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                  )}></i>
                </div>
                
                {!isCollapsed && (
                  <motion.div 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="ml-3 flex-1 flex items-center justify-between overflow-hidden"
                  >
                    <span className="text-sm font-medium truncate">{item.label}</span>
                    {item.shortcut && (
                      <span className="hidden group-hover:block text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                        {item.shortcut}
                      </span>
                    )}
                  </motion.div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* --- FOOTER: STORAGE & USER --- */}
      <div className="p-4 border-t border-gray-200/60 dark:border-gray-800/60 bg-gray-50/50 dark:bg-black/20 space-y-4">
        
        {/* Storage Widget (Condensed) */}
        {!isCollapsed ? (
          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">存储空间</span>
              <span className="text-[10px] font-medium text-gray-400">
                {user.storageUsed} / {user.storageTotal} GB
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-900 rounded-full h-1.5 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${storagePercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  isStorageWarning ? "bg-red-500" : "bg-gray-900 dark:bg-white"
                )}
              />
            </div>
          </div>
        ) : (
           <div className="flex justify-center group relative">
             <div className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
               <div 
                 className="w-full h-full rounded-full border-2 border-gray-900 dark:border-white"
                 style={{ clipPath: `inset(${100 - storagePercentage}% 0 0 0)` }}
               />
               <i className="fa-solid fa-database text-[8px] absolute text-gray-400"></i>
             </div>
           </div>
        )}

        {/* User Profile */}
        <div className="flex items-center gap-3 pt-2">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center border border-white dark:border-gray-600 shadow-sm">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
          </div>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
                {user.name}
              </h4>
              <p className="text-[11px] text-gray-500 truncate mt-0.5">
                {user.email}
              </p>
            </div>
          )}
          
          {!isCollapsed && (
            <button 
              onClick={logout}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="退出登录"
            >
              <i className="fa-solid fa-arrow-right-from-bracket text-xs"></i>
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
