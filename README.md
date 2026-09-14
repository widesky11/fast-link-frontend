# 快链 FastLink · 前端

分布式短链接与访问分析平台的管理后台前端。

> 🔗 后端仓库：[fast-link-backend](https://github.com/widesky11/fast-link-backend.git)

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Vue 3（`<script setup>` Composition API） |
| 语言 | TypeScript |
| 构建 | Vite |
| UI | Element Plus |
| 状态管理 | Pinia |
| 路由 | Vue Router |
| HTTP | Axios |
| 图表 | ECharts |
| 代码规范 | ESLint + Prettier |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（默认 http://localhost:5173）
npm run dev
```

> 前端通过 Vite 代理访问后端：请求 `/api/xxx` 会被转发到 `http://localhost:8000/xxx`（见 `vite.config.ts`）。
> 请确保后端服务已启动（默认端口 8000，启动方式见后端仓库 README）。

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 类型检查 + 构建生产包 |
| `npm run preview` | 本地预览构建产物 |
| `npm run type-check` | TS 类型检查 |
| `npm run lint` | ESLint 检查并自动修复 |
| `npm run format` | Prettier 格式化 |

## 环境变量

开发环境配置在 `.env.development`：

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_API_BASE_URL` | 后端 API 前缀（开发环境走代理） | `/api` |
| `VITE_APP_TITLE` | 页面标题 | `快链 FastLink` |
| `VITE_SHORT_DOMAIN` | 短链跳转域名（后端根路径） | `http://localhost:8000` |

## 目录结构

```
src/
├── api/          # 接口封装（request.ts 为 Axios 实例：统一响应拆包 / Token / 错误处理）
├── types/        # 与后端对应的 TS 类型（VO / DTO / PageResult）
├── router/       # 路由
├── stores/       # Pinia 状态
├── layouts/      # 布局组件
├── views/        # 页面
└── styles/       # 全局样式
```

## 接口约定

- 后端统一响应结构：`{ "code": 200, "message": "success", "data": {} }`，已在 `api/request.ts` 拦截器中统一拆包
- 分页参数：`page` / `size`；分页返回：`records` / `total` / `page` / `size`
- 鉴权（规划中）：`Authorization: Bearer <token>`，401 时自动清除本地 Token
- 短链跳转接口挂后端根路径 `GET /{shortCode}`（302 重定向），不在 API 前缀下
