#!/bin/bash
# 测试模板注入功能
# 用于验证批量发布时模板注入是否正常工作

echo "🧪 测试模板注入功能"
echo "===================="
echo ""

# 检查是否有正在运行的服务
echo "1️⃣ 检查服务状态..."
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "❌ API 服务器未运行，请先运行: pnpm dev:api"
    exit 1
fi
if ! curl -s http://localhost:5173 > /dev/null; then
    echo "❌ Web UI 未运行，请先运行: pnpm dev"
    exit 1
fi
echo "✅ 服务运行正常"
echo ""

# 检查是否有可用的文章
echo "2️⃣ 检查文章..."
POST_COUNT=$(ls -1 content/posts/*.md 2>/dev/null | wc -l)
if [ "$POST_COUNT" -eq 0 ]; then
    echo "❌ 没有找到文章，请在 content/posts/ 目录下创建测试文章"
    exit 1
fi
echo "✅ 找到 $POST_COUNT 篇文章"
echo ""

# 检查是否有注入模板
echo "3️⃣ 检查注入模板..."
TEMPLATE_COUNT=$(sqlite3 packages/database/prisma/dev.db "SELECT COUNT(*) FROM InjectionTemplate WHERE enabled = 1;" 2>/dev/null || echo "0")
if [ "$TEMPLATE_COUNT" -eq 0 ]; then
    echo "⚠️  没有找到启用的注入模板"
    echo "   请先在 Web UI 中创建并启用一个注入模板"
    echo "   访问: http://localhost:5173/post_waver/templates"
    exit 1
fi
echo "✅ 找到 $TEMPLATE_COUNT 个启用的注入模板"
echo ""

echo "4️⃣ 测试步骤："
echo "   a) 访问 http://localhost:5173/post_waver/publish"
echo "   b) 扫描文章（点击 🔄 扫描文章）"
echo "   c) 选择文章，选择注入模板"
echo "   d) 勾选「加入发布列表」"
echo "   e) 点击 📦 批量发布"
echo "   f) 在发布页面等待任务完成"
echo "   g) 点击复制按钮，检查内容是否包含注入的模板"
echo ""

echo "5️⃣ 调试信息："
echo "   - 打开浏览器开发者工具（F12）"
echo "   - 查看 Console 标签，搜索 [GridLayout]"
echo "   - 应该看到类似「获取 微信公众号 内容，参数: { platform: 'wechat', injectionTemplateId: 'xxx' }」"
echo "   - 这说明模板参数已正确传递"
echo ""

echo "✅ 准备完成！请按照上述步骤测试"
echo ""
echo "💡 提示："
echo "   - 如果复制的内容没有包含模板注入，请检查控制台是否有错误"
echo "   - 可以在 Network 标签中查看 /api/posts/:id/preview 请求的参数"
echo "   - 生成的文件在 output/ 目录下，可以直接查看 wechat.txt 等文件"
