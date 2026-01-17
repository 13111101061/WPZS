import { Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import LandingPage from "@/pages/LandingPage";
import Files from "@/pages/Files";
import Shared from "@/pages/Shared";
import Recent from "@/pages/Recent";
import Storage from "@/pages/Storage";
import OSSConfig from "@/pages/OSSConfig";
import Login from "@/pages/Login";
import { useState } from "react";
import { AuthContext } from '@/contexts/authContext';
import Layout from "@/components/Layout";
import { ApiProvider } from '@/contexts/apiContext';
import { OSSProvider } from '@/contexts/ossContext';

export default function App() {
  // 从localStorage初始化状态，解决刷新丢失问题
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('网盘用户信息');
    return savedUser ? JSON.parse(savedUser) : { 
      name: "Guest", 
      email: "guest@example.com", 
      storageUsed: 1.2, 
      storageTotal: 10 
    };
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('网盘用户信息') !== null;
  });

  const login = (username: string, password: string) => {
    // 模拟登录
    setIsAuthenticated(true);
    const mockUser = { 
      name: username, 
      email: username, 
      storageUsed: 1.2, 
      storageTotal: 10 
    };
    setUser(mockUser);
    localStorage.setItem('网盘用户信息', JSON.stringify(mockUser));
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('网盘用户信息');
    setUser({ 
      name: "Guest", 
      email: "guest@example.com", 
      storageUsed: 0, 
      storageTotal: 0 
    });
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout }}
    >
      <ApiProvider>
        <OSSProvider>
          <Routes>
            {/* 公共路由 */}
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
            <Route path="/login" element={<Login />} />

            {/* 受保护的路由 */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Home />} />
              <Route path="/files" element={<Files />} />
              <Route path="/shared" element={<Shared />} />
              <Route path="/recent" element={<Recent />} />
              <Route path="/oss-config" element={<OSSConfig />} />
              <Route path="/storage" element={<Storage />} />
            </Route>

            {/* 重定向所有其他路由到首页 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </OSSProvider>
      </ApiProvider>
    </AuthContext.Provider>
  );
}
