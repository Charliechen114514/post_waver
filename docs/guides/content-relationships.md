# 内容关联生成系统

## 概述

内容关联生成系统为您的文章提供两种类型的关系：

1. **时间关系**（prev/next）- 基于发布日期的导航
2. **语义关系**（related）- 基于内容相似度的推荐

## 系统架构

### 双路径策略

```
        ┌───────────────┐
        │  TF-IDF (Python) │  ← 高质量语义匹配
        └──────┬────────┘
               │ 失败/超时
        ┌──────▼────────┐
        │ TagMatcher TS │  ← 降级到标签匹配
        └───────────────┘
```

**优势：**
- 高质量的语义匹配，支持中文分词
- Python 不可用时优雅降级
- 索引构建永不因关系生成错误而失败

### 核心组件

#### 1. 时间关系计算器
- **位置：** `packages/linker/src/calculator/prev-next.ts`
- **算法：** 按日期排序（最新→最旧）
- **语义：** `next` = 更新的文章，`prev` = 更旧的文章
- **语言：** TypeScript

#### 2. 标签匹配器（降级方案）
- **位置：** `packages/linker/src/matchers/tag-matcher.ts`
- **算法：** 归一化 Jaccard 相似度（二进制标签向量的余弦相似度）
- **公式：** `|A ∩ B| / sqrt(|A| × |B|)`
- **优化：** 零标签交集返回 0，防止误判
- **语言：** TypeScript

#### 3. TF-IDF 计算器（主要方案）
- **位置：** `packages/linker/scripts/calculate_tfidf.py`
- **算法：** TF-IDF + jieba 分词 + 余弦相似度
- **特性：**
  - 使用 jieba 进行中文分词
  - `max_features=5000` 防止内存溢出
  - 返回每篇文章 Top 10 相关文章
- **语言：** Python

#### 4. Python 桥接器
- **位置：** `packages/linker/src/bridge/python-bridge.ts`
- **特性：**
  - 内容哈希缓存（1小时 TTL）
  - 30秒超时保护
  - PYTHON 环境变量支持
  - 严格的 stdout/stderr 分离
  - 优雅的错误处理

#### 5. 协调器
- **位置：** `packages/linker/src/orchestrator.ts`
- **职责：** 协调所有组件
- **策略：** 尝试 TF-IDF → 降级到 TagMatcher → 永不失败

## 使用方法

### 自动生成

运行以下命令时自动生成关系：

```bash
# 扫描并生成索引
npx tsx scripts/scan.ts --dir content/posts

# 重建索引（包含草稿）
npx tsx scripts/scan.ts --dir content/posts --include-drafts
```

### 输出结构

生成的 `content-index.json` 包含：

```json
{
  "posts": {
    "post-id": {
      "id": "post-id",
      "title": "文章标题",
      "date": "2026-04-02T00:00:00Z",
      "tags": ["标签1", "标签2"],
      "contentHash": "abc123...",
      "filepath": "/path/to/post.md",
      "draft": false,
      "prev": "older-post-id",
      "next": "newer-post-id",
      "related": [
        {"id": "related-1", "title": "相关文章", "score": 0.8234}
      ]
    }
  }
}
```

### 安装 Python 依赖（可选）

要使用高质量的 TF-IDF 语义匹配：

```bash
pnpm python:install
```

这将安装：
- `jieba>=0.42.1` - 中文分词
- `scikit-learn>=1.3.0` - TF-IDF 向量化
- `numpy>=1.24.0` - 数值计算

**注意：** 如果未安装 Python 依赖，系统会自动降级到基于标签的匹配。

## 配置

### Python 二进制文件

设置 `PYTHON` 环境变量以使用特定的 Python 二进制文件：

```bash
export PYTHON=/usr/bin/python3
npx tsx scripts/scan.ts --dir content/posts
```

### 缓存超时

Python 桥接器默认缓存 TF-IDF 结果 1 小时。可以在 `packages/linker/src/bridge/python-bridge.ts` 中修改：

```typescript
const bridge = new PythonBridge(
  'packages/linker/scripts/calculate_tfidf.py',
  30000,  // timeout: 30 秒
  3600000 // cacheTTL: 1 小时
)
```

## 性能

### 基准测试

| 操作 | 100 篇文章 | 500 篇文章 | 1000 篇文章 |
|------|-----------|-----------|------------|
| TagMatcher | ~20ms | ~100ms | ~400ms |
| TF-IDF（首次运行） | ~5s | ~15s | ~30s |
| TF-IDF（缓存命中） | ~5ms | ~5ms | ~5ms |

### 优化建议

1. **启用缓存：** 内容哈希缓存避免重复的 Python 调用
2. **批量处理：** 一次扫描所有文章以提高效率
3. **考虑未来升级：**
   - Python 守护进程，重复调用可提升 10x+ 性能
   - ANN（近似最近邻）支持 1000+ 篇文章
   - 向量嵌入（OpenAI/本地模型）

## 故障排除

### Python TF-IDF 失败

**症状：** 日志显示 `[LinkOrchestrator] Falling back to TagMatcher`

**可能原因：**
- 未安装 Python
- 缺少 jieba/sklearn 依赖
- 脚本超时（>30秒）
- Python 输出无效

**解决方案：** 系统会自动降级到基于标签的匹配。要修复：
```bash
# 安装 Python 依赖
pnpm python:install

# 或者继续使用 TagMatcher（效果也不错）
```

### 没有生成关系

**症状：** 文章没有 prev/next/related 字段

**可能原因：**
- 少于 2 篇文章
- 所有文章都是草稿（未使用 --include-drafts 标志）

**解决方案：**
```bash
# 扫描时包含草稿
npx tsx scripts/scan.ts --dir content/posts --include-drafts
```

### prev/next 顺序错误

**症状：** prev 指向更新的文章，next 指向更旧的文章

**这是正确的行为：**
- `next` = 更新的文章（在排序数组中靠近索引 0）
- `prev` = 更旧的文章（在排序数组中靠近末尾）

## API 使用

### 编程方式访问

```typescript
import { LinkOrchestrator } from '@content-hub/linker'
import { Post } from '@content-hub/core'

const orchestrator = new LinkOrchestrator()
const relationships = await orchestrator.generateRelationships(posts)

// 访问时间关系
const prevNext = relationships.prevNext.get('post-id')
console.log(prevNext?.prev) // 更旧的文章 ID
console.log(prevNext?.next) // 更新的文章 ID

// 访问语义关系
const related = relationships.related.get('post-id')
console.log(related) // 相关文章数组及分数
```

### 使用独立组件

```typescript
import { TagMatcher } from '@content-hub/linker'
import { calculatePrevNext } from '@content-hub/linker'

// 仅使用标签匹配
const tagMatcher = new TagMatcher()
const related = tagMatcher.findRelatedPosts(posts, currentPost, 3)

// 仅使用时间关系
const prevNext = calculatePrevNext(posts)
```

## 未来增强

M1.2 之后的计划改进：

1. **Python 守护进程** - 长运行进程，性能提升 10x+
2. **ANN 集成** - 大规模近似最近邻搜索
3. **向量嵌入** - OpenAI 或本地 LLM 嵌入
4. **FAISS/向量数据库** - 生产级向量相似度搜索

## 相关文档

- [M1.2 里程碑](../milestones/done/M1.2-内容关联生成.md) - 实现细节
- [Scanner 文档](../docs/api/scanner.md) - 扫描工作原理
- [内容索引格式](../docs/api/content-index.md) - 索引结构参考

## 验证步骤

### 快速验证

```bash
# 1. 查看已生成的关系
cat content-index.json | grep -B 2 -A 8 '"prev":'
cat content-index.json | grep -B 2 -A 8 '"related":'

# 应该看到：
# - prev/next 字段（基于日期）
# - related 数组（基于标签匹配或 TF-IDF）
```

### 完整验证（启用 Python TF-IDF）

```bash
# 1. 安装 Python 依赖
pnpm python:install

# 2. 重新生成索引
npx tsx scripts/scan.ts --dir content/posts --include-drafts

# 3. 检查日志，应该看到：
# [LinkOrchestrator] Python TF-IDF succeeded

# 4. 验证关系质量
cat content-index.json | jq '.posts["test-post-2"]'
```

### 降级测试

```bash
# 1. 临时破坏 Python 环境
mv packages/linker/requirements.txt packages/linker/requirements.txt.bak

# 2. 重新运行 - 应该自动降级到 TagMatcher
npx tsx scripts/scan.ts --dir content/posts

# 3. 检查日志
# 应该看到：[LinkOrchestrator] Falling back to TagMatcher

# 4. 恢复
mv packages/linker/requirements.txt.bak packages/linker/requirements.txt
```
