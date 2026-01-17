# Nexus Pro - 个人网盘可视化系统

一个强大的个人网盘接入系统，专为无图形化的云端网盘和对象存储提供可视化的 Web 体验。

## 特性

- **现代化界面**：基于 React 18 + TypeScript + Vite 构建，
- **多云存储支持**：支持多种对象存储协议和云服务
- **一键部署**：支持 `npm install nodejs-argo` 快速安装部署
- **安全认证**：集成 API 凭证管理和哪吒标记功能
- **响应式设计**：完美适配桌面和移动端设备
- **深色模式**：完整的深色主题支持

## 功能模块

- **工作台**：总览存储使用情况和快速访问
- **我的文件**：文件浏览、上传、下载、管理
- **团队共享**：团队文件共享与协作
- **最近访问**：快速访问最近使用的文件
- **对象存储**：配置和管理对象存储服务（支持 VLESS、VMess、Trojan 等协议）
- **存储空间**：详细的存储使用统计和分析



## 本地开发

### 环境准备

- 安装 [Node.js](https://nodejs.org/en)（推荐 v18 或更高版本）
- 安装 [pnpm](https://pnpm.io/installation)

```bash
npm install -g pnpm
```

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm run dev
```

访问 http://localhost:3000 查看应用

### 构建生产版本

```bash
pnpm run build
```

构建产物将输出到 `dist/static` 目录

## 一键部署

### 使用 nodejs-argo

```bash
npm install nodejs-argo
```
```

