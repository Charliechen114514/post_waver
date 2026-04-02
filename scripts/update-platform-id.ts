#!/usr/bin/env tsx
/**
 * 平台ID管理CLI工具
 *
 * 用法：
 *   pnpm platform:id:update <postId> --platform <platform> --id <postId> [--url <url>]
 *   pnpm platform:id:remove <postId> --platform <platform>
 *   pnpm platform:id:status <postId>
 *   pnpm platform:id:import <jsonFile>
 */

import { Command } from 'commander'
import * as fs from 'fs'
import * as path from 'path'
import {
  loadPlatformIds,
  savePlatformIds,
  updatePlatformId,
  removePlatformId,
  getPlatformId,
  getAllPlatformIds
} from '../packages/core/src/platform-link-generator.js'

const program = new Command()

program
  .name('platform-id')
  .description('管理文章的平台ID映射表')
  .version('1.0.0')

/**
 * 更新平台ID
 */
program
  .command('update <postId>')
  .description('更新文章的平台ID')
  .requiredOption('-p, --platform <platform>', '目标平台 (juejin, zhihu, csdn, wechat)')
  .requiredOption('-i, --id <postId>', '平台文章ID')
  .option('-u, --url <url>', '文章完整URL（可选）')
  .option('-f, --file <path>', 'platform-ids.json 文件路径')
  .action((postId, options) => {
    const { platform, id: postIdValue, url, file } = options

    // 验证平台名称
    const validPlatforms = ['juejin', 'zhihu', 'csdn', 'wechat']
    if (!validPlatforms.includes(platform)) {
      console.error(`❌ 无效的平台: ${platform}`)
      console.log(`   支持的平台: ${validPlatforms.join(', ')}`)
      process.exit(1)
    }

    try {
      updatePlatformId(postId, platform, postIdValue, url, file)

      console.log(`✅ 成功更新平台ID`)
      console.log(`   文章ID: ${postId}`)
      console.log(`   平台: ${platform}`)
      console.log(`   平台文章ID: ${postIdValue}`)
      if (url) {
        console.log(`   URL: ${url}`)
      }
    } catch (error) {
      console.error('❌ 更新失败:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

/**
 * 删除平台ID
 */
program
  .command('remove <postId>')
  .description('删除文章的平台ID')
  .requiredOption('-p, --platform <platform>', '目标平台')
  .option('-f, --file <path>', 'platform-ids.json 文件路径')
  .action((postId, options) => {
    const { platform, file } = options

    try {
      removePlatformId(postId, platform, file)

      console.log(`✅ 成功删除平台ID`)
      console.log(`   文章ID: ${postId}`)
      console.log(`   平台: ${platform}`)
    } catch (error) {
      console.error('❌ 删除失败:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

/**
 * 查看文章的平台ID状态
 */
program
  .command('status <postId>')
  .description('查看文章的平台ID状态')
  .option('-f, --file <path>', 'platform-ids.json 文件路径')
  .action((postId, options) => {
    const { file } = options

    try {
      const allIds = getAllPlatformIds(postId, file)
      const platforms = ['juejin', 'zhihu', 'csdn', 'wechat']

      console.log(`\n📄 文章ID: ${postId}`)
      console.log(`\n平台发布状态：`)
      console.log('─'.repeat(50))

      let hasAny = false
      platforms.forEach(platform => {
        const info = allIds[platform]
        if (info) {
          hasAny = true
          console.log(`\n${platform.toUpperCase()}`)
          console.log(`  文章ID: ${info.postId}`)
          if (info.url) {
            console.log(`  URL: ${info.url}`)
          }
          if (info.publishedAt) {
            console.log(`  发布时间: ${new Date(info.publishedAt).toLocaleString('zh-CN')}`)
          }
        } else {
          console.log(`\n${platform.toUpperCase()}`)
          console.log(`  ❌ 未发布`)
        }
      })

      if (!hasAny) {
        console.log('\n⚠️  该文章尚未在任何平台发布')
      }

      console.log('\n' + '─'.repeat(50))
    } catch (error) {
      console.error('❌ 查询失败:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

/**
 * 批量导入平台ID
 */
program
  .command('import <jsonFile>')
  .description('从JSON文件批量导入平台ID')
  .option('-f, --file <path>', '目标 platform-ids.json 文件路径')
  .action((jsonFile, options) => {
    const { file } = options

    try {
      // 读取导入文件
      const importPath = path.resolve(jsonFile)
      if (!fs.existsSync(importPath)) {
        console.error(`❌ 文件不存在: ${importPath}`)
        process.exit(1)
      }

      const importData = JSON.parse(fs.readFileSync(importPath, 'utf-8'))

      // 读取现有映射表
      const platformIds = loadPlatformIds(file)

      // 合并数据
      let updateCount = 0
      Object.entries(importData.mappings || {}).forEach(([postId, mapping]: [string, any]) => {
        if (!platformIds.mappings[postId]) {
          platformIds.mappings[postId] = {}
        }

        Object.entries(mapping).forEach(([platform, info]: [string, any]) => {
          platformIds.mappings[postId][platform] = info
          updateCount++
        })
      })

      // 保存
      savePlatformIds(platformIds, file)

      console.log(`✅ 成功导入 ${updateCount} 条平台ID记录`)
      console.log(`   源文件: ${importPath}`)
      console.log(`   目标文件: ${file || path.join(process.cwd(), 'content', 'platform-ids.json')}`)
    } catch (error) {
      console.error('❌ 导入失败:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

/**
 * 列出所有文章的平台ID状态
 */
program
  .command('list')
  .description('列出所有文章的平台ID状态')
  .option('-f, --file <path>', 'platform-ids.json 文件路径')
  .action((options) => {
    const { file } = options

    try {
      const platformIds = loadPlatformIds(file)
      const postIds = Object.keys(platformIds.mappings)

      if (postIds.length === 0) {
        console.log('📭 平台ID映射表为空')
        return
      }

      console.log(`\n📊 平台ID映射表概览`)
      console.log(`总共 ${postIds.length} 篇文章`)
      console.log('─'.repeat(50))

      postIds.forEach(postId => {
        const mapping = platformIds.mappings[postId]
        const platforms = Object.keys(mapping).join(', ')
        console.log(`\n${postId}`)
        console.log(`  已发布平台: ${platforms || '无'}`)
      })

      console.log('\n' + '─'.repeat(50))
      console.log(`\n使用 "pnpm platform:id:status <postId>" 查看详情`)
    } catch (error) {
      console.error('❌ 查询失败:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

// 解析命令行参数
program.parse(process.argv)

// 如果没有提供命令，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp()
}
