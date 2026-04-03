# 开发环境搭建

> **版本**: v1.0
> **最后更新**: 2026-04-03
> **受众**: 开发者
> **阅读时间**: 10 分钟

---

## 📋 概述

本文档详细说明了如何在本地搭建 PostWaver 的开发环境。

---

## 🎯 前置要求

### 必需软件

| 软件 | 最低版本 | 推荐版本 | 安装命令 |
|------|---------|---------|---------|
| Node.js | 18.0.0 | 20.x LTS | [官方安装](https://nodejs.org/) |
| pnpm | 8.0.0 | 最新版 | `npm install -g pnpm` |
| Git | 2.x | 最新版 | [官方安装](https://git-scm.com/) |

### 可选软件

| 软件 | 用途 |
|------|------|
| VS Code | 推荐的 IDE |
| Python 3.x | Linker 包的语义分析功能 |

---

## 🚀 安装步骤

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
# 安装所有依赖
pnpm install

# 这将安装：
# - 所有包的依赖
# - 开发依赖
# - TypeScript
# - 测试框架
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
pnpm prisma generate

# 运行数据库迁移
pnpm db:migrate:prisma
```

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

# 服务端口：
# - API Server: http://localhost:3001
# - Web UI: http://localhost:5173/post_waver/
```

---

## 🔧 配置

### 环境变量

创建 `.env` 文件：

```bash
# 复制示例配置
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库
DATABASE_URL="file:./packages/database/prisma/database.db"

# API 配置
API_PORT=3001
API_HOST=localhost

# 平台 API（可选）
JUEJIN_TOKEN=your_token_here
WECHAT_APPID=your_appid_here
WECHAT_SECRET=your_secret_here

# Hexo 配置
HEXO_BLOG_PATH=./blog
```

---

## 🧪 验证安装

### 1. 检查 API 服务器

```bash
curl http://localhost:3001/api/health
```

预期响应：

```json
{
  "status": "ok",
  "timestamp": "2026-04-03T10:00:00Z"
}
```

### 2. 检查 Web UI

在浏览器打开：http://localhost:5173/post_waver/

### 3. 运行测试

```bash
# 运行所有测试
pnpm test

# 运行单元测试
pnpm test:units
```

---

## 🛠️ 开发工具

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

### 数据库工具

```bash
# 打开 Prisma Studio（数据库 GUI）
pnpm db:studio

# 查看文章状态
pnpm post:status
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
```

---

## 📚 下一步

现在您的开发环境已经搭建完成，接下来可以：

1. **阅读架构文档**: [系统架构总览](../04-developer-guide/architecture/overview.md)
2. **了解包文档**: [Core 包文档](../04-developer-guide/packages/core.md)
3. **开始开发**: 参考 [开发工作流](../04-developer-guide/development-workflow.md)
4. **编写测试**: 参考 [测试指南](../04-developer-guide/testing-guide.md)

---

## 📚 相关文档

- [开发环境搭建](../04-developer-guide/getting-started.md)
- [开发工作流](../04-developer-guide/development-workflow.md)
- [测试指南](../04-developer-guide/testing-guide.md)

---

**最后更新**: 2026-04-03
**维护者**: PostWaver Team
**反馈**: [GitHub Issues](https://github.com/Charliechen114514/post_waver/issues)
