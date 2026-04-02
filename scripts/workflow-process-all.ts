import { WorkflowOrchestrator } from '../packages/engine/src/workflow/orchestrator.js'

async function main() {
  const orchestrator = new WorkflowOrchestrator()

  try {
    await orchestrator.processAll()
  } catch (error) {
    console.error('\n批量处理失败:', error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('\n批量处理失败:', error)
  process.exit(1)
}).then(() => process.exit(0))
