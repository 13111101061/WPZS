import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { cn } from "@/lib/utils";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // 处理表单输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = "用户名不能为空";
    }
    
    if (!formData.password) {
      newErrors.password = "密码不能为空";
    } else if (formData.password.length < 6) {
      newErrors.password = "密码长度不能少于6个字符";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    // 模拟登录请求延迟
    setTimeout(() => {
      try {
        // 调用AuthContext中的登录方法
        login(formData.username, formData.password);
        // 登录成功后重定向到主页
        navigate("/");
      } catch (error) {
        setErrors({ general: "登录失败，请检查用户名和密码" });
        setIsLoading(false);
      }
    }, 1200);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 登录卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 transform transition-all duration-500 hover:shadow-2xl">
          <div className="p-8 space-y-6">
            {/* 品牌标识和标题 */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-cloud text-white text-2xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">云存储网盘</h1>
              <p className="text-gray-600 dark:text-gray-300">登录您的账户以继续</p>
            </div>
            
            {/* 错误提示 */}
            {errors.general && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                <i className="fa-solid fa-exclamation-circle mt-0.5"></i>
                <span className="text-sm">{errors.general}</span>
              </div>
            )}
            
            {/* 登录表单 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 用户名输入框 */}
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  用户名
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa-solid fa-user text-gray-400"></i>
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    className={cn(
                      "block w-full pl-10 pr-4 py-3 border rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:outline-none transition-all duration-200",
                      errors.username 
                        ? "border-red-300 dark:border-red-700 focus:ring-red-500" 
                        : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                    )}
                    placeholder="输入用户名"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
                {errors.username && (
                  <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-300">
                    <i className="fa-solid fa-exclamation-circle text-xs"></i> {errors.username}
                  </p>
                )}
              </div>
              
              {/* 密码输入框 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    密码
                  </label>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200">
                    忘记密码?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa-solid fa-lock text-gray-400"></i>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className={cn(
                      "block w-full pl-10 pr-4 py-3 border rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:outline-none transition-all duration-200",
                      errors.password 
                        ? "border-red-300 dark:border-red-700 focus:ring-red-500" 
                        : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                    )}
                    placeholder="输入密码"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                {errors.password && (
                  <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-300">
                    <i className="fa-solid fa-exclamation-circle text-xs"></i> {errors.password}
                  </p>
                )}
              </div>
              
              {/* 登录按钮 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>登录中...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-sign-in-alt"></i>
                    <span>登录</span>
                  </>
                )}
              </button>
            </form>
            
            {/* 分隔线 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                  或者
                </span>
              </div>
            </div>
            
            {/* 注册选项 */}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                还没有账户?{" "}
                <a href="#" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200">
                  创建账户
                </a>
              </p>
            </div>
          </div>
        </div>
        
        {/* 页脚 */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          © 2023 云存储网盘. 保留所有权利.
        </p>
      </div>
    </div>
  );
}

export default Login;