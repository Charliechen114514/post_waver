# 生产环境部署

> **版本**: v1.0
> **最后更新**: 2026-04-03
> **受众**: DevOps 工程师、系统管理员
> **阅读时间**: 15 分钟

---

## 📋 概述

本文档详细说明了如何在生产服务器上部署 PostWaver。

---

## 🎯 服务器要求

### 最低配置

- **CPU**: 2 核
- **内存**: 2 GB
- **磁盘**: 20 GB SSD
- **操作系统**: Ubuntu 20.04+ / CentOS 8+

### 推荐配置

- **CPU**: 4 核
- **内存**: 4 GB
- **磁盘**: 50 GB SSD
- **操作系统**: Ubuntu 22.04 LTS

---

## 🚀 部署步骤

### 1. 准备服务器

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 PM2
npm install -g pm2

# 安装 Nginx
sudo apt install -y nginx

# 安装 Git
sudo apt install -y git
```

### 2. Clone 仓库

```bash
# 创建应用目录
sudo mkdir -p /var/www/postwaver
sudo chown $USER:$USER /var/www/postwaver

# Clone 仓库
cd /var/www/postwaver
git clone https://github.com/YOUR_USERNAME/post_waver.git .
```

### 3. 安装依赖

```bash
# 安装依赖
pnpm install

# 初始化数据库
pnpm prisma generate
pnpm db:migrate:prisma
```

### 4. 配置环境变量

```bash
# 创建生产环境配置
cp .env.example .env

# 编辑配置
nano .env
```

生产环境配置示例：

```env
# 数据库（使用 PostgreSQL）
DATABASE_URL="postgresql://postwaver:password@localhost:5432/postwaver"

# API 配置
API_PORT=3001
API_HOST=0.0.0.0
NODE_ENV=production

# Hexo 配置
HEXO_BLOG_PATH=/var/www/hexo-blog
```

### 5. 构建项目

```bash
# 构建所有包
pnpm build
```

### 6. 配置 PM2

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'postwaver',
    script: './packages/engine/dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    max_memory_restart: '1G'
  }]
}
```

启动应用：

```bash
# 启动应用
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

### 7. 配置 Nginx

创建配置文件 `/etc/nginx/sites-available/postwaver`：

```nginx
server {
    listen 80;
    server_name postwaver.yourdomain.com;

    # API 服务器
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Web UI（静态文件）
    location / {
        root /var/www/postwaver/packages/web-ui/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

启用配置：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/postwaver /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 8. 配置 SSL（使用 Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d postwaver.yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 🔄 更新部署

### 自动更新脚本

创建 `scripts/deploy.sh`：

```bash
#!/bin/bash

# 备份数据库
pnpm db:backup

# 拉取最新代码
git pull origin main

# 安装依赖
pnpm install

# 运行迁移
pnpm prisma migrate deploy

# 构建项目
pnpm build

# 重启服务
pm2 restart postwaver

# 清理缓存
pm2 flush
```

使用：

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

---

## 🔍 监控

### PM2 监控

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs postwaver

# 查看监控
pm2 monit
```

### 系统监控

```bash
# CPU 使用率
top

# 内存使用
free -h

# 磁盘使用
df -h

# 网络连接
netstat -tulpn
```

---

## 🐛 故障排查

### 应用无法启动

```bash
# 查看 PM2 日志
pm2 logs postwaver --lines 100

# 检查端口占用
lsof -i :3001

# 检查数据库连接
pnpm db:test
```

### Nginx 502 错误

```bash
# 检查 API 服务器是否运行
pm2 status

# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/error.log
```

### 数据库连接失败

```bash
# 检查数据库服务
sudo systemctl status postgresql

# 检查连接字符串
echo $DATABASE_URL

# 测试连接
psql $DATABASE_URL
```

---

## 📚 相关文档

- [开发环境搭建](development-setup.md)
- [GitHub Pages 部署](github-pages-deployment.md)
- [环境变量参考](environment-variables.md)
- [监控与维护](monitoring-maintenance.md)

---

**最后更新**: 2026-04-03
**维护者**: PostWaver Team
**反馈**: [GitHub Issues](https://github.com/Charliechen114514/post_waver/issues)
