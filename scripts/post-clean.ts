#!/usr/bin/env tsx
import { PostCleaner } from '../packages/engine/src/workflow/post-cleaner.js'
import { disconnectDatabase } from '../packages/database/dist/index.js'

async function main() {
  const args = process.argv.slice(2)
  const postId = args[0]
  const dryRun = args.includes('--dry-run') || args.includes('-n')

  if (!postId) {
    console.error('\n❌ 请提供文章 ID\n')
    console.log('用法:')
    console.log('  pnpm post:clean <postId>              # 清理文章')
    console.log('  pnpm post:clean <postId> --dry-run    # 预演模式（不实际删除）')
    console.log('  pnpm post:clean <postId> -n           # 预演模式（简写）\n')
    console.log('示例:')
    console.log('  pnpm post:clean hello-world')
    console.log('  pnpm post:clean hello-world --dry-run\n')
    console.log('说明:')
    console.log('  清理操作会删除文章的本地文件（Markdown + 资源），但保留数据库记录')
    console.log('  清理前会提取并保存标签信息到数据库')
    console.log('  只能清理已发布（published）状态的文章\n')
    process.exit(1)
  }

  console.log(`\n🧹 清理文章: ${postId}`)
  if (dryRun) {
    console.log(`   ⏭️  预演模式（不会实际删除文件）\n`)
  } else {
    console.log(`   ⚠️  警告：此操作将删除文章文件，无法撤销！\n`)
  }

  const cleaner = new PostCleaner()
  const result = await cleaner.clean(postId, { dryRun })

  if (result.success) {
    console.log(`\n✅ 清理${dryRun ? '预演' : ''}完成`)
    console.log(`   📁 将删除/已删除文件: ${result.deletedFiles.length}`)
    if (result.deletedFiles.length > 0) {
      result.deletedFiles.forEach(f => console.log(`      - ${f}`))
    }
    console.log(`   📝 保留标签: ${result.savedTags.length > 0 ? result.savedTags.join(', ') : '(无)'}`)
    console.log(`   📦 状态将更新为: archived`)

    if (!dryRun) {
      console.log(`\n💡 提示:`)
      console.log(`   - 文章内容已从本地删除`)
      console.log(`   - 数据库记录和平台链接已保留`)
      console.log(`   - 标签信息已保存到数据库`)
      console.log(`   - 如需重新发布，需从平台复制内容并重新创建\n`)
    }
  } else {
    console.error(`\n❌ 清理失败: ${result.error}`)
    await disconnectDatabase()
    process.exit(1)
  }

  // 断开数据库连接
  await disconnectDatabase()
}

main().catch(async (error) => {
  console.error('\n清理失败:', error)
  await disconnectDatabase()
  process.exit(1)
}).then(() => process.exit(0))
