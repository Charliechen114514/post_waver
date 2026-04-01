# Blog 目录说明

## 目录用途

本目录包含个人技术博客的 Hexo 源文件，用于部署到 https://charliechen114514.github.io/

**架构说明**：
- **Git Submodule**：本目录是 post_waver 项目的 [Git Submodule](https://git-scm.com/book/zh/v2/Git-%E5%B7%A5%E5%85%B7-%E5%AD%90%E6%A8%A1%E5%9D%97)，链接到独立的 [blog-source](https://github.com/Charliechen114514/blog-source) 仓库
- **独立版本控制**：博客有自己的版本历史，可以独立开源和接受贡献
- **工具链集成**：post_waver 工具链可以自动向本目录写入文章，并通过 `update-blog.sh` 脚本自动同步
- **GitHub 部署**：通过 `hexo-deployer-git` 插件部署到独立的 `charliechen114514.github.io` 仓库

## 博客信息

- **部署地址**：https://charliechen114514.github.io/
- **主题**：Hexo + Butterfly（基于 jerryc127/hexo-theme-butterfly）
- **文章数**：22 篇
- **总字数**：261.4k
- **标签数**：21 个
- **访问统计**：busuanzi（不蒜子）

### 技术主题

博客涵盖以下技术主题：
- C/C++ 并发编程
- 嵌入式开发（STM32、OLED、PlatformIO）
- Linux 系统编程（GDB、WSL2、树莓派）
- 计算机架构（AMD64）
- 其他（Qt、Tesseract OCR、设计模式等）

## 快速开始

### 本地预览

```bash
# 安装依赖（首次运行）
pnpm install

# 启动本地服务器
hexo server

# 访问 http://localhost:4000
```

### 创建新文章

```bash
# 创建新文章
hexo new "文章标题"

# 编辑文章
vim source/_posts/文章标题.md
```

### 部署到 GitHub Pages

```bash
# 生成静态文件
hexo generate

# 部署到 GitHub.io
hexo deploy
```

**注意**：首次部署前需要配置 `_config.yml` 中的 `deploy` 部分：

```yaml
deploy:
  type: git
  repo: git@github.com:Charliechen114514/charliechen114514.github.io.git
  branch: main
```

## 目录结构

```
blog/
├── source/           # 源文件目录
│   ├── _posts/      # Markdown 文章
│   └── img/         # 图片资源
├── themes/          # 主题目录
├── _config.yml      # Hexo 主配置
├── db.json          # 缓存文件
└── package.json     # 依赖配置
```

## 迁移记录

本博客于 **2026-04-01** 从独立的 GitHub.io 仓库迁移到 `post_waver` 项目中。

### 迁移背景

- **原始状态**：GitHub.io 仓库仅包含生成的静态 HTML，原始 Markdown 源文件已丢失
- **迁移方式**：从 HTML 逆向恢复文章内容（使用 html2text 或 pandoc）
- **迁移内容**：22 篇技术文章、图片资源（1MB）、busuanzi 访问统计配置

**详细迁移记录**：[BLOG-MIGRATION-博客迁移记录](../milestones/BLOG-MIGRATION-博客迁移记录.md)

## 访问统计配置

本博客使用 **busuanzi（不蒜子）**进行访问统计：

### 配置说明

busuanzi 是一个第三方访问统计服务，数据存储在 `busuanzi.ibruce.info` 服务器上。

**关键配置**：
```html
<script async src="//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"></script>
```

**显示元素**：
- 访客数（UV）：`busuanzi_value_site_uv`
- 访问量（PV）：`busuanzi_value_site_pv`

### 重要说明

1. **数据无需迁移**：busuanzi 数据基于域名统计，与具体部署位置无关
2. **自动保留**：只要使用相同的域名（`charliechen114514.github.io`），访问数据会自动保留
3. **实时更新**：访客访问时，busuanzi 服务器会自动更新统计数据

**配置文件位置**：`../work/blog-migration/config/busuanzi-config.md`

## Butterfly 主题

本博客使用 Butterfly 主题，主题仓库：
- [GitHub](https://github.com/jerryc127/hexo-theme-butterfly)
- [文档](https://butterfly.js.org/)

### 主题配置

主题配置文件：`themes/butterfly/_config.yml`

**常用配置**：
```yaml
# 访问统计
busuanzi:
  enable: true

# 代码高亮
highlight_theme: default

# 搜索功能
local_search:
  enable: true
```

## 开发注意事项

### Git Submodule 管理

本目录作为 **Git Submodule** 管理，与普通的 Git 仓库有些不同：

#### 克隆项目

**首次克隆**（包含 submodule）：
```bash
git clone --recursive git@github.com:Charliechen114514/post_waver.git
```

**如果已经克隆但忘记 `--recursive`**：
```bash
cd post_waver
git submodule update --init --recursive
```

**查看 submodule 状态**：
```bash
git submodule status
```

#### 更新 Submodule

**从远程更新 blog 到最新版本**：
```bash
git submodule update --remote --merge
```

**查看 blog 仓库的变更**：
```bash
cd blog
git status
git log
cd ..
```

#### 提交变更

由于 blog 是独立仓库，有两种提交方式：

**方式 1：手动管理（适合偶尔修改）**
```bash
cd blog
# ... 编辑文件 ...
git add .
git commit -m "描述你的变更"
git push origin main

# 返回主项目，更新 submodule 引用
cd ..
git add blog
git commit -m "Update blog submodule"
```

**方式 2：使用自动化脚本（推荐）**
```bash
# 在 post_waver 根目录
pnpm sync:blog
# 自动提交 blog 的变更并更新 submodule 引用
```

### 三个仓库的关系

本项目涉及 **三个 Git 仓库**，它们的关系如下：

1. **post_waver**（主仓库）
   - 包含所有工具链和转换逻辑
   - 通过 Git Submodule 引用 blog-source

2. **blog-source**（本仓库，submodule）
   - 包含 Hexo 源文件（Markdown、配置、主题）
   - 作为 post_waver 的 submodule
   - 可独立开源和接受贡献

3. **charliechen114514.github.io**（部署仓库）
   - 包含生成的静态 HTML 文件
   - 由 `hexo deploy` 自动推送
   - GitHub Pages 从此仓库部署网站

**工作流程**：
```
post_waver 工具链 → 写入文章到 blog/ →
自动提交到 blog-source →
hexo generate →
hexo deploy →
推送到 GitHub.io 仓库 →
GitHub Pages 部署
```

### .gitignore

以下文件/目录已被忽略（在项目根目录的 `.gitignore` 中）：
```
blog/public/          # 生成的静态文件
blog/.deploy_git/     # 部署缓存
blog/db.json          # 缓存文件
blog/node_modules/    # 依赖包
```

### 图片资源

图片应放在 `source/img/` 目录中，在文章中引用：
```markdown
![图片描述](/img/图片文件名.png)
```

## 常见问题

### Q1: 部署后无法访问统计数据？

**A**：检查以下几点：
1. 确认 `busuanzi` 脚本是否正确加载
2. 检查网络连接（busuanzi 服务器可能被墙）
3. 等待几分钟，busuanzi 统计有延迟

### Q2: 图片无法显示？

**A**：
1. 确认图片路径正确（`/img/文件名`）
2. 确认图片文件已上传到 `source/img/` 目录
3. 本地预览和部署后的路径可能不同

### Q3: 如何恢复文章的原始格式？

**A**：由于原始 Markdown 源文件已丢失，当前文章是从 HTML 逆向恢复的。如果发现格式问题：
1. 手动调整 Markdown 文件
2. 本地预览验证：`hexo server`
3. 重新部署：`hexo deploy`

## 相关文档

- [Hexo 官方文档](https://hexo.io/zh-cn/docs/)
- [Butterfly 主题文档](https://butterfly.js.org/)
- [博客迁移记录](../milestones/BLOG-MIGRATION-博客迁移记录.md)
- [项目 README](../README.md)

---

**最后更新**：2026-04-01
**维护者**：Charlie Chen

**重要变更**：本目录已于 2026-04-01 转换为 Git Submodule，详见项目 [M0.1-B 里程碑](../milestones/M0.1-B-Blog子模块转换.md)。
