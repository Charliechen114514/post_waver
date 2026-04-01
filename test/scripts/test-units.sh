#!/bin/bash

# 单元测试脚本 - 测试各个独立模块

echo "🧪 单元测试"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 测试 Frontmatter 解析
echo "📋 测试 1: Frontmatter 解析"
cat > /tmp/test-frontmatter.js << 'EOF'
import { parseFrontmatter } from '@content-hub/core';

const valid = `---
title: 测试文章
date: 2026-04-01T00:00:00Z
tags: ['test']
---

# 内容
`;

try {
  const result = parseFrontmatter(valid);
  console.log('✓ 有效 Frontmatter 解析成功:', result.title);
} catch (error) {
  console.log('✗ 解析失败:', error.message);
  process.exit(1);
}
EOF

cd "$PROJECT_ROOT" && npx tsx /tmp/test-frontmatter.js
echo ""

# 测试哈希计算
echo "🔐 测试 2: 内容哈希计算"
cat > /tmp/test-hash.js << 'EOF'
import { computeHash } from '@content-hub/core';

const content1 = "Hello World";
const content2 = "Hello World";
const content3 = "Hello World!";

const hash1 = computeHash(content1);
const hash2 = computeHash(content2);
const hash3 = computeHash(content3);

if (hash1 === hash2) {
  console.log('✓ 相同内容产生相同哈希');
} else {
  console.log('✗ 相同内容产生不同哈希');
  process.exit(1);
}

if (hash1 !== hash3) {
  console.log('✓ 不同内容产生不同哈希');
} else {
  console.log('✗ 不同内容产生相同哈希');
  process.exit(1);
}

console.log('哈希值示例:', hash1.substring(0, 16) + '...');
EOF

cd "$PROJECT_ROOT" && npx tsx /tmp/test-hash.js
echo ""

# 测试目录扫描
echo "🔍 测试 3: 目录扫描"
cat > /tmp/test-scan.js << 'EOF'
import { scanDirectory } from '@content-hub/core';

async function test() {
  const posts = await scanDirectory('test/fixtures/posts/valid');
  console.log(`✓ 扫描到 ${posts.length} 篇文章`);

  posts.forEach(post => {
    console.log(`  - ${post.id}: ${post.frontmatter.title}`);
  });
}

test().catch(console.error);
EOF

cd "$PROJECT_ROOT" && npx tsx /tmp/test-scan.js
echo ""

# 测试索引构建
echo "📊 测试 4: 索引构建"
cat > /tmp/test-index.js << 'EOF'
import { buildIndex, scanDirectory } from '@content-hub/core';

async function test() {
  const posts = await scanDirectory('test/fixtures/posts/valid');
  const index = await buildIndex(posts);

  console.log('✓ 索引构建成功');
  console.log(`  - 版本: ${index.version}`);
  console.log(`  - 总文章数: ${index.metadata.totalPosts}`);
  console.log(`  - 草稿数: ${index.metadata.draftCount}`);
  console.log(`  - 所有标签: ${index.metadata.allTags.join(', ')}`);
}

test().catch(console.error);
EOF

cd "$PROJECT_ROOT" && npx tsx /tmp/test-index.js
echo ""

# 清理临时文件
rm -f /tmp/test-*.js

echo "✅ 所有单元测试完成！"
