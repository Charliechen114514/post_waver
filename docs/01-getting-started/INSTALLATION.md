# 安装指南

> **版本**: v1.0
> **最后更新**: 2026-04-03
> **受众**: 用户
> **阅读时间**: 10 分钟
> **难度**: 初级

---

## 📋 概述

本文档提供了在不同操作系统上安装 PostWaver 的详细步骤。

---

## 🎯 系统要求

### 必需软件

| 软件 | 版本 | 检查命令 |
|------|------|---------|
| Node.js | >= 18.0.0 | `node --version` |
| pnpm | >= 8.0.0 | `pnpm --version` |
| Git | >= 2.x | `git --version` |

### 推荐配置

- **内存**: 4 GB+
- **磁盘**: 10 GB+ 可用空间
- **网络**: 稳定的互联网连接

---

## 🚀 安装步骤

### 1. 安装 Node.js

#### Windows

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS 版本（推荐 20.x）
3. 运行安装程序，按提示完成安装
4. 验证安装：
   ```cmd
   node --version
   ```

#### macOS

**使用 Homebrew**:
```bash
brew install node
```

**官方安装包**:
1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 .pkg 安装包
3. 运行安装包

#### Linux (Ubuntu/Debian)

```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
```

---

### 2. 安装 pnpm

```bash
# 使用 npm 安装
npm install -g pnpm

# 验证安装
pnpm --version
```

**如果遇到权限问题**:

```bash
# macOS/Linux
sudo npm install -g pnpm

# Windows（以管理员身份运行 PowerShell）
npm install -g pnpm
```

---

### 3. 安装 Git

#### Windows

1. 访问 [Git 官网](https://git-scm.com/)
2. 下载 Windows 版本
3. 运行安装程序

#### macOS

```bash
# Homebrew
brew install git
```

#### Linux

```bash
# Ubuntu/Debian
sudo apt-get install git

# CentOS/RHEL
sudo yum install git
```

---

### 4. Clone PostWaver

```bash
# Clone 仓库
git clone https://github.com/Charliechen114514/post_waver.git
cd post_waver
```

**如果 GitHub 访问慢，使用镜像**:

```bash
git clone https://gitee.com/mirror/post_waver.git
cd post_waver
```

---

### 5. 安装依赖

```bash
# 安装所有依赖
pnpm install

# 这将安装：
# - 所有包的依赖
# - 开发依赖
# - TypeScript
```

**如果安装失败**:

```bash
# 清理缓存
pnpm store prune

# 删除 node_modules
rm -rf node_modules packages/*/node_modules

# 重新安装
pnpm install
```

---

### 6. 初始化数据库

```bash
# 生成 Prisma Client
pnpm prisma generate

# 运行数据库迁移
pnpm db:migrate:prisma
```

---

### 7. 构建项目

```bash
# 构建所有包
pnpm build

# 首次构建可能需要 1-2 分钟
```

---

### 8. 验证安装

```bash
# 启动服务
pnpm dev

# 在浏览器打开
open http://localhost:5173/post_waver/
```

---

## 🔧 配置 Hexo 博客

PostWaver 需要一个 Hexo 博客来同步内容。

### 选项 1: 使用现有博客

```bash
# 创建软链接
ln -s /path/to/your/hexo/blog ./blog
```

### 选项 2: Clone 私有仓库

```bash
git clone git@github.com:username/my-private-blog.git blog
```

### 选项 3: 初始化新博客

```bash
# 安装 Hexo CLI
pnpm add -g hexo-cli

# 初始化博客
hexo init blog
cd blog
pnpm install
```

---

## 🐛 常见问题

### Node.js 版本过低

**问题**: `node --version` 显示版本低于 18

**解决方案**:
```bash
# 使用 nvm 安装最新版本
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### pnpm 安装失败

**问题**: `pnpm install` 报错

**解决方案**:
```bash
# 使用 npm 安装 pnpm
npm install -g pnpm

# 或使用 corepack
corepack enable
corepack prepare pnpm --activate
```

### 端口被占用

**问题**: 端口 3001 或 5173 被占用

**解决方案**:
```bash
# 查找并终止进程（macOS/Linux）
lsof -ti :3001 | xargs kill -9
lsof -ti :5173 | xargs kill -9

# Windows（PowerShell）
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### 权限错误

**问题**: EACCES 权限错误

**解决方案**:
```bash
# macOS/Linux
sudo chown -R $USER:$(id -gn $USER) ~/.npm

# Windows
# 以管理员身份运行终端
```

---

## 📚 下一步

安装完成后，请阅读：

1. **[快速开始](QUICK_START.md)** - 5 分钟上手教程
2. **[用户手册](USER_GUIDE.md)** - 完整功能说明
3. **[故障排查](../03-troubleshooting/TROUBLESHOOTING.md)** - 常见问题

---

## 🆘 获取帮助

如果安装过程中遇到问题：

1. 查看 [故障排查指南](../03-troubleshooting/TROUBLESHOOTING.md)
2. 搜索 [GitHub Issues](https://github.com/Charliechen114514/post_waver/issues)
3. 提交 [新 Issue](https://github.com/Charliechen114514/post_waver/issues/new)

---

**最后更新**: 2026-04-03
**维护者**: PostWaver Team
**反馈**: [GitHub Issues](https://github.com/Charliechen114514/post_waver/issues)
