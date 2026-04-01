# 测试规范文档

本文档详细说明 Content-Hub 项目的测试范围、测试方法、测试用例和验收标准。

---

## 📋 目录

- [测试概述](#测试概述)
- [测试环境准备](#测试环境准备)
- [M0.2 测试规范](#m02-测试规范-frontmatter-规范与-lint)
- [M0.3 测试规范](#m03-测试规范-内容扫描器与解析器)
- [集成测试](#集成测试)
- [测试工具](#测试工具)
- [故障排查](#故障排查)

---

## 测试概述

### 测试范围

Content-Hub 项目的测试覆盖以下功能模块：

| 模块 | 里程碑 | 测试重点 |
|------|--------|---------|
| Frontmatter 规范 | M0.2 | 数据结构验证、必填字段检查 |
| Markdown Lint | M0.2 | 语法规范、格式检查 |
| 内容解析 | M0.3 | Frontmatter 解析、Markdown 转 AST |
| 内容扫描 | M0.3 | 目录遍历、文件解析、索引生成 |
| 更新检测 | M0.3 | 内容哈希对比、变更检测 |

### 测试层级

```
┌─────────────────────────────────────┐
│   E2E 测试（端到端）                 │
│   完整工作流测试                     │
└─────────────────────────────────────┘
            ↑
┌─────────────────────────────────────┐
│   集成测试                           │
│   模块间协作测试                     │
└─────────────────────────────────────┘
            ↑
┌─────────────────────────────────────┐
│   单元测试                           │
│   独立函数/模块测试                  │
└─────────────────────────────────────┘
```

---

## 测试环境准备

### 前置条件

```bash
# 1. 确保依赖已安装
pnpm install

# 2. 构建 core 包
pnpm --filter @content-hub/core build

# 3. 验证测试文件存在
ls -la test/fixtures/posts/valid/
ls -la test/fixtures/posts/invalid/
ls -la content/posts/tech/

# 4. 清理旧数据
rm -f content-index.json
```

### 测试数据

测试使用以下数据集：

**有效数据集：** `test/fixtures/posts/valid/`
- 完整 Frontmatter 示例
- 符合所有规范的文件

**无效数据集：** `test/fixtures/posts/invalid/`
- 缺少必填字段
- 日期格式错误
- 空标签数组
- Markdown 语法错误

**真实数据集：** `content/posts/tech/`
- 模拟真实博客文章
- 用于集成测试

---

## M0.2 测试规范（Frontmatter 规范与 Lint）

### 测试目标

验证 Frontmatter 规范和 Markdown Lint 基础设施的正确性。

### 测试用例

#### T001: Frontmatter 接口定义

**测试目的：** 验证 TypeScript 接口定义完整且正确

**测试步骤：**
```bash
# 检查类型定义文件
cat packages/core/src/types.ts

# 验证包含所有必需接口
grep -E "(Frontmatter|PlatformConfig|PublishStrategy|Post)" packages/core/src/types.ts
```

**预期结果：**
- ✅ `Frontmatter` 接口存在
- ✅ 包含所有必填字段：`title`, `date`, `tags`
- ✅ 包含可选字段：`categories`, `description`, `draft`, `platforms`
- ✅ `PlatformConfig` 和 `PublishStrategy` 类型定义正确

**通过标准：** 所有接口定义无 TypeScript 编译错误

---

#### T002: Markdown Lint 配置

**测试目的：** 验证 markdownlint-cli2 配置正确

**测试步骤：**
```bash
# 测试有效文件
npx markdownlint-cli2 test/fixtures/posts/valid/complete-frontmatter.md

# 测试无效文件（代码块缺少语言）
npx markdownlint-cli2 test/fixtures/posts/invalid/code-block-no-lang.md

# 测试无效文件（缺少 H1）
npx markdownlint-cli2 test/fixtures/posts/invalid/no-h1.md
```

**预期结果：**
- ✅ 有效文件：无错误输出
- ✅ `code-block-no-lang.md`: 报告 MD040 错误
- ✅ `no-h1.md`: 报告 MD041 错误

**通过标准：**
```bash
# 有效文件测试
echo $?
# 输出: 0

# 无效文件测试（非零退出码）
echo $?
# 输出: 1
```

---

#### T003: remark Frontmatter 校验

**测试目的：** 验证自定义 Frontmatter 校验器

**测试步骤：**
```bash
# 测试有效的 Frontmatter
npx remark test/fixtures/posts/valid/complete-frontmatter.md

# 测试缺少 title
npx remark test/fixtures/posts/invalid/missing-title.md

# 测试无效日期格式
npx remark test/fixtures/posts/invalid/invalid-date.md

# 测试空标签数组
npx remark test/fixtures/posts/invalid/empty-tags.md
```

**预期结果：**
- ✅ `complete-frontmatter.md`: 通过验证
- ✅ `missing-title.md`: 报告 "title 字段必填"
- ✅ `invalid-date.md`: 报告 "date 必须是 ISO8601 格式"
- ✅ `empty-tags.md`: 报告 "tags 必须是至少包含 1 个元素的数组"

**通过标准：** 每个测试用例产生正确的错误信息

---

#### T004: Lint 自动修复

**测试目的：** 验证 markdownlint 自动修复功能

**测试步骤：**
```bash
# 创建包含可修复错误的文件
cat > /tmp/test-fix.md << 'EOF'
#标题
列表
- item 1
- item 2
EOF

# 运行自动修复
npx markdownlint-cli2 --fix /tmp/test-fix.md

# 查看修复后的内容
cat /tmp/test-fix.md
```

**预期结果：**
- ✅ `#标题` → `# 标题`（标题后有空格）
- ✅ 列表格式统一

**通过标准：** 自动修复后文件符合规范

---

#### T005: Pre-commit Hook 集成

**测试目的：** 验证 pre-commit hook 正确阻止无效提交

**测试步骤：**
```bash
# 复制无效文件到内容目录
cp test/fixtures/posts/invalid/missing-title.md content/posts/

# 尝试提交
git add content/posts/missing-title.md
git commit -m "test: 无效文件应该被阻止"
```

**预期结果：**
- ✅ Pre-commit hook 运行
- ✅ remark 检测到 Frontmatter 错误
- ✅ 提交被阻止

**通过标准：** Git 提交失败并显示明确错误信息

---

### M0.2 验收标准

所有以下测试必须通过：

- [ ] T001: Frontmatter 接口定义完整
- [ ] T002: Markdown lint 配置正确
- [ ] T003: remark Frontmatter 校验有效
- [ ] T004: 自动修复功能正常
- [ ] T005: Pre-commit hook 正确集成

---

## M0.3 测试规范（内容扫描器与解析器）

### 测试目标

验证内容扫描、解析和索引生成功能的正确性。

### 测试用例

#### T101: Frontmatter 解析

**测试目的：** 验证 parseFrontmatter 函数正确解析 Frontmatter

**测试步骤：**
```bash
cat > /tmp/test-parse.js << 'EOF'
import { parseFrontmatter } from '@content-hub/core';

const validFrontmatter = `---
title: 测试文章
date: 2026-04-01T00:00:00Z
tags: ['test', 'example']
categories: ['技术']
description: 这是一篇测试文章
draft: false
---

# 正文内容
`;

try {
  const result = parseFrontmatter(validFrontmatter);
  console.log('✓ 解析成功');
  console.log('  标题:', result.title);
  console.log('  日期:', result.date);
  console.log('  标签:', result.tags);
  console.log('  分类:', result.categories);
  console.log('  描述:', result.description);
  console.log('  草稿:', result.draft);
} catch (error) {
  console.log('✗ 解析失败:', error.message);
  process.exit(1);
}
EOF

npx tsx /tmp/test-parse.js
```

**预期结果：**
```
✓ 解析成功
  标题: 测试文章
  日期: 2026-04-01T00:00:00Z
  标签: [ 'test', 'example' ]
  分类: [ '技术' ]
  描述: 这是一篇测试文章
  草稿: false
```

**通过标准：** 所有字段正确解析

---

#### T102: Markdown 转 AST

**测试目的：** 验证 parseMarkdown 函数生成正确的 AST

**测试步骤：**
```bash
cat > /tmp/test-ast.js << 'EOF'
import { parseMarkdown } from '@content-hub/core';

const markdown = `# 标题

这是段落。

## 子标题

- 列表项 1
- 列表项 2
`;

const ast = parseMarkdown(markdown);

console.log('✓ AST 生成成功');
console.log('  类型:', ast.type);
console.log('  子节点数:', ast.children.length);
console.log('  第一个子节点类型:', ast.children[0].type);
console.log('  第一个子节点深度:', ast.children[0].depth);
EOF

npx tsx /tmp/test-ast.js
```

**预期结果：**
```
✓ AST 生成成功
  类型: root
  子节点数: 4
  第一个子节点类型: heading
  第一个子节点深度: 1
```

**通过标准：** AST 结构正确，包含所有节点

---

#### T103: 内容哈希计算

**测试目的：** 验证 computeHash 函数的一致性和唯一性

**测试步骤：**
```bash
cat > /tmp/test-hash.js << 'EOF'
import { computeHash } from '@content-hub/core';

// 测试 1: 相同内容产生相同哈希
const content1 = "Hello World";
const content2 = "Hello World";
const hash1 = computeHash(content1);
const hash2 = computeHash(content2);

if (hash1 === hash2) {
  console.log('✓ 测试 1 通过: 相同内容产生相同哈希');
} else {
  console.log('✗ 测试 1 失败: 相同内容产生不同哈希');
  process.exit(1);
}

// 测试 2: 不同内容产生不同哈希
const content3 = "Hello World!";
const hash3 = computeHash(content3);

if (hash1 !== hash3) {
  console.log('✓ 测试 2 通过: 不同内容产生不同哈希');
} else {
  console.log('✗ 测试 2 失败: 不同内容产生相同哈希');
  process.exit(1);
}

// 测试 3: 哈希格式正确（SHA256 = 64 个十六进制字符）
if (hash1.length === 64 && /^[a-f0-9]{64}$/.test(hash1)) {
  console.log('✓ 测试 3 通过: 哈希格式正确');
  console.log('  示例哈希:', hash1.substring(0, 32) + '...');
} else {
  console.log('✗ 测试 3 失败: 哈希格式不正确');
  console.log('  长度:', hash1.length);
  process.exit(1);
}
EOF

npx tsx /tmp/test-hash.js
```

**预期结果：**
```
✓ 测试 1 通过: 相同内容产生相同哈希
✓ 测试 2 通过: 不同内容产生不同哈希
✓ 测试 3 通过: 哈希格式正确
  示例哈希: a591a6d40bf420404a011733cfb7b19d...
```

**通过标准：** 所有哈希测试通过

---

#### T104: 目录扫描

**测试目的：** 验证 scanDirectory 函数正确扫描和解析文件

**测试步骤：**
```bash
cat > /tmp/test-scan.js << 'EOF'
import { scanDirectory } from '@content-hub/core';

async function test() {
  // 不包含草稿
  const postsWithoutDrafts = await scanDirectory('content/posts/tech', {
    recursive: true,
    includeDrafts: false
  });

  console.log('✓ 扫描完成（不含草稿）');
  console.log('  文章数:', postsWithoutDrafts.length);
  postsWithoutDrafts.forEach(post => {
    console.log(`  - ${post.id}: ${post.frontmatter.title} (草稿: ${post.frontmatter.draft || false})`);
  });

  // 包含草稿
  const postsWithDrafts = await scanDirectory('content/posts/tech', {
    recursive: true,
    includeDrafts: true
  });

  console.log('\n✓ 扫描完成（含草稿）');
  console.log('  文章数:', postsWithDrafts.length);
  postsWithDrafts.forEach(post => {
    console.log(`  - ${post.id}: ${post.frontmatter.title} (草稿: ${post.frontmatter.draft || false})`);
  });

  // 验证草稿过滤
  if (postsWithDrafts.length > postsWithoutDrafts.length) {
    console.log('\n✓ 草稿过滤正常工作');
  }
}

test().catch(console.error);
EOF

npx tsx /tmp/test-scan.js
```

**预期结果：**
```
✓ 扫描完成（不含草稿）
  文章数: 2
  - test-post-2: 第二篇测试文章 (草稿: false)
  - test-post-1: 第一篇测试文章 (草稿: false)

✓ 扫描完成（含草稿）
  文章数: 3
  - test-post-2: 第二篇测试文章 (草稿: false)
  - test-post-1: 第一篇测试文章 (草稿: false)
  - draft-post: 草稿文章 (草稿: true)

✓ 草稿过滤正常工作
```

**通过标准：** 扫描结果正确，草稿过滤有效

---

#### T105: 索引构建

**测试目的：** 验证 buildIndex 函数生成正确的索引结构

**测试步骤：**
```bash
cat > /tmp/test-index.js << 'EOF'
import { buildIndex, scanDirectory } from '@content-hub/core';
import { readFile } from 'fs/promises';

async function test() {
  // 构建索引
  const posts = await scanDirectory('content/posts/tech', { includeDrafts: true });
  const index = await buildIndex(posts);

  console.log('✓ 索引构建成功');
  console.log('  版本:', index.version);
  console.log('  最后更新:', index.lastUpdated);
  console.log('  元数据:');
  console.log('    总文章数:', index.metadata.totalPosts);
  console.log('    草稿数:', index.metadata.draftCount);
  console.log('    所有标签:', index.metadata.allTags.join(', '));

  // 验证结构
  console.log('\n✓ 验证索引结构:');
  console.log('  - version 字段存在:', typeof index.version === 'number');
  console.log('  - posts 字段存在:', typeof index.posts === 'object');
  console.log('  - lastUpdated 字段存在:', typeof index.lastUpdated === 'string');
  console.log('  - metadata 字段存在:', typeof index.metadata === 'object');

  // 验证文章条目
  const firstPostId = Object.keys(index.posts)[0];
  const firstPost = index.posts[firstPostId];
  console.log('\n✓ 第一篇文章条目:');
  console.log('  - id:', firstPost.id);
  console.log('  - title:', firstPost.title);
  console.log('  - date:', firstPost.date);
  console.log('  - tags:', firstPost.tags.join(', '));
  console.log('  - contentHash:', firstPost.contentHash.substring(0, 16) + '...');
  console.log('  - draft:', firstPost.draft);
}

test().catch(console.error);
EOF

npx tsx /tmp/test-index.js
```

**预期结果：**
```
✓ 索引构建成功
  版本: 1
  最后更新: 2026-04-02T...
  元数据:
    总文章数: 3
    草稿数: 1
    所有标签: draft, tech, test

✓ 验证索引结构:
  - version 字段存在: true
  - posts 字段存在: true
  - lastUpdated 字段存在: true
  - metadata 字段存在: true

✓ 第一篇文章条目:
  - id: test-post-2
  - title: 第二篇测试文章
  - date: 2026-04-02T00:00:00.000Z
  - tags: test
  - contentHash: c2dbf387b8fc65de...
  - draft: false
```

**通过标准：** 索引结构完整，数据正确

---

#### T106: 索引文件读写

**测试目的：** 验证 readIndex 和 writeIndex 函数

**测试步骤：**
```bash
cat > /tmp/test-io.js << 'EOF'
import { readIndex, writeIndex, buildIndex, scanDirectory } from '@content-hub/core';
import { unlink } from 'fs/promises';

async function test() {
  const testIndexPath = '/tmp/test-index.json';

  // 清理旧文件
  try {
    await unlink(testIndexPath);
  } catch {
    // 文件不存在，忽略
  }

  // 测试 1: 读取不存在的索引
  const index1 = await readIndex(testIndexPath);
  if (index1 === null) {
    console.log('✓ 测试 1 通过: 不存在的索引返回 null');
  } else {
    console.log('✗ 测试 1 失败: 应该返回 null');
    process.exit(1);
  }

  // 测试 2: 写入索引
  const posts = await scanDirectory('content/posts/tech');
  const index = await buildIndex(posts);
  await writeIndex(index, testIndexPath);
  console.log('✓ 测试 2 通过: 索引写入成功');

  // 测试 3: 读取索引
  const index2 = await readIndex(testIndexPath);
  if (index2 !== null && index2.version === index.version) {
    console.log('✓ 测试 3 通过: 索引读取成功');
  } else {
    console.log('✗ 测试 3 失败: 索引读取失败');
    process.exit(1);
  }

  // 清理
  await unlink(testIndexPath);
  console.log('✓ 测试完成: 临时文件已清理');
}

test().catch(console.error);
EOF

npx tsx /tmp/test-io.js
```

**预期结果：**
```
✓ 测试 1 通过: 不存在的索引返回 null
✓ 测试 2 通过: 索引写入成功
✓ 测试 3 通过: 索引读取成功
✓ 测试完成: 临时文件已清理
```

**通过标准：** 所有 I/O 操作成功

---

#### T107: 更新检测

**测试目的：** 验证 detectNewPosts 和 detectUpdatedPosts 函数

**测试步骤：**
```bash
cat > /tmp/test-update.js << 'EOF'
import { scan, readIndex, writeIndex, buildIndex, scanDirectory } from '@content-hub/core';

async function test() {
  const indexPath = '/tmp/test-update-index.json';

  // 步骤 1: 初始扫描
  console.log('步骤 1: 初始扫描');
  const result1 = await scan('content/posts/tech', {
    updateIndex: true,
    includeDrafts: true
  });

  // 手动保存索引到临时位置
  const posts = await scanDirectory('content/posts/tech', { includeDrafts: true });
  const index = await buildIndex(posts);
  await writeIndex(index, indexPath);

  console.log(`  扫描到 ${result1.posts.length} 篇文章`);
  console.log(`  新文章: ${result1.newPosts.length}`);
  console.log(`  已更新: ${result1.updatedPosts.length}`);

  if (result1.newPosts.length === result1.posts.length) {
    console.log('✓ 初始扫描: 所有文章都是新的');
  }

  // 步骤 2: 再次扫描（无变化）
  console.log('\n步骤 2: 再次扫描（无变化）');
  const result2 = await scan('content/posts/tech', {
    updateIndex: false,
    includeDrafts: true
  });

  console.log(`  扫描到 ${result2.posts.length} 篇文章`);
  console.log(`  新文章: ${result2.newPosts.length}`);
  console.log(`  已更新: ${result2.updatedPosts.length}`);

  if (result2.newPosts.length === 0 && result2.updatedPosts.length === 0) {
    console.log('✓ 无变化扫描: 正确检测到无更新');
  }

  // 清理
  const { unlink } = await import('fs/promises');
  await unlink(indexPath);
}

test().catch(console.error);
EOF

npx tsx /tmp/test-update.js
```

**预期结果：**
```
步骤 1: 初始扫描
  扫描到 3 篇文章
  新文章: 3
  已更新: 0
✓ 初始扫描: 所有文章都是新的

步骤 2: 再次扫描（无变化）
  扫描到 3 篇文章
  新文章: 0
  已更新: 0
✓ 无变化扫描: 正确检测到无更新
```

**通过标准：** 更新检测逻辑正确

---

#### T108: 完整扫描流程

**测试目的：** 验证 scan 函数的完整工作流

**测试步骤：**
```bash
# 清理旧索引
rm -f content-index.json

# 执行完整扫描
pnpm scan

# 验证输出
echo "退出码: $?"
echo ""

# 检查索引文件
if [ -f "content-index.json" ]; then
  echo "✓ 索引文件已生成"

  # 验证 JSON 格式
  if python3 -m json.tool content-index.json > /dev/null 2>&1; then
    echo "✓ 索引文件格式正确"
  else
    echo "✗ 索引文件格式错误"
    exit 1
  fi

  # 显示摘要
  echo ""
  echo "索引摘要:"
  cat content-index.json | jq '{version, totalPosts: .metadata.totalPosts, draftCount: .metadata.draftCount, allTags: .metadata.allTags}'
else
  echo "✗ 索引文件未生成"
  exit 1
fi
```

**预期结果：**
```
退出码: 0

✓ 索引文件已生成
✓ 索引文件格式正确

索引摘要:
{
  "version": 1,
  "totalPosts": 2,
  "draftCount": 0,
  "allTags": ["tech", "test"]
}
```

**通过标准：** 完整扫描成功，索引生成正确

---

### M0.3 验收标准

所有以下测试必须通过：

- [ ] T101: Frontmatter 解析正确
- [ ] T102: Markdown 转 AST 成功
- [ ] T103: 内容哈希计算准确
- [ ] T104: 目录扫描功能正常
- [ ] T105: 索引构建结构完整
- [ ] T106: 索引文件读写正确
- [ ] T107: 更新检测逻辑有效
- [ ] T108: 完整扫描流程成功

---

## 集成测试

### IT001: 完整工作流测试

**测试目的：** 验证从内容创建到索引生成的完整流程

**测试步骤：**
```bash
#!/bin/bash

# 1. 环境准备
echo "1. 环境准备"
rm -rf /tmp/content-test
mkdir -p /tmp/content-test/posts

# 2. 创建测试文章
echo "2. 创建测试文章"
cat > /tmp/content-test/posts/test-1.md << 'EOF'
---
title: 第一篇文章
date: 2026-04-02T00:00:00Z
tags: ['test']
---

# 第一篇文章

这是内容。
EOF

cat > /tmp/content-test/posts/test-2.md << 'EOF'
---
title: 第二篇文章
date: 2026-04-02T01:00:00Z
tags: ['test', 'demo']
draft: true
---

# 第二篇文章
EOF

# 3. 扫描并生成索引
echo "3. 扫描并生成索引"
npx tsx scripts/scan.ts --dir /tmp/content-test/posts

# 4. 验证结果
echo "4. 验证结果"
if [ -f "content-index.json" ]; then
  POST_COUNT=$(cat content-index.json | jq '.metadata.totalPosts')
  echo "✓ 扫描成功，共 $POST_COUNT 篇文章"
else
  echo "✗ 索引文件未生成"
  exit 1
fi

# 5. 修改文章
echo "5. 修改文章并重新扫描"
echo "" >> /tmp/content-test/posts/test-1.md
echo "## 新增章节" >> /tmp/content-test/posts/test-1.md

npx tsx scripts/scan.ts --dir /tmp/content-test/posts --output table | grep "已更新"

# 6. 清理
rm -rf /tmp/content-test
echo "6. 清理完成"
```

**预期结果：**
```
1. 环境准备
2. 创建测试文章
3. 扫描并生成索引
✓ 扫描成功，共 2 篇文章
4. 验证结果
5. 修改文章并重新扫描
已更新: 1
6. 清理完成
```

**通过标准：** 完整工作流无错误执行

---

### IT002: Lint 到扫描集成测试

**测试目的：** 验证 Lint 检查和内容扫描的集成

**测试步骤：**
```bash
#!/bin/bash

# 1. 创建符合规范的文章
echo "1. 创建符合规范的文章"
cat > /tmp/valid-post.md << 'EOF'
---
title: 有效文章
date: 2026-04-02T00:00:00Z
tags: ['valid']
---

# 有效文章

这是内容。

\`\`\`typescript
const code = "valid";
\`\`\`
EOF

# 2. Lint 检查
echo "2. Lint 检查"
npx markdownlint-cli2 /tmp/valid-post.md
if [ $? -eq 0 ]; then
  echo "✓ Markdown lint 通过"
else
  echo "✗ Markdown lint 失败"
  exit 1
fi

npx remark /tmp/valid-post.md
if [ $? -eq 0 ]; then
  echo "✓ Frontmatter 验证通过"
else
  echo "✗ Frontmatter 验证失败"
  exit 1
fi

# 3. 解析测试
echo "3. 解析测试"
cat > /tmp/test-parse.js << 'EOF'
import { parsePost } from '@content-hub/core';

const post = await parsePost('/tmp/valid-post.md');
console.log('✓ 解析成功');
console.log('  ID:', post.id);
console.log('  标题:', post.frontmatter.title);
console.log('  内容哈希:', post.contentHash.substring(0, 16) + '...');
EOF

npx tsx /tmp/test-parse.js

# 清理
rm -f /tmp/valid-post.md /tmp/test-parse.js

echo "4. 集成测试完成"
```

**预期结果：**
```
1. 创建符合规范的文章
2. Lint 检查
✓ Markdown lint 通过
✓ Frontmatter 验证通过
3. 解析测试
✓ 解析成功
  ID: valid-post
  标题: 有效文章
  内容哈希: 8f434346648f6b96...
4. 集成测试完成
```

**通过标准：** 所有集成步骤成功

---

## 测试工具

### 命令行工具

| 工具 | 用途 | 命令 |
|------|------|------|
| **markdownlint-cli2** | Markdown 语法检查 | `npx markdownlint-cli2 <file>` |
| **remark** | Frontmatter 校验 | `npx remark <file>` |
| **tsx** | TypeScript 执行 | `npx tsx <file>` |
| **jq** | JSON 处理 | `cat file.json \| jq <filter>` |

### 测试脚本

| 脚本 | 功能 | 命令 |
|------|------|------|
| **scripts/scan.ts** | 内容扫描 | `pnpm scan` |
| **scripts/test-units.sh** | 单元测试 | `pnpm test:units` |
| **scripts/test-integration.sh** | 集成测试 | `pnpm test:integration` |

### 辅助命令

```bash
# 构建 core 包
pnpm --filter @content-hub/core build

# 清理测试数据
rm content-index.json

# 验证 JSON 格式
python3 -m json.tool content-index.json

# 查看索引摘要
cat content-index.json | jq '.metadata'

# 查找特定文章
cat content-index.json | jq '.posts["post-id"]'
```

---

## 故障排查

### 常见问题

#### 问题 1: 模块找不到

**症状：**
```
Error: Cannot find module '@content-hub/core'
```

**解决方案：**
```bash
# 重新构建 core 包
pnpm --filter @content-hub/core build

# 验证构建产物
ls -la packages/core/dist/
```

---

#### 问题 2: Top-level await 错误

**症状：**
```
ERROR: Top-level await is currently not supported
```

**解决方案：**
```bash
# 使用 async 函数包装
cat > test.js << 'EOF'
import { func } from 'module';

async function test() {
  await func();
}

test().catch(console.error);
EOF

npx tsx test.js
```

---

#### 问题 3: remark 配置错误

**症状：**
```
Error: Cannot find module 'remark-preset-lint-recommended'
```

**解决方案：**
```bash
# 安装缺失的依赖
pnpm add -D -w remark-preset-lint-recommended

# 验证配置文件
cat .remarkrc.mjs
```

---

#### 问题 4: 索引文件权限错误

**症状：**
```
Error: EACCES: permission denied, open 'content-index.json'
```

**解决方案：**
```bash
# 检查文件权限
ls -la content-index.json

# 修改权限
chmod 644 content-index.json

# 或删除重建
rm content-index.json
pnpm scan
```

---

### 调试技巧

#### 1. 启用详细输出

```bash
# 扫描时显示详细信息
DEBUG=* npx tsx scripts/scan.ts --dir content/posts

# 或修改脚本添加 console.log
```

#### 2. 检查中间结果

```bash
# 查看扫描的原始数据
npx tsx scripts/scan.ts --dir content/posts --update-index false

# 查看索引文件内容
cat content-index.json | jq '.'
```

#### 3. 逐步测试

```bash
# 1. 测试单个文件解析
cat > test-parse.js << 'EOF'
import { parsePost } from '@content-hub/core';
const post = await parsePost('content/posts/tech/test-post-1.md');
console.log(post);
EOF
npx tsx test-parse.js

# 2. 测试目录扫描
cat > test-scan.js << 'EOF'
import { scanDirectory } from '@content-hub/core';
const posts = await scanDirectory('content/posts/tech');
console.log(posts);
EOF
npx tsx test-scan.js

# 3. 测试完整流程
pnpm scan
```

---

## 附录

### 测试数据示例

**有效 Frontmatter：**
```yaml
---
title: 文章标题
date: 2026-04-02T00:00:00Z
tags: ['tag1', 'tag2']
categories: ['分类']
description: 描述
draft: false
platforms:
  juejin: auto
  wechat: semi-auto
---
```

**无效 Frontmatter（缺少 title）：**
```yaml
---
date: 2026-04-02T00:00:00Z
tags: ['tag1']
---
```

### 索引文件结构

```json
{
  "version": 1,
  "posts": {
    "post-id": {
      "id": "post-id",
      "title": "文章标题",
      "date": "2026-04-02T00:00:00.000Z",
      "tags": ["tag1", "tag2"],
      "contentHash": "abc123...",
      "filepath": "/path/to/file.md",
      "draft": false
    }
  },
  "lastUpdated": "2026-04-02T...",
  "metadata": {
    "totalPosts": 1,
    "draftCount": 0,
    "allTags": ["tag1", "tag2"]
  }
}
```

---

## 总结

本测试规范文档涵盖了 Content-Hub 项目 M0.2 和 M0.3 里程碑的所有测试内容：

- ✅ **8 个单元测试**（T101-T108）
- ✅ **5 个 Lint 测试**（T001-T005）
- ✅ **2 个集成测试**（IT001-IT002）
- ✅ **完整的故障排查指南**

遵循本规范，可以确保项目功能的正确性和稳定性。
