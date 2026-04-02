# 仓库引用注入器

本文档介绍 Content Hub 的仓库引用注入器功能，用于在发布到不同平台时自动添加项目仓库的引用链接。

---

## 📋 目录

- [功能概述](#功能概述)
- [使用场景](#使用场景)
- [配置方法](#配置方法)
- [输出格式](#输出格式)
- [API 参考](#api-参考)

---

## 功能概述

### 核心功能

仓库引用注入器会自动在文章内容末尾添加：

1. **仓库链接**：指向 GitHub 项目主页
2. **文章链接**：指向该文章在仓库中的具体文件
3. **仓库描述**：项目的简短描述（可选）

### 设计目标

- ✅ **品牌曝光**：每篇发布的文章都带有项目链接
- ✅ **流量引导**：读者可以方便地找到源码和更多文章
- ✅ **版权声明**：明确标注文章来源
- ✅ **平台适配**：针对不同平台生成合适的格式

---

## 使用场景

### 1. 开源项目博客

如果你在维护一个开源项目，博客文章发布到第三方平台时：

- ✅ 引导读者访问 GitHub 仓库
- ✅ 展示项目的活跃度（文章更新）
- ✅ 建立个人/团队品牌

### 2. 技术文章分发

将技术文章同步发布到多个平台：

- 掘金、知乎、CSDN 等
- 统一的仓库引用提升专业度
- 便于读者找到更多相关内容

### 3. 内容管理系统

Content Hub 作为内容管理的中心：

- 所有文章统一存储在 Git 仓库
- 发布到各平台时自动添加引用
- 保持内容来源的可追溯性

---

## 配置方法

### 命令行配置

```bash
pnpm transform:html content/posts/test.md \
  --repo-owner "Charliechen114514" \
  --repo-name "post_waver" \
  --repo-desc "Content Hub" \
  --repo-branch "main"
```

**参数说明**：

| 参数 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `--repo-owner` | ✅ | - | GitHub 用户名或组织名 |
| `--repo-name` | ✅ | - | 仓库名称 |
| `--repo-desc` | ❌ | 仓库名 | 仓库的描述文本 |
| `--repo-branch` | ❌ | main | Git 分支名 |

### 编程接口配置

```typescript
import { injectRepoReference } from '@content-hub/core'

const content = injectRepoReference(
  htmlContent,
  post,
  {
    owner: 'Charliechen114514',
    repo: 'post_waver',
    branch: 'main',
    description: 'Content Hub - 本地优先的内容管理系统'
  },
  'html'
)
```

### 环境变量配置（推荐）

在项目根目录创建 `.env` 文件：

```env
REPO_OWNER=Charliechen114514
REPO_NAME=post_waver
REPO_DESC=Content Hub
REPO_BRANCH=main
```

然后在脚本中读取：

```typescript
const repoConfig = {
  owner: process.env.REPO_OWNER!,
  repo: process.env.REPO_NAME!,
  description: process.env.REPO_DESC,
  branch: process.env.REPO_BRANCH || 'main'
}
```

---

## 输出格式

### 掘金平台（Markdown 格式）

```markdown
---
*本文首发于 [Content Hub](https://github.com/Charliechen114514/post_waver)，查看源码和更多文章请访问仓库。*
*文章链接：https://github.com/Charliechen114514/post_waver/blob/main/content/posts/test.md*
```

**渲染效果**：

---

*本文首发于 [Content Hub](https://github.com/Charliechen114514/post_waver)，查看源码和更多文章请访问仓库。*
*文章链接：https://github.com/Charliechen114514/post_waver/blob/main/content/posts/test.md*

---

### 微信公众号（HTML 格式）

```html
---
<p style="font-size: 14px; color: #666; margin-top: 40px;">
本文首发于 <a href="https://github.com/Charliechen114514/post_waver">Content Hub</a>，查看源码和更多文章请访问仓库。<br/>
文章链接：<a href="https://github.com/Charliechen114514/post_waver/blob/main/content/posts/test.md">https://github.com/Charliechen114514/post_waver/blob/main/content/posts/test.md</a>
</p>
```

**渲染效果**：

---

本文首发于 [Content Hub](https://github.com/Charliechen114514/post_waver)，查看源码和更多文章请访问仓库。
文章链接：https://github.com/Charliechen114514/post_waver/blob/main/content/posts/test.md

---

### HTML/Web（HTML 格式）

```html
---
<p style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
<strong>来源：</strong><a href="https://github.com/Charliechen114514/post_waver">Content Hub</a><br/>
<strong>原文链接：</strong><a href="https://github.com/Charliechen114514/post_waver/blob/main/content/posts/test.md">https://github.com/Charliechen114514/post_waver/blob/main/content/posts/test.md</a></p>
```

**渲染效果**：

---

**来源：**[Content Hub](https://github.com/Charliechen114514/post_waver)
**原文链接：**https://github.com/Charliechen114514/post_waver/blob/main/content/posts/test.md

---

## API 参考

### 核心函数

#### `injectRepoReference(content, post, repoConfig, platform): string`

为内容注入仓库引用链接。

**类型签名**：

```typescript
function injectRepoReference(
  content: string,
  post: Post,
  repoConfig: RepoConfig,
  platform: string
): string
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `content` | `string` | ✅ | 转换后的文章内容 |
| `post` | `Post` | ✅ | 文章对象（包含 filepath 等信息） |
| `repoConfig` | `RepoConfig` | ✅ | 仓库配置对象 |
| `platform` | `string` | ✅ | 目标平台（'juejin' \| 'wechat' \| 'html'） |

**RepoConfig 类型**：

```typescript
interface RepoConfig {
  /** 仓库拥有者 */
  owner: string
  /** 仓库名称 */
  repo: string
  /** 分支（默认 main） */
  branch?: string
  /** 仓库描述（可选） */
  description?: string
}
```

**返回值**：

- `string`：注入了仓库引用的内容

**示例**：

```typescript
import { injectRepoReference } from '@content-hub/core'
import type { Post } from '@content-hub/core'

const post: Post = {
  id: 'test-post',
  filepath: 'content/posts/test.md',
  frontmatter: {
    title: 'Test Post',
    date: '2026-04-02',
    tags: ['test']
  },
  content: '# Test\n\nContent here...',
  ast: null,
  contentHash: 'abc123',
  scannedAt: new Date()
}

const result = injectRepoReference(
  '<h1>Test</h1><p>Content here...</p>',
  post,
  {
    owner: 'Charliechen114514',
    repo: 'post_waver',
    branch: 'main',
    description: 'Content Hub'
  },
  'html'
)

console.log(result)
// 输出带有仓库引用的 HTML
```

---

## 高级用法

### 自定义模板

如果需要自定义引用格式，可以直接修改 `packages/core/src/repo-injector.ts` 中的 `generateRepoFooter` 函数：

```typescript
function generateRepoFooter(
  repoUrl: string,
  articleUrl: string,
  config: RepoConfig,
  platform: string
): string {
  // 添加你的自定义平台
  switch (platform) {
    case 'custom-platform':
      return `
---
<div class="custom-footer">
  来自 ${config.repo} 的文章
  <a href="${repoUrl}">查看仓库</a>
</div>
`.trim()

    // ... 其他平台
  }
}
```

### 多仓库支持

如果需要为不同文章配置不同的仓库，可以在文章的 Frontmatter 中添加配置：

```yaml
---
title: My Post
date: 2026-04-02
tags:
  - test
repo:
  owner: another-user
  repo: another-repo
  description: Another Project
---
```

然后在转换时读取这个配置。

---

## 最佳实践

### 1. 统一配置

建议在项目根目录的 `.env` 文件中统一配置仓库信息：

```env
REPO_OWNER=your-username
REPO_NAME=your-repo
REPO_DESC=Your Project Description
REPO_BRANCH=main
```

### 2. 分支管理

- **主仓库**：使用 `main` 或 `master` 分支
- **开发分支**：使用 `dev` 或 `develop` 分支
- **文章分支**：为每篇文章创建单独的分支

### 3. 链接有效性

确保生成的链接有效：

- ✅ 文件路径相对于仓库根目录
- ✅ 分支名称正确
- ✅ 仓库存在且公开可访问

### 4. 版权声明

除了仓库引用，还可以在文章开头添加版权声明：

```yaml
---
title: My Post
date: 2026-04-02
tags:
  - test
copyright: >
  本文首发于 [Content Hub](https://github.com/user/repo)，
  转载请注明出处。
---
```

---

## 故障排除

### 常见问题

#### 1. 生成的链接 404

**原因**：
- 文件路径不正确
- 分支名称错误
- 仓库不存在或未公开

**解决方案**：
- 检查 `post.filepath` 是否正确
- 确认 `repoConfig.branch` 与实际分支名一致
- 验证仓库存在且公开可访问

#### 2. 样式不生效

**原因**：
- 平台过滤了某些样式属性
- HTML 结构被修改

**解决方案**：
- 使用内联样式（当前实现）
- 查看平台的编辑器限制
- 简化样式，避免复杂 CSS

#### 3. 链接过长影响美观

**原因**：GitHub 链接通常较长

**解决方案**：
- 使用短链接服务（可选）
- 调整文本描述，让链接更简洁
- 使用按钮样式而非直接链接

---

## 相关文档

- **[转换器技术文档](/docs/transformers/README.md)** - 转换器总览
- **[平台发布指南](/docs/platforms/README.md)** - 各平台发布规范
- **[M2.1 完成报告](/milestones/done/M2.1-完成报告.md)** - 实现详情

---

**文档版本**：v1.0
**最后更新**：2026-04-02
**维护者**：Content Hub Team
