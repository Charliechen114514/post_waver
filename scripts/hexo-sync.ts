#!/usr/bin/env tsx
import { HexoConfigManager } from '../packages/config/dist/hexo-config.js'
import { HexoSyncEngine } from '../packages/engine/dist/hexo/sync-engine.js'

async function main() {
  const postId = process.argv[2]

  if (!postId) {
    console.error('❌ 请提供文章 ID')
    console.error('用法: pnpm hexo:sync <postId>')
    console.error('示例: pnpm hexo:sync my-first-post')
    process.exit(1)
  }

  const hexoConfig = new HexoConfigManager()

  // 检查是否启用
  if (!hexoConfig.get('enabled')) {
    console.warn('⚠️  Hexo 同步未启用')
    console.warn('💡 启用方法: pnpm hexo:config set enabled true')
    process.exit(1)
  }

  // 验证配置
  const validation = await hexoConfig.validate()
  if (!validation.valid) {
    console.error('❌ Hexo 配置无效:')
    validation.errors.forEach(err => console.error(`  - ${err}`))
    console.error('💡 配置方法: pnpm hexo:config set blogPath <path>')
    process.exit(1)
  }

  // 执行同步
  const engine = new HexoSyncEngine(hexoConfig.getAll())
  const result = await engine.syncPost(postId)

  if (result.success) {
    console.log('\n✅ 同步成功')
    console.log(`📁 文件: ${result.hexoPostPath}`)
    console.log(`📦 资源: ${result.assetsCopied} 个`)

    if (result.committed) {
      console.log(`✅ 已提交到 Git`)
    }

    if (result.pushed) {
      console.log(`✅ 已推送到远程`)
    }

    if (result.deployed && result.blogUrl) {
      console.log(`🚀 已部署: ${result.blogUrl}`)
    }
  } else {
    console.error('\n❌ 同步失败:', result.error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('❌ 执行失败:', error)
  process.exit(1)
})