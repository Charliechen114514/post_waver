import { WorkflowOrchestrator } from '../packages/engine/src/workflow/orchestrator.js'
import { disconnectDatabase, disconnectStatusTransition } from '../packages/database/dist/index.js'

async function main() {
  const postId = process.argv[2]

  if (!postId) {
    console.error('❌ 请提供文章 ID')
    console.log('\n用法: pnpm workflow:rollback <postId>')
    console.log('示例: pnpm workflow:rollback example-post')
    process.exit(1)
  }

  const orchestrator = new WorkflowOrchestrator()

  try {
    await orchestrator.rollback(postId)
  } catch (error) {
    console.error('\n回滚失败:', error)
    process.exit(1)
  } finally {
    await disconnectDatabase()
    await disconnectStatusTransition()
  }
}

main().catch(error => {
  console.error('回滚失败:', error)
  process.exit(1)
}).then(() => {
  process.exit(0)
})
