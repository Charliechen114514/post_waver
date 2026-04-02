#!/usr/bin/env tsx
import { HexoConfigManager } from '../packages/config/dist/hexo-config.js'
import { HexoSyncEngine } from '../packages/engine/dist/hexo/sync-engine.js'
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
  const deployConfig = hexoConfig.get('deploy')

  console.log('\n🚀 开始 Hexo 部署流程...\n')

  try {
    // 1. 清理之前的构建
    console.log('1/4 清理构建文件...')
    execSync('npx hexo clean', {
      cwd: blogPath,
      stdio: 'inherit'
    })
    console.log('  ✅ 清理完成\n')

    // 2. 生成静态文件
    console.log('2/4 生成静态文件...')
    execSync('npx hexo generate', {
      cwd: blogPath,
      stdio: 'inherit',
      timeout: deployConfig.timeout
    })
    console.log('  ✅ 生成完成\n')

    // 3. 部署
    console.log('3/4 部署到远程...')
    execSync(deployConfig.command, {
      cwd: blogPath,
      stdio: 'inherit',
      timeout: deployConfig.timeout
    })
    console.log('  ✅ 部署完成\n')

    // 4. 获取博客 URL
    const hexoConfig = require('fs').readFileSync(
      resolve(blogPath, '_config.yml'),
      'utf-8'
    )
    const urlMatch = hexoConfig.match(/^url:\s*(.+)$/m)
    const blogUrl = urlMatch ? urlMatch[1].trim() : 'your-blog-url'

    console.log('4/4 部署成功！')
    console.log(`\n🎉 博客已部署: ${blogUrl}\n`)

  } catch (error) {
    console.error('\n❌ 部署失败:', error)
    console.error('\n💡 提示:')
    console.error('   1. 检查 _config.yml 中的 deploy 配置')
    console.error('   2. 确保已配置正确的 git 仓库或其他部署方式')
    console.error('   3. 检查网络连接\n')
    process.exit(1)
  }
}

main().catch(error => {
  console.error('❌ 执行失败:', error)
  process.exit(1)
})