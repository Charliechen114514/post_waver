#!/usr/bin/env tsx
/**
 * 标题注入测试工具
 *
 * 用法：
 *   pnpm title:injector:test --post my-post --platform juejin
 */

import { TitleInjectorConfigManager } from '@content-hub/config'
import { injectTitlePostContent } from '@content-hub/core'
import { readFileSync } from 'fs'
import { join } from 'path'

interface TestOptions {
  post?: string
  platform?: string
  content?: string
}

async function main() {
  const args = process.argv.slice(2)
  const options: TestOptions = {}

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--post' && args[i + 1]) {
      options.post = args[++i]
    } else if (args[i] === '--platform' && args[i + 1]) {
      options.platform = args[++i]
    } else if (args[i] === '--content' && args[i + 1]) {
      options.content = args[++i]
    }
  }

  if (!options.post) {
    console.error('❌ 错误: 必须指定 --post')
    printUsage()
    process.exit(1)
  }

  const platform = (options.platform || 'juejin') as 'juejin' | 'wechat' | 'html'

  console.log(`\n🧪 测试标题注入功能`)
  console.log(`📝 文章: ${options.post}`)
  console.log(`🔧 平台: ${platform}\n`)

  // 读取文章内容
  const postPath = join(process.cwd(), 'content/posts', `${options.post}.md`)
  let content: string

  try {
    content = readFileSync(postPath, 'utf-8')
  } catch (error) {
    try {
      const postPath2 = join(process.cwd(), 'content/posts', options.post, 'index.md')
      content = readFileSync(postPath2, 'utf-8')
    } catch (error2) {
      console.error(`❌ 错误: 无法读取文章 "${options.post}"`)
      console.error('   尝试的路径:')
      console.error(`   1. ${postPath}`)
      console.error(`   2. ${join(process.cwd(), 'content/posts', options.post, 'index.md')}`)
      process.exit(1)
    }
  }

  // 获取配置
  const configManager = new TitleInjectorConfigManager()
  const config = await configManager.getPostConfig(options.post, platform)

  console.log('⚙️  配置信息:')
  console.log(`   状态: ${config.enabled ? '✅ 启用' : '❌ 禁用'}`)
  console.log(`   位置: ${config.position}`)
  console.log(`   内容: ${config.content || '(未设置)'}\n`)

  // 如果提供了直接的内容参数，使用它
  const injectionContent = options.content || config.content

  if (!injectionContent || !config.enabled) {
    console.log('⏭️  标题注入未启用或无内容，显示原文:\n')
    console.log('─'.repeat(60))
    console.log(content)
    console.log('─'.repeat(60))
    return
  }

  // 执行注入
  const injectedContent = injectTitlePostContent(content, {
    platform,
    customContent: injectionContent,
    enabled: true,
    position: config.position
  })

  console.log('✅ 注入后的内容:\n')
  console.log('─'.repeat(60))
  console.log(injectedContent)
  console.log('─'.repeat(60))

  // 显示差异
  console.log('\n📊 统计信息:')
  console.log(`   原文长度: ${content.length} 字符`)
  console.log(`   注入后长度: ${injectedContent.length} 字符`)
  console.log(`   增加长度: ${injectedContent.length - content.length} 字符`)
  console.log(`   注入内容: ${injectionContent.length} 字符\n`)
}

function printUsage() {
  console.log(`
标题注入测试工具

用法:
  pnpm title:injector:test --post <id> [options]

选项:
  --post <id>          文章 ID (必需)
  --platform <name>    平台名称 (juejin, wechat, html, 默认: juejin)
  --content <text>     自定义注入内容 (可选)

示例:
  # 使用配置的注入内容测试掘金平台
  pnpm title:injector:test --post my-article --platform juejin

  # 使用自定义内容测试
  pnpm title:injector:test --post my-article --content "欢迎订阅"

  # 测试微信公众号平台
  pnpm title:injector:test --post my-article --platform wechat
`)
}

main().catch(console.error)
