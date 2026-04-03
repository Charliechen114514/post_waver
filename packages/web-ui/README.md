# @content-hub/web-ui

> PostWaver 的 React Web 界面 - 内容管理和发布工作台

---

## 📋 概述

`@content-hub/web-ui` 是基于 React 18 的 Web 界面，提供内容管理、发布工作台和实时预览功能。

**主要功能**:
- ✅ 文章列表和管理
- ✅ 发布工作台
- ✅ 实时预览
- ✅ 平台配置
- ✅ 模板管理

---

## 🚀 安装

```bash
pnpm install @content-hub/web-ui
```

---

## 📖 使用

### 启动开发服务器

```bash
cd packages/web-ui
pnpm dev
```

访问: http://localhost:5173/post_waver/

### 构建

```bash
pnpm build
```

---

## 🏗️ 架构

### 技术栈

- **React 18**: UI 框架
- **React Router 6**: 路由管理
- **Vite**: 构建工具
- **TypeScript**: 类型系统
- **Tailwind CSS**: 样式框架

### 主要页面

- **文章列表**: `/` - 文章列表页
- **文章详情**: `/posts/:id` - 文章详情页
- **发布工作台**: `/publish` - 发布页面
- **模板管理**: `/templates` - 模板管理
- **配置**: `/settings` - 系统配置

### 依赖关系

```
web-ui
└── engine (API 调用)
```

---

## 🔌 API 调用

### 获取文章列表

```typescript
import { fetchPosts } from '@/api/posts'

const posts = await fetchPosts({ status: 'PUBLISHED' })
```

### 发布文章

```typescript
import { publishPost } from '@/api/posts'

const result = await publishPost(postId, { platform: 'juejin' })
```

---

## 🧪 开发

```bash
# 进入包目录
cd packages/web-ui

# 启动开发服务器
pnpm dev

# 构建
pnpm build

# 预览构建
pnpm preview

# 类型检查
pnpm typecheck
```

---

## 📚 相关文档

- [详细文档](../../docs/04-developer-guide/packages/web-ui.md)
- [Web UI 用户指南](../../docs/02-user-guides/features/web-ui-guide.md)

---

**版本**: 0.1.0
**许可证**: MIT
