# Blog 部署架构说明

## 三仓库架构

```
┌─────────────────────────────────────────────────────────────┐
│                    post_waver (主仓库)                        │
│  - 工具链代码（转换器、解析器、引擎）                            │
│  - 通过 Git Submodule 引用 blog                                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Git Submodule
                        ↓
┌─────────────────────────────────────────────────────────────┐
│           blog-source (Submodule 仓库)                        │
│  - blog/ 目录的所有内容                                         │
│  - Hexo 源文件：Markdown 文章、配置、主题                          │
│  - 独立版本控制，可单独开源                                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ hexo deploy
                        ↓
┌─────────────────────────────────────────────────────────────┐
│      charliechen114514.github.io (GitHub Pages 仓库)          │
│  - 生成的静态 HTML 文件                                         │
│  - 由 Hexo 自动推送                                            │
│  - GitHub Pages 自动部署                                       │
└─────────────────────────────────────────────────────────────┘
```

## 仓库职责

### 1. post_waver（主仓库）
- **内容**：工具链代码、转换逻辑、配置文件
- **作用**：内容管理的核心工具
- **URL**：`https://github.com/Charliechen114514/post_waver`

### 2. blog-source（Submodule）
- **内容**：Hexo 博客源文件
  - `blog/source/_posts/` - Markdown 文章
  - `blog/_config.yml` - Hexo 配置
  - `blog/themes/` - 主题文件
- **作用**：博客的源代码管理
- **URL**：`https://github.com/Charliechen114514/blog-source`
- **特性**：
  - 作为 post_waver 的 Git Submodule
  - 可独立开源和接受贡献
  - post_waver 工具链可自动写入文章

### 3. charliechen114514.github.io（GitHub Pages）
- **内容**：生成的静态站点
  - HTML、CSS、JS 文件
  - 图片、字体等资源
- **作用**：对外展示的博客
- **URL**：`https://charliechen114514.github.io/`
- **特性**：
  - 由 Hexo 自动推送
  - GitHub Pages 自动部署
  - 用户访问的实际网站

## 工作流程

### 方式 1：手动发布

```bash
# 1. 在 blog-source 中生成静态文件
cd blog
hexo generate

# 2. 部署到 GitHub Pages
hexo deploy
# 这会将 public/ 目录推送到 charliechen114514.github.io 仓库

# 3. 回到 post_waver，更新 submodule 引用
cd ..
git add blog
git commit -m "Update blog submodule"
git push
```

### 方式 2：通过 GitHub Actions 自动部署（推荐）

在 post_waver 中配置 `.github/workflows/deploy-blog.yml`：

```yaml
name: Deploy Blog

on:
  push:
    branches: [main]
    paths:
      - 'blog/**'
      - 'content/posts/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout post_waver
        uses: actions/checkout@v3
        with:
          submodules: true

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Dependencies
        working-directory: ./blog
        run: npm install

      - name: Generate & Deploy
        working-directory: ./blog
        run: |
          hexo generate
          hexo deploy
```

**效果**：
- 当你更新 blog/ 或 content/posts/ 时
- 自动触发 GitHub Actions
- 自动生成并部署到 GitHub Pages

### 方式 3：通过 post_waver 工具链（最终目标）

```bash
# 1. 创建或修改文章
vim content/posts/my-article.md

# 2. 同步到 blog
pnpm sync:hexo
# 这个脚本会：
#   - 读取 content/posts/ 的文章
#   - 写入到 blog/source/_posts/
#   - 自动提交到 blog-source 仓库
#   - 更新 post_waver 的 submodule 引用

# 3. 触发部署（手动或自动）
cd blog
hexo deploy
# 或等待 GitHub Actions 自动触发
```

## 目录映射

### post_waver → blog-source

```
post_waver/content/posts/          →  blog/source/_posts/
  └── tech/article.md                 └── tech/article.md

post_waver/content/assets/images/  →  blog/source/img/
  └── screenshot.png                  └── screenshot.png
```

### blog-source → GitHub Pages

```
blog/source/        →  (HTML 文件)
blog/themes/        →  (CSS/JS 文件)
blog/source/img/    →  /img/ (图片资源)

hexo generate 生成到 blog/public/
hexo deploy 推送到 charliechen114514.github.io
```

## 常见问题

### Q1: 为什么要三个仓库？

**A**: 职责分离：
- **post_waver**：工具开发，不断迭代
- **blog-source**：博客内容，独立版本控制
- **GitHub Pages**：最终展示，自动部署

好处：
- 工具链更新不影响博客内容
- 博客可以独立开源
- 部署失败不影响源文件

### Q2: 如何同时更新三个仓库？

**A**: 两种方式：

**方式 1**：分别推送
```bash
# 1. 更新 blog-source
cd blog
git add .
git commit -m "Add new article"
git push origin main

# 2. 更新 post_waver
cd ..
git add blog
git commit -m "Update blog submodule"
git push origin main

# 3. 部署到 GitHub Pages
cd blog
hexo deploy
```

**方式 2**：使用 M1.3 的同步脚本（推荐）
```bash
pnpm sync:hexo
# 自动完成步骤 1 和 2
```

### Q3: GitHub Pages 如何自动更新？

**A**: 两种方式：

**方式 1**：使用 GitHub Actions
- 在 post_waver 中配置 Actions
- 当 blog/ 有变更时自动触发
- 自动运行 `hexo deploy`

**方式 2**：手动部署
```bash
cd blog
hexo deploy
```

### Q4: 如何回滚博客内容？

**A**: 取决于回滚的目标：

**回滚源文件**（blog-source）：
```bash
cd blog
git log --oneline
git reset --hard <commit-hash>
git push -f origin main
```

**回滚部署版本**（GitHub Pages）：
```bash
cd blog
hexo deploy  # 重新生成并推送
# 或
cd ../.deploy_git  # Hexo 的部署缓存
git log --oneline
git reset --hard <commit-hash>
git push -f origin main
```

### Q5: 三个仓库的 .gitignore 如何配置？

**post_waver/.gitignore**:
```gitignore
# 忽略 blog 的生成文件，但追踪源文件
blog/public/
blog/.deploy_git/
blog/db.json
blog/node_modules/

# 不忽略 blog/ 本身（因为是 submodule）
```

**blog-source/.gitignore**:
```gitignore
# Hexo 标准忽略
public/
.deploy_git/
db.json
node_modules/
```

**GitHub Pages 仓库**：
- 通常不需要 .gitignore
- 因为只包含生成的静态文件
- 由 Hexo 自动管理

## 实施步骤（M0.1-B 里程碑）

### Step 1: 创建 blog-source 仓库
```bash
cd blog
git init
git add .
git commit -m "Initial commit: Hexo blog source"
git remote add origin git@github.com:Charliechen114514/blog-source.git
git push -u origin main
```

### Step 2: 在 post_waver 中添加 submodule
```bash
cd ..  # 回到 post_waver 根目录
git rm -r blog
git commit -m "Remove blog for submodule conversion"
git submodule add git@github.com:Charliechen114514/blog-source.git blog
git commit -m "Add blog as submodule"
```

### Step 3: 配置 GitHub Actions
创建 `.github/workflows/deploy-blog.yml`（见上文）

### Step 4: 测试部署
```bash
cd blog
hexo deploy
# 访问 https://charliechen114514.github.io/
```

## 总结

这个架构的优势：
- ✅ 职责清晰分离
- ✅ blog 可独立开源
- ✅ 工具链自动同步
- ✅ 支持自动部署
- ✅ 易于回滚和维护

**核心思想**：一份源文件，两个仓库，自动部署。
