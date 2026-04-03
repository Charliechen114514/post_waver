# 数据流

> **版本**: v1.0
> **最后更新**: 2026-04-03
> **受众**: 开发者
> **阅读时间**: 15 分钟

---

## 📋 概述

本文档详细说明了 PostWaver 中的数据流转过程，包括内容扫描、转换、发布等关键流程。

---

## 🔄 主要数据流

### 1. 内容扫描流程

```
Markdown 文件
    ↓
Scanner (core)
    ↓
生成 Frontmatter
    ↓
解析内容
    ↓
提取元数据
    ↓
存储到数据库 (database)
    ↓
返回文章对象
```

**详细步骤**:

1. **扫描目录**: 扫描 `content/posts/` 目录
2. **读取文件**: 读取所有 `.md` 文件
3. **解析 Frontmatter**: 提取现有 Frontmatter
4. **生成 Frontmatter**: 补充缺失的字段
5. **解析内容**: 使用 unified/remark 解析
6. **提取图片**: 提取所有图片路径
7. **存储数据**: 保存到 SQLite 数据库

**代码位置**: `packages/core/src/scanner.ts`

---

### 2. 内容转换流程

```
Markdown 内容
    ↓
Parser (core)
    ↓
AST (抽象语法树)
    ↓
Transformer (transformer)
    ↓
平台特定格式
    ↓
注入链接/标题 (core)
    ↓
最终输出
```

**详细步骤**:

1. **解析 Markdown**: 转换为 AST
2. **提取内容**: 提取标题、内容、图片
3. **平台转换**: 应用平台特定规则
4. **样式处理**: 添加平台特定样式
5. **链接注入**: 注入相关文章链接
6. **标题处理**: 添加/优化标题
7. **输出结果**: 返回转换后内容

**代码位置**: `packages/transformer/src/`

---

### 3. 关系生成流程

```
文章 ID
    ↓
查询数据库 (database)
    ↓
标签匹配 (linker)
    ↓
时间排序
    ↓
计算前后篇 (linker)
    ↓
语义分析 (可选，Python)
    ↓
返回相关文章
```

**详细步骤**:

1. **查询文章**: 从数据库获取文章
2. **标签匹配**: 匹配有相同标签的文章
3. **时间排序**: 按发布时间排序
4. **前后篇计算**: 计算上一篇和下一篇
5. **语义分析**: 使用 Python TF-IDF（可选）
6. **返回结果**: 返回相关文章列表

**代码位置**: `packages/linker/src/`

---

### 4. 发布流程

```
选择文章
    ↓
选择平台
    ↓
转换内容 (transformer)
    ↓
上传图片 (adapter，可选)
    ↓
发布到平台 (adapter)
    ↓
保存发布记录 (database)
    ↓
返回结果
```

**详细步骤**:

1. **选择文章**: 用户选择要发布的文章
2. **选择平台**: 选择目标平台
3. **转换内容**: 转换为平台格式
4. **上传图片**: 上传图片到平台（如需要）
5. **发布内容**: 调用平台 API 发布
6. **保存记录**: 保存发布记录到数据库
7. **返回结果**: 返回发布结果（URL 等）

**代码位置**: `packages/engine/src/`

---

### 5. Hexo 同步流程

```
文章列表
    ↓
转换为 Hexo 格式
    ↓
注入模板 (core)
    ↓
写入 Hexo 目录
    ↓
生成静态文件 (Hexo)
    ↓
Git 提交
    ↓
推送到远程
```

**详细步骤**:

1. **获取文章**: 从数据库获取文章
2. **转换格式**: 转换为 Hexo 格式
3. **注入模板**: 注入到 Hexo 模板
4. **写入文件**: 写入到 `blog/` 目录
5. **生成静态文件**: 运行 `hexo generate`
6. **Git 提交**: 提交到 Git 仓库
7. **推送**: 推送到远程仓库

**代码位置**: `scripts/sync-to-hexo.ts`

---

## 📊 数据模型

### 文章数据结构

```typescript
interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  status: PostStatus
  publishedAt: Date | null
  tags: string[]
  categories: string[]
  frontmatter: Record<string, any>
  images: string[]
  createdAt: Date
  updatedAt: Date
}
```

### 发布记录数据结构

```typescript
interface PublishRecord {
  id: string
  postId: string
  platform: Platform
  platformPostId: string
  platformUrl: string
  status: PublishStatus
  publishedAt: Date
  createdAt: Date
}
```

---

## 🔍 关键数据流示例

### 示例1: 创建并发布文章

```typescript
// 1. 创建文章
const post = await createPost({
  title: 'Hello World',
  content: '# Hello World\n\nThis is a test.',
  tags: ['test']
})

// 2. 扫描和索引
await scanContent('content/posts')

// 3. 转换为平台格式
const transformed = await transformToJuejin(post.content)

// 4. 发布到平台
const result = await publishToPlatform(post.id, 'juejin')

// 5. 保存发布记录
await savePublishRecord({
  postId: post.id,
  platform: 'juejin',
  platformUrl: result.url
})
```

### 示例2: 生成相关文章

```typescript
// 1. 获取文章
const post = await getPostById('post-id')

// 2. 获取相关文章
const related = await getRelatedPosts(post.id, {
  limit: 5,
  method: 'tags' // or 'semantic'
})

// 3. 注入到内容
const contentWithLinks = await injectRelatedLinks(post.content, related)
```

---

## 📈 性能考虑

### 缓存策略

- **标签缓存**: 缓存标签匹配结果
- **内容缓存**: 缓存解析后的内容
- **API 缓存**: 缓存平台 API 响应

### 批处理

- **批量扫描**: 一次扫描多个文件
- **批量发布**: 支持批量发布到多个平台
- **批量转换**: 并行转换多个文章

### 数据库优化

- **索引**: 在常用查询字段上建立索引
- **分页**: 大数据集使用分页查询
- **连接优化**: 优化数据库连接

---

## 🔧 调试数据流

### 启用调试日志

```bash
# 设置环境变量
export DEBUG=postwaver:*

# 运行命令
pnpm scan
```

### 查看数据库状态

```bash
# 打开 Prisma Studio
pnpm db:studio

# 查看文章状态
pnpm post:status
```

### 测试数据流

```bash
# 测试扫描
pnpm scan

# 测试转换
pnpm transform:juejin

# 测试发布（预览）
pnpm preview:juejin
```

---

## 📚 相关文档

- [系统架构总览](overview.md)
- [包依赖关系](package-dependencies.md)
- [数据库设计](database-schema.md)

---

**最后更新**: 2026-04-03
**维护者**: PostWaver Team
**反馈**: [GitHub Issues](https://github.com/Charliechen114514/post_waver/issues)
