# 文章清理功能指南

> **版本**: v1.0
> **更新日期**: 2026-04-03

## 🎯 功能概述

文章清理功能允许您安全地删除已发布博客的本地文件（Markdown 和资源文件），同时保留数据库记录、平台链接和标签信息。

## ✨ 特性

### ✅ 保留的数据

- **数据库记录**：文章的所有元数据保存在数据库中
- **平台链接**：`PublishRecord` 表中的所有发布记录
- **标签信息**：文章的标签存储在数据库的 `tags` 字段
- **发布历史**：完整的发布时间线和状态变化

### 🗑️ 删除的内容

- **Markdown 文件**：`content/done/` 目录下的 `.md` 文件
- **资源文件**：文章引用的本地图片和其他资源
- **工作流状态**：清空 `currentPath` 和 `workflowLocation`

### 🔒 安全特性

- ✅ 只能清理已发布（`published`）状态的文章
- ✅ 预演模式支持（`--dry-run`）
- ✅ 清理前提取并保存标签信息
- ✅ 自动更新文章状态为 `archived`
- ✅ 清晰的日志输出

## 🚀 使用方法

### CLI 命令

#### 基本用法

```bash
# 清理文章
pnpm post:clean <postId>

# 预演模式（不实际删除）
pnpm post:clean <postId> --dry-run

# 预演模式（简写）
pnpm post:clean <postId> -n
```

#### 示例

```bash
# 清理已发布的文章
pnpm post:clean hello-world

# 先预览再清理
pnpm post:clean hello-world --dry-run
pnpm post:clean hello-world
```

### API 调用

```bash
curl -X POST http://localhost:3001/api/posts/<postId>/clean \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'
```

**响应示例**：

```json
{
  "success": true,
  "deletedFiles": [
    "/path/to/content/done/hello-world.md",
    "/path/to/content/done/assets/image.png"
  ],
  "savedTags": ["javascript", "tutorial"],
  "message": "清理完成"
}
```

## 📋 清理前检查清单

### 必须满足的条件

- [ ] 文章状态为 `published`
- [ ] 平台链接已保存到数据库
- [ ] 文章位于 `content/done/` 目录

### 检查命令

```bash
# 1. 检查文章状态
pnpm post:status

# 2. 检查平台链接
pnpm platform:id:status <postId>

# 3. 验证文件位置
ls content/done/<postId>.md
```

## 🔍 清理流程详解

### 阶段 1：验证

```
1. 查询文章记录
2. 验证状态是否为 published
3. 检查文件是否存在
```

### 阶段 2：提取元数据

```
1. 读取 Markdown 文件
2. 提取 frontmatter 中的 tags
3. 扫描文章中的资源引用
4. 构建要删除的文件列表
```

### 阶段 3：执行清理

```
1. 删除 Markdown 文件
2. 删除关联的资源文件
3. 更新数据库：
   - 状态 → archived
   - tags → JSON 数组
   - cleanedAt → 当前时间
   - currentPath → null
   - workflowLocation → null
```

### 阶段 4：验证结果

```
1. 确认文件已删除
2. 确认数据库已更新
3. 确认标签已保存
```

## 📊 数据库状态变化

### 清理前

| 字段 | 值 |
|------|-----|
| `status` | `published` |
| `currentPath` | `/path/to/content/done/post.md` |
| `workflowLocation` | `done` |
| `tags` | `null` |
| `cleanedAt` | `null` |

### 清理后

| 字段 | 值 |
|------|-----|
| `status` | `archived` |
| `currentPath` | `null` |
| `workflowLocation` | `null` |
| `tags` | `["tag1", "tag2"]` |
| `cleanedAt` | `2026-04-03T08:00:00Z` |

## ⚠️ 注意事项

### 清理后的影响

#### ❌ 无法执行的操作

1. **无法查看文章内容**
   - Web UI 无法显示文章内容（返回 404）
   - API 无法读取文件

2. **无法重新发布**
   - 回滚功能不可用
   - 无法从 `done` 目录恢复文件

3. **资源链接失效**
   - 本地资源文件被删除
   - 图片链接失效（如果只存在于 `content/done/assets`）

#### ✅ 仍然可用的功能

1. **数据库查询**
   - 可以查询文章历史记录
   - 可以查看平台链接
   - 可以查看标签信息

2. **平台链接管理**
   - `PublishRecord` 表的记录完整保留
   - `PlatformIdMapping` 表保留

3. **统计分析**
   - 发布历史统计
   - 标签使用统计

## 🔄 恢复机制

### 如果需要重新发布文章

清理后无法直接恢复文件，但可以：

#### 方案 1：从平台复制内容

```bash
# 1. 从已发布平台复制内容
# 2. 创建新的文章文件
pnpm scan --inject

# 3. 重新发布
pnpm post:publish <newPostId>
```

#### 方案 2：重置数据库状态

```bash
# 从平台复制内容后，重置状态
pnpm db-update-status <postId> draft
```

## 📈 使用场景

### 适用场景

✅ **定期清理**
- 文章已发布到所有目标平台
- 不再需要本地编辑
- 释放磁盘空间

✅ **归档管理**
- 文章已过时但保留历史记录
- 批量清理旧文章

✅ **测试环境**
- 清理测试文章
- 重置测试数据

### 不适用场景

❌ **可能需要重新编辑**
- 文章可能需要更新
- 需要重新发布到其他平台

❌ **资源仍在使用**
- 图片资源被其他文章引用
- 资源文件未备份

## 💡 最佳实践

### 1. 发布后等待一段时间

```bash
# 发布后等待 1-2 周，确认无需修改
pnpm post:publish <postId>
# 等待...
pnpm post:clean <postId>
```

### 2. 先使用预演模式

```bash
# 先预览
pnpm post:clean <postId> --dry-run

# 确认无误后再实际清理
pnpm post:clean <postId>
```

### 3. 定期批量清理

```bash
# 查看已发布 3 个月以上的文章
pnpm post:status | grep "3 months ago"

# 逐个清理
pnpm post:clean <oldPostId>
```

### 4. 备份重要内容

```bash
# 清理前备份到归档目录
mkdir -p content/archived/$(date +%Y%m)
cp content/done/<postId>.md content/archived/$(date +%Y%m)/

# 然后再清理
pnpm post:clean <postId>
```

## 🐛 故障排查

### 清理失败

**错误**：`只能清理已发布的文章，当前状态: draft`

**解决**：
```bash
# 先发布文章
pnpm post:publish <postId>

# 然后再清理
pnpm post:clean <postId>
```

### 文件不存在

**错误**：`文件不存在: /path/to/file.md`

**解决**：
```bash
# 检查文件位置
ls content/posts/<postId>.md
ls content/done/<postId>.md

# 如果在 posts 目录，先处理工作流
pnpm workflow:process <postId>
```

### 标签未保存

**问题**：清理后标签为空

**原因**：文章没有 frontmatter 或 tags 字段

**解决**：
```bash
# 清理前先注入 frontmatter
pnpm scan --inject

# 然后再清理
pnpm post:clean <postId>
```

## 📚 相关文档

- [工作流管理](../CLI_REFERENCE.md#工作流管理)
- [数据库存储](DATABASE_STORAGE.md)
- [Frontmatter 自动生成](FRONTMATTER_AUTO_GENERATION.md)

---

**更新日期**: 2026-04-03
**版本**: v1.0
