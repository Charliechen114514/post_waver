#!/bin/bash

set -e  # 遇到错误立即退出

echo "🔄 开始重置环境..."

# 1. 停止所有运行的服务
echo ""
echo "🛑 停止运行中的服务..."
pkill -f "pnpm dev" || true
pkill -f "vite" || true
pkill -f "tsx.*preview" || true
sleep 1

# 2. 清空内容目录（保留目录结构）
echo ""
echo "🗑️  清空内容目录..."
rm -rf content/posts/*
rm -rf content/done/*
mkdir -p content/posts
mkdir -p content/done
echo "   ✅ 内容目录已清空"

# 3. 清空数据库
echo ""
echo "🗑️  清空数据库..."
rm -f packages/database/prisma/dev.db
rm -f packages/database/prisma/dev.db-journal
echo "   ✅ 数据库已清空"

# 4. 清空索引文件
echo ""
echo "🗑️  清空索引文件..."
rm -f content-index.json
echo "   ✅ 索引文件已清空"

# 5. 清空平台 ID 映射
echo ""
echo "🗑️  清空平台 ID 映射..."
echo "   ✅ 平台 ID 映射将在数据库重置时自动清空"

# 6. 清空输出目录
echo ""
echo "🗑️  清空输出目录..."
rm -rf output/*
mkdir -p output
echo "   ✅ 输出目录已清空"

# 7. 重新生成数据库（自动运行seed导入配置）
echo ""
echo "🔧 重新生成数据库..."
cd packages/database
npx prisma migrate reset --force
cd ../..
echo "   ✅ 数据库已重新生成（配置已自动导入）"


# 创建测试图片目录并复制测试图片
mkdir -p content/posts/assets
if [ -f "content/assets/images/test-image.png" ]; then
  cp content/assets/images/test-image.png content/posts/assets/test-image.png
  echo "   ✅ 已复制测试图片"
else
  echo "   ⚠️  警告: content/assets/images/test-image.png 不存在，创建空文件占位"
  touch content/posts/assets/test-image.png
fi

echo "   ✅ 测试文章已创建（3篇）"

# 9. 初始化工作流状态
echo ""
echo "🔧 初始化工作流状态..."
npx tsx scripts/workflow-scan.ts > /dev/null 2>&1 || echo "   ⚠️  工作流扫描完成（可能有警告）"
echo "   ✅ 工作流状态已初始化"

# 10. 显示环境状态
echo ""
echo "📊 当前环境状态："
echo ""
echo "📁 内容文章："
ls -1 content/posts/*.md 2>/dev/null | wc -l | xargs echo "   - 文章数量:"
echo ""
echo "📁 已完成文章："
ls -1 content/done/*.md 2>/dev/null | wc -l | xargs echo "   - 文章数量:"
echo ""
echo "📦 数据库："
ls -lh packages/database/prisma/dev.db 2>/dev/null | awk '{print "   - 大小: " $5}'
echo ""

# 11. 显示下一步操作提示
echo "✅ 环境重置完成！"
echo ""
echo "🚀 下一步操作："
echo "   1. 启动开发服务器: pnpm dev"
echo "   2. 测试工作流扫描: pnpm workflow:scan"
echo "   3. 处理单篇文章: pnpm workflow:process <postId>"
echo "   4. 批量处理: pnpm workflow:process-all"
echo ""
