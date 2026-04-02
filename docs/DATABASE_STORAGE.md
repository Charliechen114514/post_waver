# PostWaver 数据库存储方案

> **版本**: v3.0  
> **更新日期**: 2026-04-02  
> **数据库**: SQLite (Prisma ORM)

---

## 🎯 概述

PostWaver 采用**全数据库存储方案**，所有数据统一存储在 SQLite 数据库中，不再使用分散的 JSON 配置文件。

### ✨ 核心优势

- **单一数据源**：所有配置、缓存、索引都在一个数据库文件中
- **易于迁移**：只需复制 `dev.db` 文件即可完成数据迁移
- **事务安全**：利用数据库事务保证数据一致性
- **高效查询**：支持复杂查询和索引优化
- **类型安全**：通过 Prisma ORM 提供完整的 TypeScript 类型支持

---

## 📊 数据库结构

### 数据库位置

```
packages/database/prisma/dev.db
```

### 数据模型

PostWaver 包含以下核心数据表：

#### 1. **Post** - 文章和工作流状态
```prisma
model Post {
  id              String
  postId          String   @unique
  title           String
  status          String
  workflowStatus  String   // pending, processing, done
  workflowLocation String  // posts, done
  originalPath    String
  currentPath     String
  assetsMoved     Boolean
  createdAt       DateTime
  updatedAt       DateTime
  processedAt     DateTime?
  movedAt         DateTime?

  publishRecords  PublishRecord[]
}
```

**用途**：追踪文章从创建到发布的完整生命周期

#### 2. **Config** - 统一配置存储
```prisma
model Config {
  id        Int      @id @default(autoincrement())
  key       String   @unique
  value     String   // JSON 字符串
  category  String   // frontmatter, main, hexo, imageUpload, theme, wechatToken
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**用途**：替代所有 JSON 配置文件
- `frontmatter.*` - Frontmatter 自动生成配置
- `main.*` - 主题配置
- `hexo.*` - Hexo 集成配置
- `imageUpload.*` - 图片上传配置
- `theme.*` - 主题相关配置
- `wechatToken.*` - 微信公众号配置

#### 3. **TagCache** - 标签缓存和学习
```prisma
model TagCache {
  id              Int      @id @default(autoincrement())
  tag             String   @unique
  count           Int      @default(1)
  lastUsed        DateTime @default(now())
  relatedKeywords String   // JSON array
  categories      String   // JSON array
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**用途**：
- AI 生成的标签自动保存
- 智能匹配标签（基于分类、关键词、频率）
- 标签使用统计

#### 4. **ContentIndex** - 内容索引
```prisma
model ContentIndex {
  id          String    @id
  title       String
  date        DateTime
  tags        String    // JSON array
  contentHash String
  filepath    String
  draft       Boolean   @default(false)
  prev        String?
  next        String?
  related     String?   // JSON array
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

**用途**：
- 文章快速检索
- 相关文章推荐
- 文章导航（上一篇/下一篇）

#### 5. **PlatformIdMapping** - 平台发布记录
```prisma
model PlatformIdMapping {
  id             Int      @id @default(autoincrement())
  postId         String
  platform       String   // juejin, zhihu, csdn, wechat
  platformPostId String
  url            String?
  publishedAt    DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([postId, platform])
}
```

**用途**：
- 记录文章在各平台的发布状态
- 存储平台文章 ID 和 URL
- 支持跨平台同步更新

#### 6. **PublishRecord** - 发布历史
```prisma
model PublishRecord {
  id        String   @id @default(cuid())
  postId    String
  platform  String
  hashId    String?
  url       String?
  createdAt DateTime @default(now())

  post Post @relation(fields: [postId], references: [id])
}
```

#### 7. **OperationLog** - 操作日志
```prisma
model OperationLog {
  id        String   @id @default(cuid())
  postId    String?
  action    String
  details   String?
  createdAt DateTime @default(now())
}
```

---

## 🔧 使用指南

### 1. 配置管理 (Config)

```typescript
import { getConfig, setConfig, getConfigCategory, setConfigCategory } from '@content-hub/database'

// 读取单个配置
const enabled = await getConfig('frontmatter', 'autoGeneration.enabled')

// 读取整个分类配置
const frontmatterConfig = await getConfigCategory('frontmatter')

// 写入单个配置
await setConfig('frontmatter', 'autoGeneration.enabled', true)

// 写入整个分类配置
await setConfigCategory('frontmatter', {
  commonTags: ['javascript', 'react'],
  autoGeneration: {
    enabled: true,
    preferAI: true
  }
})

// 删除配置
import { ConfigService } from '@content-hub/database'
await ConfigService.delete('frontmatter', 'obsoleteKey')
await ConfigService.deleteCategory('oldCategory')
```

### 2. 标签缓存 (TagCache)

```typescript
import { 
  addTags, 
  matchTagsFromContent, 
  getPopularTags,
  getTagsByCategory,
  TagCacheService 
} from '@content-hub/database'

// 添加标签到缓存
await addTags(
  ['react', 'hooks'], 
  'tech', 
  ['component', 'state', 'function']
)

// 从内容智能匹配标签
const content = '这篇文章介绍了 React Hooks 的使用方法...'
const matchedTags = await matchTagsFromContent(content, 'tech', 5)
// 返回: ['react', 'hooks', 'component', 'javascript', 'tutorial']

// 获取热门标签
const popular = await getPopularTags(20)

// 获取特定分类的标签
const techTags = await getTagsByCategory('tech')

// 获取统计信息
const stats = await TagCacheService.getStats()
console.log(`总标签数: ${stats.totalTags}`)
console.log(`总使用次数: ${stats.totalUsage}`)
console.log(`热门标签:`, stats.topTags)

// 清理低频标签（保留使用次数 >= 2 的）
const result = await TagCacheService.cleanup(2)
console.log(`清理前: ${result.before}, 清理后: ${result.after}`)

// 导出常用标签列表（供 AI 参考）
const commonTags = await TagCacheService.exportCommonTags(50)
```

### 3. 内容索引 (ContentIndex)

```typescript
import { 
  getContentIndex, 
  upsertContentIndex,
  upsertContentIndexMany,
  deleteContentIndex,
  ContentIndexService
} from '@content-hub/database'

// 获取单个文章索引
const index = await getContentIndex('my-post-id')

// 批量获取索引
const indices = await ContentIndexService.getMany(['post1', 'post2'])

// 创建或更新索引
await upsertContentIndex({
  id: 'my-post-id',
  title: '理解 JavaScript 闭包',
  date: new Date(),
  tags: ['javascript', 'closure'],
  contentHash: 'abc123',
  filepath: 'content/posts/tech/closure.md',
  draft: false,
  prev: 'previous-post-id',
  next: 'next-post-id',
  related: [
    { id: 'related-1', title: 'JavaScript 作用域', score: 0.85 }
  ]
})

// 批量更新索引
await upsertContentIndexMany([
  { id: 'post1', title: '...', /* ... */ },
  { id: 'post2', title: '...', /* ... */ }
])

// 搜索
const byTag = await ContentIndexService.searchByTag('javascript')
const byCategory = await ContentIndexService.searchByCategory('tech')

// 获取草稿/已发布
const drafts = await ContentIndexService.getDrafts()
const published = await ContentIndexService.getPublished()

// 统计信息
const stats = await ContentIndexService.getStats()
console.log(`总文章数: ${stats.totalPosts}`)
console.log(`草稿数: ${stats.draftCount}`)
console.log(`所有标签:`, stats.allTags)
```

### 4. 平台 ID 映射 (PlatformIdMapping)

```typescript
import { 
  getPlatformId,
  setPlatformId,
  getAllPlatformIds,
  PlatformIdService
} from '@content-hub/database'

// 获取文章在特定平台的 ID
const juejinInfo = await getPlatformId('my-post-id', 'juejin')
console.log(juejinInfo.postId)  // 掘金文章 ID
console.log(juejinInfo.url)     // 掘金文章 URL

// 获取文章在所有平台的 ID
const allPlatforms = await getAllPlatformIds('my-post-id')
// 返回: { juejin: {...}, zhihu: {...}, wechat: {...} }

// 设置平台 ID
await setPlatformId(
  'my-post-id',
  'juejin',
  '7123456789',
  'https://juejin.cn/post/7123456789'
)

// 批量设置
await PlatformIdService.setMany([
  { postId: 'post1', platform: 'juejin', platformPostId: 'id1', url: '...' },
  { postId: 'post1', platform: 'zhihu', platformPostId: 'id2', url: '...' }
])

// 获取特定平台的所有映射
const juejinPosts = await PlatformIdService.getAllForPlatform('juejin')

// 获取所有映射
const allMappings = await PlatformIdService.getAll()

// 统计信息
const stats = await PlatformIdService.getStats()
console.log(`总映射数: ${stats.totalMappings}`)
console.log(`按平台统计:`, stats.byPlatform)
```

---

## 🚀 数据迁移

### 备份数据

```bash
# 备份数据库文件
cp packages/database/prisma/dev.db packages/database/prisma/dev.db.backup.$(date +%Y%m%d)
```

### 恢复数据

```bash
# 恢复数据库
cp packages/database/prisma/dev.db.backup.20260402 packages/database/prisma/dev.db
```

### 跨设备迁移

1. **复制数据库文件**
   ```bash
   # 从旧设备复制
   scp user@old-device:/path/to/post_waver/packages/database/prisma/dev.db \
       /path/to/new/post_waver/packages/database/prisma/dev.db
   ```

2. **验证数据**
   ```bash
   # 查看数据库统计
   npx tsx -e "
   import { PrismaClient } from '@content-hub/database'
   const prisma = new PrismaClient()
   
   const postCount = await prisma.post.count()
   const configCount = await prisma.config.count()
   const tagCount = await prisma.tagCache.count()
   
   console.log(\`文章数: \${postCount}\`)
   console.log(\`配置数: \${configCount}\`)
   console.log(\`标签数: \${tagCount}\`)
   "
   ```

### 从 JSON 配置迁移到数据库

如果你有旧版本的 JSON 配置文件，可以使用迁移脚本：

```typescript
// scripts/migrate-to-db.ts
import { setConfigCategory } from '@content-hub/database'
import fs from 'fs'

// 读取旧的 frontmatter-config.json
const oldConfig = JSON.parse(
  fs.readFileSync('frontmatter-config.json', 'utf-8')
)

// 迁移到数据库
await setConfigCategory('frontmatter', {
  commonTags: oldConfig.commonTags,
  commonCategories: oldConfig.commonCategories,
  autoGeneration: oldConfig.autoGeneration
})

console.log('配置迁移完成！')
```

---

## 🔍 数据库查询示例

### 使用 Prisma Client 直接查询

```typescript
import { PrismaClient } from '@content-hub/database'

const prisma = new PrismaClient()

// 查询所有草稿文章
const drafts = await prisma.post.findMany({
  where: { status: 'draft' },
  orderBy: { createdAt: 'desc' }
})

// 查询特定分类的标签
const techTags = await prisma.tagCache.findMany({
  where: {
    categories: {
      contains: 'tech'
    }
  },
  orderBy: { count: 'desc' }
})

// 查询已发布到掘金的文章
const juejinPublished = await prisma.platformIdMapping.findMany({
  where: { platform: 'juejin' },
  include: {
    // 需要时可以关联查询
  }
})

// 统计查询
const stats = await prisma.post.aggregate({
  _count: { id: true },
  where: { workflowStatus: 'done' }
})
```

### 使用 SQL 原生查询

```typescript
// 复杂查询可以使用原生 SQL
const result = await prisma.$queryRaw`
  SELECT 
    p.title,
    p.postId,
    COUNT(pr.id) as publishCount
  FROM Post p
  LEFT JOIN PublishRecord pr ON p.id = pr.postId
  WHERE p.status = 'published'
  GROUP BY p.id
  ORDER BY publishCount DESC
`
```

---

## 🛠️ 数据库维护

### 重建索引

```bash
# 使用 Prisma 重建数据库
pnpm db:reset
```

### 清理数据

```typescript
// 清理低频标签
await TagCacheService.cleanup(2)

// 清理旧的操作日志（保留最近 30 天）
import { PrismaClient } from '@content-hub/database'
const prisma = new PrismaClient()
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

await prisma.operationLog.deleteMany({
  where: {
    createdAt: { lt: thirtyDaysAgo }
  }
})
```

### 数据库性能优化

1. **定期清理**
   ```typescript
   // 清理低频标签
   await TagCacheService.cleanup(2)
   
   // 清理旧日志
   await prisma.operationLog.deleteMany({
     where: { createdAt: { lt: thirtyDaysAgo } }
   })
   ```

2. **索引优化**
   - Prisma 自动为 `@unique` 和 `@@index` 字段创建索引
   - 查看 `schema.prisma` 了解索引定义

3. **事务批量操作**
   ```typescript
   // 使用事务提高批量操作性能
   await prisma.$transaction([
     prisma.tagCache.create({ data: { /* ... */ } }),
     prisma.tagCache.create({ data: { /* ... */ } }),
     // ...
   ])
   ```

---

## 📝 最佳实践

### 1. 配置管理

- ✅ **使用分类前缀**：如 `frontmatter.commonTags`、`hexo.sourcePath`
- ✅ **批量读取**：使用 `getConfigCategory()` 读取整个分类
- ✅ **类型安全**：定义 TypeScript 接口确保配置类型正确

```typescript
interface FrontmatterConfig {
  commonTags: string[]
  autoGeneration: {
    enabled: boolean
    preferAI: boolean
  }
}

const config = await getConfigCategory('frontmatter') as FrontmatterConfig
```

### 2. 标签缓存

- ✅ **定期使用 AI**：让缓存自动学习和积累
- ✅ **手动补充**：添加常用标签到缓存
- ✅ **定期清理**：删除低频标签，保持精简

```typescript
// 定期维护
const stats = await TagCacheService.getStats()
if (stats.totalTags > 500) {
  await TagCacheService.cleanup(3) // 提高清理阈值
}
```

### 3. 内容索引

- ✅ **实时更新**：文章变更时立即更新索引
- ✅ **批量操作**：使用事务批量更新索引
- ✅ **定期重建**：从文件系统重建索引确保一致性

```typescript
// 批量更新索引
await upsertContentIndexMany(posts)
```

### 4. 数据备份

- ✅ **定期备份**：使用 cron 或 CI 定期备份数据库
- ✅ **版本控制**：数据库文件不应提交到 Git，但可以保留备份
- ✅ **异地备份**：重要数据备份到云存储

```bash
# .gitignore
packages/database/prisma/dev.db
packages/database/prisma/dev.db-journal

# 但可以保留示例 schema
!packages/database/prisma/schema.prisma
```

---

## 🔒 数据安全

### 权限控制

- SQLite 数据库文件权限应设置为 `600`（仅所有者可读写）
- 避免将数据库文件提交到公共仓库

```bash
chmod 600 packages/database/prisma/dev.db
```

### 敏感数据

- 微信公众号 Token 等敏感信息存储在数据库中
- 定期审计数据库中的敏感信息
- 考虑使用环境变量 + 数据库加密

---

## 📊 性能指标

### 数据库大小估算

| 数据类型 | 单条记录大小 | 1000 条记录 |
|---------|------------|------------|
| Post | ~500 bytes | ~500 KB |
| Config | ~200 bytes | ~200 KB |
| TagCache | ~300 bytes | ~300 KB |
| ContentIndex | ~400 bytes | ~400 KB |

**典型项目数据库大小**：
- 小型项目（< 100 篇文章）：~5 MB
- 中型项目（100-500 篇文章）：~20 MB
- 大型项目（> 500 篇文章）：~50 MB

### 查询性能

- 主键查询：< 1ms
- 索引查询：< 5ms
- 全表扫描：< 50ms（取决于数据量）

---

## 🆘 故障排查

### 数据库锁定

**问题**：`Database is locked`

**解决**：
```bash
# 检查是否有进程占用数据库
lsof packages/database/prisma/dev.db

# 如果有僵尸进程，杀掉它
kill -9 <PID>

# 或者删除 journal 文件
rm packages/database/prisma/dev.db-journal
```

### 数据库损坏

**问题**：`Database disk image is malformed`

**解决**：
```bash
# 使用 SQLite 恢复模式
sqlite3 packages/database/prisma/dev.db "PRAGMA integrity_check;"

# 如果损坏，从备份恢复
cp packages/database/prisma/dev.db.backup.YYYYMMDD packages/database/prisma/dev.db
```

### 迁移失败

**问题**：数据迁移后应用无法启动

**解决**：
```bash
# 重新生成 Prisma Client
pnpm db:generate

# 检查数据库权限
ls -la packages/database/prisma/dev.db

# 查看数据库结构
sqlite3 packages/database/prisma/dev.db ".schema"
```

---

## 📚 相关文档

- [Prisma 文档](https://www.prisma.io/docs)
- [快速开始](QUICK_START.md)
- [Frontmatter 自动生成](FRONTMATTER_AUTO_GENERATION.md)
- [用户手册](USER_GUIDE.md)

---

**更新日期**: 2026-04-02  
**版本**: v3.0
