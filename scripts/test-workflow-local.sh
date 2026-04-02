#!/bin/bash
set -e

echo "🧪 完整本地构建测试（模拟 GitHub Actions）"
echo "=========================================="
echo ""

# 1. 环境检查
echo "📋 检查环境..."
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js 未安装"
  exit 1
fi
echo "  ✅ Node.js: $(node --version)"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "❌ pnpm 未安装"
  exit 1
fi
echo "  ✅ pnpm: $(pnpm --version)"

if command -v act >/dev/null 2>&1; then
  echo "  ✅ act: $(act --version)"
  ACT_AVAILABLE=true
else
  echo "  ⚠️  act 未安装，将跳过 workflow 测试"
  echo "     安装方法: curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash"
  ACT_AVAILABLE=false
fi

echo ""

# 2. 清理并安装依赖（模拟 CI 环境）
echo "📦 安装依赖（--frozen-lockfile 模式）..."
if [ "$CLEAN_BUILD" = "true" ]; then
  echo "  🧹 清理现有依赖..."
  rm -rf node_modules .pnpm-store
fi
pnpm install --frozen-lockfile
echo "  ✅ 依赖安装完成"
echo ""

# 3. 构建所有包
echo "🔨 构建所有包..."
pnpm build
echo "  ✅ 所有包构建完成"
echo ""

# 4. 构建 Web UI
echo "🎨 构建 Web UI..."
pnpm --filter @content-hub/web-ui build
echo "  ✅ Web UI 构建完成"
echo ""

# 5. 验证构建产物
echo "✅ 验证构建产物..."
if [ ! -d "packages/web-ui/dist" ]; then
  echo "❌ 构建失败：dist 目录不存在"
  exit 1
fi

echo "📦 构建产物："
ls -lh packages/web-ui/dist | head -10
echo ""

# 6. 检查关键文件
echo "🔍 检查关键文件..."
required_files=("index.html" "assets")
for file in "${required_files[@]}"; do
  if [ -f "packages/web-ui/dist/$file" ] || [ -d "packages/web-ui/dist/$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file 缺失"
    exit 1
  fi
done
echo ""

# 7. 构建测试总结
echo "=========================================="
echo "✅ 所有构建测试通过！"
echo ""
echo "下一步："
echo "  1. 本地预览: pnpm preview:prod"
echo "  2. 运行 act:  pnpm test:workflow:act"
echo ""

# 8. 如果安装了 act，运行 workflow 测试
if [ "$ACT_AVAILABLE" = true ] && [ "$RUN_ACT" = "true" ]; then
  echo "🐳 使用 Docker 运行 GitHub Actions workflow 测试..."
  echo "   这将完全模拟 CI 环境"
  echo ""

  # 列出所有 jobs
  echo "📋 可用的 jobs："
  act -l .github/workflows/deploy-web.yml

  # 运行 deploy job（但跳过实际部署）
  echo ""
  echo "🚀 运行 deploy job（dry-run 模式）..."
  act -j deploy -n  # -n 表示 dry-run
fi
