# PostWaver 平台链接管理指南

> **版本**: v1.0
> **更新日期**: 2026-04-03
> **功能**: 跨平台文章链接与相关推荐

---

## 🚀 快速开始

### 3分钟上手平台链接

**1. 基本概念**
```
平台链接 = 同一文章在不同平台的关联 + 相关文章推荐
```

**2. 自动生成**
```bash
# 扫描文章时自动生成平台链接
pnpm scan

# 发布时自动添加相关链接
pnpm post:publish post-123 --include-related-links
```

**3. 效果展示**
```markdown
---
**相关文章**：

- [PostWaver 入门教程](https://juejin.cn/post/7123456789)
- [TypeScript 最佳实践](https://blog.csdn.net/xxx/article/details/12345678)
- [React Hooks 详解](https://zhuanlan.zhihu.com/p/45678901)

**上一篇**：[如何选择前端框架](https://juejin.cn/post/7111111111)
**下一篇**：[Next.js 实战教程](https://juejin.cn/post/7133333333)
```

---

## 📖 完整指南

### 一、平台链接系统概述

PostWaver的平台链接系统提供智能的跨平台文章关联和推荐功能，帮助读者发现更多相关内容。

#### 1.1 核心功能

**跨平台链接**：
- 🔗 自动生成同一文章在不同平台的链接
- 📊 支持掘金、CSDN、知乎、微信等平台
- 🎯 智能匹配已发布的文章
- 💡 提供博客URL作为备用链接

**相关文章推荐**：
- 📚 基于标签和分类的智能推荐
- 🔍 自动查找相似文章
- 📈 支持自定义推荐算法
- ⚡ 高效的缓存查询

**导航链接**：
- ⬅️ 上一篇/下一篇导航
- 🏠 系列文章目录
- 📑 相关文章索引
- 🔄 双向链接支持

#### 1.2 系统架构

```
PostWaver 平台链接系统
├── 平台 ID 管理
│   ├── ID 存储与查询
│   ├── URL 生成
│   └── 状态跟踪
├── 链接生成器
│   ├── 跨平台链接
│   ├── 相关文章链接
│   └── 导航链接
└── 内容注入
    ├── Markdown 链接
    ├── HTML 链接
    └── 自定义格式
```

---

### 二、平台 ID 管理

#### 2.1 平台 ID 作用

**为什么需要平台 ID？**
- 不同平台为同一文章分配不同的文章 ID
- 需要记录这些 ID 以生成准确的跨平台链接
- 支持读者在不同平台间切换阅读

**平台 ID 格式**：
```javascript
{
  postId: "post-2026-04-03-how-to-use-postwaver",
  platformIds: {
    "juejin": {
      id: "7123456789",
      url: "https://juejin.cn/post/7123456789",
      publishedAt: "2026-04-03T10:00:00Z"
    },
    "csdn": {
      id: "12345678",
      url: "https://blog.csdn.net/xxx/article/details/12345678",
      publishedAt: "2026-04-03T11:00:00Z"
    },
    "zhihu": {
      id: "45678901",
      url: "https://zhuanlan.zhihu.com/p/45678901",
      publishedAt: "2026-04-03T12:00:00Z"
    }
  }
}
```

#### 2.2 管理平台 ID

**命令行管理**：
```bash
# 添加/更新平台 ID
pnpm platform:id:update post-123 --platform juejin --id 7123456789

# 批量导入
pnpm platform:id:import platform-ids.json

# 查看 ID 状态
pnpm platform:id:status post-123

# 删除平台 ID
pnpm platform:id:remove post-123 --platform juejin
```

**Web UI 管理**：
1. 打开文章详情页面
2. 找到"平台 ID 管理"部分
3. 点击"添加 ID"或"编辑"按钮
4. 填写平台 ID 和 URL
5. 保存更改

**批量导入格式**：
```json
{
  "posts": [
    {
      "postId": "post-123",
      "platformIds": {
        "juejin": {
          "id": "7123456789",
          "url": "https://juejin.cn/post/7123456789"
        },
        "csdn": {
          "id": "12345678",
          "url": "https://blog.csdn.net/xxx/article/details/12345678"
        }
      }
    }
  ]
}
```

#### 2.3 URL 生成规则

**各平台 URL 格式**：

| 平台 | URL 模板 | 示例 |
|------|----------|------|
| 掘金 | `https://juejin.cn/post/{id}` | `https://juejin.cn/post/7123456789` |
| CSDN | `https://blog.csdn.net/{user}/article/details/{id}` | `https://blog.csdn.net/xxx/article/details/12345678` |
| 知乎 | `https://zhuanlan.zhihu.com/p/{id}` | `https://zhuanlan.zhihu.com/p/45678901` |
| 微信 | 需要手动管理 | - |
| HTML | `{blogBaseUrl}/{postId}.html` | `https://blog.example.com/post-123.html` |

**备用 URL 系统**：
- 如果没有平台 ID，使用博客基础 URL
- 自动生成可访问的链接
- 支持自定义 URL 模板

---

### 三、相关文章链接

#### 3.1 智能推荐算法

**推荐因素**：
```javascript
推荐分数 = (
  标签匹配度 × 0.4 +
  分类相似度 × 0.3 +
  发布时间接近度 × 0.2 +
  关键词相关性 × 0.1
)
```

**匹配规则**：
1. **标签匹配**：共同标签越多，相关度越高
2. **分类相似**：同一分类的文章优先推荐
3. **时间接近**：发布时间相近的文章权重更高
4. **关键词匹配**：标题和内容关键词相似度

#### 3.2 配置相关链接

**启用相关链接**：
```bash
# 命令行启用
pnpm post:publish post-123 --include-related-links

# Web UI 启用
在发布工作台勾选"显示相关链接"选项
```

**自定义推荐数量**：
```javascript
// 在发布时指定推荐文章数量
const result = await transformForPlatform(markdown, {
  postId: 'post-123',
  relatedPosts: [...], // 相关文章列表
  maxRelatedLinks: 5    // 最多显示5个相关链接
})
```

**排除特定文章**：
```javascript
// 排除不想推荐的文章
const result = await transformForPlatform(markdown, {
  postId: 'post-123',
  excludePosts: ['post-456', 'post-789'], // 排除这些文章
  includeRelatedLinks: true
})
```

#### 3.3 手动指定相关文章

**在 frontmatter 中指定**：
```yaml
---
title: "PostWaver 使用教程"
related_posts:
  - post-id-1
  - post-id-2
  - post-id-3
---
```

**通过 API 指定**：
```javascript
const relatedPosts = await getRelatedPosts('post-123', {
  manual: ['post-456', 'post-789'], // 手动指定
  auto: true,                       // 自动补充
  limit: 5                          // 总数限制
})
```

---

### 四、导航链接

#### 4.1 上一篇/下一篇

**自动导航**：
```markdown
**上一篇**：[如何选择前端框架](https://juejin.cn/post/7111111111)
**下一篇**：[Next.js 实战教程](https://juejin.cn/post/7133333333)
```

**基于时间顺序**：
- 上一篇：发布时间较早的相邻文章
- 下一篇：发布时间较晚的相邻文章

**基于系列文章**：
```yaml
---
title: "PostWaver 教程（三）"
series: "PostWaver 入门系列"
series_order: 3
---
```

#### 4.2 系列文章链接

**系列文章配置**：
```yaml
---
title: "PostWaver 快速开始"
series:
  name: "PostWaver 入门系列"
  order: 1
  posts:
    - post-id-1
    - post-id-2
    - post-id-3
---
```

**生成的系列导航**：
```markdown
**PostWaver 入门系列**：

1. [PostWaver 快速开始](link1)
2. [安装与配置](link2)
3. **发布到多平台** (当前文章)
4. [高级功能](link4)
```

---

### 五、链接格式定制

#### 5.1 Markdown 格式

**默认格式**：
```markdown
---
**相关文章**：

- [文章标题1](platform-url-1)
- [文章标题2](platform-url-2)
- [文章标题3](platform-url-3)
---
```

**自定义模板**：
```javascript
const customTemplate = `
## 推荐阅读

1. [{{title}}]({{url}})
2. [{{title}}]({{url}})
3. [{{title}}]({{url}})
`;

const result = await transformForPlatform(markdown, {
  linkTemplate: customTemplate,
  includeRelatedLinks: true
});
```

#### 5.2 HTML 格式

**微信公众号格式**：
```html
<div style="margin-top: 2em; padding-top: 1em; border-top: 1px solid #eee;">
  <p style="font-weight: bold; margin-bottom: 0.5em;">相关阅读</p>
  <ul style="list-style: none; padding: 0;">
    <li style="margin: 0.5em 0;">
      <a href="{{url}}" style="color: #1890ff;">{{title}}</a>
    </li>
  </ul>
</div>
```

#### 5.3 平台特定格式

**掘金格式**：
```markdown
> 延伸阅读：
> - [文章1](url1)
> - [文章2](url2)
```

**知乎格式**：
```markdown
---
**相关阅读**：

- [文章1](url1) - 简短描述
- [文章2](url2) - 简短描述
---
```

---

### 六、使用场景

#### 6.1 发布流程集成

**完整发布流程**：
```
1. 写作文章
   └─ 创建 Markdown 文件

2. 扫描内容
   └─ pnpm scan
   └─ 自动分析标签和分类

3. 发布到平台
   └─ 发布到掘金 → 获取文章 ID
   └─ 发布到 CSDN → 获取文章 ID
   └─ 发布到知乎 → 获取文章 ID

4. 记录平台 ID
   └─ pnpm platform:id:update post-123 --platform juejin --id 7123456789
   └─ pnpm platform:id:update post-123 --platform csdn --id 12345678

5. 重新生成链接
   └─ 跨平台链接自动生成
   └─ 相关文章自动推荐

6. 后续文章
   └─ 自动包含当前文章的链接
```

#### 6.2 内容矩阵策略

**多平台内容矩阵**：
```
主博客 (Blog)
    ├── 掘金 (技术社区)
    ├── CSDN (开发者社区)
    ├── 知乎 (知识分享)
    └── 微信 (深度文章)
```

**链接策略**：
- 主博客 ←→ 所有平台
- 平台之间互相关联
- 相关文章互相推荐
- 系列文章按序链接

#### 6.3 SEO 优化

**内链建设**：
- 同一文章的跨平台链接
- 相关文章互相推荐
- 系列文章完整索引
- 首页归档页面

**外链建设**：
- 各平台互相引流
- 提高文章曝光度
- 增加域名权重
- 改善搜索排名

---

### 七、最佳实践

#### 7.1 链接设计原则

**用户体验优先**：
- ✅ 链接数量适中（3-5个）
- ✅ 相关性高（真正推荐值得看的文章）
- ✅ 链接有效（定期检查链接可用性）
- ✅ 描述准确（链接文本清楚表明内容）

**避免过度推荐**：
- ❌ 不相关文章
- ❌ 过多链接（超过10个）
- ❌ 重复链接
- ❌ 过期链接

#### 7.2 维护策略

**定期检查**：
```bash
# 检查链接有效性
pnpm verify:related-links

# 查看链接统计
pnpm link:stats

# 清理无效链接
pnpm link:cleanup
```

**更新策略**：
- 新文章发布时更新相关链接
- 定期检查平台 ID 有效性
- 移除已删除或失效的文章
- 保持推荐文章的新鲜度

#### 7.3 性能优化

**缓存策略**：
```javascript
// 缓存相关文章查询结果
const cacheKey = `related:${postId}`;
const cached = await cache.get(cacheKey);

if (cached) {
  return cached;
}

const result = await computeRelatedPosts(postId);
await cache.set(cacheKey, result, { ttl: 3600 });
```

**异步生成**：
- 文章发布时异步生成链接
- 不阻塞主要发布流程
- 后台更新相关链接

---

### 八、高级功能

#### 8.1 智能推荐算法

**机器学习增强**：
```javascript
// 基于用户行为的推荐
const recommendations = await getPersonalizedRecs({
  userId: 'user-123',
  postId: 'post-456',
  algorithm: 'collaborative-filtering'
});
```

**A/B 测试**：
```javascript
// 测试不同推荐策略
const strategy = Math.random() > 0.5 ? 'tag-based' : 'category-based';
const links = await getRelatedPosts(postId, { strategy });
```

#### 8.2 跨平台同步

**实时同步**：
```javascript
// 一篇文章发布后，自动更新所有平台的相关链接
await syncRelatedLinks(postId, {
  platforms: ['juejin', 'csdn', 'zhihu'],
  realtime: true
});
```

**批量更新**：
```bash
# 批量更新所有文章的相关链接
pnpm link:update-all

# 更新特定平台的链接
pnpm link:update-platform --platform=juejin
```

#### 8.3 分析与报告

**链接点击分析**：
```javascript
// 跟踪链接点击情况
const analytics = await getLinkAnalytics({
  postId: 'post-123',
  period: '30d',
  metrics: ['clicks', 'ctr', 'conversions']
});
```

**推荐效果报告**：
```bash
# 生成推荐效果报告
pnpm link:report --period=30d --format=html
```

---

### 九、故障排查

#### 9.1 常见问题

**Q: 平台链接不显示？**

**A**: 检查：
1. 是否正确设置了平台 ID
2. 是否启用了相关链接功能
3. 平台 URL 格式是否正确
4. 文章是否正确发布

**Q: 相关文章不准确？**

**A**: 优化方法：
1. 完善文章标签和分类
2. 调整推荐算法权重
3. 手动指定相关文章
4. 使用更精准的关键词

**Q: 链接点击率低？**

**A**: 改进建议：
1. 提高文章质量
2. 优化链接位置
3. 改进链接文案
4. 确保相关性强

#### 9.2 调试工具

**查看链接生成过程**：
```bash
# 启用详细日志
DEBUG=platform-link:* pnpm post:publish post-123
```

**测试链接生成**：
```bash
# 测试特定文章的链接生成
pnpm link:test post-123

# 预览生成的链接
pnpm link:preview post-123 --format=markdown
```

---

### 十、API 参考

#### 10.1 核心函数

**generatePlatformLinks**
```typescript
async function generatePlatformLinks(
  postId: string,
  relatedPosts: IndexedPost[],
  options?: PlatformLinkOptions
): Promise<PlatformLink[]>

// 使用示例
const links = await generatePlatformLinks('post-123', relatedPosts, {
  platform: 'juejin',
  blogBaseUrl: 'https://blog.example.com',
  includeRelatedLinks: true,
  maxLinks: 5
});
```

**formatLinksAsMarkdown**
```typescript
function formatLinksAsMarkdown(
  links: PlatformLink[],
  platform: string
): string

// 使用示例
const markdown = formatLinksAsMarkdown(links, 'juejin');
```

#### 10.2 配置选项

```typescript
interface PlatformLinkOptions {
  /** 目标平台 */
  platform: 'juejin' | 'csdn' | 'zhihu' | 'wechat' | 'html';
  
  /** 博客基础 URL */
  blogBaseUrl?: string;
  
  /** 是否包含相关链接 */
  includeRelatedLinks?: boolean;
  
  /** 最大链接数量 */
  maxLinks?: number;
  
  /** 自定义链接模板 */
  linkTemplate?: string;
  
  /** 排除的文章 ID */
  excludePosts?: string[];
}
```

---

**文档版本**: v1.0
**最后更新**: 2026-04-03
**维护者**: PostWaver项目
