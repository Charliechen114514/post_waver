# Frontmatter 注入方式对比

本文档对比了 PostWaver 中 Frontmatter 注入的不同方式，帮助你选择最适合的使用场景。

---

## 📊 方式对比

| 方式 | 命令 | 注入时机 | 文件修改 | 适用场景 |
|------|------|---------|---------|---------|
| **开发环境** | `pnpm dev` | 每次启动 | ✅ 写入 | 日常开发 |
| **手动注入** | `pnpm scan --inject` | 按需执行 | ✅ 写入 | 批量处理 |
| **内存生成** | `pnpm scan` | 扫描时 | ❌ 不写入 | 数据库索引 |

---

## 🔍 详细说明

### 1. 开发环境自动注入（推荐）

**命令**：`pnpm dev`

**工作流程**：
```
启动 → 扫描 → 注入 Frontmatter → 注入链接 → 启动服务器
```

**特点**：
- ✅ **全自动**：无需手动操作
- ✅ **智能检测**：只补充缺失字段
- ✅ **最小化写入**：只在有修改时保存
- ✅ **实时反馈**：清晰的日志输出
- ✅ **完整环境**：同时启动 Web UI

**适用场景**：
- 日常开发写作
- 新建文章后自动补全
- 持续维护文章元数据

**示例输出**：
```
📚 开始扫描内容...

[Parser] 📝 my-new-post.md 的 Frontmatter 不完整，开始自动生成...
[Parser] ✅ 自动生成完成，添加字段: title, date, tags, categories
    title: 我的新文章
    tags: javascript, tutorial
    categories: tech
[Parser] 💾 已更新文件: /path/to/my-new-post.md

✅ 扫描完成: 找到 5 篇文章
   - 💾 已自动注入 Frontmatter 到新文章
```

---

### 2. 手动注入模式

**命令**：`pnpm scan --inject`

**工作流程**：
```
执行 → 扫描 → 智能注入 → 完成
```

**特点**：
- ✅ **按需执行**：想注入时才运行
- ✅ **选择性处理**：可指定目录
- ✅ **预演支持**：`--dry-run` 预览
- ✅ **灵活控制**：不启动服务器

**适用场景**：
- 批量处理现有文章
- 一次性补全所有缺失的 frontmatter
- 不想启动完整开发环境

**高级用法**：
```bash
# 只处理特定目录
pnpm scan --dir content/posts/tech --inject

# 预演模式（不实际写入）
pnpm scan --inject --dry-run

# 不更新数据库索引
pnpm scan --inject --no-update-index
```

---

### 3. 内存生成模式

**命令**：`pnpm scan`

**工作流程**：
```
扫描 → 内存生成 → 更新数据库索引 → 完成
```

**特点**：
- ✅ **只读操作**：不修改任何文件
- ✅ **快速扫描**：用于数据库索引
- ✅ **安全模式**：完全不会改变文件

**适用场景**：
- 仅需更新数据库索引
- 不想修改文件
- 快速预览扫描结果

**注意**：
- ⚠️ 生成的 frontmatter 只在内存中
- ⚠️ 文件本身不会被修改
- ⚠️ 下次扫描仍会重新生成

---

## 💡 选择建议

### 日常开发（推荐）

```bash
pnpm dev
```

**理由**：
- 全自动，无需记忆额外命令
- 每次启动都确保 frontmatter 完整
- 同时获得 Web UI 界面

### 批量处理旧文章

```bash
# 先预览
pnpm scan --inject --dry-run

# 确认无误后执行
pnpm scan --inject
```

**理由**：
- 可以预览将要做的修改
- 确认无误后再批量处理
- 不启动开发服务器

### 只更新索引

```bash
pnpm scan
```

**理由**：
- 快速更新数据库
- 不修改任何文件
- 用于索引和查询

---

## 🔄 工作流示例

### 典型的开发工作流

```bash
# 1. 创建新文章（无需写 frontmatter）
cat > content/posts/new-post.md << 'EOF'
# 我的新文章

这是一篇新文章...
EOF

# 2. 启动开发环境（自动注入）
pnpm dev

# 输出：
# 📚 开始扫描内容...
# [Parser] 📝 new-post.md 的 Frontmatter 不完整，开始自动生成...
# [Parser] ✅ 自动生成完成，添加字段: title, date, tags...
# [Parser] 💾 已更新文件: content/posts/new-post.md
# ✅ 扫描完成

# 3. 文件已自动更新，包含完整的 frontmatter
cat content/posts/new-post.md
# ---
# title: 我的新文章
# date: '2026-04-03T...'

# 4. 在浏览器中访问 Web UI
# http://localhost:5173
```

### 批量处理工作流

```bash
# 1. 检查有多少文章需要注入
pnpm scan --inject --dry-run | grep "添加字段"

# 2. 确认后批量注入
pnpm scan --inject

# 3. 验证结果
pnpm scan --output table
```

---

## ⚠️ 注意事项

### 开发环境模式

- ✅ 适合日常开发
- ✅ 每次启动都会扫描并注入
- ⚠️ 如果文章很多，启动会稍慢
- 💡 可以通过 Ctrl+C 中断

### 手动注入模式

- ✅ 灵活控制
- ✅ 支持预演
- ⚠️ 需要手动执行
- 💡 适合批量操作

### 内存生成模式

- ✅ 最快速度
- ✅ 完全安全
- ⚠️ 不会持久化
- 💡 适合仅索引场景

---

## 📚 相关文档

- [Frontmatter 自动生成](FRONTMATTER_AUTO_GENERATION.md)
- [快速开始](QUICK_START.md)
- [CLI 命令参考](CLI_REFERENCE.md)

---

**更新日期**: 2026-04-03
**版本**: v1.0
