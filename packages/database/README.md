# @content-hub/database

> PostWaver 的数据库层 - 数据持久化和元数据管理

---

## 📋 概述

`@content-hub/database` 是 PostWaver 的数据库层，基于 Prisma ORM 和 SQLite，提供数据持久化、元数据管理和内容索引功能。

**主要功能**:
- ✅ 文章元数据存储
- ✅ 发布记录管理
- ✅ 平台 ID 映射
- ✅ 标签缓存
- ✅ 配置存储

---

## 🚀 安装

```bash
pnpm install @content-hub/database
```

---

## 📖 使用

### 初始化数据库

```typescript
import { PrismaClient } from '@content-hub/database'

const prisma = new PrismaClient()

// 查询所有文章
const posts = await prisma.post.findMany()

// 创建文章
const post = await prisma.post.create({
  data: {
    title: 'Hello World',
    slug: 'hello-world',
    content: '# Hello World',
    status: 'PUBLISHED'
  }
})
```

### 使用 DAL

```typescript
import { PostDAL } from '@content-hub/database'

const dal = new PostDAL()

// 获取文章
const post = await dal.getBySlug('hello-world')

// 更新状态
await dal.updateStatus(post.id, 'PUBLISHED')

// 获取已发布文章
const publishedPosts = await dal.getPublishedPosts()
```

---

## 🏗️ 架构

### 数据模型

- **Post**: 文章元数据
- **PublishRecord**: 发布记录
- **PlatformMapping**: 平台 ID 映射
- **Tag**: 标签
- **Config**: 配置

### 主要模块

- **Prisma Client**: ORM 客户端
- **DAL (数据访问层)**: 高级数据访问接口
- **Migrations**: 数据库迁移

---

## 🔌 API

### Prisma Client

```typescript
import { PrismaClient } from '@content-hub/database'

const prisma = new PrismaClient()

// CRUD 操作
await prisma.post.create({ ... })
await prisma.post.findMany({ ... })
await prisma.post.update({ ... })
await prisma.post.delete({ ... })
```

### DAL (数据访问层)

```typescript
import { PostDAL } from '@content-hub/database'

const dal = new PostDAL()

// 高级查询
const posts = await dal.getPublishedPosts()
const post = await dal.getBySlug('slug')
const count = await dal.count()
```

---

## 🧪 开发

```bash
# 进入包目录
cd packages/database

# 生成 Prisma Client
pnpm prisma generate

# 运行迁移
pnpm prisma migrate dev

# 打开 Prisma Studio
pnpm prisma studio

# 重置数据库
pnpm prisma migrate reset
```

---

## 📚 相关文档

- [详细文档](../../docs/04-developer-guide/packages/database.md)
- [数据库设计](../../docs/04-developer-guide/architecture/database-schema.md)
- [API 参考](../../docs/04-developer-guide/api-reference/database-api.md)

---

## 🤝 贡献

欢迎贡献！请阅读 [贡献指南](../../CONTRIBUTING.md)。

---

**版本**: 0.1.0
**许可证**: MIT
