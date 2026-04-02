#!/usr/bin/env tsx
import { ConfigManager } from '../packages/config/dist/config-manager.js'

async function main() {
  const [key, ...valueParts] = process.argv.slice(2)
  const value = valueParts.join(' ')

  if (!key || !value) {
    console.error('Usage: pnpm config:set <key> <value>')
    console.error('Example: pnpm config:set autoSync.enabled true')
    process.exit(1)
  }

  const manager = new ConfigManager()

  // 解析值
  let parsedValue: any = value
  if (value === 'true') parsedValue = true
  else if (value === 'false') parsedValue = false
  else if (!isNaN(parseInt(value))) parsedValue = parseInt(value)

  // 设置配置
  manager.set(key as any, parsedValue)

  console.log(`✅ 配置已更新: ${key} = ${parsedValue}`)
}

main().catch(console.error)
