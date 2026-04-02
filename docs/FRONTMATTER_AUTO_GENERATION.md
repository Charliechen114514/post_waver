# Frontmatter 自动生成功能

## 🎯 功能概述

PostWaver 支持智能自动生成文章 Frontmatter，让你专注于内容创作，而不必手动编写元数据。

## ✨ 特性

### 🤖 AI 智能生成（方案2）

在 **Claude Code 环境**中，PostWaver 会自动使用 Claude API 分析文章内容：

- **智能标题提取**：理解文章主题，生成准确的标题
- **精准标签匹配**：从常用标签库中选择最相关的标签
- **合理分类推断**：根据内容自动分类
- **简洁描述生成**：生成文章摘要（100字以内）

### 💾 标签缓存系统（NEW）

AI 生成的标签会自动保存到缓存，当 AI 不可用时：

- **智能匹配**：从历史缓存中匹配最相关的标签
- **自学习**：使用次数越多，匹配越准确
- **关键词关联**：自动提取并记录相关关键词

详见：[标签缓存系统](TAG_CACHE_GUIDE.md)

### 🔧 规则生成（方案1 - Fallback）

当 AI 不可用时，使用规则引擎自动生成：

- **标题**：从第一个 `# 一级标题` 提取
- **日期**：使用当前日期（ISO8601 格式）
- **标签**：优先从缓存匹配，补充关键词提取
- **分类**：从文件路径推断（`tech/`, `life/`, `notes/`）
- **描述**：提取文章第一段内容

## 📋 配置文件

> **💡 数据存储更新**  
> 所有配置现在存储在数据库中，不再使用 JSON 配置文件。标签缓存也存储在数据库的 `TagCache` 表中。详见 [数据库存储文档](DATABASE_STORAGE.md)。

### 配置管理方式

配置数据存储在数据库的 `Config` 表中：

```typescript
// 读取配置（替代 JSON 文件）
import { getConfig, setConfig, getConfigCategory } from '@content-hub/database'

// 获取单个配置
const commonTags = await getConfig('frontmatter', 'commonTags')

// 获取整个分类配置
const frontmatterConfig = await getConfigCategory('frontmatter')

// 设置配置
await setConfig('frontmatter', 'commonTags', ['javascript', 'react'])
await setConfigCategory('frontmatter', {
  commonTags: ['javascript', 'react'],
  autoGeneration: { enabled: true }
})
```

### 配置分类说明

| 分类 | 说明 | 数据库表 |
|------|------|----------|
| `frontmatter` | Frontmatter 自动生成配置 | Config |
| `main` | 主题配置 | Config |
| `hexo` | Hexo 集成配置 | Config |
| `imageUpload` | 图片上传配置 | Config |
| `tagCache` | 标签缓存（自动学习） | TagCache |

### 标签缓存系统

标签缓存完全存储在数据库中，具有以下特点：

- **自动学习**：AI 生成的标签自动保存到 `TagCache` 表
- **智能匹配**：根据分类、关键词、使用频率智能匹配标签
- **统计分析**：实时统计标签使用频率和热门标签
- **分类管理**：按分类组织标签，提高匹配精度

```typescript
import { addTags, matchTagsFromContent, getPopularTags } from '@content-hub/database'

// 添加标签到缓存
await addTags(['react', 'hooks'], 'tech', ['component', 'state'])

// 从内容智能匹配标签
const matched = await matchTagsFromContent(content, 'tech', 5)

// 获取热门标签
const popular = await getPopularTags(20)
```

## 🚀 使用方法

### 方法 1：扫描时自动生成

```bash
# 扫描文章，自动补全缺失的 Frontmatter
pnpm workflow:scan
```

### 方法 2：手动测试

```bash
# 测试自动生成功能
npx tsx scripts/test-auto-frontmatter.ts
```

### 方法 3：编程方式

```typescript
import { parsePost } from '@content-hub/core'

const post = await parsePost('content/posts/my-post.md', {
  autoComplete: true,      // 启用自动补全
  saveToFile: true         // 保存到文件
})
```

## 📊 生成示例

### 输入文章（无 Frontmatter）

```markdown
# 理解 JavaScript 闭包

闭包是 JavaScript 中一个非常重要但也容易让人困惑的概念。

## 什么是闭包？

闭包是指函数能够访问其词法作用域外的变量。
```

### 输出（自动生成后）

```markdown
---
title: 理解 JavaScript 闭包
date: 2026-04-02T14:55:23.124Z
tags:
  - javascript
  - java
categories:
  - test
description: 闭包是 JavaScript 中一个非常重要但也容易让人困惑的概念。
draft: false
---

# 理解 JavaScript 闭包
...
```

## 🔍 环境检测

PostWaver 会自动检测运行环境：

- ✅ **检测到 Claude Code 环境** → 使用 AI 方案
- ❌ **未检测到** → 使用规则方案

检测条件：
- 环境变量 `ANTHROPIC_API_KEY` 存在
- 或环境变量 `CLAUDE_CODE` / `VSCODE_PID` 存在

## ⚙️ 高级配置

### API Key 配置

如果需要使用 AI 方案，请设置 API Key：

```bash
# 方式 1：环境变量
export ANTHROPIC_API_KEY="your-api-key"

# 方式 2：.env 文件
echo "ANTHROPIC_API_KEY=your-api-key" >> .env
```

### 自定义标签库

通过数据库管理常用标签：

```typescript
import { addTags, getPopularTags, exportCommonTags } from '@content-hub/database'

// 添加自定义标签到缓存
await addTags(['vue', 'nuxt', 'pinia'], 'tech')

// 导出常用标签列表（供 AI 参考）
const commonTags = await exportCommonTags(50)

// 更新配置
await setConfig('frontmatter', 'commonTags', commonTags)
```

## 💡 最佳实践

### 1. 保持数据库标签库更新

定期使用 AI 生成文章，让标签缓存自动学习和积累：

```typescript
// 查看当前标签统计
import { TagCacheService } from '@content-hub/database'
const stats = await TagCacheService.getStats()
console.log(`总标签数: ${stats.totalTags}, 总使用次数: ${stats.totalUsage}`)
```

### 2. 利用标签缓存智能匹配

- AI 生成的标签自动保存到数据库 `TagCache` 表
- 即使 AI 不可用，也能从缓存中智能匹配
- 支持关键词关联和分类匹配，提高精度

### 3. 验证生成结果

首次使用时，建议先不保存到文件（`saveToFile: false`），检查生成结果后再启用。

### 4. 混合使用

- 自动生成基础 Frontmatter
- 手动微调不合适的字段
- 逐步完善常用标签库

## 🐛 故障排查

### AI 生成失败

**问题**：提示 "未找到 ANTHROPIC_API_KEY"

**解决**：
1. 检查 API Key 是否正确配置
2. 系统会自动 fallback 到规则方案（带标签缓存）

### 生成结果不准确

**问题**：标签或分类不准确

**解决**：
1. 使用 AI 多生成几次文章，让数据库标签缓存学习
2. 手动添加常用标签到数据库：`await addTags(['tag1', 'tag2'], 'tech')`
3. 查看标签统计和热门标签：`await getPopularTags(20)`
4. 或手动调整生成的 Frontmatter

### 标签缓存不工作

**问题**：数据库匹配的标签不相关

**解决**：
1. 多使用 AI 生成几次，让缓存积累数据
2. 手动添加常用标签：`await addTags(['your-tag'], 'category', ['keyword1', 'keyword2'])`
3. 定期清理低频标签：`await TagCacheService.cleanup(2)`
4. 查看缓存统计：`await TagCacheService.getStats()`

### 文件未保存

**问题**：生成的 Frontmatter 没有保存到文件

**解决**：
1. 检查配置中 `saveToFile` 是否为 `true`
2. 或使用 `parsePost` 时传入 `saveToFile: true`

## 📚 相关文档

- [快速开始](QUICK_START.md)
- [用户手册](USER_GUIDE.md)
- [标签缓存系统](TAG_CACHE_GUIDE.md)
- [Frontmatter 规范](docs/features/M2.3-frontmatter-spec.md)

---

**更新日期**: 2026-04-02
**版本**: v3.1
