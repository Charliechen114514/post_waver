# @content-hub/engine

> PostWaver 的发布引擎 - API 服务器和工作流编排

---

## 📋 概述

`@content-hub/engine` 是 PostWaver 的发布引擎，提供 RESTful API 服务器、工作流编排和预览系统。

**主要功能**:
- ✅ RESTful API (基于 Hono.js)
- ✅ 发布工作流编排
- ✅ 内容预览系统
- ✅ 图片上传管理
- ✅ Hexo 同步集成

---

## 🚀 安装

```bash
pnpm install @content-hub/engine
```

---

## 📖 使用

### 启动服务器

```typescript
import { createServer } from '@content-hub/engine'

const server = createServer()
server.listen(3001)
```

### API 端点

```bash
# 健康检查
GET /api/health

# 获取文章列表
GET /api/posts

# 获取单篇文章
GET /api/posts/:id

# 发布文章
POST /api/posts/:id/publish

# 预览文章
POST /api/posts/:id/preview
```

---

## 🏗️ 架构

### 主要模块

- **API Server**: Hono.js 服务器
- **Workflow Manager**: 工作流管理器
- **Preview System**: 预览系统
- **Image Manager**: 图片管理器

### 依赖关系

```
engine
├── core (内容解析)
├── linker (关系生成)
├── transformer (平台转换)
├── adapter (平台 API)
├── database (数据持久化)
└── config (配置管理)
```

---

## 🔌 API

### 健康检查

```bash
GET /api/health

Response:
{
  "status": "ok",
  "timestamp": "2026-04-03T10:00:00Z"
}
```

### 获取文章列表

```bash
GET /api/posts?status=PUBLISHED&limit=10

Response:
{
  "posts": [...],
  "total": 100,
  "page": 1
}
```

### 发布文章

```bash
POST /api/posts/:id/publish
Content-Type: application/json

{
  "platform": "juejin",
  "autoPublish": false
}

Response:
{
  "success": true,
  "postId": "123",
  "platformUrl": "https://juejin.cn/post/123"
}
```

---

## 🧪 开发

```bash
# 进入包目录
cd packages/engine

# 构建
pnpm build

# 启动服务器
pnpm start

# 监听模式
pnpm dev

# 测试
pnpm test
```

---

## 📚 相关文档

- [详细文档](../../docs/04-developer-guide/packages/engine.md)
- [API 参考](../../docs/04-developer-guide/api-reference/engine-api.md)

---

## 🤝 贡献

欢迎贡献！请阅读 [贡献指南](../../CONTRIBUTING.md)。

---

**版本**: 0.1.0
**许可证**: MIT
