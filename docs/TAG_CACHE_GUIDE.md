# 标签缓存系统使用指南

## 🎯 功能概述

PostWaver 的标签缓存系统会自动保存 AI 生成的标签，当 AI 不可用时，从历史缓存中智能匹配最相关的标签。

## ✨ 核心特性

### 1. 自动缓存 AI 生成的标签

当 AI 成功生成 frontmatter 时，标签会自动保存到缓存：

```typescript
// AI 生成标签: ['react', 'javascript', 'typescript', 'hooks']
// 自动保存到缓存，下次可以直接使用
```

### 2. 智能标签匹配

当 AI 不可用时，系统会：

1. 分析文章内容
2. 从缓存中匹配最相关的标签（基于关键词、分类、使用频率）
3. 如果缓存不够，补充关键词提取

### 3. 自学习

随着使用次数增加，缓存会越来越准确：

- 标签使用次数越高，匹配优先级越高
- 自动记录标签与分类的关系
- 自动提取相关关键词

## 📁 文件结构

```
frontmatter-tag-cache.json    # 标签缓存文件（自动生成）
```

### 缓存文件格式

```json
{
  "version": 1,
  "tags": {
    "react": {
      "tag": "react",
      "count": 5,
      "lastUsed": "2026-04-02T15:00:00Z",
      "relatedKeywords": ["react", "hooks", "components", "jsx", "frontend"],
      "categories": ["test", "tech"]
    },
    "javascript": {
      "tag": "javascript",
      "count": 8,
      "lastUsed": "2026-04-02T15:00:00Z",
      "relatedKeywords": ["javascript", "js", "node", "es6"],
      "categories": ["test", "tech", "notes"]
    }
  },
  "lastUpdated": "2026-04-02T15:00:00Z"
}
```

## 🚀 使用方法

### 自动使用（默认）

正常使用扫描和生成功能，缓存会自动工作：

```bash
# 扫描文章（AI 可用时，标签自动保存到缓存）
pnpm scan

# AI 不可用时，自动从缓存匹配
pnpm scan
```

### 手动管理缓存

#### 查看缓存统计

```bash
npx tsx -e "
import { getTagCacheManager } from '@content-hub/core';
const cache = await getTagCacheManager();
console.log(cache.getStats());
"
```

#### 清理低频标签

```bash
npx tsx -e "
import { getTagCacheManager } from '@content-hub/core';
const cache = await getTagCacheManager();
await cache.cleanup(2); // 清理使用次数 < 2 的标签
"
```

#### 测试标签匹配

```bash
npx tsx scripts/test-tag-cache.ts
```

## 🎨 工作原理

### 匹配算法

标签匹配使用加权评分系统：

| 匹配条件 | 权重 | 说明 |
|---------|------|------|
| 分类匹配 | 50 | 标签所属分类与当前文章分类相同 |
| 关键词匹配 | 10/次 | 文章内容包含标签的相关关键词 |
| 标签名匹配 | 20 | 文章内容直接包含标签名 |
| 使用频率 | 0.1/次 | 历史使用次数越高，权重越大 |

### 示例

假设缓存中有标签 `react`:
- 相关关键词: `['react', 'hooks', 'components', 'jsx']`
- 分类: `['tech']`
- 使用次数: 5

对于一篇关于 "React Hooks" 的技术文章：
- 分类匹配: +50 (tech → tech)
- 关键词匹配: +20 (包含 'react' 和 'hooks')
- 标签名匹配: +20 (包含 'react')
- 频率加权: +0.5 (5次使用)
- **总分: 90.5** → 高优先级匹配

## 📊 最佳实践

### 1. 定期清理缓存

随着时间推移，可能会积累一些不常用的标签：

```bash
# 每月清理一次，删除使用次数 < 2 的标签
npx tsx scripts/cleanup-tag-cache.ts
```

### 2. 查看热门标签

了解你的常用标签分布：

```bash
npx tsx -e "
import { getTagCacheManager } from '@content-hub/core';
const cache = await getTagCacheManager();
const popular = cache.getPopularTags(20);
popular.forEach((entry, i) => {
  console.log(\`\${i+1}. \${entry.tag} (\${entry.count}次)\`);
});
"
```

### 3. 手动添加标签

如果你有常用的标签，可以手动添加到缓存：

```bash
npx tsx -e "
import { getTagCacheManager } from '@content-hub/core';
const cache = await getTagCacheManager();
cache.addTags(['vue', 'nuxt', 'typescript'], 'tech', ['vue', 'nuxtjs']);
await cache.save();
console.log('✅ 标签已添加');
"
```

## 🔧 配置选项

标签缓存功能在扫描和生成时自动启用，无需额外配置。

相关配置在 `frontmatter-config.json`:

```json
{
  "commonTags": ["react", "vue", "javascript"],
  "autoGeneration": {
    "enabled": true,
    "preferAI": true
  }
}
```

## 🐛 故障排查

### 缓存文件丢失

**问题**: 缓存文件被删除或丢失

**解决**: 系统会自动创建新缓存，重新积累即可

### 匹配不准确

**问题**: 缓存匹配的标签不相关

**解决**:
1. 增加使用次数（常用标签优先级更高）
2. 使用 AI 生成几篇文章，让缓存积累数据
3. 手动添加相关标签到缓存

### 缓存占用空间过大

**问题**: 缓存文件变得很大

**解决**: 定期清理低频标签：
```bash
await cache.cleanup(5) // 只保留使用 >= 5 次的标签
```

## 📚 相关文档

- [Frontmatter 自动生成](FRONTMATTER_AUTO_GENERATION.md)
- [快速开始](QUICK_START.md)
- [用户手册](USER_GUIDE.md)

---

**更新日期**: 2026-04-02
**版本**: v3.0
