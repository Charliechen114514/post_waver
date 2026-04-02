# PostWaver 用户使用流程指南

## 📋 概述

PostWaver 是一个"本地优先"的内容管理和分发系统，支持一次写作、多平台发布。

**核心特点：**
- 📝 本地编写 Markdown 文章
- 🚀 一键生成多平台发布格式
- 🔒 内容隐私保护（不提交到公开仓库）
- 🔄 自动同步到 Hexo 博客

---

## 🎯 完整使用流程

### 第一阶段：准备输入内容

#### 1. 文章位置和格式

**文章存储位置：**
```
content/posts/
├── tech/              # 技术文章
├── life/              # 生活随笔
└── notes/             # 学习笔记
```

**文章格式要求：**
- 文件扩展名：`.md`
- 必须包含 Frontmatter（元数据）

**Frontmatter 规范：**
```yaml
---
title: 文章标题          # 必需
date: 2026-04-02T00:00:00Z  # 必需，ISO8601 格式
tags: ['tag1', 'tag2']  # 必需
categories: ['分类']     # 必需
description: 描述       # 可选
draft: false           # 可选，默认 false
---

# 文章标题

正文内容...
```

**文件命名规范：**
- 使用小写字母和连字符：`my-article.md`
- 避免空格和特殊字符
- 文件名将作为文章 ID

#### 2. Assets 资源位置

**资源存储位置：**
```
content/assets/
├── images/            # 图片资源
│   ├── screenshots/  # 截图
│   ├── photos/       # 照片
│   └── diagrams/     # 图表
├── videos/           # 视频资源
└── files/            # 其他文件
```

**图片引用方式：**
```markdown
<!-- 方式 1：本地 assets -->
![示例图片](/assets/images/screenshot.png)

<!-- 方式 2：外部图床（推荐） -->
![示例图片](https://your-cdn.com/image.png)

<!-- 方式 3：占位图服务 -->
![示例图片](https://via.placeholder.com/800x400)
```

---

### 第二阶段：CLI 执行流程

#### 方式 1：推荐工作流程（使用 workflow 命令）

```bash
# Step 1: 扫描并初始化工作流
pnpm workflow:scan

# Step 2: 处理文章（带预览确认）
pnpm workflow:process <postId>

# 或快速处理（跳过预览）
pnpm workflow:process <postId> --fast
```

**工作流状态流转：**
```
draft → previewing → publishing → published
```

#### 方式 2：传统发布流程

```bash
# Step 1: 扫描内容目录
pnpm scan

# Step 2: 查看扫描结果（可选）
pnpm scan:table

# Step 3: 交互式发布
pnpm post:publish <postId>

# 或快速发布
pnpm post:publish:fast <postId>
```

#### 可选：仅生成发布页面

```bash
# 不启动预览服务器，仅生成发布内容
pnpm post:publish:generate <postId>

# 或仅预览
pnpm post:publish:preview-only <postId>
```

---

### 第三阶段：获取输出结果

#### 输出位置

```
output/
└── {hashId}/                    # 基于文章 hash 的唯一目录
    ├── index.html               # 主预览页面（自动打开）
    ├── {postId}-juejin.txt      # 掘金平台内容
    ├── {postId}-wechat.txt      # 微信公众号内容
    ├── {postId}.html            # HTML 通用格式
    └── *_imagelist.txt          # 图片列表文件
```

#### 输出内容格式

**1. 掘金平台（juejin.txt）**
- 格式：标准 Markdown
- 特性：代码高亮、数学公式、Mermaid 图表
- 图片：支持外链或手动上传

**2. 微信公众号（wechat.txt）**
- 格式：HTML + 内联 CSS
- 特性：移动端优化、样式完整
- 图片：建议使用微信素材库或外链

**3. HTML 通用格式（index.html）**
- 格式：独立 HTML 文件
- 特性：可直接在浏览器打开
- 用途：静态归档、文档导出

#### 用户操作流程

1. **自动打开浏览器**
   - 发布命令执行后自动打开 `output/{hashId}/index.html`
   - 可视化预览页面，分屏显示各平台内容

2. **复制粘贴到目标平台**
   - 点击页面上的"复制"按钮
   - 或手动复制对应的 `.txt` 文件内容
   - 粘贴到目标平台编辑器

3. **平台发布**
   - **掘金**：访问 https://juejin.cn/editor 粘贴内容
   - **微信公众号**：登录后台，新建图文，粘贴内容
   - **Hexo 博客**：自动同步（如配置）

---

### 第四阶段：可选同步操作

#### 同步到 Hexo 博客

```bash
# 同步内容到 Hexo
pnpm hexo:sync

# 预览博客
pnpm hexo:preview

# 部署博客
pnpm hexo:deploy
```

#### Git 版本控制

```bash
# 提交并推送博客内容
pnpm sync:blog
```

---

## 📂 关键文件位置

### 输入文件
- **文章**：`content/posts/{postId}.md`
- **资源**：`content/assets/images/`

### 配置文件
- **项目配置**：`.post-waver/config.json`
- **Hexo 配置**：`.post-waver/hexo-config.json`
- **平台 ID**：`.post-waver/platform-ids.json`

### 输出文件
- **发布页面**：`output/{hashId}/index.html`
- **平台内容**：`output/{hashId}/{postId}-{platform}.txt`

### 索引文件
- **内容索引**：`content-index.json`
- **数据库**：`packages/database/prisma/dev.db`

---

## ⚡ 常用命令速查

### 扫描和索引
```bash
pnpm scan                 # 扫描内容
pnpm scan:table          # 表格形式查看
pnpm workflow:scan       # 工作流扫描
```

### 发布流程
```bash
pnpm workflow:process <postId>       # 处理文章（推荐）
pnpm post:publish <postId>           # 交互式发布
pnpm post:publish:fast <postId>      # 快速发布
```

### 状态管理
```bash
pnpm workflow:status     # 查看工作流状态
pnpm workflow:rollback <postId>  # 回滚状态
```

### Hexo 同步
```bash
pnpm hexo:sync           # 同步到博客
pnpm hexo:deploy         # 部署博客
```

---

## ✅ 验证方式

### 验证输入文件

```bash
# 检查文章是否存在
ls -la content/posts/

# 验证 Frontmatter 格式
npx remark content/posts/*.md

# 查看扫描结果
cat content-index.json | jq '.'
```

### 验证输出结果

```bash
# 查看输出目录
ls -la output/

# 查看发布页面
open output/{hashId}/index.html

# 检查平台内容
cat output/{hashId}/*.txt
```

### 完整流程测试

```bash
# 1. 创建测试文章
cat > content/posts/test.md << 'EOF'
---
title: 测试文章
date: 2026-04-02T00:00:00Z
tags: ['test']
categories: ['test']
---

# 测试标题

这是测试内容。
EOF

# 2. 扫描
pnpm scan

# 3. 处理
pnpm workflow:process test --fast

# 4. 验证输出
ls -la output/
```

---

## 📚 文档参考

- **主文档**：[docs/QUICK_START.md](docs/QUICK_START.md) - 1694 行详细指南
- **项目 README**：[README.md](README.md) - 项目概述
- **内容管理**：[content/README.md](content/README.md) - 内容目录说明
- **平台指南**：[docs/guides/](docs/guides/) - 各平台发布指南

---

## 🎯 快速上手示例

```bash
# 1. 创建文章
cat > content/posts/my-first-post.md << 'EOF'
---
title: 我的第一篇文章
date: 2026-04-02T10:00:00Z
tags: ['tutorial', 'beginner']
categories: ['tech']
description: 学习使用 post_waver 的第一步
---

# 欢迎使用 post_waver

这是我使用 post_waver 发布的第一篇文章！
EOF

# 2. 扫描
pnpm workflow:scan

# 3. 处理（会自动打开浏览器）
pnpm workflow:process my-first-post

# 4. 在浏览器中复制内容到目标平台
```

---

## 💡 核心理念总结

PostWaver 的用户使用流程可以总结为：

1. **准备输入** → 在 `content/posts/` 创建 Markdown 文章（带 Frontmatter）
2. **扫描初始化** → 运行 `pnpm workflow:scan`
3. **处理发布** → 运行 `pnpm workflow:process <postId>`
4. **复制粘贴** → 在浏览器中打开发布页面，复制内容到目标平台
5. **可选同步** → 运行 `pnpm hexo:sync` 同步到个人博客

**整个流程设计为"本地优先"，用户的文章内容不会被提交到公开仓库，保障隐私。**

---

**Happy Writing!** ✍️
