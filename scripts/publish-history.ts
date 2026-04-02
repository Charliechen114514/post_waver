#!/usr/bin/env tsx
import { PublishHistoryManager } from '../packages/engine/dist/publish/history-manager.js'

async function main() {
  const postId = process.argv[2]
  if (!postId) {
    console.error('Usage: pnpm publish:history <postId>')
    process.exit(1)
  }

  const manager = new PublishHistoryManager()
  const history = await manager.getPostHistory(postId)

  console.log(`\n📜 发布历史: ${postId}\n`)
  console.table(history)
}

main().catch(console.error)
