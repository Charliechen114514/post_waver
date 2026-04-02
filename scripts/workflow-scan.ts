import { WorkflowOrchestrator } from '../packages/engine/src/workflow/orchestrator.js'

async function main() {
  const orchestrator = new WorkflowOrchestrator()

  await orchestrator.scanAndInitialize()
}

main().catch(error => {
  console.error('扫描失败:', error)
  process.exit(1)
})
