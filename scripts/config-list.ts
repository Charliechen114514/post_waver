#!/usr/bin/env tsx
import { ConfigManager } from '../packages/config/dist/config-manager.js'

async function main() {
  const manager = new ConfigManager()
  const config = await manager.getAll()

  console.log('\n📋 当前配置:\n')
  console.log(JSON.stringify(config, null, 2))
}

main().catch(console.error)
