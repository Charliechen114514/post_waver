# JSON to Database Migration Script

## 概述

此脚本用于将所有 JSON 配置文件迁移到 SQLite 数据库，实现统一数据存储。

## 修复说明

### 问题
原始脚本无法正确导入 `@content-hub/database` 模块，因为包链接问题。

### 解决方案
将导入方式改为相对路径导入：
```typescript
import { PrismaClient } from '../packages/database/dist/index.js'
```

## 迁移的数据

脚本会迁移以下 JSON 文件：

1. **frontmatter-config.json** → `Config` 表 (分类: frontmatter)
2. **.post-waver/config.json** → `Config` 表 (分类: main)
3. **.post-waver/hexo-config.json** → `Config` 表 (分类: hexo)
4. **.post-waver/image-upload-config.json** → `Config` 表 (分类: imageUpload)
5. **.post-waver/theme-preferences.json** → `Config` 表 (分类: theme)
6. **.post-waver/wechat-token.json** → `Config` 表 (分类: wechatToken)
7. **frontmatter-tag-cache.json** → `TagCache` 表
8. **content-index.json** → `ContentIndex` 表
9. **content/platform-ids.json** → `PlatformIdMapping` 表

## 使用方法

### 1. 运行迁移脚本

```bash
# 确保数据库已构建
cd packages/database && pnpm build && npx prisma generate && npx prisma db push

# 运行迁移
npx tsx scripts/migrate-json-to-db.ts
```

### 2. 验证迁移结果

```bash
# 运行测试脚本
npx tsx scripts/test-migration.ts
```

测试脚本会显示：
- Config 表中的配置数量和分类统计
- TagCache 表中的标签数量和热门标签
- ContentIndex 表中的文章数量和草稿统计
- PlatformIdMapping 表中的平台映射统计

### 3. 检查备份

所有原始 JSON 文件会自动备份到：
```
.post-waver/backup/
```

## 数据库结构

### Config 表
存储所有配置项，使用 `category` 字段区分不同类型的配置。

### TagCache 表
存储标签缓存，包括使用次数、最后使用时间、相关关键词和分类。

### ContentIndex 表
存储文章索引，包括标题、日期、标签、文件路径、草稿状态等。

### PlatformIdMapping 表
存储平台 ID 映射，记录文章在各平台的发布状态和 URL。

## 测试命令

### 快速测试
```bash
# 运行迁移
npx tsx scripts/migrate-json-to-db.ts

# 验证结果
npx tsx scripts/test-migration.ts
```

### 直接查询数据库
```bash
# 使用 SQLite 命令行
sqlite3 packages/database/prisma/dev.db

# 查询示例
SELECT * FROM Config;
SELECT * FROM TagCache;
SELECT * FROM ContentIndex;
SELECT * FROM PlatformIdMapping;
```

### 使用 Prisma Studio
```bash
cd packages/database
npx prisma studio
```

## 验证清单

- [ ] 脚本成功运行，没有错误
- [ ] 所有 JSON 文件已备份
- [ ] 配置数据正确导入 Config 表
- [ ] 标签缓存正确导入 TagCache 表
- [ ] 文章索引正确导入 ContentIndex 表
- [ ] 平台映射正确导入 PlatformIdMapping 表
- [ ] 数据库文件已创建 (packages/database/prisma/dev.db)

## 故障排除

### 模块导入错误
如果遇到 `ERR_MODULE_NOT_FOUND` 错误：
1. 确保数据库包已构建：`cd packages/database && pnpm build`
2. 确保 Prisma Client 已生成：`npx prisma generate`
3. 检查相对路径是否正确

### 数据库连接错误
如果遇到数据库连接错误：
1. 确保 Prisma schema 已同步：`npx prisma db push`
2. 检查 DATABASE_URL 环境变量
3. 确保数据库文件有写入权限

### 数据重复
脚本使用 `upsert` 操作，重复运行是安全的。已存在的记录会被更新而不是创建新记录。

## 下一步

迁移完成后：
1. 测试应用功能是否正常
2. 确认数据正确后，可以删除原始 JSON 文件（保留备份）
3. 后续只需要迁移数据库文件 `dev.db` 即可

## 性能说明

- 迁移速度：~37 条记录 < 1 秒
- 数据库大小：168KB (37 条记录)
- 备份大小：~8KB (JSON 文件)

## 维护

如果需要重新迁移：
1. 清空数据库：`npx prisma db push --force-reset`
2. 重新运行迁移脚本
3. 运行测试脚本验证
