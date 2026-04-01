# 内容目录

这是你的内容存放区域。在这里创建和编辑你的博客文章。

**⚠️ 重要：** `.gitignore` 已配置，你在此目录创建的文件**不会**被提交到 Git 仓库。

---

## 📝 如何使用

### 创建新文章

1. 在适当的分类目录下创建 Markdown 文件：
   ```bash
   # 技术类文章
   mkdir -p posts/tech
   vim posts/tech/my-article.md

   # 生活类文章
   mkdir -p posts/life
   vim posts/life/daily-log.md
   ```

2. 文件必须包含 Frontmatter：
   ```yaml
   ---
   title: 文章标题
   date: 2026-04-02T00:00:00Z
   tags: ['tag1', 'tag2']
   categories: ['分类']
   ---

   # 文章标题

   文章正文...
   ```

### 文件命名规范

- 使用小写字母和连字符：`my-article.md`
- 避免空格和特殊字符
- 文件名将作为文章 ID

---

## 📂 目录结构

```
content/
├── .gitignore              # 忽略用户文章
├── README.md               # 本文件
├── assets/                 # 资源文件
│   └── images/            # 图片资源
│       ├── .gitkeep       # 目录标记
│       └── example-image.md  # 使用示例
└── posts/                  # 博客文章
    ├── example-post.md     # 示例文章（保留在仓库）
    ├── tech/              # 技术文章（你创建的，不提交）
    ├── life/              # 生活随笔（你创建的，不提交）
    └── notes/             # 学习笔记（你创建的，不提交）
```

---

## ✅ 质量检查

创建文章后，运行质量检查：

```bash
# Markdown Lint
pnpm lint:md posts/tech/my-article.md

# Frontmatter 校验
npx remark posts/tech/my-article.md

# 扫描到索引
pnpm scan
```

---

## 🖼️ 图片和资源

### 在文章中使用图片

```markdown
# 方式 1：使用本地 assets 目录
![示例图片](/assets/images/screenshot.png)

# 方式 2：使用外部图床（推荐）
![示例图片](https://your-cdn.com/image.png)

# 方式 3：使用占位图服务
![示例图片](https://via.placeholder.com/800x400)
```

### 图片存放建议

- **小图标** → `assets/images/`
- **截图/大图** → 使用图床或 CDN
- **示例图片** → 使用占位图服务

### 创建资源目录

```bash
# 图片
mkdir -p assets/images/{screenshots,photos,diagrams}

# 视频
mkdir -p assets/videos

# 其他文件
mkdir -p assets/files
```

**注意：** 大文件会被 `.gitignore` 忽略，建议使用外部图床。

---

## 🔒 隐私说明

- ✅ 你的文章**不会**被提交到公开仓库
- ✅ 大文件（图片、视频）会被忽略
- ✅ `.gitignore` 配置保护隐私
- ✅ 可以安心在此写作私密内容

如需版本控制你的文章，可以：
1. 使用私有仓库
2. 或者单独管理内容目录

---

## 📚 相关文档

- [Frontmatter 规范](../packages/core/src/types.ts)
- [测试文档](../docs/TESTING.md)
- [目录结构](../docs/DIRECTORY_STRUCTURE.md)

---

**Happy Writing!** ✍️
