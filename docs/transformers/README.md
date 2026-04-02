# 内容转换器技术文档

本文档介绍 Content Hub 的内容转换器系统，用于将 Markdown 内容转换为不同平台所需的格式。

---

## 📋 目录

- [概述](#概述)
- [架构设计](#架构设计)
- [转换器类型](#转换器类型)
- [使用指南](#使用指南)
- [扩展指南](#扩展指南)
- [API 参考](#api-参考)

---

## 概述

### 功能定位

内容转换器负责将 Markdown 格式的文章内容转换为不同平台所需的格式：

- **HTML 转换器**：生成标准 HTML，用于 Web 预览
- **微信转换器**：生成带内联样式的 HTML，符合微信公众号编辑器要求
- **掘金转换器**：生成与掘金编辑器兼容的 Markdown

### 设计原则

1. **单一职责**：每个转换器只负责一个平台的转换
2. **接口统一**：所有转换器使用相同的函数签名
3. **可扩展性**：易于添加新的平台转换器
4. **独立性**：转换器不依赖外部状态

---

## 架构设计

### 包结构

```
packages/transformer/
├── src/
│   ├── types.ts           # 类型定义
│   ├── to-html.ts         # HTML 转换器
│   ├── to-wechat.ts       # 微信转换器
│   ├── to-juejin.ts       # 掘金转换器
│   └── index.ts           # 导出接口
├── package.json
└── tsconfig.json
```

### 核心依赖

```json
{
  "dependencies": {
    "@content-hub/core": "workspace:*",
    "unified": "^11.0.5",
    "remark-parse": "^11.0.0",
    "remark-rehype": "^11.0.0",
    "rehype-stringify": "^10.0.0",
    "rehype-raw": "^7.0.0"
  }
}
```

**技术栈说明**：

- **unified**：统一的文本处理框架
- **remark**：Markdown 解析和转换
- **rehype**：HTML 处理和序列化
- **rehype-raw**：支持 HTML 在 Markdown 中

---

## 转换器类型

### 1. HTML 转换器

**文件**：`packages/transformer/src/to-html.ts`

**功能**：将 Markdown 转换为标准 HTML

**实现**：

```typescript
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeRaw from 'rehype-raw'

export async function markdownToHTML(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(markdown)

  return String(result)
}
```

**特点**：

- ✅ 支持 GFM（GitHub Flavored Markdown）
- ✅ 支持代码块语法高亮
- ✅ 支持表格、删除线等扩展语法
- ✅ 保留 HTML 标签

**使用场景**：

- Web 预览渲染
- 邮件内容生成
- 归档格式

---

### 2. 微信转换器

**文件**：`packages/transformer/src/to-wechat.ts`

**功能**：将 Markdown 转换为带内联样式的 HTML

**实现策略**：

1. 先调用 HTML 转换器生成基础 HTML
2. 使用正则表达式为所有元素添加内联样式

**样式覆盖**：

| 元素 | 样式 |
|------|------|
| H1 | font-size: 24px, font-weight: bold, margin: 30px 0 20px |
| H2 | font-size: 20px, font-weight: bold, margin: 25px 0 15px |
| H3 | font-size: 18px, font-weight: bold, margin: 20px 0 10px |
| 段落 | font-size: 15px, line-height: 1.8, text-align: justify |
| 代码块 | background: #f4f4f4, padding: 16px, border-radius: 4px |
| 引用 | border-left: 4px solid #ddd, background: #f9f9f9 |
| 表格 | border-collapse: collapse, border: 1px solid #ddd |
| 链接 | color: #007bff, text-decoration: underline |

**使用场景**：

- 微信公众号文章发布
- 其他不支持外部样式表的 HTML 编辑器

---

### 3. 掘金转换器

**文件**：`packages/transformer/src/to-juejin.ts`

**功能**：生成与掘金编辑器兼容的 Markdown

**实现**：直接返回原始 Markdown（掘金原生支持 Markdown）

```typescript
export async function transformForJuejin(markdown: string): Promise<string> {
  return markdown
}
```

**使用场景**：

- 掘金平台文章发布（semi-auto 策略）
- 其他支持 Markdown 的平台

**相关文档**：

- [掘金半自动发布指南](/docs/platforms/juejin-semi-auto-guide.md)
- [PV.1 掘金平台调研](/milestones/done/PV.1-完成报告.md)

---

## 使用指南

### 命令行使用

#### 基础转换

```bash
# 转换为 HTML
pnpm transform:html content/posts/test.md > /tmp/output.html

# 转换为微信格式
pnpm transform:wechat content/posts/test.md > /tmp/wechat.html

# 转换为掘金格式
pnpm transform:juejin content/posts/test.md > /tmp/juejin.md
```

#### 带仓库引用的转换

```bash
pnpm transform:html content/posts/test.md \
  --repo-owner "Charliechen114514" \
  --repo-name "post_waver" \
  --repo-desc "Content Hub" \
  > /tmp/output.html
```

**参数说明**：

- `--repo-owner`：仓库拥有者（必填）
- `--repo-name`：仓库名称（必填）
- `--repo-branch`：仓库分支（可选，默认 main）
- `--repo-desc`：仓库描述（可选）

### 编程接口使用

```typescript
import { markdownToHTML, transformForWechat, transformForJuejin } from '@content-hub/transformer'
import { injectRepoReference } from '@content-hub/core'

// 基础转换
const html = await markdownToHTML(markdown)
const wechat = await transformForWechat(markdown)
const juejin = await transformForJuejin(markdown)

// 带仓库引用的转换
const withRepo = injectRepoReference(
  html,
  post,
  {
    owner: 'Charliechen114514',
    repo: 'post_waver',
    branch: 'main',
    description: 'Content Hub'
  },
  'html'
)
```

---

## 扩展指南

### 添加新平台转换器

#### 1. 创建转换器文件

在 `packages/transformer/src/` 下创建新文件，例如 `to-zhihu.ts`：

```typescript
/**
 * 知乎转换器
 */
export async function transformForZhihu(markdown: string): Promise<string> {
  // 实现知乎特定的转换逻辑
  // ...

  return transformedContent
}
```

#### 2. 导出接口

在 `packages/transformer/src/index.ts` 中添加导出：

```typescript
export * from './to-zhihu.js'
```

#### 3. 更新类型定义

在 `packages/transformer/src/types.ts` 中添加平台类型：

```typescript
export type Platform = 'html' | 'wechat' | 'juejin' | 'zhihu'
```

#### 4. 添加 CLI 命令

在 `scripts/transform.ts` 中添加新的平台分支：

```typescript
case 'zhihu':
  transformed = await transformForZhihu(content)
  console.log(transformed)
  break
```

#### 5. 添加 NPM Script

在 `package.json` 中添加：

```json
{
  "scripts": {
    "transform:zhihu": "tsx scripts/transform.ts zhihu"
  }
}
```

### 样式自定义

如果需要自定义微信转换器的样式，可以修改 `packages/transformer/src/to-wechat.ts` 中的样式对象：

```typescript
const customStyles = {
  h1: 'font-size: 26px; color: #your-color;',
  // ...
}
```

---

## API 参考

### 核心函数

#### `markdownToHTML(markdown: string): Promise<string>`

将 Markdown 转换为标准 HTML。

**参数**：
- `markdown`：Markdown 格式的字符串

**返回**：
- `Promise<string>`：HTML 格式的字符串

**示例**：

```typescript
const html = await markdownToHTML('# Hello\n\nWorld')
// <h1>Hello</h1>\n<p>World</p>
```

---

#### `transformForWechat(markdown: string): Promise<string>`

将 Markdown 转换为带内联样式的 HTML（微信公众号格式）。

**参数**：
- `markdown`：Markdown 格式的字符串

**返回**：
- `Promise<string>`：带内联样式的 HTML 字符串

---

#### `transformForJuejin(markdown: string): Promise<string>`

将 Markdown 转换为掘金兼容格式。

**参数**：
- `markdown`：Markdown 格式的字符串

**返回**：
- `Promise<string>`：Markdown 字符串

---

### 仓库引用注入器

#### `injectRepoReference(content, post, repoConfig, platform): string`

为内容注入仓库引用链接。

**参数**：
- `content: string`：转换后的内容
- `post: Post`：文章对象（来自 `@content-hub/core`）
- `repoConfig: RepoConfig`：仓库配置
  - `owner: string`：仓库拥有者
  - `repo: string`：仓库名称
  - `branch?: string`：分支（可选）
  - `description?: string`：描述（可选）
- `platform: string`：平台类型

**返回**：
- `string`：注入了仓库引用的内容

**示例**：

```typescript
import { injectRepoReference } from '@content-hub/core'

const content = injectRepoReference(
  htmlContent,
  post,
  {
    owner: 'user',
    repo: 'repo',
    branch: 'main',
    description: 'My Project'
  },
  'html'
)
```

---

## 故障排除

### 常见问题

#### 1. 微信转换器样式不生效

**原因**：微信公众号编辑器可能过滤了某些样式属性

**解决方案**：
- 检查样式属性是否被过滤
- 使用内联样式而非外部样式表
- 参考 [微信公众号编辑器限制](/docs/platforms/wechat-limitations.md)

#### 2. 掘金转换器输出异常

**原因**：掘金编辑器可能不支持某些 Markdown 语法

**解决方案**：
- 查看 [掘金半自动发布指南](/docs/platforms/juejin-semi-auto-guide.md)
- 测试内容在掘金编辑器中的渲染效果
- 调整 Markdown 格式以符合掘金要求

#### 3. HTML 转换器输出包含多余标签

**原因**：Markdown 中包含原始 HTML 标签

**解决方案**：
- 使用 `rehype-sanitize` 清理 HTML（安全考虑）
- 或者保留原始 HTML（当前实现）

---

## 相关文档

- **[平台发布指南](/docs/platforms/README.md)** - 各平台发布规范
- **[M2.1 完成报告](/milestones/done/M2.1-完成报告.md)** - 实现详情
- **[仓库引用注入器](/docs/features/repo-injector.md)** - 仓库引用功能

---

**文档版本**：v1.0
**最后更新**：2026-04-02
**维护者**：Content Hub Team
