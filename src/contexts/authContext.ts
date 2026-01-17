import { createContext, ReactNode } from "react";

// 用户信息类型定义
export interface User {
  name: string;
  email: string;
  storageUsed: number;
  storageTotal: number;
}

// 认证上下文类型定义
export interface AuthContextType {
  isAuthenticated: boolean;
  user: User;
  login: (username: string, password: string) => void;
  logout: () => void;
}

// 默认用户信息
const defaultUser: User = {
  name: "Guest",
  email: "guest@example.com",
  storageUsed: 0,
  storageTotal: 0,
};

// 创建认证上下文
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: defaultUser,
  login: () => {},logout: () => {},
});