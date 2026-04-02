import { WorkflowOrchestrator } from '../packages/engine/src/workflow/orchestrator.js'

async function main() {
  const postId = process.argv[2]
  const isFastMode = process.argv.includes('--fast')

  if (!postId) {
    console.error('❌ 请提供文章 ID')
    console.log('\n用法: pnpm workflow:process <postId> [--fast]')
    console.log('  --fast    跳过预览确认，直接生成发布页面')
    console.log('\n示例:')
    console.log('  pnpm workflow:process example-post        # 带预览确认')
    console.log('  pnpm workflow:process example-post --fast # 快速模式')
    process.exit(1)
  }

  const orchestrator = new WorkflowOrchestrator()

  try {
    await orchestrator.processPost(postId, { fast: isFastMode })
  } catch (error) {
    // 区分用户取消和真正的错误
    if (error instanceof Error && error.name === 'USER_CANCELLED') {
      console.log('\n✅ 操作已取消')
      process.exit(0)  // 用户取消是正常退出
    } else {
      console.error('\n❌ 处理失败:', error)
      process.exit(1)
    }
  }
}

main().catch(error => {
  // 区分用户取消和真正的错误
  if (error instanceof Error && error.name === 'USER_CANCELLED') {
    console.log('\n✅ 操作已取消')
    process.exit(0)
  } else {
    console.error('\n处理失败:', error)
    process.exit(1)
  }
}).then(() => process.exit(0))
