#!/usr/bin/env tsx
/**
 * 标题注入配置管理工具
 *
 * 用法：
 *   pnpm title:injector:show                           # 查看配置
 *   pnpm title:injector:set --platform juejin         # 设置平台配置
 *   pnpm title:injector:set --post my-post            # 设置文章覆盖
 *   pnpm title:injector:remove --post my-post         # 删除文章覆盖
 *   pnpm title:injector:reset                         # 重置所有配置
 */

import { TitleInjectorConfigManager } from '@content-hub/config'
import { readFileSync } from 'fs'
import { join } from 'path'

interface CommandOptions {
  platform?: string
  post?: string
  content?: string
  enabled?: string
  position?: string
  reset?: boolean
  remove?: boolean
  sync?: boolean
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'show'

  const options: CommandOptions = {}
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--platform' && args[i + 1]) {
      options.platform = args[++i]
    } else if (args[i] === '--post' && args[i + 1]) {
      options.post = args[++i]
    } else if (args[i] === '--content' && args[i + 1]) {
      options.content = args[++i]
    } else if (args[i] === '--enabled' && args[i + 1]) {
      options.enabled = args[++i]
    } else if (args[i] === '--position' && args[i + 1]) {
      options.position = args[++i]
    } else if (args[i] === '--reset') {
      options.reset = true
    } else if (args[i] === '--remove') {
      options.remove = true
    } else if (args[i] === '--sync') {
      options.sync = true
    }
  }

  const configManager = new TitleInjectorConfigManager()

  switch (command) {
    case 'show':
      await showConfig(configManager)
      break

    case 'set':
      await setConfig(configManager, options)
      break

    case 'remove':
      await removeConfig(configManager, options)
      break

    case 'reset':
      await resetConfig(configManager)
      break

    case 'sync':
      await syncToDatabase(configManager)
      break

    default:
      printUsage()
      process.exit(1)
  }
}

async function showConfig(configManager: TitleInjectorConfigManager) {
  console.log('\n📋 标题注入配置\n')

  const allConfig = configManager.getAllConfig()

  console.log('平台配置：')
  console.log('─'.repeat(60))

  for (const [key, config] of Object.entries(allConfig)) {
    console.log(`\n🔹 ${key.toUpperCase()}`)
    console.log(`   状态: ${config.enabled ? '✅ 启用' : '❌ 禁用'}`)
    console.log(`   位置: ${config.position}`)

    if (config.content) {
      console.log(`   内容: ${config.content}`)
    } else {
      console.log(`   内容: (未设置)`)
    }
  }

  console.log('\n' + '─'.repeat(60) + '\n')
}

async function setConfig(configManager: TitleInjectorConfigManager, options: CommandOptions) {
  // 设置文章覆盖
  if (options.post) {
    if (!options.content) {
      console.error('❌ 错误: 使用 --post 时必须提供 --content')
      process.exit(1)
    }

    const enabled = options.enabled !== 'false'
    await configManager.setPostOverride(options.post, options.content, enabled)

    console.log(`✅ 已为文章 "${options.post}" 设置注入内容`)
    console.log(`   内容: ${options.content}`)
    console.log(`   状态: ${enabled ? '启用' : '禁用'}`)
    return
  }

  // 设置平台配置
  if (!options.platform) {
    console.error('❌ 错误: 必须指定 --platform 或 --post')
    process.exit(1)
  }

  const updates: any = {}

  if (options.content !== undefined) {
    updates.content = options.content
  }

  if (options.enabled !== undefined) {
    updates.enabled = options.enabled === 'true'
  }

  if (options.position !== undefined) {
    updates.position = options.position
  }

  configManager.setPlatformConfig(options.platform, updates)

  console.log(`✅ 已更新 ${options.platform} 平台配置`)

  if (updates.content !== undefined) {
    console.log(`   内容: ${updates.content}`)
  }
  if (updates.enabled !== undefined) {
    console.log(`   状态: ${updates.enabled ? '启用' : '禁用'}`)
  }
  if (updates.position !== undefined) {
    console.log(`   位置: ${updates.position}`)
  }
}

async function removeConfig(configManager: TitleInjectorConfigManager, options: CommandOptions) {
  if (!options.post) {
    console.error('❌ 错误: --remove 需要指定 --post')
    process.exit(1)
  }

  await configManager.removePostOverride(options.post)
  console.log(`✅ 已删除文章 "${options.post}" 的注入覆盖配置`)
}

async function resetConfig(configManager: TitleInjectorConfigManager) {
  console.log('⚠️  警告: 这将重置所有平台配置为默认值')
  console.log('是否继续？(yes/no)')

  // 简单的确认（在非交互环境中可能需要调整）
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question('', async (answer: string) => {
    rl.close()

    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      configManager.reset()
      console.log('✅ 配置已重置')
    } else {
      console.log('❌ 操作已取消')
    }
  })
}

async function syncToDatabase(configManager: TitleInjectorConfigManager) {
  console.log('🔄 正在同步配置到数据库...')
  await configManager.syncToDatabase()
  console.log('✅ 配置已同步到数据库')
}

function printUsage() {
  console.log(`
标题注入配置管理工具

用法:
  pnpm title:injector:show                           查看配置
  pnpm title:injector:set [options]                  设置配置
  pnpm title:injector:remove [options]               删除配置
  pnpm title:injector:reset                          重置配置
  pnpm title:injector:sync                           同步到数据库

选项:
  --platform <name>    平台名称 (juejin, wechat, html, global)
  --post <id>          文章 ID
  --content <text>     注入内容
  --enabled <bool>     是否启用 (true/false)
  --position <pos>     注入位置 (after_title/before_content)

示例:
  # 查看所有配置
  pnpm title:injector:show

  # 设置掘金平台配置
  pnpm title:injector:set --platform juejin --content "欢迎订阅我的专栏" --enabled true

  # 为特定文章设置注入内容
  pnpm title:injector:set --post my-article --content "这是一篇特别文章"

  # 删除文章覆盖
  pnpm title:injector:remove --post my-article

  # 重置所有配置
  pnpm title:injector:reset

  # 同步配置到数据库
  pnpm title:injector:sync
`)
}

main().catch(console.error)
