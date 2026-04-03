# PostWaver AutoTag 自动标签系统

> **版本**: v1.0
> **更新日期**: 2026-04-03
> **AI引擎**: Claude Sonnet 4.6

---

## 🚀 快速开始

### 3分钟上手AutoTag

**1. 基础使用**
```bash
# 自动生成标签和分类
pnpm scan

# AutoTag会自动：
# ✅ 分析文章内容
# ✅ 生成相关标签
# ✅ 推荐文章分类
# ✅ 缓存结果供下次使用
```

**2. 工作原理**
```
写作文章 → 扫描内容 → AI分析 → 生成标签 → 缓存结果
```

**3. 双重策略**
- 🤖 **AI生成**：使用Claude AI智能分析（首选）
- 📋 **规则生成**：基于关键词和缓存（备选）

---

## 📖 完整指南

### 一、AutoTag系统概述

PostWaver的AutoTag是一个智能的标签和分类生成系统，通过AI自动分析文章内容，生成准确的标签和分类。

#### 1.1 核心特性

**智能分析**：
- 🤖 基于Claude AI的深度内容理解
- 📝 自动提取关键主题和技术栈
- 🎯 智能匹配常用标签库
- 📊 支持自定义标签和分类

**高效缓存**：
- 💾 本地SQLite数据库存储
- ⚡ 秒级检索历史标签
- 🔄 自动更新标签使用频率
- 📈 标签推荐算法优化

**灵活配置**：
- ⚙️ 支持AI和规则双模式
- 🎨 自定义常用标签库
- 📁 基于路径的分类推荐
- 🔧 可选的强制模式

#### 1.2 系统架构

```
PostWaver AutoTag
├── AI生成引擎 (Claude Sonnet 4.6)
│   ├── 内容分析
│   ├── 关键词提取
│   └── 标签生成
├── 规则生成引擎
│   ├── 关键词匹配
│   ├── 路径分析
│   └── 缓存查询
└── 缓存系统 (SQLite)
    ├── 标签存储
    ├── 使用统计
    └── 关系管理
```

---

### 二、AI生成模式

#### 2.1 工作原理

**AI分析流程**：
```
1. 提取文章纯文本内容
2. 移除Markdown语法和代码块
3. 取前3000字符作为分析样本
4. 调用Claude AI API分析
5. 生成标签、分类、描述等元数据
```

**技术细节**：
- **AI模型**：Claude Sonnet 4.6
- **分析样本**：文章前3000字符
- **API调用**：通过Anthropic API
- **环境变量**：`ANTHROPIC_API_KEY`

#### 2.2 使用方法

**自动模式（推荐）**：
```bash
# AutoTag自动检测是否使用AI
pnpm scan

# 系统会：
# 1. 检查ANTHROPIC_API_KEY环境变量
# 2. 如果有API Key，使用AI生成
# 3. 如果没有，fallback到规则生成
```

**强制AI模式**：
```bash
# 强制使用AI生成
ANTHROPIC_API_KEY=your-key pnpm scan

# 或在代码中指定
pnpm scan --use-ai --api-key=your-key
```

#### 2.3 API配置

**设置API Key**：

方法1 - 环境变量：
```bash
# 临时设置
export ANTHROPIC_API_KEY=your-api-key

# 永久设置（添加到 ~/.bashrc 或 ~/.zshrc）
echo 'export ANTHROPIC_API_KEY=your-api-key' >> ~/.bashrc
source ~/.bashrc
```

方法2 - .env文件：
```bash
# 在项目根目录创建 .env 文件
echo "ANTHROPIC_API_KEY=your-api-key" > .env
```

**获取API Key**：
1. 访问 https://console.anthropic.com/
2. 注册/登录Anthropic账户
3. 在API Keys部分创建新密钥
4. 复制密钥到环境变量

#### 2.4 自定义标签库

**配置常用标签**：
```javascript
// 在扫描时传入自定义标签库
const result = await generateFrontmatter(markdown, filepath, {
  commonTags: [
    'javascript', 'typescript', 'react', 'vue',
    'node.js', 'frontend', 'backend', 'database',
    'algorithm', 'tutorial', 'best-practices'
  ],
  commonCategories: [
    '前端开发', '后端开发', '数据库', '算法',
    '工具使用', '最佳实践', '教程翻译'
  ]
})
```

**标签库作用**：
- AI会优先从标签库中选择相关标签
- 提高标签生成的一致性
- 减少不相关或错误标签
- 适应个人技术栈和写作风格

---

### 三、规则生成模式

#### 3.1 工作原理

当AI不可用时，AutoTag会自动切换到规则模式：

**规则分析流程**：
```
1. 检查现有frontmatter
2. 从内容中提取关键词
3. 匹配预定义的技术关键词列表
4. 查询缓存中的历史标签
5. 根据文件路径推断分类
6. 合并生成最终标签
```

#### 3.2 关键词匹配

**技术关键词列表**：
```javascript
const TECH_KEYWORDS = {
  'javascript': ['javascript', 'js', 'node', 'npm'],
  'typescript': ['typescript', 'ts', 'interface', 'type'],
  'react': ['react', 'jsx', 'hooks', 'component'],
  'vue': ['vue', 'vuetify', 'nuxt', 'vuex'],
  'python': ['python', 'pip', 'django', 'flask'],
  'java': ['java', 'spring', 'maven', 'gradle'],
  'go': ['golang', 'go', 'goroutine', 'channel'],
  'rust': ['rust', 'cargo', 'crates', 'ownership'],
  'database': ['sql', 'mysql', 'postgresql', 'mongodb'],
  'algorithm': ['算法', 'algorithm', '排序', '搜索'],
  // ... 更多关键词
}
```

#### 3.3 路径推断

**基于文件路径的分类**：
```
content/posts/frontend/ → 分类: "前端开发"
content/posts/backend/  → 分类: "后端开发"
content/posts/database/ → 分类: "数据库"
content/posts/tutorial/ → 分类: "教程翻译"
```

**实现逻辑**：
```javascript
function inferCategoryFromPath(filepath: string): string {
  const pathParts = filepath.split('/')
  const dirName = pathParts[pathParts.length - 2] // 倒数第二部分
  
  const categoryMap = {
    'frontend': '前端开发',
    'backend': '后端开发',
    'database': '数据库',
    'tutorial': '教程翻译',
    // ... 更多映射
  }
  
  return categoryMap[dirName] || '未分类'
}
```

#### 3.4 缓存查询

**标签缓存系统**：
- 存储历史上使用的标签
- 记录标签使用频率
- 关联相关文章
- 智能推荐标签

**缓存查询示例**：
```javascript
// 查询相似文章的标签
const similarPosts = await findSimilarPosts(currentPost)
const cachedTags = similarPosts.flatMap(post => post.tags)
const recommendedTags = getMostFrequentTags(cachedTags)
```

---

### 四、缓存系统

#### 4.1 数据库结构

**标签缓存表**：
```sql
CREATE TABLE tag_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tag_name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  usage_count INTEGER DEFAULT 1,
  last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tag_name)
);
```

**关键词关联表**：
```sql
CREATE TABLE tag_keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tag_id INTEGER NOT NULL,
  keyword VARCHAR(100) NOT NULL,
  weight INTEGER DEFAULT 1,
  FOREIGN KEY (tag_id) REFERENCES tag_cache(id)
);
```

#### 4.2 缓存功能

**自动缓存**：
- AI生成的标签自动存储
- 规则生成的标签也会缓存
- 手动编辑的标签可以保存
- 跨文章复用标签

**智能推荐**：
```javascript
// 基于缓存推荐标签
const recommendations = await getTagRecommendations({
  limit: 10,
  minUsage: 2,
  categories: ['frontend', 'javascript']
})
```

**缓存更新**：
- 每次使用标签时增加计数
- 定期清理不常用的标签
- 更新关键词关联
- 维护标签关系图

#### 4.3 缓存管理

**查看缓存统计**：
```bash
# 查看标签使用统计
pnpm tag:stats

# 输出示例：
# 总标签数: 156
# 最常用标签:
#   javascript (32次)
#   react (28次)
#   typescript (24次)
#   tutorial (18次)
```

**清理缓存**：
```bash
# 清理未使用的标签
pnpm tag:cleanup --unused-days=30

# 重置整个缓存系统
pnpm tag:reset
```

---

### 五、使用场景

#### 5.1 新文章写作

**场景**：创建一篇新的技术文章

**工作流**：
```bash
1. 创建新文章
   touch content/posts/new-article.md

2. 编写内容
   # 使用喜欢的编辑器写作

3. 扫描生成标签
   pnpm scan

4. 检查生成的frontmatter
   ---
   title: "文章标题"
   date: 2026-04-03
   tags: [javascript, react, tutorial]
   categories: [前端开发]
   ---

5. 发布文章
   pnpm publish
```

#### 5.2 批量导入文章

**场景**：从其他平台导入大量文章

**工作流**：
```bash
1. 导入文章到 content/posts/

2. 批量生成标签
   pnpm scan --batch

3. 检查和调整
   # 查看生成结果
   # 手动调整不准确的标签

4. 保存到缓存
   # 确认后的标签会自动缓存
```

#### 5.3 标签维护

**场景**：优化文章标签系统

**工作流**：
```bash
1. 查看标签统计
   pnpm tag:stats

2. 发现问题标签
   # 如：标签不一致、拼写错误等

3. 批量替换标签
   pnpm tag:rename --old="js" --new="javascript"

4. 清理无用标签
   pnpm tag:cleanup --unused-days=90
```

---

### 六、最佳实践

#### 6.1 标签设计原则

**好的标签特点**：
- ✅ 简洁明了（1-3个词）
- ✅ 技术相关（描述技术栈）
- ✅ 一致性强（命名规范）
- ✅ 可复用性高（多篇文章共用）

**标签示例**：
```
✅ 好的标签：
- javascript
- react-hooks
- performance-optimization
- best-practices

❌ 不好的标签：
- js和react （太复杂）
- JavaScript （大小写不一致）
- 很好的文章 （无意义）
- 2023年4月3日 （不是技术标签）
```

#### 6.2 分类设计原则

**分类层级建议**：
```
一级分类（大类）：
- 前端开发
- 后端开发
- 移动开发
- 数据科学
- 人工智能
- 工具使用

二级分类（细分）：
前端开发/
  ├── React
  ├── Vue
  ├── Angular
  └── 构建工具
```

#### 6.3 AI使用技巧

**提高AI生成质量**：

1. **提供清晰的常用标签库**
   ```javascript
   // 具体的标签库比泛泛的更好
   commonTags: ['react', 'vue', 'angular', 'svelte']
   // 而不是
   commonTags: ['frontend', 'framework']
   ```

2. **保持标签库更新**
   ```javascript
   // 定期更新标签库以适应新技术
   commonTags: [
     'next.js',  // 新增
     'remix',    // 新增
     'astro'     // 新增
   ]
   ```

3. **合理的文章结构**
   ```markdown
   ---
   title: "清晰的文章标题"
   ---
   
   ## 概述
   简短的文章概述...
   
   ## 技术栈
   - React 18
   - TypeScript
   - Vite
   
   ## 详细内容
   ...
   ```
   有结构的文章更容易被AI准确分析

#### 6.4 缓存优化

**定期维护**：
```bash
# 每月执行一次
pnpm tag:cleanup --unused-days=30
pnpm tag:stats
```

**标签规范化**：
```bash
# 统一标签大小写
pnpm tag:normalize --case=lower

# 合并相似标签
pnpm tag:merge --source="js" --target="javascript"
```

---

### 七、故障排查

#### 7.1 常见问题

**Q: AI生成失败？**

**A**: 检查以下几点：
1. 确认 `ANTHROPIC_API_KEY` 环境变量已设置
2. 验证API Key是否有效
3. 检查网络连接
4. 查看API余额是否充足

**Q: 标签不准确？**

**A**: 尝试以下方法：
1. 完善常用标签库配置
2. 改进文章结构和标题
3. 手动调整标签（会自动缓存）
4. 使用强制模式重新生成

**Q: 缓存不生效？**

**A**: 解决方案：
1. 检查数据库文件权限
2. 确认数据库未损坏
3. 重建缓存：`pnpm tag:rebuild`

**Q: 生成速度慢？**

**A**: 优化建议：
1. AI生成需要时间，属正常现象
2. 可以使用规则模式加快速度
3. 启用缓存可以减少重复分析

#### 7.2 调试方法

**启用详细日志**：
```bash
# 启用调试模式
DEBUG=* pnpm scan

# 只看AutoTag相关日志
DEBUG=autotag:* pnpm scan
```

**查看AI请求内容**：
```javascript
// 在代码中添加日志
console.log('AI Prompt:', prompt)
console.log('AI Response:', response)
```

**测试API连接**：
```bash
# 测试Anthropic API连接
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

---

### 八、API参考

#### 8.1 核心函数

**generateFrontmatter**
```typescript
async function generateFrontmatter(
  markdown: string,
  filepath: string,
  options?: FrontmatterGeneratorOptions
): Promise<FrontmatterGenerationResult>

// 使用示例
const result = await generateFrontmatter(markdown, filepath, {
  useAI: true,
  apiKey: 'sk-ant-...',
  commonTags: ['react', 'typescript'],
  commonCategories: ['前端开发', 'React']
})
```

**getTagCacheManager**
```typescript
function getTagCacheManager(): TagCacheManager

// 使用示例
const manager = getTagCacheManager()
await manager.saveTag('react', 'frontend', ['jsx', 'components'])
const tags = await manager.getRecommendedTags(10)
```

#### 8.2 数据库操作

**TagCacheManager API**：
```typescript
class TagCacheManager {
  // 保存标签
  async saveTag(name: string, category?: string, keywords?: string[]): Promise<void>
  
  // 查询标签
  async getTag(name: string): Promise<Tag | null>
  
  // 获取推荐标签
  async getRecommendedTags(limit?: number, category?: string): Promise<string[]>
  
  // 更新使用计数
  async incrementUsage(tagName: string): Promise<void>
  
  // 清理未使用的标签
  async cleanupUnused(days: number): Promise<number>
  
  // 获取统计信息
  async getStatistics(): Promise<TagStatistics>
}
```

---

### 九、性能考虑

#### 9.1 性能指标

**AI生成性能**：
- 平均响应时间：2-5秒
- API调用限制：根据Anthropic账户等级
- 并发处理：支持批量处理（需注意API限制）

**规则生成性能**：
- 平均响应时间：< 1秒
- 无外部依赖
- 可无限并发

**缓存查询性能**：
- 平均查询时间：< 100ms
- 数据库大小：通常 < 10MB
- 索引优化：自动维护

#### 9.2 优化建议

**减少API调用**：
```bash
# 使用缓存减少重复调用
pnpm scan --use-cache

# 批量处理共享AI分析结果
pnpm scan --batch --shared-analysis
```

**异步处理**：
```javascript
// 异步生成标签，不阻塞主流程
generateFrontmatter(markdown, filepath)
  .then(result => {
    // 处理结果
  })
  .catch(error => {
    // fallback到规则模式
  })
```

---

### 十、未来规划

#### 10.1 计划功能

- 🔄 **更多AI模型支持**：GPT-4、Gemini等
- 📊 **标签可视化**：标签关系图、使用趋势
- 🎯 **智能推荐**：基于内容相似度的标签推荐
- 🔗 **跨平台同步**：与GitHub、GitLab等平台集成
- 🌐 **多语言支持**：支持多语言文章分析

#### 10.2 改进方向

- 提高AI生成准确度
- 优化缓存算法
- 支持自定义规则引擎
- 增强错误处理
- 提供更多配置选项

---

**文档版本**: v1.0
**最后更新**: 2026-04-03
**维护者**: PostWaver项目
