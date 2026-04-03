# 环境变量参考

> **版本**: v1.0
> **最后更新**: 2026-04-03
> **受众**: 开发者、DevOps 工程师
> **阅读时间**: 10 分钟

---

## 📋 概述

PostWaver 使用环境变量进行配置。本文档列出了所有可用的环境变量及其说明。

---

## 🔧 配置文件

### 1. .env 文件

创建 `.env` 文件在项目根目录：

```bash
cp .env.example .env
```

### 2. .env.example

示例配置文件：

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

## 📊 环境变量列表

### 数据库配置

| 变量 | 说明 | 默认值 | 必需 |
|------|------|--------|------|
| `DATABASE_URL` | 数据库连接字符串 | `file:./packages/database/prisma/database.db` | 是 |

**示例**:
```env
# SQLite（默认）
DATABASE_URL="file:./packages/database/prisma/database.db"

# PostgreSQL（生产环境）
DATABASE_URL="postgresql://user:password@localhost:5432/postwaver"
```

---

### API 配置

| 变量 | 说明 | 默认值 | 必需 |
|------|------|--------|------|
| `API_PORT` | API 服务器端口 | `3001` | 否 |
| `API_HOST` | API 服务器主机 | `localhost` | 否 |
| `NODE_ENV` | 运行环境 | `development` | 否 |

**示例**:
```env
API_PORT=3001
API_HOST=0.0.0.0
NODE_ENV=production
```

---

### 平台 API 配置

#### 掘金

| 变量 | 说明 | 必需 |
|------|------|------|
| `JUEJIN_TOKEN` | 掘金 API Token | 否 |

**获取方式**:
1. 登录掘金
2. 打开开发者工具
3. 查看请求头中的 `X-Juejin-Src` 或 Cookie

---

#### 微信公众号

| 变量 | 说明 | 必需 |
|------|------|------|
| `WECHAT_APPID` | 微信 AppID | 否 |
| `WECHAT_SECRET` | 微信 AppSecret | 否 |

**获取方式**:
1. 登录微信公众平台
2. 进入开发 → 基本配置
3. 获取 AppID 和 AppSecret

---

#### CSDN

| 变量 | 说明 | 必需 |
|------|------|------|
| `CSDN_TOKEN` | CSDN API Token | 否 |

---

#### 知乎

| 变量 | 说明 | 必需 |
|------|------|------|
| `ZHIHU_TOKEN` | 知乎 API Token | 否 |

---

### Hexo 配置

| 变量 | 说明 | 默认值 | 必需 |
|------|------|--------|------|
| `HEXO_BLOG_PATH` | Hexo 博客路径 | `./blog` | 是 |

**示例**:
```env
HEXO_BLOG_PATH=./blog
# 或绝对路径
HEXO_BLOG_PATH=/path/to/your/hexo/blog
```

---

### 图片上传配置

| 变量 | 说明 | 默认值 | 必需 |
|------|------|--------|------|
| `IMAGE_UPLOAD_SERVICE` | 图片上传服务 | `local` | 否 |
| `IMAGE_UPLOAD_PATH` | 图片上传路径 | `./images` | 否 |

**支持的值**:
- `local`: 本地存储
- `oss`: 阿里云 OSS（需额外配置）
- `cos`: 腾讯云 COS（需额外配置）

---

### 日志配置

| 变量 | 说明 | 默认值 | 必需 |
|------|------|--------|------|
| `LOG_LEVEL` | 日志级别 | `info` | 否 |
| `LOG_FILE` | 日志文件路径 | - | 否 |

**支持的值**:
- `debug`
- `info`
- `warn`
- `error`

---

## 🔐 安全注意事项

### 1. 不要提交 .env 文件

`.env` 文件已在 `.gitignore` 中，不会被提交。

### 2. 使用 .env.example

提交 `.env.example` 作为模板，不包含真实值。

### 3. 生产环境

使用环境变量管理服务：
- **Docker**: 使用 `--env-file`
- **Kubernetes**: 使用 Secrets
- **云平台**: 使用环境变量管理工具

---

## 🧪 测试配置

### 验证环境变量

```bash
# 查看当前环境变量
pnpm env:info

# 测试数据库连接
pnpm db:test

# 测试 API 服务器
curl http://localhost:3001/api/health
```

---

## 📚 相关文档

- [开发环境搭建](development-setup.md)
- [生产环境部署](production-setup.md)
- [监控与维护](monitoring-maintenance.md)

---

**最后更新**: 2026-04-03
**维护者**: PostWaver Team
**反馈**: [GitHub Issues](https://github.com/Charliechen114514/post_waver/issues)
