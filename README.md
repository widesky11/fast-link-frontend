# 快链 FastLink · 前端

短链接与访问分析平台的管理后台前端。



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

---
快链 FastLink 管理后台，基于 Vue 3 + TypeScript + Element Plus 开发的短链接平台前端，覆盖短链管理、活动与渠道归因、点击统计看板、日志检索与图片上传等完整功能。工程上实现了 JWT 双 Token 无感刷新（并发去重、静默续期）、游标分页加载、ECharts 多维图表渲染，开发期通过 Vite 代理对接后端，生产环境由 Nginx 托管静态资源并反代 API 与短码跳转。


---
**后端仓库**：[fast-link-backend](https://github.com/widesky11/fast-link-backend.git)