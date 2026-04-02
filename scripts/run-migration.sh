#!/bin/bash
# 迁移脚本执行器
# 自动执行迁移和验证步骤

set -e  # 遇到错误立即退出

echo "🚀 开始 JSON 到数据库迁移流程..."
echo ""

# 1. 构建数据库包
echo "📦 步骤 1: 构建数据库包..."
cd packages/database
pnpm build
npx prisma generate
npx prisma db push
cd ../..
echo "✅ 数据库包构建完成"
echo ""

# 2. 运行迁移
echo "📋 步骤 2: 运行迁移脚本..."
npx tsx scripts/migrate-json-to-db.ts
echo ""

# 3. 验证迁移
echo "🔍 步骤 3: 验证迁移结果..."
npx tsx scripts/test-migration.ts
echo ""

# 4. 详细验证
echo "🔬 步骤 4: 详细验证..."
npx tsx scripts/verify-migration.ts
echo ""

echo "✅ 迁移流程全部完成！"
echo ""
echo "📊 迁移总结:"
echo "   - 所有 JSON 配置已迁移到数据库"
echo "   - 数据库文件: packages/database/prisma/dev.db"
echo "   - 备份位置: .post-waver/backup/"
echo ""
echo "💡 下一步:"
echo "   1. 测试应用功能: pnpm scan"
echo "   2. 确认无误后，可删除原始 JSON 文件"
echo "   3. 后续只需迁移 dev.db 数据库文件"
