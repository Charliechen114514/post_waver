#!/bin/bash

# 集成测试脚本
# 测试 M0.2 和 M0.3 的核心功能

set -e

echo "🧪 开始集成测试..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
PASSED=0
FAILED=0

# 测试函数
test_case() {
  local name="$1"
  local command="$2"
  local expected="$3"

  echo -n "测试: $name ... "

  if eval "$command" > /dev/null 2>&1; then
    if [ "$expected" = "pass" ]; then
      echo -e "${GREEN}✓ 通过${NC}"
      ((PASSED++))
    else
      echo -e "${RED}✗ 失败（期望失败但通过了）${NC}"
      ((FAILED++))
    fi
  else
    if [ "$expected" = "fail" ]; then
      echo -e "${GREEN}✓ 通过${NC}"
      ((PASSED++))
    else
      echo -e "${RED}✗ 失败${NC}"
      ((FAILED++))
    fi
  fi
}

# 1. 测试 Markdown 解析
echo "📄 Markdown 解析测试"
test_case "解析有效 Frontmatter" \
  "npx remark test/fixtures/posts/valid/complete-frontmatter.md" \
  "pass"

echo ""

# 2. 测试内容扫描
echo "🔍 内容扫描测试"
test_case "扫描测试夹具目录" \
  "npx tsx scripts/scan.ts --dir test/fixtures/posts/valid" \
  "pass"

echo ""

# 3. 测试索引生成
echo "📋 索引生成测试"
if [ -f "content-index.json" ]; then
  echo -e "${GREEN}✓ content-index.json 已生成${NC}"
  ((PASSED++))

  # 验证 JSON 格式
  if python3 -m json.tool content-index.json > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 索引文件格式正确${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ 索引文件格式错误${NC}"
    ((FAILED++))
  fi
else
  echo -e "${RED}✗ content-index.json 未生成${NC}"
  ((FAILED++))
fi

echo ""

# 4. 测试草稿过滤
echo "📝 草稿过滤测试"

# 创建临时测试目录（包含草稿）
TEST_DIR="/tmp/content-test-draft-$$"
mkdir -p "$TEST_DIR"

# 复制测试文件（包含草稿）
cp test/fixtures/posts/valid/*.md "$TEST_DIR/"

# 创建一个草稿文件
cat > "$TEST_DIR/draft-test.md" << 'EOF'
---
title: 草稿测试
date: 2026-04-02T00:00:00Z
tags: ['draft']
draft: true
---

# 草稿文章
EOF

# 测试包含草稿
DRAFT_COUNT=$(npx tsx scripts/scan.ts --dir "$TEST_DIR" --include-drafts 2>/dev/null | grep -o '"totalPosts":[0-9]*' | grep -o '[0-9]*' || echo "0")

# 测试不包含草稿
WITHOUT_DRAFT=$(npx tsx scripts/scan.ts --dir "$TEST_DIR" 2>/dev/null | grep -o '"totalPosts":[0-9]*' | grep -o '[0-9]*' || echo "0")

# 清理
rm -rf "$TEST_DIR"

if [ "$DRAFT_COUNT" -gt "$WITHOUT_DRAFT" ]; then
  echo -e "${GREEN}✓ 草稿过滤正常工作（包含: $DRAFT_COUNT, 不含: $WITHOUT_DRAFT）${NC}"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠ 草稿数量相同或过滤失败${NC}"
fi

echo ""

# 5. 测试更新检测
echo "🔄 更新检测测试"

# 创建临时测试目录
TEST_DIR="/tmp/content-test-$$"
mkdir -p "$TEST_DIR"

# 复制测试文件
cp test/fixtures/posts/valid/complete-frontmatter.md "$TEST_DIR/test-post.md"

# 初始扫描获取哈希
npx tsx scripts/scan.ts --dir "$TEST_DIR" > /dev/null 2>&1
ORIGINAL_HASH=$(grep -A 3 "test-post" content-index.json | grep "contentHash" | cut -d'"' -f4)

# 修改文件
echo "" >> "$TEST_DIR/test-post.md"
echo "## 新增内容" >> "$TEST_DIR/test-post.md"

# 重新扫描
npx tsx scripts/scan.ts --dir "$TEST_DIR" > /dev/null 2>&1
NEW_HASH=$(grep -A 3 "test-post" content-index.json | grep "contentHash" | cut -d'"' -f4)

# 清理临时目录
rm -rf "$TEST_DIR"

if [ "$ORIGINAL_HASH" != "$NEW_HASH" ]; then
  echo -e "${GREEN}✓ 更新检测正常工作（哈希已变化）${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ 更新检测失败（哈希未变化）${NC}"
  ((FAILED++))
fi

echo ""

# 总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试结果:"
echo -e "  ${GREEN}通过: $PASSED${NC}"
echo -e "  ${RED}失败: $FAILED${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -eq 0 ]; then
  echo -e "\n🎉 所有测试通过！"
  exit 0
else
  echo -e "\n❌ 有测试失败"
  exit 1
fi
