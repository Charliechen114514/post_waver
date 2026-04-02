#!/bin/bash

# M1.1 图片迁移集成测试脚本

set -e  # 遇到错误立即退出

echo "🖼️  M1.1 图片迁移集成测试"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 创建临时测试目录
TEST_DIR="$PROJECT_ROOT/../temp-migrate-test"
TEST_POSTS_DIR="$TEST_DIR/posts"
TEST_IMAGES_DIR="$TEST_DIR/posts/images"
TEST_ASSETS_DIR="$TEST_DIR/assets/images"

echo "📁 设置测试环境..."
rm -rf "$TEST_DIR"
mkdir -p "$TEST_POSTS_DIR"
mkdir -p "$TEST_IMAGES_DIR"
mkdir -p "$TEST_ASSETS_DIR"

# 创建测试图片文件
echo "🖼️  创建测试图片..."
touch "$TEST_IMAGES_DIR/image1.png"
touch "$TEST_IMAGES_DIR/image2.jpg"
touch "$TEST_IMAGES_DIR/screenshot.webp"

# 创建测试文章
echo "📝 创建测试文章..."
cat > "$TEST_POSTS_DIR/test-images.md" << 'EOF'
---
title: 图片测试
date: 2026-04-02T00:00:00Z
tags: ['test']
---

# 图片测试

本地图片：
![](./images/image1.png)

另一个本地图片：
<img src="./images/image2.jpg" />

WebP 图片：
![](./images/screenshot.webp)

外链图片（应该保持不变）：
![](https://example.com/external.jpg)

Base64 图片（应该保持不变）：
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==)

缺失图片（应该保持不变）：
![](./missing.png)
EOF

cd "$PROJECT_ROOT/.."

echo ""
echo "🧪 测试 1: Dry-run 模式"
echo "─────────────────────────"
npx tsx scripts/migrate-images.ts --dir "$TEST_POSTS_DIR" --assets-dir "$TEST_ASSETS_DIR" --dry-run

echo ""
echo "🧪 测试 2: 验证 dry-run 不修改文件"
echo "────────────────────────────────"
if grep -q "../images/image1.png" "$TEST_POSTS_DIR/test-images.md"; then
  echo "✅ Dry-run 模式正确：文件未被修改"
else
  echo "❌ Dry-run 失败：文件已被修改"
  exit 1
fi

echo ""
echo "🧪 测试 3: 实际迁移"
echo "──────────────────"
npx tsx scripts/migrate-images.ts --dir "$TEST_POSTS_DIR" --assets-dir "$TEST_ASSETS_DIR"

echo ""
echo "🧪 测试 4: 验证图片路径已更新"
echo "──────────────────────────"
if grep -q "/assets/images/image1.png" "$TEST_POSTS_DIR/test-images.md"; then
  echo "✅ 图片路径已更新为 /assets/images/"
else
  echo "❌ 图片路径未更新"
  cat "$TEST_POSTS_DIR/test-images.md"
  exit 1
fi

echo ""
echo "🧪 测试 5: 验证外链保持不变"
echo "──────────────────────────"
if grep -q "https://example.com/external.jpg" "$TEST_POSTS_DIR/test-images.md"; then
  echo "✅ 外链图片保持不变"
else
  echo "❌ 外链图片被修改"
  exit 1
fi

echo ""
echo "🧪 测试 6: 验证 base64 保持不变"
echo "──────────────────────────"
if grep -q "data:image/png;base64" "$TEST_POSTS_DIR/test-images.md"; then
  echo "✅ Base64 图片保持不变"
else
  echo "❌ Base64 图片被修改"
  exit 1
fi

echo ""
echo "🧪 测试 7: 验证缺失图片保持原路径"
echo "──────────────────────────────"
if grep -q "./missing.png" "$TEST_POSTS_DIR/test-images.md"; then
  echo "✅ 缺失图片路径保持不变"
else
  echo "❌ 缺失图片路径被修改"
  exit 1
fi

echo ""
echo "🧪 测试 8: 验证图片文件已复制"
echo "──────────────────────────"
if [ -f "$TEST_ASSETS_DIR/image1.png" ] && [ -f "$TEST_ASSETS_DIR/image2.jpg" ]; then
  echo "✅ 图片文件已复制到 assets/images/"
else
  echo "❌ 图片文件未复制"
  ls -la "$TEST_ASSETS_DIR"
  exit 1
fi

echo ""
echo "🧪 测试 9: 文件名冲突处理"
echo "────────────────────────"
# 为冲突测试创建新的测试环境
rm -rf "$TEST_DIR"
mkdir -p "$TEST_POSTS_DIR"
mkdir -p "$TEST_IMAGES_DIR"
mkdir -p "$TEST_ASSETS_DIR"

# 重新创建测试图片
touch "$TEST_IMAGES_DIR/image1.png"
touch "$TEST_IMAGES_DIR/image2.jpg"

# 创建第一个文件
cat > "$TEST_POSTS_DIR/test1.md" << 'EOF'
---
title: 测试 1
date: 2026-04-02T00:00:00Z
tags: ['test']
---

![](./images/image1.png)
EOF

# 创建第二个文件（使用相同的图片名）
mkdir -p "$TEST_POSTS_DIR/subdir/images"
cp "$TEST_IMAGES_DIR/image1.png" "$TEST_POSTS_DIR/subdir/images/image1.png"

cat > "$TEST_POSTS_DIR/subdir/test2.md" << 'EOF'
---
title: 测试 2
date: 2026-04-02T00:00:00Z
tags: ['test']
---

![](./images/image1.png)
EOF

npx tsx scripts/migrate-images.ts --dir "$TEST_POSTS_DIR" --assets-dir "$TEST_ASSETS_DIR"

# 检查是否生成了带数字后缀的文件
if [ -f "$TEST_ASSETS_DIR/image1-1.png" ]; then
  echo "✅ 文件名冲突处理正确：生成了 image1-1.png"
else
  echo "❌ 文件名冲突未处理"
  ls -la "$TEST_ASSETS_DIR"
  exit 1
fi

# 清理测试目录
echo ""
echo "🧹 清理测试环境..."
rm -rf "$TEST_DIR"

echo ""
echo "✅ M1.1 所有集成测试通过！"
echo ""
