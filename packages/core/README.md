# @content-hub/core

> PostWaver 的核心功能包 - 内容解析、扫描和注入

---

## 📋 概述

`@content-hub/core` 是 PostWaver 的核心包，负责 Markdown 内容的解析、扫描、元数据生成和内容注入。

**主要功能**:
- ✅ Markdown 解析（基于 unified/remark）
- ✅ 内容扫描和索引
- ✅ Frontmatter 自动生成
- ✅ 图片路径解析
- ✅ 链接注入（相关文章、仓库链接）
- ✅ 标题注入
- ✅ 标签缓存

---

## 🚀 安装

```bash
pnpm install @content-hub/core
```

---

## 📖 使用

### 解析 Markdown

```typescript
import { parseMarkdown } from '@content-hub/core'

const content = '# Hello World\n\nThis is a test.'
const result = await parseMarkdown(content)

console.log(result.title) // 'Hello World'
console.log(result.content) // 'This is a test.'
```

### 扫描内容

```typescript
import { scanContent } from '@content-hub/core'

const posts = await scanContent('content/posts')

console.log(posts) // Array of parsed posts
```

### 生成 Frontmatter

```typescript
import { generateFrontmatter } from '@content-hub/core'

const frontmatter = await generateFrontmatter({
  title: 'Hello World',
  date: new Date(),
  tags: ['test', 'example']
})

console.log(frontmatter)
```

---

## 🏗️ 架构

### 主要模块

- **parser**: Markdown 解析器
- **scanner**: 内容扫描器
- **frontmatter-generator**: Frontmatter 生成器
- **image-resolver**: 图片路径解析器
- **link-injector**: 链接注入器
- **title-injector**: 标题注入器
- **repo-injector**: 仓库链接注入器
- **tag-cache**: 标签缓存

### 依赖关系

```
core
├── database (元数据存储)
└── linker (关系生成)
```

---

## 🔌 API

### 主要函数

| 函数 | 说明 | 返回值 |
|------|------|--------|
| `parseMarkdown()` | 解析 Markdown | `Promise<ParsedContent>` |
| `scanContent()` | 扫描内容目录 | `Promise<Post[]>` |
| `generateFrontmatter()` | 生成 Frontmatter | `Promise<object>` |
| `resolveImages()` | 解析图片路径 | `Promise<string[]>` |
| `injectLinks()` | 注入链接 | `Promise<string>` |
| `injectTitle()` | 注入标题 | `Promise<string>` |

---

## 🧪 开发

```bash
# 进入包目录
cd packages/core

# 构建
pnpm build

# 监听模式
pnpm dev

# 测试
pnpm test

# 类型检查
pnpm typecheck
```

---

## 📚 相关文档

- [详细文档](../../docs/04-developer-guide/packages/core.md)
- [API 参考](../../docs/04-developer-guide/api-reference/core-api.md)

---

## 🤝 贡献

欢迎贡献！请阅读 [贡献指南](../../CONTRIBUTING.md)。

---

**版本**: 0.1.0
**许可证**: MIT
