# 部署文档

> **版本**: v1.0
> **最后更新**: 2026-04-03
> **受众**: 开发者、DevOps 工程师
> **阅读时间**: 5 分钟

---

欢迎来到 PostWaver 部署文档！这里包含了从本地开发到生产部署的完整指南。

---

## 📋 快速导航

### 🚀 快速开始

- **[开发环境搭建](development-setup.md)** - 本地开发环境配置
- **[生产环境部署](production-setup.md)** - 生产服务器部署

### 🔧 平台部署

- **[GitHub Pages 部署](github-pages-deployment.md)** - 自动部署 Web UI
- **[环境变量参考](environment-variables.md)** - 所有配置说明

### 📊 运维

- **[监控与维护](monitoring-maintenance.md)** - 系统监控和维护

---

## 🎯 部署选项

### 1. 本地开发

**用途**: 开发和测试

**技术栈**:
- Node.js 18+
- SQLite
- pnpm

**文档**: [开发环境搭建](development-setup.md)

---

### 2. GitHub Pages

**用途**: Web UI 和 Converter Web 的免费托管

**优势**:
- 免费托管
- 自动部署（GitHub Actions）
- HTTPS 支持
- 自定义域名

**文档**: [GitHub Pages 部署](github-pages-deployment.md)

---

### 3. 生产服务器

**用途**: 生产环境部署

**技术栈**:
- Node.js 18+
- PostgreSQL/SQLite
- Nginx (反向代理)
- PM2 (进程管理)

**文档**: [生产环境部署](production-setup.md)

---

## 📊 部署架构

```
┌─────────────────┐
│   GitHub Pages   │  ← Web UI + Converter Web
│   (静态托管)     │
└─────────────────┘

┌─────────────────┐
│  Production Server │ ← API Server + Database
│  (Node.js + SQLite) │
└─────────────────┘
```

---

## 🔧 环境要求

### 开发环境

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Git

### 生产环境

- Node.js >= 18.0.0
- PostgreSQL 或 SQLite
- Nginx（推荐）
- PM2（推荐）

---

## 🚀 快速部署

### GitHub Pages 部署

```bash
# 1. Fork 仓库
# 2. 启用 GitHub Pages
# 3. 推送代码，自动部署
```

详细步骤: [GitHub Pages 部署](github-pages-deployment.md)

### 生产服务器部署

```bash
# 1. 克隆代码
git clone https://github.com/YOUR_USERNAME/post_waver.git
cd post_waver

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env

# 4. 构建项目
pnpm build

# 5. 启动服务
pm2 start ecosystem.config.js
```

详细步骤: [生产环境部署](production-setup.md)

---

## 📚 相关文档

### 开发者文档
- [开发环境搭建](development-setup.md)
- [开发工作流](../04-developer-guide/development-workflow.md)

### 用户文档
- [快速开始](../01-getting-started/QUICK_START.md)
- [安装指南](../01-getting-started/INSTALLATION.md)

---

## 🤝 贡献

发现部署问题？请提交 Issue 或 PR。

---

**最后更新**: 2026-04-03
**维护者**: PostWaver Team
**反馈**: [GitHub Issues](https://github.com/Charliechen114514/post_waver/issues)
