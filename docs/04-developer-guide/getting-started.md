# 开发环境搭建

> **版本**: v1.0
> **最后更新**: 2026-04-03
> **受众**: 开发者
> **阅读时间**: 15 分钟
> **难度**: 初级

---

## 📋 概述

本文档将指导您搭建 PostWaver 的开发环境，包括依赖安装、项目构建和开发服务器启动。

---

## 🎯 前置要求

### 必需软件

| 软件 | 最低版本 | 推荐版本 | 用途 |
|------|---------|---------|------|
| Node.js | 18.0.0 | 20.x LTS | JavaScript 运行时 |
| pnpm | 8.0.0 | 最新版 | 包管理器 |
| Git | 2.x | 最新版 | 版本控制 |

### 可选软件

| 软件 | 用途 |
|------|------|
| VS Code | 推荐的 IDE |
| Python 3.x | Linker 包的语义分析功能 |

### 验证安装

```bash
node --version   # 应该 >= 18.0.0
pnpm --version   # 应该 >= 8.0.0
git --version    # 应该 >= 2.x
```

---

## 🚀 快速搭建

### 1. Clone 仓库

```bash
# Clone 主仓库
git clone https://github.com/Charliechen114514/post_waver.git
cd post_waver

# 或者 fork 后 clone 你的 fork
git clone https://github.com/YOUR_USERNAME/post_waver.git
cd post_waver
```

### 2. 安装依赖

```bash
# 使用 pnpm 安装所有依赖
pnpm install

# 这将安装：
# - 所有包的依赖
# - 开发依赖
# - TypeScript
# - 测试框架
```

### 3. 初始化数据库

```bash
# 初始化数据库（生成 Prisma Client）
pnpm db:init

# 运行数据库迁移（创建数据库文件和表结构）
pnpm db:migrate:prisma
```

> **💡 说明**: 
> - `pnpm db:init` 生成 Prisma Client（TypeScript 类型定义）
> - `pnpm db:migrate:prisma` 创建 SQLite 数据库文件并运行所有迁移
> - 迁移会自动导入初始配置数据

### 4. 构建项目

```bash
# 构建所有包
pnpm build

# 这将：
# - 编译 TypeScript
# - 生成 dist/ 目录
# - 复制静态资源
```

### 5. 启动开发服务器

```bash
# 完整启动（构建 + 启动服务）
pnpm dev

# 或者快速启动（跳过构建）
pnpm start

# 或者分别启动
pnpm dev:api    # API 服务器（端口 3001）
pnpm dev:web    # Web UI（端口 5173）
```

### 6. 验证安装

```bash
# 检查 API 服务器
curl http://localhost:3001/api/health

# 在浏览器打开
open http://localhost:5173/post_waver/
```

---

## 🔧 配置

### 环境变量

创建 `.env` 文件：

```bash
# 创建 .env 文件
cat > .env << 'EOF'
# Database
DATABASE_URL="file:./packages/database/prisma/dev.db"

# API Configuration
API_PORT=3001
API_HOST=localhost

# Environment
NODE_ENV=development
EOF
```

> **⚠️ 重要**: `.env` 文件用于本地开发配置，包含敏感信息，已被添加到 `.gitignore` 中不会被提交。

---

## 🛠️ IDE 设置

### VS Code（推荐）

#### 推荐扩展

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

#### 工作区设置

创建 `.vscode/settings.json`：

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.workingDirectories": [
    { "directory": "packages/core", "changeProcessCWD": true },
    { "directory": "packages/engine", "changeProcessCWD": true },
    { "directory": "packages/web-ui", "changeProcessCWD": true }
  ]
}
```

### 其他 IDE

- **WebStorm**: 内置 TypeScript 支持，开箱即用
- **Vim/Neovim**: 使用 coc.nvim 或 LSP-TypeScript
- **Emacs**: 使用 tide-mode

---

## 🔧 开发工具

### 代码检查

```bash
# Lint TypeScript
pnpm lint:ts

# Lint Markdown
pnpm lint:md

# 修复问题
pnpm lint:fix
```

### 类型检查

```bash
# 检查所有包的类型
pnpm typecheck

# 检查单个包
pnpm --filter @content-hub/core typecheck
```

### 测试

```bash
# 运行所有测试
pnpm test

# 运行单元测试
pnpm test:units

# 运行集成测试
pnpm test:integration

# 测试 UI
pnpm test:ui
```

### 数据库工具

```bash
# 打开 Prisma Studio（数据库 GUI）
pnpm db:studio

# 查看文章状态
pnpm post:status
```

---

## 📂 项目结构

### 主要目录

```
post_waver/
├── packages/          # Monorepo 包
│   ├── core/         # 核心功能
│   ├── engine/       # API 服务器
│   ├── web-ui/       # Web 界面
│   └── ...
├── content/          # 测试内容
├── scripts/          # 工具脚本
├── docs/             # 文档
└── test/             # 测试文件
```

### 包的结构

每个包都遵循标准结构：

```
packages/<package-name>/
├── src/              # 源代码
├── dist/             # 编译输出
├── package.json      # 包配置
├── tsconfig.json     # TypeScript 配置
└── README.md         # 包文档
```

---

## 🔄 开发工作流

### 日常开发

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 创建功能分支
git checkout -b feature/your-feature

# 3. 进行开发
# ... 编写代码 ...

# 4. 类型检查
pnpm typecheck

# 5. 运行测试
pnpm test

# 6. 构建项目
pnpm build

# 7. 提交代码
git add .
git commit -m "feat: add your feature"

# 8. 推送到远程
git push origin feature/your-feature
```

### 监听模式

```bash
# 监听 TypeScript 编译
pnpm --filter @content-hub/core dev

# 监听 Web UI（自动重新加载）
pnpm dev:web

# 监听 API 服务器
pnpm dev:api
```

---

## 🐛 常见问题

### 依赖安装失败

**问题**: `pnpm install` 失败

**解决方案**:
```bash
# 清理缓存
pnpm store prune

# 删除 node_modules
rm -rf node_modules packages/*/node_modules

# 重新安装
pnpm install
```

### Prisma 错误

**问题**: Prisma 相关错误

**解决方案**:
```bash
# 重新生成 Prisma Client
pnpm prisma generate

# 重置数据库
pnpm db:migrate:prisma
```

### 端口被占用

**问题**: 端口 3001 或 5173 被占用

**解决方案**:
```bash
# 查找并终止进程
lsof -ti :3001 | xargs kill -9
lsof -ti :5173 | xargs kill -9

# 或者修改端口
# 在 packages/engine/.env 中修改 API_PORT
# 在 packages/web-ui/vite.config.ts 中修改 server.port
```

### TypeScript 错误

**问题**: TypeScript 类型错误

**解决方案**:
```bash
# 清理构建产物
pnpm clean

# 重新构建
pnpm build

# 检查类型
pnpm typecheck
```

---

## 📚 下一步

现在您的开发环境已经搭建完成，接下来可以：

1. **阅读架构文档**: [系统架构总览](architecture/overview.md)
2. **了解包文档**: [Core 包文档](packages/core.md)
3. **开始开发**: 参考 [开发工作流](development-workflow.md)
4. **编写测试**: 参考 [测试指南](testing-guide.md)

---

## 🤝 贡献

准备贡献代码？请阅读：

- [贡献指南](../../CONTRIBUTING.md)
- [开发工作流](development-workflow.md)
- [测试指南](testing-guide.md)

---

**最后更新**: 2026-04-03
**维护者**: PostWaver Team
**反馈**: [GitHub Issues](https://github.com/Charliechen114514/post_waver/issues)
