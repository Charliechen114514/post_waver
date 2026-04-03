# 常见问题（FAQ）

> **版本**: v1.0
> **最后更新**: 2026-04-03

---

## 📋 目录

- [安装问题](#安装问题)
- [使用问题](#使用问题)
- [平台问题](#平台问题)
- [技术问题](#技术问题)

---

## 🔧 安装问题

### Q: 如何安装 Node.js？

**A**: 访问 [Node.js 官网](https://nodejs.org/) 下载 LTS 版本（推荐 20.x）。

详细步骤请参考：[安装指南](../01-getting-started/INSTALLATION.md)

---

### Q: pnpm 安装失败怎么办？

**A**: 尝试以下解决方案：

```bash
# 使用 npm 安装
npm install -g pnpm

# 或使用 corepack
corepack enable
corepack prepare pnpm --activate
```

---

### Q: 端口被占用怎么解决？

**A**:

```bash
# macOS/Linux
lsof -ti :3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

---

## 💡 使用问题

### Q: 如何创建第一篇文章？

**A**:

```bash
# 创建文件
echo "# Hello World" > content/posts/test.md

# 扫描内容
pnpm scan

# 查看状态
pnpm post:status
```

详细教程：[第一篇文章指南](../01-getting-started/FIRST_ARTICLE.md)

---

### Q: 如何发布到平台？

**A**: 使用 Web UI 或命令行：

```bash
# 使用 Web UI
open http://localhost:5173/post_waver/

# 或使用命令行（需要配置）
pnpm transform:juejin
```

---

### Q: 如何同步到 Hexo 博客？

**A**:

```bash
# 同步到博客
pnpm sync:blog

# 这将：
# 1. 转换内容为 Hexo 格式
# 2. 注入到 Hexo 模板
# 3. Git 提交并推送
```

---

## 🌐 平台问题

### Q: 支持哪些平台？

**A**: 目前支持：

- ✅ 掘金 (Juejin)
- ✅ 微信公众号 (WeChat)
- ✅ CSDN
- ✅ 知乎 (Zhihu)
- ✅ HTML

---

### Q: 如何添加新平台？

**A**:

1. 在 `packages/transformer/src/` 创建新转换器
2. 实现平台转换逻辑
3. 添加平台配置

详情参考：[Transformer 包文档](../04-developer-guide/packages/transformer.md)

---

### Q: 为什么图片没有上传？

**A**: 检查以下几点：

1. 图片路径是否正确
2. 是否配置了图片上传服务
3. 查看日志：`pnpm logs`

---

## 🛠️ 技术问题

### Q: 数据库在哪里？

**A**:

```
packages/database/prisma/database.db
```

可以使用 Prisma Studio 查看：

```bash
pnpm db:studio
```

---

### Q: 如何重置数据库？

**A**:

```bash
# 重置数据库（警告：会删除所有数据）
pnpm prisma migrate reset

# 或手动删除
rm packages/database/prisma/database.db
pnpm db:migrate:prisma
```

---

### Q: 如何更新 PostWaver？

**A**:

```bash
# 拉取最新代码
git pull origin main

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 运行迁移
pnpm prisma migrate deploy
```

---

### Q: 内存不足怎么办？

**A**:

```bash
# 增加 Node.js 内存限制
NODE_OPTIONS="--max-old-space-size=4096" pnpm dev

# 或减少并发数
# 在 .env 中设置
CONCURRENT_LIMIT=2
```

---

### Q: 如何查看日志？

**A**:

```bash
# PM2 日志（生产环境）
pm2 logs postwaver

# 开发环境日志
pnpm dev 2>&1 | tee logs/dev.log

# 数据库日志
DEBUG="prisma:*" pnpm start
```

---

## 📚 更多帮助

### 文档

- [快速开始](../01-getting-started/QUICK_START.md)
- [用户手册](../01-getting-started/USER_GUIDE.md)
- [故障排查](TROUBLESHOOTING.md)

### 社区

- [GitHub Issues](https://github.com/Charliechen114514/post_waver/issues)
- [GitHub Discussions](https://github.com/Charliechen114514/post_waver/discussions)

---

**最后更新**: 2026-04-03
**维护者**: PostWaver Team
