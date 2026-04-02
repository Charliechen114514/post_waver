#!/usr/bin/env tsx
import { OutputCleanupManager } from '../packages/engine/dist/publish/cleanup.js'

async function main() {
  const args = process.argv.slice(2)
  const daysIndex = args.indexOf('--days')
  const dryRun = args.includes('--dry-run')

  const days = daysIndex !== -1 ? parseInt(args[daysIndex + 1]) : undefined

  const manager = new OutputCleanupManager()
  await manager.cleanup({ days, dryRun })
}

main().catch(console.error)
