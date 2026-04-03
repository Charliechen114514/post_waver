# 更新日志 v3.2.0

**发布日期**: 2026-04-03
**版本**: v3.2.0

---

## 🎉 新功能

### 1. Frontmatter 智能注入

**命令**：`pnpm scan --inject`

**功能**：
- ✅ 智能检测缺失的 frontmatter 字段
- ✅ 只补充缺失字段，不覆盖已有内容
- ✅ 最小化文件写入（只在确实修改时保存）
- ✅ 清晰的日志输出

**支持的注入字段**：
- `title`：从内容提取或使用文件名
- `date`：生成当前时间
- `tags`：从缓存匹配或关键词提取
- `categories`：从路径提取或推断
- `description`：从第一段提取

**示例**：

```bash
# 扫描并注入缺失字段
pnpm scan --inject

# 指定目录
pnpm scan --dir content/posts --inject
```

### 2. 文章清理功能

**命令**：`pnpm post:clean <postId>`

**功能**：
- ✅ 安全删除已发布文章的本地文件
- ✅ 保留数据库记录和平台链接
- ✅ 自动提取并保存标签信息
- ✅ 支持预演模式（`--dry-run`）

**清理内容**：
- 删除 Markdown 文件
- 删除关联的资源文件
- 更新状态为 `archived`

**保留数据**：
- 数据库记录完整保留
- 平台链接（PublishRecord）
- 标签信息（JSON 格式）
- 发布历史

**示例**：

```bash
# 预演模式
pnpm post:clean hello-world --dry-run

# 实际清理
pnpm post:clean hello-world
```

---

## 🗄️ 数据库变更

### 新增字段

| 表 | 字段 | 类型 | 说明 |
|---|------|------|------|
| `Post` | `tags` | `String?` | JSON 数组，存储文章标签 |
| `Post` | `cleanedAt` | `DateTime?` | 清理时间戳 |

**迁移**：`20260403081511_add_post_clean_fields`

---

## 📝 文档更新

### 新增文档

- **[文章清理功能指南](guides/post-cleanup-guide.md)**
  - 完整的功能说明
  - 使用场景和最佳实践
  - 故障排查指南

### 更新文档

- **[CLI 命令参考](CLI_REFERENCE.md)**
  - 添加 `--inject` 选项说明
  - 添加 `post:clean` 命令
  - 更新扫描命令部分

- **[Frontmatter 自动生成](FRONTMATTER_AUTO_GENERATION.md)**
  - 添加智能注入模式说明
  - 更新使用方法部分
  - 添加注入示例

- **[文档首页](README.md)**
  - 添加新功能链接
  - 更新版本日志
  - 优化导航结构

---

## 🔧 代码变更

### 核心包 (packages/core)

**src/parser.ts**：
- 添加 `injectMode` 参数
- 实现智能字段比较逻辑
- 只在确实有修改时保存文件

**src/scanner.ts**：
- 添加 `inject` 选项
- 传递注入参数到 `parsePost`

### 数据库包 (packages/database)

**prisma/schema.prisma**：
- 添加 `tags` 和 `cleanedAt` 字段
- 添加索引优化

**src/dal/post.ts**：
- 添加 `cleanPost()` 方法
- 添加 `getCleanedPosts()` 方法
- 添加 `isCleaned()` 方法

### 引擎包 (packages/engine)

**src/workflow/post-cleaner.ts** (新建)：
- 实现清理核心逻辑
- 支持 dry-run 模式
- 自动提取元数据

**src/api.ts**：
- 添加 `POST /api/posts/:id/clean` 端点
- 更新文章列表 API 以支持 `tags` 字段

### 脚本 (scripts)

**post-clean.ts** (新建)：
- CLI 工具入口
- 支持命令行参数
- 友好的输出格式

**scan.ts**：
- 添加 `--inject` 选项
- 更新帮助信息

---

## 📊 测试

### 功能测试

- ✅ Frontmatter 智能注入（完整字段缺失）
- ✅ Frontmatter 智能注入（部分字段缺失）
- ✅ Frontmatter 智能注入（已有完整字段）
- ✅ 文章清理功能（预演模式）
- ✅ 文章清理功能（实际清理）
- ✅ 数据库状态验证
- ✅ 文件系统验证

### 测试覆盖率

所有新功能均已测试通过，包括：
- 边界情况处理
- 错误处理
- 数据一致性
- 文件操作安全性

---

## 🐛 已知问题

无

---

## 🔄 升级指南

### 数据库迁移

```bash
cd packages/database
pnpm prisma migrate dev --name add_post_clean_fields
```

### 重新构建

```bash
pnpm build
```

### 验证安装

```bash
# 测试扫描功能
pnpm scan --help

# 测试清理功能
pnpm post:clean --help
```

---

## 💡 使用建议

### Frontmatter 注入

1. **首次使用**：先用 `--inject` 处理所有缺失 frontmatter 的文章
   ```bash
   pnpm scan --inject
   ```

2. **定期使用**：新建文章后运行注入，补充元数据
   ```bash
   pnpm scan --dir content/new-posts --inject
   ```

3. **安全检查**：注入前可以先不指定 `--inject`，预览生成结果

### 文章清理

1. **发布后等待**：建议发布 1-2 周后再清理，确保无需修改

2. **使用预演**：清理前使用 `--dry-run` 预览
   ```bash
   pnpm post:clean <postId> --dry-run
   ```

3. **备份重要内容**：清理前可以备份到归档目录
   ```bash
   mkdir -p content/archived
   cp content/done/<postId>.md content/archived/
   ```

---

## 📚 相关文档

- [文章清理功能指南](guides/post-cleanup-guide.md)
- [Frontmatter 自动生成](FRONTMATTER_AUTO_GENERATION.md)
- [CLI 命令参考](CLI_REFERENCE.md)
- [数据库存储](DATABASE_STORAGE.md)

---

**发布者**: PostWaver Team
**发布日期**: 2026-04-03
**下个版本**: v3.3.0 (计划中)
