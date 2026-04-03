# Hexo 同步使用指南

本指南介绍如何使用 `post_waver` 的 Hexo 同步功能，将内容自动同步到 Hexo 博客。

---

## 📋 目录

- [前置条件](#前置条件)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [关联信息](#关联信息)
- [图片资源](#图片资源)
- [常见问题](#常见问题)

---

## 前置条件

1. **已完成的里程碑**：
   - [x] M0.3 - 内容扫描器与解析器
   - [x] M1.1 - 图片路径规范化
   - [x] M1.2 - 内容关联生成

2. **Hexo 博客设置**：
   - `blog/` 目录存在且为有效的 Hexo 博客
   - 已配置 `_config.yml` 中的 `permalink`

3. **内容索引**：
   - 已运行 `pnpm scan` 生成 `content-index.json`

---

## 快速开始

### 1. 设置 Hexo 博客

如果还没有 Hexo 博客，可以选择以下方式之一：

#### 方式 1：符号链接（推荐）

```bash
# 将现有的 Hexo 博客链接为 blog/ 目录
ln -s /path/to/your/hexo/blog ./blog
```

#### 方式 2：新建 Hexo 博客

```bash
# 在项目根目录创建新的 Hexo 博客
hexo init blog
cd blog
npm install
```

### 2. 扫描内容

```bash
# 扫描 content/posts/ 并生成索引
pnpm scan
```

输出示例：
```
[LinkOrchestrator] Generating relationships for 4 posts...
[LinkOrchestrator] Relationship generation completed
✅ 扫描完成:
   - 总文章数: 4
   - 新文章: 0
   - 已更新: 0
```

### 3. 同步到 Hexo

```bash
# 同步文章和图片到 Hexo 博客
pnpm sync:hexo
```

输出示例：
```
📖 正在读取内容索引...
📖 正在读取 Hexo 配置...
📋 使用 permalink 格式: :year/:month/:day/:title/
📊 找到 4 篇已发布文章
📷 正在同步图片资源...
✅ 图片资源同步完成
✅ 已同步: test-post-3
✅ 已同步: test-post-2
✅ 已同步: test-post-1
✅ 已同步: example-post

📊 同步完成:
   - 成功: 4 篇
```

### 4. 本地预览

```bash
# 启动 Hexo 开发服务器
cd blog
npx hexo server
```

访问 http://localhost:4000 查看效果。

---

## 配置说明

### Hexo Permalink 配置

同步脚本会自动读取 `blog/_config.yml` 中的 `permalink` 配置，并生成正确的链接。

#### 推荐配置

```yaml
# 日期 + 标题（推荐）
permalink: :year/:month/:day/:title/

# 示例 URL: /2026/04/01/test-post-1/
```

#### 其他可用格式

```yaml
# 仅文件名
permalink: :title.html
# 示例 URL: /test-post-1.html

# 分类 + 标题
permalink: posts/:title/
# 示例 URL: /posts/test-post-1/

# 年份 + 标题
permalink: :year/:title/
# 示例 URL: /2026/test-post-1/
```

**注意**：修改 permalink 后，需要重新运行 `pnpm sync:hexo` 更新链接。

---

## 关联信息

同步脚本会自动为每篇文章注入关联信息，包括：

### 1. 相邻文章

基于发布时间顺序的上一篇和下一篇：

```markdown
## 相关阅读

**相邻文章**：

- [上一篇: Vue.js 实战](/2026/03/30/test-post-3/)
- [下一篇: React 开发指南](/2026/04/02/test-post-2/)
```

### 2. 推荐阅读

基于语义相似度的 Top 3 相关文章：

```markdown
**推荐阅读**：

1. [Vue.js 实战](/2026/03/30/test-post-3/) - 相似度 67%
2. [React 开发指南](/2026/04/02/test-post-2/) - 相似度 67%
3. [示例文章](/2026/04/02/example-post/) - 相似度 41%
```

**相似度计算**：
- 由 M1.2 里程碑的 `LinkOrchestrator` 计算
- 基于标签重叠度和 TF-IDF 算法
- 显示前 3 篇最相关的文章

---

## 图片资源

### 自动同步

同步脚本会自动将 `content/assets/` 目录同步到 `blog/source/assets/`：

```bash
content/assets/images/    → blog/source/assets/images/
content/assets/files/     → blog/source/assets/files/
content/assets/audio/     → blog/source/assets/audio/
content/assets/videos/    → blog/source/assets/videos/
```

### 图片引用

在 Markdown 文章中引用本地图片：

```markdown
<!-- 使用绝对路径（推荐） -->
![图片描述](/assets/images/your-image.png)

<!-- 相对路径也可以工作 -->
![图片描述](../assets/images/your-image.png)
```

**路径规则**：
- `/assets/images/` - 相对于 Hexo 的 `source/` 目录
- 在浏览器中解析为 `/assets/images/your-image.png`

### 图片验证

同步后验证图片是否正确复制：

```bash
# 检查图片是否已同步
ls -la blog/source/assets/images/

# 在 Hexo 开发服务器中测试
curl -I http://localhost:4000/assets/images/your-image.png
# 应返回 HTTP/1.1 200 OK
```

---

## 常见问题

### Q1: 同步后图片 404

**症状**：
浏览器中图片显示为 404 Not Found

**原因**：
Hexo 开发服务器在图片同步之前启动，没有重新加载资源

**解决方案**：
```bash
# 1. 停止 Hexo 服务器（Ctrl+C）

# 2. 清理并重新生成
cd blog
npx hexo clean
npx hexo generate

# 3. 重新启动服务器
npx hexo server
```

### Q2: 链接无法跳转

**症状**：
点击关联链接后 URL 变成嵌套路径，如 `/2026/03/30/test-post-3/2026/04/01/test-post-1/`

**原因**：
使用了旧版本的同步脚本，生成的是相对路径

**解决方案**：
```bash
# 重新同步（新版本使用绝对路径）
pnpm sync:hexo
```

如果问题仍然存在，检查代码版本：
```bash
git pull  # 确保使用最新代码
pnpm build  # 重新构建
```

### Q3: Blog 目录不存在

**症状**：
```
❌ Blog 目录不存在！
💡 请先设置 Hexo 博客：
   方式1: ln -s /path/to/your/blog ./blog
   方式2: hexo init blog
```

**解决方案**：

选择以下方式之一：

1. **链接现有博客**：
```bash
ln -s /path/to/your/hexo/blog ./blog
```

2. **新建 Hexo 博客**：
```bash
hexo init blog
cd blog
npm install
```

3. **使用子模块**（推荐用于独立博客仓库）：
```bash
git submodule add <your-blog-repo-url> blog
```

### Q4: 索引不存在

**症状**：
```
❌ 索引不存在，请先运行 pnpm scan
```

**解决方案**：
```bash
# 扫描内容并生成索引
pnpm scan

# 验证索引文件是否存在
ls -la content-index.json
```

### Q5: Permalink 配置不生效

**症状**：
修改了 `_config.yml` 中的 permalink，但同步后的链接没有变化

**原因**：
同步脚本缓存了旧的配置，或者没有重新同步

**解决方案**：
```bash
# 1. 重新同步（会重新读取配置）
pnpm sync:hexo

# 2. 验证链接是否更新
grep -A 10 "相关阅读" blog/source/_posts/*.md
```

### Q6: 草稿文章也被同步了

**当前行为**：
设计上会同步所有文章（包括草稿），以便在 Hexo 中预览

**如需过滤草稿**：
可以修改 `scripts/sync-to-hexo.ts` 中的过滤逻辑：
```typescript
const publishedPosts = Object.values(index.posts).filter(post => !post.draft)
```

---

## 高级用法

### 仅同步特定文章

如果只想同步特定文章，可以修改同步脚本添加过滤条件：

```typescript
// 示例：只同步特定标签的文章
const taggedPosts = publishedPosts.filter(post =>
  post.tags.includes('hexo')
)
```

### 自定义关联信息格式

如果想要自定义关联信息的显示格式，可以修改 `packages/core/src/link-injector.ts` 中的 `injectRelatedLinks` 函数。

### 批量操作

```bash
# 完整的工作流程
pnpm scan           # 1. 扫描内容
pnpm sync:hexo      # 2. 同步到 Hexo
cd blog && npx hexo clean && npx hexo generate  # 3. 生成静态文件
pnpm sync:blog      # 4. 提交到博客仓库（可选）
```

---

## 相关文档

- [M1.3 完成报告](../../milestones/done/M1.3-完成报告.md) - 功能实现细节
- [M1.2 内容关联生成](../../milestones/done/M1.2-内容关联生成.md) - 关联信息生成逻辑
- [Hexo 官方文档](https://hexo.io/zh-cn/docs/) - Hexo 使用指南

---

## 技术支持

如有问题或建议，请：
1. 查看 [常见问题](#常见问题)
2. 提交 Issue 到项目仓库
3. 查看源码：[scripts/sync-to-hexo.ts](../../scripts/sync-to-hexo.ts)
