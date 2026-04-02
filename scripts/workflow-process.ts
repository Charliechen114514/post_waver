import { WorkflowOrchestrator } from '../packages/engine/src/workflow/orchestrator.js'

async function main() {
  const postId = process.argv[2]

  if (!postId) {
    console.error('❌ 请提供文章 ID')
    console.log('\n用法: pnpm workflow:process <postId>')
    console.log('示例: pnpm workflow:process example-post')
    process.exit(1)
  }

  const orchestrator = new WorkflowOrchestrator()

  try {
    await orchestrator.processPost(postId)
  } catch (error) {
    console.error('\n处理失败:', error)
    process.exit(1)
  }
}

main()
