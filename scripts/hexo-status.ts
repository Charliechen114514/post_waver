#!/usr/bin/env tsx
import { HexoConfigManager } from '../packages/config/dist/hexo-config.js'
import { HexoSyncEngine } from '../packages/engine/dist/hexo/sync-engine.js'

async function main() {
  const postId = process.argv[2]

  if (!postId) {
    console.error('❌ 请提供文章 ID')
    console.error('用法: pnpm hexo:status <postId>')
    console.error('示例: pnpm hexo:status my-first-post')
    process.exit(1)
  }

  const hexoConfig = new HexoConfigManager()

  // 检查是否启用
  if (!hexoConfig.get('enabled')) {
    console.warn('⚠️  Hexo 同步未启用')
    console.warn('💡 启用方法: pnpm hexo:config set enabled true')
    process.exit(1)
  }

  // 检查状态
  const engine = new HexoSyncEngine(hexoConfig.getAll())
  const status = await engine.checkSyncStatus(postId)

  console.log(`\n📊 文章 "${postId}" 的 Hexo 同步状态:\n`)

  const rows = [
    { '状态': '在 Hexo 博客中', '值': status.inHexo ? '✅ 是' : '❌ 否' },
    { '状态': '已提交到 Git', '值': status.committed ? '✅ 是' : '❌ 否' },
    { '状态': '已推送到远程', '值': status.pushed ? '✅ 是' : '❌ 否' },
    { '状态': '已部署', '值': status.deployed ? '✅ 是' : '❌ 否' }
  ]

  // 简单的表格输出
  console.log('┌─────────────────────┬─────────┐')
  rows.forEach(row => {
    const key = row['状态']
    const value = row['值']
    console.log(`│ ${key.padEnd(19)} │ ${value.padEnd(7)} │`)
  })
  console.log('└─────────────────────┴─────────┘')

  if (!status.inHexo) {
    console.log('\n💡 提示: 文章尚未同步到 Hexo')
    console.log('   运行: pnpm hexo:sync', postId)
  }
}

main().catch(error => {
  console.error('❌ 执行失败:', error)
  process.exit(1)
})