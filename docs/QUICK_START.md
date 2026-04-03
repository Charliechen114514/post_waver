# PostWaver 快速开始

> **版本**: v3.0  
> **更新日期**: 2026-04-02  
> **预计阅读时间**: 5 分钟

---

## 🎯 5 分钟上手 PostWaver

PostWaver 是一个"本地优先"的内容管理和分发系统，帮助你一次写作、多平台发布。

### ✨ 核心特点

- 📝 **本地编写** - 使用 Markdown 和你喜欢的编辑器
- 🚀 **多平台发布** - 一键生成掘金、微信公众号等平台格式
- 🔒 **隐私保护** - 文章内容不会提交到公开仓库
- 🔄 **自动同步** - 支持同步到 Hexo 个人博客
- 💾 **全数据库存储** - 所有配置、缓存、索引都在 SQLite 数据库中

---

## 📋 第一步：安装

### 前置要求

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Git**（可选，用于版本控制）

### 安装命令

```bash
# 1. 克隆仓库
git clone https://github.com/Charliechen114514/post_waver.git
cd post_waver

# 2. 安装依赖
pnpm install

# 3. 构建项目
pnpm build

# 4. 初始化数据库
pnpm db:init
```

> **💡 数据存储说明**  
> PostWaver 采用全数据库存储方案，所有数据（配置、缓存、索引、工作流状态）都存储在 `packages/database/prisma/dev.db` 文件中。迁移或备份时只需复制这一个文件。详见 [数据库存储文档](DATABASE_STORAGE.md)。

---

## 📝 第二步：创建第一篇文章

### 文章格式

每篇文章需要包含 Frontmatter（元数据），**但不用担心！PostWaver 支持自动生成**：

```bash
# 创建文章目录
mkdir -p content/posts/tech

# 创建第一篇文章（不需要写 Frontmatter！）
cat > content/posts/my-first-post.md << 'EOF'
# 欢迎使用 PostWaver

这是我用 PostWaver 发布的第一篇文章！

## 为什么选择 PostWaver？

- 一次写作，多平台发布
- 自动格式转换
- 简单易用
EOF
```

### 🪄 自动生成 Frontmatter

PostWaver 会智能分析你的文章内容，自动生成 Frontmatter：

- **AI 智能生成**（在 Claude Code 环境中）：
  - 使用 Claude API 分析文章内容
  - 生成准确的标题、标签、分类和描述
  - 从常用标签库中智能选择

- **规则生成**（Fallback）：
  - 从第一个一级标题提取 `title`
  - 自动添加当前日期作为 `date`
  - 根据文章内容提取关键词作为 `tags`
  - 从文件路径推断 `categories`
  - 提取第一段内容作为 `description`

### 手动指定 Frontmatter（可选）

如果你想完全控制，也可以手动编写 Frontmatter：

```markdown
---
title: 我的第一篇文章
date: 2026-04-02T10:00:00Z
tags: ['tutorial', 'beginner']
categories: ['tech']
description: 学习使用 PostWaver 的第一步
---
```

### Frontmatter 字段说明

| 字段 | 必需 | 说明 |
|------|------|------|
| `title` | ✅ | 文章标题（可自动生成） |
| `date` | ✅ | 发布日期（可自动生成） |
| `tags` | ✅ | 标签数组（可自动生成） |
| `categories` | ✅ | 分类数组（可自动生成） |
| `description` | ❌ | 文章描述（可自动生成） |
| `draft` | ❌ | 是否为草稿（默认 false） |

> **💡 开发环境自动注入**  
> 当你运行 `pnpm dev` 启动开发环境时，系统会**自动扫描并注入缺失的 Frontmatter** 到你的文章文件中。你甚至不需要手动编写 Frontmatter，只需专注于内容创作即可！
>
> - 只补充缺失的字段，不覆盖已有内容
> - 智能检测并最小化文件写入
> - 完全自动化，无需手动干预

---

## 🚀 第三步：发布文章

### 启动开发环境（推荐）

```bash
# 启动开发环境
pnpm dev
```

**开发环境会自动完成**：
1. 📚 扫描 `content/posts` 目录
2. 💾 **自动注入缺失的 Frontmatter** 到文章文件
3. 🔗 注入相关文章链接
4. 🚀 启动 Web UI（http://localhost:5173）

**为什么推荐？**
- ✅ 全自动，无需手动维护 Frontmatter
- ✅ 实时预览和编辑
- ✅ 可视化管理文章

### 手动扫描（可选）

如果你不想启动完整开发环境，也可以手动扫描：

```bash
# 扫描并自动注入 Frontmatter
pnpm scan --inject

# 或只扫描不注入
pnpm scan
```

### 处理文章

```bash
# 处理文章（带预览确认）
pnpm workflow:process my-first-post
```

系统会：
1. 解析文章内容
2. 生成多平台预览
3. 自动打开浏览器
4. 等待你确认

### 复制粘贴到平台

浏览器打开发布页面后：

1. **掘金平台**
   - 点击"复制掘金内容"
   - 访问 [掘金写作平台](https://juejin.cn/editor/drafts/new)
   - 粘贴内容并发布

2. **微信公众号**
   - 点击"复制微信内容"
   - 登录 [微信公众平台](https://mp.weixin.qq.com)
   - 新建图文，粘贴内容

3. **Hexo 博客**（可选）
   ```bash
   # 同步到个人博客
   pnpm hexo:sync
   pnpm hexo:deploy
   ```

---

## 🎓 下一步学习

### 📖 深入学习

- **[用户手册](USER_GUIDE.md)** - 完整的功能使用指南
- **[平台指南](guides/)** - 各平台发布详细教程
- **[CLI 参考](CLI_REFERENCE.md)** - 所有命令说明

### 🔧 高级功能

- **图片管理** - 自动上传到微信公众号素材库
- **Hexo 集成** - 同步到个人博客
- **工作流管理** - 追踪文章发布状态

### ❓ 遇到问题？

- **[故障排查](TROUBLESHOOTING.md)** - 常见问题解决方案
- **[提交 Issue](https://github.com/Charliechen114514/post_waver/issues)** - 获取帮助

---

## 💡 常用命令速查

```bash
# 扫描内容
pnpm workflow:scan

# 处理文章
pnpm workflow:process <post-id>

# 快速发布（跳过预览）
pnpm workflow:process <post-id> --fast

# 查看状态
pnpm workflow:status

# 同步到 Hexo
pnpm hexo:sync
```

---

## 🎉 开始创作

现在你已经掌握了基础，开始创作你的第一篇文章吧！

**记住**：PostWaver 的核心价值是"一次写作，多平台发布"，让你专注于内容创作，而不是格式转换。

---

**需要帮助？** 查看 [用户手册](USER_GUIDE.md) 或 [故障排查指南](TROUBLESHOOTING.md)
