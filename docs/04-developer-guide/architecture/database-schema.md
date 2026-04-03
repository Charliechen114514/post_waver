# 数据库设计

> **版本**: v1.0
> **最后更新**: 2026-04-03
> **受众**: 开发者、数据库管理员
> **阅读时间**: 15 分钟

---

## 📋 概述

PostWaver 使用 SQLite 作为数据库，通过 Prisma ORM 进行数据访问。本文档详细说明了数据库架构、表结构和关系。

---

## 🗄️ 数据库技术栈

- **数据库**: SQLite 3.x
- **ORM**: Prisma 5.22.0
- **位置**: `packages/database/prisma/database.db`

---

## 📊 数据模型

### ER 图

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│    Post     │───────│ PublishRecord    │───────│  Platform   │
│             │ 1   N │                  │ N   1 │  Mapping    │
└─────────────┘       └──────────────────┘       └─────────────┘
       │                                                    │
       │ N                                                  │ N
       │                                                    │
┌──────────────┐                                    ┌─────────────┐
│     Tag      │                                    │   Config    │
│              │                                    │             │
└──────────────┘                                    └─────────────┘
```

---

## 📋 表结构

### 1. Post（文章表）

**用途**: 存储文章元数据

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | String | 主键 | Primary Key |
| title | String | 标题 | Not Null |
| slug | String | URL 友好标识 | Unique, Not Null |
| content | Text | Markdown 内容 | Not Null |
| excerpt | String | 摘要 | |
| status | Enum | 状态 | DRAFT, PUBLISHED, ARCHIVED |
| publishedAt | DateTime | 发布时间 | |
| tags | String[] | 标签列表 | |
| categories | String[] | 分类列表 | |
| createdAt | DateTime | 创建时间 | Default: now() |
| updatedAt | DateTime | 更新时间 | Default: now() |
| cleanedAt | DateTime | 清理时间 | |
| hash | String | 内容哈希 | Unique |

**索引**:
- `slug` (UNIQUE)
- `status`
- `publishedAt`
- `hash` (UNIQUE)

---

### 2. PublishRecord（发布记录表）

**用途**: 存储文章发布记录

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | String | 主键 | Primary Key |
| postId | String | 文章 ID | Foreign Key → Post.id |
| platform | Enum | 平台 | j看好in, wechat, csdn, zhihu |
| platformPostId | String | 平台文章 ID | |
| platformUrl | String | 平台文章 URL | |
| status | Enum | 发布状态 | PENDING, PUBLISHED, FAILED |
| publishedAt | DateTime | 发布时间 | |
| createdAt | DateTime | 创建时间 | Default: now() |
| updatedAt | DateTime | 更新时间 | Default: now() |

**索引**:
- `postId` + `platform` (UNIQUE)
- `platformPostId` (UNIQUE)

---

### 3. PlatformMapping（平台 ID 映射表）

**用途**: 存储平台 ID 映射关系

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | String | 主键 | Primary Key |
| postId | String | 文章 ID | Foreign Key → Post.id |
| platform | Enum | 平台 | j看好in, wechat, csdn, zhihu |
| platformPostId | String | 平台文章 ID | |
| platformUrl | String | 平台文章 URL | |
| createdAt | DateTime | 创建时间 | Default: now() |
| updatedAt | DateTime | 更新时间 | Default: now() |

**索引**:
- `postId` + `platform` (UNIQUE)

---

### 4. Tag（标签表）

**用途**: 存储标签信息

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | String | 主键 | Primary Key |
| name | String | 标签名 | Unique, Not Null |
| count | Int | 使用次数 | Default: 0 |
| createdAt | DateTime | 创建时间 | Default: now() |
| updatedAt | DateTime | 更新时间 | Default: now() |

**索引**:
- `name` (UNIQUE)
- `count`

---

### 5. Config（配置表）

**用途**: 存储系统配置

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | String | 主键 | Primary Key |
| key | String | 配置键 | Unique, Not Null |
| value | String | 配置值 | Not Null |
| type | Enum | 值类型 | STRING, NUMBER, BOOLEAN, JSON |
| createdAt | DateTime | 创建时间 | Default: now() |
| updatedAt | DateTime | 更新时间 | Default: now() |

**索引**:
- `key` (UNIQUE)

---

## 🔗 关系说明

### 1. Post ↔ PublishRecord

**关系**: 一对多

**说明**: 一篇文章可以发布到多个平台

**示例**:
```typescript
const post = await prisma.post.findUnique({
  where: { id: 'post-id' },
  include: { publishRecords: true }
})
```

### 2. Post ↔ Tag

**关系**: 多对多（通过 Post.tags 字段）

**说明**: 一篇文章可以有多个标签

**示例**:
```typescript
const posts = await prisma.post.findMany({
  where: {
    tags: {
      hasSome: ['javascript', 'typescript']
    }
  }
})
```

### 3. Post ↔ PlatformMapping

**关系**: 一对多

**说明**: 一篇文章可以映射到多个平台

---

## 🚀 迁移管理

### 创建迁移

```bash
cd packages/database
pnpm prisma migrate dev --name add_new_field
```

### 应用迁移

```bash
pnpm prisma migrate deploy
```

### 重置数据库

```bash
pnpm prisma migrate reset
```

---

## 🔧 数据库操作

### CRUD 操作

#### 创建

```typescript
const post = await prisma.post.create({
  data: {
    title: 'Hello World',
    slug: 'hello-world',
    content: '# Hello World',
    status: 'PUBLISHED',
    tags: ['test', 'example']
  }
})
```

#### 读取

```typescript
const post = await prisma.post.findUnique({
  where: { id: 'post-id' }
})

const posts = await prisma.post.findMany({
  where: { status: 'PUBLISHED' },
  orderBy: { publishedAt: 'desc' }
})
```

#### 更新

```typescript
const post = await prisma.post.update({
  where: { id: 'post-id' },
  data: {
    title: 'Updated Title',
    updatedAt: new Date()
  }
})
```

#### 删除

```typescript
await prisma.post.delete({
  where: { id: 'post-id' }
})
```

---

## 📊 数据库性能

### 索引策略

- **唯一索引**: `slug`, `hash`, `name` (tag)
- **复合索引**: `postId` + `platform`
- **单列索引**: `status`, `publishedAt`, `count`

### 查询优化

- 使用 `select` 只选择需要的字段
- 使用 `include` 预加载关联数据
- 使用 `where` 精确过滤
- 使用 `take` 和 `skip` 分页

### 连接池

- 默认连接池大小: 10
- 最大连接数: 20

---

## 🔍 数据库监控

### Prisma Studio

```bash
pnpm db:studio
```

访问: http://localhost:5555

### 查询日志

```bash
# 启用查询日志
DEBUG="prisma:query" pnpm start
```

---

## 📚 相关文档

- [系统架构总览](overview.md)
- [包依赖关系](package-dependencies.md)
- [数据流](data-flow.md)
- [Database API](../api-reference/database-api.md)

---

**最后更新**: 2026-04-03
**维护者**: PostWaver Team
**反馈**: [GitHub Issues](https://github.com/Charliechen114514/post_waver/issues)
