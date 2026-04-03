# @content-hub/linker

> PostWaver 的内容关系生成器 - 相关文章、前后篇计算

---

## 📋 概述

`@content-hub/linker` 负责生成文章之间的关系，包括相关文章推荐、前后篇计算和标签匹配。

**主要功能**:
- ✅ 相关文章推荐（基于标签和语义）
- ✅ 前后篇计算（按时间）
- ✅ 标签匹配
- ✅ Python 语义分析桥接（可选）

---

## 🚀 安装

```bash
pnpm install @content-hub/linker
```

---

## 📖 使用

### 获取相关文章

```typescript
import { getRelatedPosts } from '@content-hub/linker'

const postId = 'post-id'
const related = await getRelatedPosts(postId, { limit: 5 })

console.log(related) // Array of related posts
```

### 计算前后篇

```typescript
import { getPrevNext } from '@content-hub/linker'

const postId = 'post-id'
const { prev, next } = await getPrevNext(postId)

console.log(prev) // Previous post
console.log(next) // Next post
```

---

## 🏗️ 架构

### 主要模块

- **Tag Matcher**: 标签匹配器
- **Prev/Next Calculator**: 前后篇计算器
- **Python Bridge**: Python 语义分析桥接

### 依赖关系

```
linker
└── database (数据查询)
```

---

## 🔌 API

### 主要函数

| 函数 | 说明 | 返回值 |
|------|------|--------|
| `getRelatedPosts()` | 获取相关文章 | `Promise<Post[]>` |
| `getPrevNext()` | 获取前后篇 | `Promise<{prev, next}>` |
| `matchByTags()` | 标签匹配 | `Promise<Post[]>` |

---

## 🧪 开发

```bash
# 进入包目录
cd packages/linker

# 构建
pnpm build

# 安装 Python 依赖（可选）
pip3 install -r requirements.txt

# 测试
pnpm test
```

---

## 📚 相关文档

- [详细文档](../../docs/04-developer-guide/packages/linker.md)

---

**版本**: 0.1.0
**许可证**: MIT
