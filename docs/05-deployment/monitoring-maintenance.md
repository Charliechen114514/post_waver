# 监控与维护

> **版本**: v1.0
> **最后更新**: 2026-04-03
> **受众**: DevOps 工程师、系统管理员
> **阅读时间**: 15 分钟

---

## 📋 概述

本文档说明了 PostWaver 生产环境的监控和维护策略。

---

## 🔍 健康检查

### API 健康检查

```bash
curl http://localhost:3001/api/health
```

预期响应：

```json
{
  "status": "ok",
  "timestamp": "2026-04-03T10:00:00Z",
  "database": "connected",
  "version": "0.1.0"
}
```

### 数据库健康检查

```bash
# 使用 Prisma
pnpm db:test

# 或使用 SQLite 命令
sqlite3 packages/database/prisma/database.db "SELECT 1"
```

---

## 📊 日志管理

### 日志位置

- **应用日志**: `logs/`
- **错误日志**: `logs/error.log`
- **访问日志**: `logs/access.log`

### 日志级别

- `DEBUG`: 详细信息
- `INFO`: 一般信息
- `WARN`: 警告信息
- `ERROR`: 错误信息

### 日志轮转

使用 PM2 的日志轮转：

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 🔔 告警

### 推荐告警规则

1. **API 服务器宕机**
   - 条件：健康检查失败
   - 频率：每分钟
   - 通知：邮件、Slack

2. **数据库连接失败**
   - 条件：数据库查询失败
   - 频率：每分钟
   - 通知：邮件、Slack

3. **磁盘空间不足**
   - 条件：磁盘使用率 > 80%
   - 频率：每小时
   - 通知：邮件

### 告警工具

- **Uptime Robot**: 免费监控
- **Pingdom**: 商业监控
- **Prometheus + Grafana**: 开源监控

---

## 💾 备份策略

### 数据库备份

```bash
# 手动备份
sqlite3 packages/database/prisma/database.db ".backup backup.db"

# 自动备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
sqlite3 packages/database/prisma/database.db ".backup backups/db_$DATE.db"
```

### 备份频率

- **开发环境**: 每天一次
- **生产环境**: 每小时一次
- **保留时间**: 30 天

### 备份存储

- **本地**: `/backups/`
- **远程**: AWS S3、阿里云 OSS
- **异地**: 不同地理位置

---

## 🔄 更新流程

### 1. 准备更新

```bash
# 备份数据库
pnpm db:backup

# 备份代码
git stash
```

### 2. 拉取更新

```bash
git pull origin main
```

### 3. 安装依赖

```bash
pnpm install
```

### 4. 运行迁移

```bash
pnpm prisma migrate deploy
```

### 5. 重启服务

```bash
pm2 restart postwaver
```

### 6. 验证更新

```bash
curl http://localhost:3001/api/health
```

---

## 🐛 故障排查

### 常见问题

#### 1. API 服务器无响应

**诊断**:
```bash
# 检查进程
pm2 status

# 检查端口
lsof -i :3001

# 查看日志
pm2 logs postwaver
```

**解决方案**:
```bash
pm2 restart postwaver
```

#### 2. 数据库锁定

**诊断**:
```bash
# 检查数据库文件
ls -la packages/database/prisma/

# 检查锁定文件
ls -la packages/database/prisma/*.lock
```

**解决方案**:
```bash
# 删除锁定文件
rm packages/database/prisma/*.lock

# 重启服务
pm2 restart postwaver
```

#### 3. 内存不足

**诊断**:
```bash
# 检查内存使用
pm2 monit
```

**解决方案**:
```bash
# 增加内存限制
pm2 restart postwaver --max-memory-restart 1G
```

---

## 📈 性能优化

### 数据库优化

1. **索引优化**
   - 确保常用查询字段有索引
   - 定期分析查询性能

2. **连接池**
   - 调整连接池大小
   - 使用连接池监控

### 应用优化

1. **缓存策略**
   - 使用内存缓存
   - 缓存常用查询

2. **并发处理**
   - 使用 Worker Threads
   - 优化异步操作

---

## 🔐 安全维护

### 1. 定期更新

```bash
# 更新依赖
pnpm update

# 检查安全漏洞
pnpm audit
```

### 2. 密码轮换

定期更换：
- 数据库密码
- API Token
- SSH 密钥

### 3. 访问控制

- 定期审查访问权限
- 撤销不必要的访问
- 启用双因素认证

---

## 📚 相关文档

- [开发环境搭建](development-setup.md)
- [生产环境部署](production-setup.md)
- [环境变量参考](environment-variables.md)

---

**最后更新**: 2026-04-03
**维护者**: PostWaver Team
**反馈**: [GitHub Issues](https://github.com/Charliechen114514/post_waver/issues)
