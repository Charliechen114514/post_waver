import { WorkflowOrchestrator } from '../packages/engine/src/workflow/orchestrator.js'

async function main() {
  const orchestrator = new WorkflowOrchestrator()

  try {
    await orchestrator.scanAndInitialize()
  } catch (error) {
    console.error('扫描失败:', error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('扫描失败:', error)
  process.exit(1)
}).then(() => process.exit(0))
