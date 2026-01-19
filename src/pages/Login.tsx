import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) newErrors.username = "请输入用户名";
    if (!formData.password) {
      newErrors.password = "请输入密码";
    } else if (formData.password.length < 6) {
      newErrors.password = "密码长度至少为6位";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setTimeout(() => {
      try {
        login(formData.username, formData.password);
        navigate("/");
      } catch (error) {
        setErrors({ general: "登录失败，请检查您的凭证" });
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="w-full h-screen flex overflow-hidden bg-white">
      
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          <svg className="absolute top-0 right-0 opacity-10 transform translate-x-1/3 -translate-y-1/4 w-[800px] h-[800px]" viewBox="0 0 100 100" fill="none">
             <circle cx="50" cy="50" r="50" stroke="white" strokeWidth="0.5" />
             <circle cx="50" cy="50" r="35" stroke="white" strokeWidth="0.5" />
             <circle cx="50" cy="50" r="20" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50">
            <i className="fa-solid fa-layer-group text-white text-lg"></i>
          </div>
          <span className="text-xl font-bold tracking-tight">Nexus Enterprise</span>
        </div>

        <div className="relative z-10 max-w-lg">
          <blockquote className="space-y-6">
            <p className="text-2xl font-medium leading-relaxed text-slate-100">
              "这个平台彻底改变了我们处理数据聚合的方式。它不仅是一个工具，更是企业数字化转型的基础设施。"
            </p>
            <footer className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                <span className="text-sm font-bold">JD</span>
              </div>
              <div>
                <div className="font-semibold text-white">Jane Doe</div>
                <div className="text-sm text-slate-400">CTO, TechGlobal Inc.</div>
              </div>
            </footer>
          </blockquote>
        </div>

        <div className="relative z-10 text-sm text-slate-500">
          © 2026 Nexus Enterprise System. All rights reserved.
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12 bg-gray-50/50">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center lg:text-left space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              欢迎回来
            </h1>
            <p className="text-slate-500">
              请输入您的账户凭证以访问工作台(此为展示版本可随意输入6位数，实际使用请自行部署使用)
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
            {errors.general && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="username">
                  用户名 / 工作邮箱
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  className={cn(
                    "block w-full px-4 py-2.5 bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all",
                    errors.username 
                      ? "border-red-300 focus:ring-red-100 focus:border-red-500" 
                      : "border-gray-300 focus:ring-blue-100 focus:border-blue-600 hover:border-gray-400"
                  )}
                  placeholder="name@company.com"
                  value={formData.username}
                  onChange={handleChange}
                />
                {errors.username && (
                  <p className="text-xs text-red-600 mt-1">{errors.username}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                    密码
                  </label>
                  <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                    忘记密码?
                  </a>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className={cn(
                    "block w-full px-4 py-2.5 bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all",
                    errors.password 
                      ? "border-red-300 focus:ring-red-100 focus:border-red-500" 
                      : "border-gray-300 focus:ring-blue-100 focus:border-blue-600 hover:border-gray-400"
                  )}
                  placeholder="请输入您的密码"
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && (
                  <p className="text-xs text-red-600 mt-1">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer select-none">
                  记住我的登录状态
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
                    登录中...
                  </span>
                ) : "安全登录"}
              </button>
            </form>

            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">
                  或使用企业SSO登录
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors">
                <i className="fa-brands fa-microsoft text-lg"></i>
                <span>Microsoft</span>
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors">
                <i className="fa-brands fa-google text-lg"></i>
                <span>Google</span>
              </button>
            </div>
          </div>
          
          <p className="text-center text-xs text-slate-400">
            遇到问题? 请联系 <a href="#" className="underline hover:text-slate-600">IT 支持部门</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
