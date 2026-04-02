# PostWaver 全面测试手册

## 📋 测试概述

本手册提供完整的 PostWaver 系统测试流程，用于验证所有核心功能。建议在清空环境后进行全面的端到端测试。

**测试目标**:
- ✅ 验证完整工作流（扫描→预览→发布→同步）
- ✅ 测试所有平台转换器（掘金、微信、HTML）
- ✅ 验证数据库功能
- ✅ 测试 Web UI 功能
- ✅ 验证 Hexo 集成

---

## 🔧 环境准备

### 步骤 1: 清空环境

**⚠️ 重要**: 此操作将删除所有内容和数据库，请确保已备份重要数据！

```bash
# 1. 停止所有运行的服务
# 按 Ctrl+C 停止 pnpm dev 和 pnpm dev:api

# 2. 清空内容目录（保留目录结构）
rm -rf content/posts/*
rm -rf content/done/*

# 3. 清空数据库
rm -f packages/database/prisma/dev.db
rm -f packages/database/prisma/dev.db-journal

# 4. 清空索引文件
rm -f content-index.json

# 5. 清空平台 ID 映射
rm -f .post-waver/platform-ids.json

# 6. 清空输出目录
rm -rf output/*

# 7. 设置环境变量（如果 .env 文件不存在）
if [ ! -f .env ]; then
  cat > .env << 'ENVEOF'
# Database
DATABASE_URL="file:/home/Charliechen/post_waver/packages/database/prisma/dev.db"
ENVEOF
  echo "✅ .env 文件已创建"
fi

# 8. 验证环境已清空（在重新初始化之前）
echo "🔍 验证环境已清空"
if [ ! -f packages/database/prisma/dev.db ]; then
  echo "✅ 数据库已删除"
else
  echo "❌ 数据库仍然存在，请检查"
  exit 1
fi
ls -la content/posts/
echo ""

# 9. 重新初始化数据库
echo "🔧 重新初始化数据库"
pnpm db:init
pnpm db:migrate --name init

# 10. 验证数据库已创建
echo ""
echo "✅ 环境准备完成"
if [ -f packages/database/prisma/dev.db ]; then
  echo "✅ 数据库已创建"
  ls -lh packages/database/prisma/dev.db
else
  echo "❌ 数据库创建失败"
  exit 1
fi
```

### 步骤 2: 创建测试数据

```bash
# 创建测试文章 1：完整文章（带图片）
cat > content/posts/test-complete.md << 'EOF'
---
title: PostWaver 完整测试文章
date: 2026-04-02T10:00:00Z
tags: ['test', 'postwaver']
categories: ['技术']
description: 这是一篇用于全面测试 PostWaver 功能的文章
---

# PostWaver 完整测试

本文用于测试 PostWaver 的所有核心功能。

## 功能测试清单

- [x] Markdown 解析
- [x] Frontmatter 提取
- [x] 图片处理
- [x] 代码高亮
- [x] 多平台转换

## 代码示例

```typescript
function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet("PostWaver"));
```

## 图片测试

以下是本地图片测试：

![测试图片](assets/test-image.png)

## 总结

这是一篇完整的测试文章，涵盖了所有关键功能。
EOF

# 创建测试文章 2：草稿文章
cat > content/posts/test-draft.md << 'EOF'
---
title: 草稿文章测试
date: 2026-04-02T11:00:00Z
tags: ['draft']
draft: true
---

# 草稿文章

这是一篇草稿文章，用于测试草稿功能。
EOF

# 创建测试文章 3：多平台发布
cat > content/posts/test-platforms.md << 'EOF'
---
title: 多平台发布测试
date: 2026-04-02T12:00:00Z
tags: ['platforms', 'test']
categories: ['测试']
---

# 多平台发布测试

本文将测试发布到不同平台的功能。

## 测试内容

1. 掘金平台
2. 微信公众号
3. HTML 格式

## 表格测试

| 平台 | 状态 | 备注 |
|------|------|------|
| 掘金 | ✅ | 自动发布 |
| 微信 | ✅ | 半自动发布 |
| HTML | ✅ | 静态页面 |
EOF

# 创建测试图片目录
mkdir -p content/posts/assets
cp /dev/null content/posts/assets/test-image.png  # 创建空文件占位

echo "✅ 测试数据创建完成"
```

---

## 🧪 阶段 1: 基础功能测试

### 测试 1.1: 内容扫描

```bash
# 扫描所有文章（默认包含草稿）
pnpm scan

# 预期输出：
# ✓ 扫描 content/posts/
# ✓ 发现 3 篇文章（含草稿）
# ✓ test-complete, test-draft, test-platforms

# 如果只想扫描非草稿文章
pnpm scan --exclude-drafts

# 预期输出：
# ✓ 发现 2 篇文章（不含草稿）
# ✓ test-complete, test-platforms

# 验证索引文件
cat content-index.json | jq '.metadata'
# 预期（默认含草稿）：totalPosts: 3, draftCount: 1
# 预期（不含草稿）：totalPosts: 2, draftCount: 0
```

**注意**: `pnpm scan` **默认包含所有文章**（包括草稿）。如需排除草稿，使用 `pnpm scan --exclude-drafts`。

**验证清单**:
- [ ] 扫描成功，无错误
- [ ] 索引文件生成
- [ ] 所有文章都被扫描（含草稿）
- [ ] 所有标签被索引

### 测试 1.2: 数据库功能

```bash
# 查看数据库状态
pnpm workflow:status

# 预期输出（扫描所有文章）：
# Workflow Status:
# - Pending: 3 posts
# - Processing: 0 posts
# - Completed: 0 posts

# 进入工作流
pnpm workflow:scan

# 查看状态（应该看到所有 3 篇文章）
pnpm workflow:status

# 工作流会处理所有文章，包括草稿
```

**验证清单**:
- [ ] 数据库连接正常
- [ ] 文章记录已创建
- [ ] 状态管理正常

---

## 🎨 阶段 2: 工作流测试

### 测试 2.1: 启动 Web UI

```bash
# 终端 1: 启动 Web UI
pnpm dev:web

# 终端 2: 启动 API 服务器
pnpm dev:api

# 浏览器访问: http://localhost:5173/post_waver/
```

**验证清单**:
- [ ] Web UI 正常加载
- [ ] 文章列表显示
- [ ] 可以查看文章详情
- [ ] 草稿文章标记正确

### 测试 2.2: 工作流处理

```bash
# 处理第一篇文章
pnpm workflow:process test-complete

# 预期输出：
# ✓ Processing test-complete
# ✓ Generated previews
# ✓ Status updated to 'completed'

# 检查状态
pnpm workflow:status
```

**验证清单**:
- [ ] 工作流处理成功
- [ ] 预览文件生成
- [ ] 状态更新为 completed
- [ ] 操作日志记录

---

## 🚀 阶段 3: 发布测试

### 测试 3.1: 生成交互式发布页面

```bash
# 快速发布模式（跳过预览确认）
pnpm workflow:process test-complete --fast

# 预期输出：
# ✓ Generating publish page for test-complete
# ✓ Created: output/YYYYMMDDHHmmss-xxxxx/index.html
# ✓ Opening in browser...
```

**验证清单**:
- [ ] 输出目录创建（格式：YYYYMMDDHHmmss-random）
- [ ] index.html 文件生成
- [ ] 浏览器自动打开

### 测试 3.2: 发布页面功能测试

在浏览器中测试以下功能：

**页面布局验证**:
- [ ] Grid 布局正确显示
- [ ] 每个平台独立的 Card
- [ ] 响应式设计正常

**平台 Card 功能**:
- [ ] **HTML 平台**:
  - [ ] 显示转换后内容
  - [ ] "复制内容" 按钮工作
  - [ ] "预览与对比" 显示差异
  - [ ] 图片状态检查正确

- [ ] **掘金平台**:
  - [ ] Markdown 格式正确
  - [ ] 代码块语法高亮
  - [ ] 表格渲染正确
  - [ ] 复制功能正常

- [ ] **微信平台**:
  - [ ] HTML 格式转换
  - [ ] 图片引用处理
  - [ ] 样式适配微信

**URL 管理功能**:
- [ ] 显示 "🔗 发布链接管理" 区域
- [ ] URL 输入框可见
- [ ] 点击 "💾 保存" 成功
- [ ] URL 持久化（刷新后保留）
- [ ] "🔗 打开" 链接正常跳转

### 测试 3.3: 批量发布测试

```bash
# 处理所有文章
pnpm workflow:process-all

# 查看发布历史
pnpm post:publish:history

# 预期：看到所有已发布的文章
```

**验证清单**:
- [ ] 所有文章处理完成
- [ ] 发布历史记录正确
- [ ] 状态流转正确

---

## 🔄 阶段 4: Hexo 集成测试

### 测试 4.1: Hexo 配置检查

```bash
# 检查 Hexo 配置
pnpm hexo:config

# 预期输出：
# Hexo Configuration:
# - Blog Path: ./blog
# - Status: Configured (or Not configured)
```

**验证清单**:
- [ ] 配置检测正常
- [ ] 路径正确（如果已配置）

### 测试 4.2: 同步到 Hexo（可选）

```bash
# 仅当已配置 Hexo 博客时执行
pnpm hexo:sync

# 或使用包装脚本
pnpm sync:blog
```

**验证清单**:
- [ ] 同步成功（如果配置了）
- [ ] Hexo source 目录更新
- [ ] 文章正确复制

---

## 🧼 清理和重置测试

### 测试 5.1: 单篇文章重置

```bash
# 重置特定文章
pnpm workflow:rollback test-complete

# 验证状态
pnpm workflow:status

# 预期：test-complete 状态回到 pending
```

**验证清单**:
- [ ] 状态回滚成功
- [ ] 可以重新处理

### 测试 5.2: 批量重置

```bash
# 重置所有文章
pnpm workflow:reset-all

# 验证
pnpm workflow:status

# 预期：所有文章回到 pending 状态
```

**验证清单**:
- [ ] 所有文章重置
- [ ] 数据库清理正确

---

## 📊 验证检查清单

### 完整功能验证

#### ✅ 核心功能
- [ ] 内容扫描和索引
- [ ] Frontmatter 解析
- [ ] Markdown 转 AST
- [ ] 内容哈希计算
- [ ] 更新检测

#### ✅ 工作流
- [ ] 工作流扫描
- [ ] 文章处理
- [ ] 状态管理
- [ ] 操作日志
- [ ] 回滚功能

#### ✅ 平台转换
- [ ] HTML 转换器
- [ ] 掘金转换器
- [ ] 微信转换器
- [ ] 代码高亮
- [ ] 表格渲染
- [ ] 图片处理

#### ✅ 发布功能
- [ ] 生成发布页面
- [ ] Grid 布局
- [ ] 平台 Card
- [ ] 复制功能
- [ ] 预览对比
- [ ] URL 管理
- [ ] 图片状态检查

#### ✅ 数据库
- [ ] Prisma ORM
- [ ] 文章记录
- [ ] 发布记录
- [ ] 操作日志
- [ ] 状态查询

#### ✅ Web UI
- [ ] 文章列表
- [ ] 文章详情
- [ ] 状态显示
- [ ] 草稿过滤
- [ ] 响应式设计

#### ✅ CLI 工具
- [ ] pnpm scan
- [ ] pnpm workflow:*
- [ ] pnpm post:publish:*
- [ ] pnpm hexo:*

---

## 🐛 常见问题排查

### 问题 1: 模块找不到

```bash
Error: Cannot find module '@content-hub/core'

# 解决方案
pnpm build
```

### 问题 2: 数据库锁定

```bash
Error: Database is locked

# 解决方案
# 停止所有服务
pkill -f "tsx scripts"
pkill -f "vite"

# 重置数据库
pnpm db:reset
```

### 问题 3: 端口占用

```bash
Error: Port 5173 is already in use

# 解决方案
# 查找并停止进程
lsof -ti:5173 | xargs kill -9
```

### 问题 4: 发布页面打不开

```bash
# 检查输出目录
ls -la output/

# 手动在浏览器打开
open output/YYYYMMDDHHmmss-xxxxx/index.html
```

---

## 📝 测试记录模板

```markdown
## 测试执行记录

**测试日期**: 2026-04-02
**测试人员**: [Your Name]
**环境**: [Local/Production]

### 测试结果总览

| 测试阶段 | 通过 | 失败 | 备注 |
|---------|------|------|------|
| 环境准备 | ✅ | | |
| 基础功能 | ✅ | | |
| 工作流 | ✅ | | |
| 发布功能 | ✅ | | |
| Hexo 集成 | ⏭️ | | 未配置 |
| 清理重置 | ✅ | | |

### 发现的问题

1. **问题描述**:
   - 严重程度: [High/Medium/Low]
   - 复现步骤:
   - 预期行为:
   - 实际行为:

### 改进建议

1. [建议内容]

### 总体评价

- 系统稳定性: [⭐⭐⭐⭐⭐]
- 功能完整性: [⭐⭐⭐⭐⭐]
- 用户体验: [⭐⭐⭐⭐⭐]
```

---

## 🎯 快速测试命令

```bash
# 一键完整测试（复制粘贴）
echo "=== PostWaver 完整测试 ===" && \
pnpm scan && \
pnpm workflow:scan && \
pnpm workflow:process-all && \
pnpm workflow:process test-complete --fast && \
echo "=== 测试完成 ===" && \
pnpm workflow:status && \
echo "=== 检查输出目录 ===" && \
ls -la output/
```

---

## 📚 相关文档

- [测试规范](../docs/test/TEST_SPECIFICATION.md)
- [快速参考](../docs/test/TEST_QUICK_REFERENCE.md)
- [平台指南](../docs/guides/)
- [项目 README](../README.md)

---

## ✅ 测试完成标准

测试被认为完全通过，当且仅当：

1. ✅ 所有核心功能测试通过
2. ✅ 所有平台转换器工作正常
3. ✅ 数据库操作无错误
4. ✅ Web UI 所有功能可用
5. ✅ 发布页面所有交互正常
6. ✅ URL 管理功能完整
7. ✅ 无控制台错误或警告
8. ✅ 性能表现良好（页面加载 < 2s）

---

**祝测试顺利！** 🚀

如有问题，请参考故障排查章节或查看项目文档。

---

## 📌 重要说明：草稿文章处理

### 草稿文章的定义

在 PostWaver 中，草稿文章是指在 Frontmatter 中设置了 `draft: true` 的文章：

```yaml
---
title: 草稿文章
draft: true  # 这就是草稿标记
---
```

### 扫描行为（默认包含所有）

| 命令 | 包含草稿 | 说明 |
|------|---------|------|
| `pnpm scan` | ✅ **是** | 默认扫描所有文章（含草稿） |
| `pnpm scan --exclude-drafts` | ❌ 否 | 只扫描非草稿文章 |
| `pnpm scan:drafts` | ✅ 是 | 扫描所有文章（含草稿） |
| `pnpm scan:table` | ✅ 是 | 表格输出，含草稿 |

**注意**: PostWaver 现在默认扫描所有文章，包括草稿。这样更符合"扫描"的语义 - 扫描就应该发现所有文件。

### 工作流处理

| 命令 | 处理草稿 | 说明 |
|------|---------|------|
| `pnpm workflow:scan` | ✅ 是 | 扫描所有文章 |
| `pnpm workflow:process-all` | ✅ 是 | 处理所有文章 |
| `pnpm workflow:process <post-id>` | ✅ 是 | 可处理指定文章 |

### 测试数据说明

测试手册中创建的 3 篇文章：

1. **test-complete.md** - `draft: false` ✅ 会被扫描
2. **test-draft.md** - `draft: true` ✅ 也会被扫描
3. **test-platforms.md** - `draft: false` ✅ 会被扫描

因此：
- `pnpm scan` → 扫描到 **3 篇**（默认行为）
- `pnpm scan --exclude-drafts` → 扫描到 **2 篇**

