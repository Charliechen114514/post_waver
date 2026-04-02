# 迁移脚本快速参考

## 快速开始

### 一键执行（推荐）
```bash
./scripts/run-migration.sh
```

### 分步执行
```bash
# 1. 构建
cd packages/database && pnpm build && npx prisma generate && npx prisma db push && cd ../..

# 2. 迁移
npx tsx scripts/migrate-json-to-db.ts

# 3. 验证
npx tsx scripts/verify-migration.ts
```

## 核心文件

### 脚本文件
- `scripts/migrate-json-to-db.ts` - 主迁移脚本
- `scripts/test-migration.ts` - 基础测试
- `scripts/verify-migration.ts` - 详细验证
- `scripts/run-migration.sh` - 自动化脚本

### 数据库
- `packages/database/prisma/dev.db` - SQLite 数据库
- `packages/database/prisma/schema.prisma` - 数据库模型

### 文档
- `scripts/MIGRATION_README.md` - 详细使用文档
- `scripts/MIGRATION_GUIDE.md` - 测试报告
- `scripts/QUICK_REFERENCE.md` - 本文件

## 验证命令

### 快速验证
```bash
npx tsx scripts/test-migration.ts
```

### 详细验证
```bash
npx tsx scripts/verify-migration.ts
```

### 数据库查询
```bash
sqlite3 packages/database/prisma/dev.db
> SELECT category, COUNT(*) FROM Config GROUP BY category;
> SELECT COUNT(*) FROM TagCache;
> SELECT COUNT(*) FROM ContentIndex;
> .quit
```

### Prisma Studio
```bash
cd packages/database && npx prisma studio
```

## 测试结果

### 迁移数据统计
- Config 表: 21 条
- TagCache 表: 11 条
- ContentIndex 表: 4 条
- PlatformIdMapping 表: 1 条
- **总计: 37 条记录**

### 验证结果
- ✅ frontmatter 配置: 6/6
- ✅ 标签缓存: 11/11
- ✅ 文章索引: 4/4
- ✅ 配置完整性: 6/6
- ✅ 数据关系: 4/4

## 备份位置
```
.post-waver/backup/
├── config.json
├── content-index.json
├── frontmatter-config.json
├── frontmatter-tag-cache.json
├── hexo-config.json
├── image-upload-config.json
├── platform-ids.json
├── theme-preferences.json
└── wechat-token.json
```

## 常见问题

### Q: 模块导入错误？
A: 确保已构建数据库包：`cd packages/database && pnpm build`

### Q: 数据库连接错误？
A: 运行 `npx prisma db push` 同步数据库结构

### Q: 如何重新迁移？
A: 直接重新运行脚本，使用 `upsert` 操作是安全的

### Q: 如何回滚？
A: 使用 `.post-waver/backup/` 中的备份文件

## 性能指标
- 迁移速度: < 1 秒 (37 条记录)
- 数据库大小: 168KB
- 备份大小: ~8KB

## 下一步
1. 运行应用测试：`pnpm scan`
2. 确认功能正常
3. 可选择删除原始 JSON 文件（保留备份）
