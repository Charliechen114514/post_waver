#!/usr/bin/env tsx
import { HexoConfigManager } from '../packages/config/dist/hexo-config.js'
import { readFileSync } from 'fs'

const config = new HexoConfigManager()
const action = process.argv[2]

async function main() {
  switch (action) {
    case 'setup': {
      console.log('\n🔧 Hexo 同步配置向导\n')
      console.log('💡 配置存储位置: 数据库 (Config 表)')

      const currentConfig = config.getAll()
      console.log('\n📋 当前配置:')
      console.log(JSON.stringify(currentConfig, null, 2))

      console.log('\n💡 提示: 直接编辑配置文件，或使用以下命令:')
      console.log('   pnpm hexo:config set <key> <value>')
      console.log('   例如: pnpm hexo:config set enabled true')
      break
    }

    case 'get': {
      const key = process.argv[3]
      if (!key) {
        console.error('❌ 请提供配置项名称')
        process.exit(1)
      }
      const value = config.get(key as any)
      console.log(JSON.stringify(value, null, 2))
      break
    }

    case 'set': {
      const setKey = process.argv[3]
      const setValue = process.argv[4]

      if (!setKey || !setValue) {
        console.error('❌ 请提供配置项名称和值')
        console.error('用法: pnpm hexo:config set <key> <value>')
        console.error('示例: pnpm hexo:config set enabled true')
        process.exit(1)
      }

      try {
        // 尝试解析为 JSON，支持对象和数组
        const parsedValue = JSON.parse(setValue)
        config.set(setKey as any, parsedValue)
        console.log('✅ 配置已更新')
        console.log(`   ${setKey} = ${JSON.stringify(parsedValue)}`)
      } catch (error) {
        // 如果 JSON 解析失败，作为字符串处理
        config.set(setKey as any, setValue as any)
        console.log('✅ 配置已更新')
        console.log(`   ${setKey} = ${setValue}`)
      }
      break
    }

    case 'validate': {
      const validation = await config.validate()
      if (validation.valid) {
        console.log('✅ 配置有效')
      } else {
        console.error('❌ 配置无效:')
        validation.errors.forEach(err => console.error(`  - ${err}`))
        process.exit(1)
      }
      break
    }

    case 'show': {
      const currentConfig = config.getAll()
      console.log('\n📋 当前 Hexo 配置:')
      console.log(JSON.stringify(currentConfig, null, 2))
      break
    }

    default:
      console.log(`
用法:
  pnpm hexo:config setup          # 查看配置说明
  pnpm hexo:config get <key>      # 获取配置项
  pnpm hexo:config set <k> <v>    # 设置配置项
  pnpm hexo:config validate       # 验证配置
  pnpm hexo:config show           # 显示完整配置

配置项:
  enabled          是否启用自动同步 (boolean)
  blogPath         Hexo 博客路径 (string)
  git.autoCommit   是否自动 commit (boolean)
  git.autoPush     是否自动 push (boolean)
  deploy.enabled   是否自动部署 (boolean)

示例:
  pnpm hexo:config set enabled true
  pnpm hexo:config set blogPath "../my-blog"
  pnpm hexo:config get enabled
      `)
  }
}

main().catch(error => {
  console.error('❌ 执行失败:', error)
  process.exit(1)
})