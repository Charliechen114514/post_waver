# PostWaver 用户手册

> **版本**: v3.0  
> **更新日期**: 2026-04-02  
> **适用对象**: 所有用户

---

## 📚 目录

### 第一部分：基础使用
- [安装与配置](#安装与配置)
- [创建文章](#创建文章)
- [Frontmatter 规范](#frontmatter-规范)
- [图片管理](#图片管理)

### 第二部分：发布流程
- [工作流管理](#工作流管理)
- [预览与确认](#预览与确认)
- [生成发布内容](#生成发布内容)
- [平台发布](#平台发布)

### 第三部分：高级功能
- [Hexo 博客集成](#hexo-博客集成)
- [相关文章链接](#相关文章链接)
- [标题内容注入](#标题内容注入)
- [平台 ID 管理](#平台-id-管理)

### 第四部分：故障排查
- [常见问题](#常见问题)
- [错误处理](#错误处理)
- [获取帮助](#获取帮助)

---

## 第一部分：基础使用

### 安装与配置

#### 前置要求

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Git**（可选，用于版本控制）

#### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/Charliechen114514/post_waver.git
cd post_waver

# 2. 安装依赖
pnpm install

# 3. 构建项目
pnpm build

# 4. 初始化数据库
pnpm db:init
pnpm db:migrate
```

#### Hexo 博客配置（可选）

PostWaver 支持同步到 Hexo 博客。`blog/` 目录不会被 Git 跟踪。

```bash
# 方式 1：使用现有 Hexo 博客（推荐）
ln -s /path/to/your/hexo/blog ./blog

# 方式 2：初始化新博客
pnpm add -g hexo-cli
hexo init blog
cd blog && pnpm install
```

---

### 创建文章

#### 文章位置

```
content/
├── posts/          # 博客文章
│   ├── tech/       # 技术文章
│   ├── life/       # 生活随笔
│   └── notes/      # 学习笔记
└── assets/         # 资源文件
    └── images/     # 图片资源
```

#### 创建文章

```bash
# 创建文章目录
mkdir -p content/posts/tech

# 创建文章
cat > content/posts/my-article.md << 'EOF'
---
title: 文章标题
date: 2026-04-02T10:00:00Z
tags: ['tag1', 'tag2']
categories: ['分类']
description: 文章描述（可选）
---

# 文章标题

文章正文内容...
EOF
```

---

### Frontmatter 规范

#### 必需字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `title` | string | 文章标题 | `title: 我的第一篇文章` |
| `date` | string | 发布日期（ISO8601） | `date: 2026-04-02T10:00:00Z` |
| `tags` | array | 标签数组 | `tags: ['tutorial', 'beginner']` |
| `categories` | array | 分类数组 | `categories: ['tech']` |

#### 可选字段

| 字段 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `description` | string | 文章描述 | - |
| `draft` | boolean | 是否为草稿 | `false` |

#### Frontmatter 示例

```yaml
---
title: 使用 PostWaver 发布第一篇文章
date: 2026-04-02T10:00:00Z
tags: ['tutorial', 'postwaver']
categories: ['tech']
description: 学习如何使用 PostWaver 进行多平台发布
draft: false
---

# 文章标题

文章正文...
```

---

### 图片管理

#### 图片存放位置

```
content/assets/images/
├── screenshots/  # 截图
├── photos/       # 照片
└── diagrams/     # 图表
```

#### 图片引用方式

```markdown
<!-- 方式 1：本地 assets -->
![示例图片](/assets/images/screenshot.png)

<!-- 方式 2：外部图床（推荐） -->
![示例图片](https://your-cdn.com/image.png)

<!-- 方式 3：占位图服务 -->
![示例图片](https://via.placeholder.com/800x400)
```

#### 微信公众号图片上传

```bash
# 1. 配置微信 API
pnpm image:config set wechat <appId> <appSecret>

# 2. 上传并替换图片链接
pnpm image:upload:replace <postId> --backup

# 3. 验证替换结果
grep "mmbiz.qpic.cn" content/posts/<postId>.md
```

---

## 第二部分：发布流程

### 工作流管理

#### 工作流状态

```
draft → previewing → publishing → published
  ↓         ↓            ↓           ↓
草稿     预览中      发布中       已发布
```

#### 扫描工作流

```bash
# 扫描并初始化工作流
pnpm workflow:scan

# 输出示例：
# ✅ 发现 1 篇新文章
# ID: my-article
# 状态: draft
```

#### 处理文章

```bash
# 标准处理（带预览确认）
pnpm workflow:process <postId>

# 快速处理（跳过预览）
pnpm workflow:process <postId> --fast

# 批量处理所有文章
pnpm workflow:process-all
```

#### 查看状态

```bash
# 查看工作流状态
pnpm workflow:status

# 查看工作流历史
pnpm workflow:history
```

#### 回滚状态

```bash
# 回滚特定文章
pnpm workflow:rollback <postId>

# 重置所有状态
pnpm workflow:reset-all
```

---

### 预览与确认

#### 启动预览

```bash
# 仅预览，不发布
pnpm post:publish:preview-only <postId>
```

#### 预览内容

预览页面会显示：
- **掘金格式** - 标准 Markdown，代码高亮
- **微信公众号格式** - HTML + 内联 CSS
- **HTML 格式** - 静态 HTML 文件
- **分屏对比** - 并排显示不同格式

#### 确认发布

预览确认后，系统会：
1. 生成发布页面
2. 自动打开浏览器
3. 提供复制按钮

---

### 生成发布内容

#### 发布页面位置

```
output/
└── {hashId}/                    # 基于文章 hash 的唯一目录
    ├── index.html               # 主预览页面
    ├── {postId}-juejin.txt      # 掘金平台内容
    ├── {postId}-wechat.txt      # 微信公众号内容
    └── {postId}.html            # HTML 通用格式
```

#### 仅生成发布数据

```bash
# 不启动预览服务器，仅生成
pnpm post:publish:generate <postId>
```

---

### 平台发布

#### 掘金平台

1. **生成发布内容**
   ```bash
   pnpm workflow:process <postId>
   ```

2. **复制内容**
   - 在预览页面点击"复制掘金内容"
   - 或复制 `output/{hashId}/{postId}-juejin.txt`

3. **发布到掘金**
   - 访问 [掘金写作平台](https://juejin.cn/editor/drafts/new)
   - 粘贴内容
   - 检查格式
   - 发布

#### 微信公众号

1. **生成发布内容**
   ```bash
   pnpm workflow:process <postId>
   ```

2. **复制内容**
   - 点击"复制微信内容"
   - 或复制 `output/{hashId}/{postId}-wechat.txt`

3. **发布到公众号**
   - 登录 [微信公众平台](https://mp.weixin.qq.com)
   - 新建图文
   - 粘贴内容
   - 调整样式
   - 发布

#### HTML 导出

1. **生成 HTML**
   ```bash
   pnpm transform:html <postId>
   ```

2. **使用 HTML 文件**
   - 可以直接在浏览器中打开
   - 可以部署到静态网站
   - 可以嵌入到其他系统中

---

## 第三部分：高级功能

### Hexo 博客集成

#### 配置 Hexo 博客

```bash
# 创建符号链接（推荐）
ln -s /path/to/your/hexo/blog ./blog

# 或使用配置文件
pnpm hexo:config
```

#### 同步内容

```bash
# 同步所有已发布的文章
pnpm hexo:sync

# 查看同步状态
pnpm hexo:status
```

#### 预览和部署

```bash
# 本地预览
pnpm hexo:preview

# 生成静态文件并部署
pnpm hexo:deploy
```

#### Git 集成

```bash
# 同步内容
pnpm hexo:sync

# 提交并推送
pnpm sync:blog
```

---

### 相关文章链接

PostWaver 会自动在文章末尾添加相关文章链接。

#### 生成规则

- **相邻文章**：基于发布日期计算上/下篇
- **推荐阅读**：基于标签和内容相似度

#### 示例输出

```markdown
---

## 相关阅读

**相邻文章**：

- [上一篇: 之前的文章](/2026/04/01/previous-post/)
- [下一篇: 之后的文章](/2026/04/03/next-post/)

**推荐阅读**：

1. [相关文章 1](/2026/03/15/related-1/) - 相似度 85%
2. [相关文章 2](/2026/03/20/related-2/) - 相似度 78%
```

---

### 标题内容注入

PostWaver 支持在文章标题后自动注入自定义内容。

#### 配置标题注入

```bash
# 1. 查看当前配置
pnpm title:injector:show

# 2. 设置平台级别注入规则
pnpm title:injector:set --platform juejin --content "🔥 欢迎订阅我的专栏" --enabled true

# 3. 设置全局注入（所有平台）
pnpm title:injector:set --platform global --content "本文首发于个人博客" --enabled true

# 4. 为特定文章设置覆盖
pnpm title:injector:set --post my-article --content "这是一篇特别文章"
```

#### 测试注入效果

```bash
# 测试特定文章的注入效果
pnpm title:injector:test --post my-article --platform juejin
```

---

### 平台 ID 管理

追踪每篇文章在各个平台的发布 ID 和 URL。

#### 查看平台 ID

```bash
# 列出文章的所有平台 ID
pnpm platform:id:list <postId>

# 输出示例：
# 掘金: https://juejin.cn/post/7123456789
# 微信: https://mp.weixin.qq.com/s/xxxxx
# HTML: https://example.com/posts/my-article.html
```

#### 更新平台 ID

```bash
# 更新平台 ID
pnpm platform:id:update

# 按照提示输入：
# - 文章 ID
# - 平台名称
# - 发布 URL
```

---

## 第四部分：故障排查

### 常见问题

#### Q1: 扫描失败

**问题**: `pnpm scan` 报错

**解决方案**:
```bash
# 1. 检查目录结构
ls -la content/posts/

# 2. 验证 Frontmatter 格式
npx remark content/posts/*.md

# 3. 重新构建
pnpm build

# 4. 重新扫描
pnpm scan
```

#### Q2: 发布失败

**问题**: `pnpm workflow:process` 报错

**解决方案**:
```bash
# 1. 检查文章是否存在
ls content/posts/<postId>.md

# 2. 查看工作流状态
pnpm workflow:status

# 3. 清理输出目录
rm -rf output/

# 4. 重新发布
pnpm workflow:process <postId>
```

#### Q3: 微信图片上传失败

**问题**: 图片上传到微信失败

**解决方案**:
```bash
# 1. 验证配置
pnpm image:config validate wechat

# 2. 检查图片格式和大小
file content/assets/images/*.png
ls -lh content/assets/images/

# 3. 转换图片格式（如果需要）
convert image.png image.jpg

# 4. 重新上传
pnpm image:upload:replace <postId>
```

---

### 错误处理

#### 数据库错误

```bash
# 错误: Database is not initialized

# 解决方案：
rm -f packages/database/prisma/dev.db
pnpm db:init
pnpm db:migrate
```

#### 构建错误

```bash
# 错误: Cannot find module

# 解决方案：
pnpm install
pnpm build
```

---

### 获取帮助

#### 文档资源

- **[快速开始](QUICK_START.md)** - 5 分钟上手
- **[平台指南](guides/)** - 详细发布教程
- **[CLI 参考](CLI_REFERENCE.md)** - 完整命令说明

#### 社区支持

- **[GitHub Issues](https://github.com/Charliechen114514/post_waver/issues)** - 问题反馈
- **[GitHub Discussions](https://github.com/Charliechen114514/post_waver/discussions)** - 讨论交流

---

**需要更多帮助？** 查看 [故障排查指南](TROUBLESHOOTING.md) 或提交 Issue
