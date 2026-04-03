# Link Injector API 文档

`@content-hub/core/link-injector` 模块提供文章关联信息注入功能，用于自动生成相邻文章链接和相关推荐。

---

## 目录

- [概述](#概述)
- [API 参考](#api-参考)
- [类型定义](#类型定义)
- [使用示例](#使用示例)
- [注意事项](#注意事项)

---

## 概述

Link Injector 负责为文章内容注入关联信息，包括：
- **相邻文章**：基于时间顺序的上一篇和下一篇
- **相关推荐**：基于语义相似度的 Top 3 相关文章

**特点**：
- ✅ 自动生成 Hexo permalink（支持任意配置）
- ✅ 使用绝对路径（避免相对路径嵌套问题）
- ✅ 显示相似度百分比
- ✅ 智能过滤（无关联信息时不添加内容）

---

## API 参考

### `injectRelatedLinks()`

为文章内容注入关联信息（上/下篇、相关阅读）。

#### 函数签名

```typescript
function injectRelatedLinks(
  content: string,
  post: IndexedPost,
  allPosts: Record<string, IndexedPost>,
  permalinkPattern?: string
): string
```

#### 参数

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `content` | `string` | ✅ | - | 原始文章内容 |
| `post` | `IndexedPost` | ✅ | - | 当前文章的索引信息 |
| `allPosts` | `Record<string, IndexedPost>` | ✅ | - | 所有文章的索引 |
| `permalinkPattern` | `string` | ❌ | `:year/:month/:day/:title/` | Hexo permalink 模式 |

#### 返回值

`string` - 注入关联信息后的文章内容

#### 示例

```typescript
import { injectRelatedLinks } from '@content-hub/core'

const content = '# 我的文章\n\n这是文章内容。'

const post = {
  id: 'my-post',
  title: '我的文章',
  date: '2026-04-01T10:00:00Z',
  tags: ['typescript', 'tutorial'],
  prev: 'previous-post',
  next: 'next-post',
  related: [
    { id: 'related-post-1', title: '相关文章1', score: 0.85 }
  ]
}

const allPosts = {
  'my-post': post,
  'previous-post': { /* ... */ },
  'next-post': { /* ... */ },
  'related-post-1': { /* ... */ }
}

const enhanced = injectRelatedLinks(content, post, allPosts)
console.log(enhanced)
```

输出：
```markdown
# 我的文章

这是文章内容。


---

## 相关阅读

**相邻文章**：

- [上一篇: Previous Post](/2026/03/31/previous-post/)
- [下一篇: Next Post](/2026/04/02/next-post/)

**推荐阅读**：

1. [相关文章1](/2026/04/01/related-post-1/) - 相似度 85%
```

---

### `generatePermalink()`

根据日期和 ID 生成 Hexo permalink。

**注意**：此函数为内部函数，通常不需要直接调用。使用 `injectRelatedLinks()` 会自动调用。

#### 函数签名

```typescript
function generatePermalink(
  id: string,
  dateString: string,
  permalinkPattern?: string
): string
```

#### 参数

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `id` | `string` | ✅ | - | 文章 ID |
| `dateString` | `string` | ✅ | - | 文章日期（ISO8601 格式） |
| `permalinkPattern` | `string` | ❌ | `:year/:month/:day/:title/` | Hexo permalink 模式 |

#### 返回值

`string` - 生成的 permalink 路径（以 `/` 开头的绝对路径）

#### 示例

```typescript
import { generatePermalink } from '@content-hub/core/link-injector'

const permalink = generatePermalink(
  'my-post',
  '2026-04-01T10:00:00Z',
  ':year/:month/:day/:title/'
)

console.log(permalink)
// 输出: /2026/04/01/my-post
```

---

## 类型定义

### `IndexedPost`

已索引文章的数据结构（来自 `@content-hub/core/types`）。

```typescript
interface IndexedPost {
  /** 文章 ID */
  id: string

  /** 文章标题 */
  title: string

  /** 发布时间（ISO8601） */
  date: string

  /** 标签列表 */
  tags: string[]

  /** 内容哈希（SHA256） */
  contentHash: string

  /** 文件路径 */
  filepath: string

  /** 是否为草稿 */
  draft: boolean

  /** 上一篇文章 ID */
  prev?: string

  /** 下一篇文章 ID */
  next?: string

  /** 相关文章（Top 3） */
  related?: RelatedPost[]
}
```

### `RelatedPost`

相关文章的数据结构。

```typescript
interface RelatedPost {
  /** 文章 ID */
  id: string

  /** 文章标题 */
  title: string

  /** 相似度分数（0-1） */
  score: number
}
```

---

## 使用示例

### 基本使用

```typescript
import { injectRelatedLinks } from '@content-hub/core'
import { readIndex } from '@content-hub/core/scanner'

async function enhancePost(postId: string) {
  // 读取索引
  const index = await readIndex()
  if (!index) throw new Error('索引不存在')

  const post = index.posts[postId]
  const content = await readFile(post.filepath, 'utf-8')

  // 注入关联信息
  const enhanced = injectRelatedLinks(
    content,
    post,
    index.posts
  )

  return enhanced
}
```

### 自定义 Permalink

```typescript
import { injectRelatedLinks } from '@content-hub/core'

const enhanced = injectRelatedLinks(
  content,
  post,
  allPosts,
  ':title.html'  // 使用自定义 permalink 格式
)

// 生成的链接: /my-post.html
```

### 无关联信息时不添加内容

```typescript
const post = {
  id: 'isolated-post',
  title: '独立文章',
  date: '2026-04-01T10:00:00Z',
  tags: ['unique'],
  // 没有 prev, next, related
}

const enhanced = injectRelatedLinks(
  content,
  post,
  allPosts
)

// 如果没有任何关联信息，返回原始内容不变
console.log(enhanced === content)  // true
```

---

## 注意事项

### 1. Permalink 格式

确保 `permalinkPattern` 与 Hexo 的 `_config.yml` 中的配置一致：

```yaml
# blog/_config.yml
permalink: :year/:month/:day/:title/
```

```typescript
// 同步脚本中的 pattern 应该匹配
const permalinkPattern = ':year/:month/:day/:title/'
```

### 2. 日期格式

`dateString` 必须是有效的 ISO8601 格式：

```typescript
// ✅ 正确
'2026-04-01T10:00:00Z'
'2026-04-01T10:00:00+08:00'

// ❌ 错误
'2026-04-01'
'April 1, 2026'
```

### 3. 绝对路径

生成的链接始终是绝对路径（以 `/` 开头），确保从任何页面都能正确跳转：

```typescript
const permalink = generatePermalink('my-post', '2026-04-01T10:00:00Z')

console.log(permalink)
// 输出: /2026/04/01/my-post
//       ^ 注意开头的斜杠
```

### 4. 相似度显示

相似度会四舍五入到整数百分比：

```typescript
score: 0.856  // 显示为 "相似度 86%"
score: 0.413  // 显示为 "相似度 41%"
```

### 5. 相关文章数量

只显示前 3 篇相关文章：

```typescript
post.related = [
  { id: 'post-1', title: 'Post 1', score: 0.9 },  // ✅ 显示
  { id: 'post-2', title: 'Post 2', score: 0.8 },  // ✅ 显示
  { id: 'post-3', title: 'Post 3', score: 0.7 },  // ✅ 显示
  { id: 'post-4', title: 'Post 4', score: 0.6 },  // ❌ 不显示
]
```

---

## 性能考虑

- **时间复杂度**：O(1) - 只处理当前文章的关联信息
- **空间复杂度**：O(n) - n 为关联文章数量（通常 ≤ 5）
- **建议**：对于大量文章，建议缓存 `allPosts` 对象

---

## 相关模块

- [`@content-hub/core/scanner`](./scanner.md) - 内容扫描器
- [`@content-hub/core/types`](./types.md) - 类型定义
- [`@content-hub/linker`](../packages/linker/README.md) - 关联关系生成器

---

## 更新日志

### v0.1.0 (2026-04-02)

- ✅ 初始版本
- ✅ 支持相邻文章链接
- ✅ 支持相关推荐
- ✅ 智能 permalink 生成
- ✅ 绝对路径支持

---

## 许可证

MIT
