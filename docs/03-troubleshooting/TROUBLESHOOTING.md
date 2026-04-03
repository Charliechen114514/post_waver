# 故障排查指南

> **版本**: v3.0  
> **更新日期**: 2026-04-02

---

## 📋 目录

- [常见错误](#常见错误)
- [数据库问题](#数据库问题)
- [发布失败](#发布失败)
- [图片问题](#图片问题)
- [配置问题](#配置问题)
- [获取帮助](#获取帮助)

---

## 常见错误

### 错误 1：模块找不到

**错误信息**:
```
Error: Cannot find module '@content-hub/core'
```

**解决方案**:
```bash
# 重新构建依赖包
pnpm --filter @content-hub/core build

# 或重新安装所有依赖
pnpm install
```

---

### 错误 2：数据库初始化失败

**错误信息**:
```
Error: Database is not initialized
```

**解决方案**:
```bash
# 删除旧数据库
rm -f packages/database/prisma/dev.db

# 重新初始化
pnpm db:init
pnpm db:migrate
```

---

### 错误 3：扫描失败

**错误信息**:
```
Error: Failed to scan content directory
```

**解决方案**:
```bash
# 1. 检查目录结构
ls -la content/posts/

# 2. 验证 Frontmatter 格式
npx remark content/posts/*.md

# 3. 重新构建
pnpm build

# 4. 重新扫描
pnpm scan
```

---

### 错误 4：发布失败

**错误信息**:
```
Error: Failed to generate publish page
```

**解决方案**:
```bash
# 1. 检查文章是否存在
ls content/posts/<postId>.md

# 2. 检查数据库记录
pnpm workflow:status

# 3. 清理输出目录
rm -rf output/

# 4. 重新发布
pnpm workflow:process <postId>
```

---

### 错误 5：命令不存在

**错误信息**:
```
pnpm: command not found
```

**解决方案**:
```bash
# 1. 安装 pnpm
npm install -g pnpm

# 2. 或使用 npm 替代
npm run <command>
```

---

## 数据库问题

### 数据库文件损坏

**症状**: Prisma 查询失败，数据库无法打开

**解决方案**:
```bash
# 1. 停止所有进程
pkill -f "prisma"

# 2. 删除数据库文件
rm -f packages/database/prisma/dev.db
rm -f packages/database/prisma/dev.db-journal

# 3. 重新初始化
pnpm db:init
pnpm db:migrate

# 4. 重新扫描
pnpm workflow:scan
```

---

### 数据库迁移失败

**错误信息**:
```
Error: Migration failed
```

**解决方案**:
```bash
# 1. 重置数据库
pnpm db:reset

# 2. 如果失败，手动删除
rm -f packages/database/prisma/dev.db

# 3. 重新迁移
pnpm db:migrate
```

---

### 数据库连接超时

**症状**: Prisma Studio 无法打开，查询超时

**解决方案**:
```bash
# 1. 检查数据库文件
ls -lh packages/database/prisma/dev.db

# 2. 检查文件权限
chmod 644 packages/database/prisma/dev.db

# 3. 重新生成 Prisma Client
pnpm db:init
```

---

## 发布失败

### 预览服务器无法启动

**症状**: 预览页面打不开

**解决方案**:
```bash
# 1. 检查端口占用
lsof -i :5173

# 2. 杀死占用进程
kill -9 <PID>

# 3. 重新启动
pnpm workflow:process <postId>
```

---

### 生成页面失败

**错误信息**:
```
Error: Failed to generate publish page
```

**解决方案**:
```bash
# 1. 检查输出目录权限
ls -ld output/

# 2. 清理并重建
rm -rf output/
mkdir -p output

# 3. 重新生成
pnpm post:publish:generate <postId>
```

---

### 文章状态异常

**症状**: 工作流状态不正确

**解决方案**:
```bash
# 1. 查看当前状态
pnpm workflow:status

# 2. 回滚到初始状态
pnpm workflow:rollback <postId>

# 3. 或重置所有状态
pnpm workflow:reset-all

# 4. 重新扫描
pnpm workflow:scan
```

---

## 图片问题

### 微信图片上传失败

**错误信息**:
```
Error: WeChat image upload failed [45009]
```

**错误码说明**:
- `45009` - 文件类型不支持
- `45010` - 文件大小超限
- `40001` - AppSecret 错误
- `42001` - Access Token 超时
- `429` - API 调用频率限制

**解决方案**:
```bash
# 1. 验证配置
pnpm image:config validate wechat

# 2. 检查图片格式和大小
file content/assets/images/*.png
ls -lh content/assets/images/

# 3. 转换图片格式（如果需要）
convert image.png image.jpg

# 4. 压缩图片（如果需要）
convert image.png -quality 85 image.jpg

# 5. 重新上传
pnpm image:upload:replace <postId>
```

---

### 图片路径错误

**症状**: 图片无法显示或链接失效

**解决方案**:
```bash
# 1. 检查图片路径
grep "!\[" content/posts/<postId>.md

# 2. 验证图片文件存在
ls -la content/assets/images/

# 3. 更正路径引用
# 本地图片：/assets/images/filename.png
# 外部图片：https://example.com/image.png

# 4. 手动移动图片到正确位置
mkdir -p content/assets/images
cp <source-path> content/assets/images/
```

---

## 配置问题

### Hexo 博客路径错误

**错误信息**:
```
Error: Hexo blog path not found
```

**解决方案**:
```bash
# 1. 检查 blog 目录
ls -la blog/

# 2. 重新配置
pnpm hexo:config

# 3. 或创建符号链接
ln -s /path/to/hexo/blog ./blog

# 4. 验证配置
pnpm hexo:status
```

---

### 环境变量缺失

**错误信息**:
```
Error: DATABASE_URL is not set
```

**解决方案**:
```bash
# 1. 检查 .env 文件
cat .env

# 2. 如果不存在，创建
cat > .env << 'EOF'
# Database
DATABASE_URL="file:/home/Charliechen/post_waver/packages/database/prisma/dev.db"
EOF

# 3. 验证配置
echo $DATABASE_URL
```

---

## 高级排查

### 启用调试日志

```bash
# 查看详细日志
DEBUG=* pnpm scan

# 查看特定模块日志
DEBUG=post_waver:scanner pnpm scan
DEBUG=post_waver:publisher pnpm post:publish
DEBUG=post_waver:image pnpm image:upload:replace
```

### 检查系统状态

```bash
# 检查 Node.js 版本
node --version

# 检查 pnpm 版本
pnpm --version

# 检查磁盘空间
df -h

# 检查内存使用
free -h

# 检查进程
ps aux | grep node
```

### 完全重置环境

```bash
# ⚠️ 警告：这将删除所有数据

# 1. 停止所有进程
pkill -f node

# 2. 清理依赖
rm -rf node_modules
rm -rf packages/*/node_modules

# 3. 清理数据库
rm -f packages/database/prisma/dev.db

# 4. 清理输出
rm -rf output/
rm -f content-index.json

# 5. 重新安装
pnpm install

# 6. 重新构建
pnpm build

# 7. 重新初始化
pnpm db:init
pnpm db:migrate
pnpm workflow:scan
```

---

## 获取帮助

### 文档资源

- **[快速开始](QUICK_START.md)** - 5 分钟上手
- **[用户手册](USER_GUIDE.md)** - 完整使用指南
- **[CLI 参考](CLI_REFERENCE.md)** - 命令说明

### 日志位置

- **构建日志**: `packages/*/dist/`
- **数据库日志**: Prisma 自动生成
- **应用日志**: 控制台输出

### 社区支持

- **[GitHub Issues](https://github.com/Charliechen114514/post_waver/issues)** - Bug 报告
- **[GitHub Discussions](https://github.com/Charliechen114514/post_waver/discussions)** - 问题讨论

### 提交问题时请提供

1. **错误信息**: 完整的错误堆栈
2. **运行命令**: 你执行的命令
3. **环境信息**:
   ```bash
   node --version
   pnpm --version
   uname -a
   ```
4. **复现步骤**: 如何重现问题

---

**问题已解决？** 太好了！如果问题仍未解决，请提交 Issue 获取帮助。
