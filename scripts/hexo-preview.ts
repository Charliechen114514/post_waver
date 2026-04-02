#!/usr/bin/env tsx
import { HexoConfigManager } from '../packages/config/dist/hexo-config.js'
import { execSync } from 'child_process'
import { resolve } from 'path'

async function main() {
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
    process.exit(1)
  }

  const blogPath = resolve(process.cwd(), hexoConfig.get('blogPath'))

  console.log('\n🚀 启动 Hexo 预览服务器...\n')
  console.log(`📂 博客路径: ${blogPath}`)
  console.log(`🌐 预览地址: http://localhost:4000/`)
  console.log(`\n💡 提示: 按 Ctrl+C 停止服务器\n`)

  try {
    // 启动 Hexo 服务器
    execSync('npx hexo server --port 4000', {
      cwd: blogPath,
      stdio: 'inherit'
    })
  } catch (error) {
    // 用户按 Ctrl+C 退出，这是正常的
    console.log('\n\n✅ Hexo 预览服务器已停止')
  }
}

main().catch(error => {
  console.error('❌ 启动失败:', error)
  process.exit(1)
})