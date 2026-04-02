#!/usr/bin/env tsx
import { PrismaClient } from '../packages/database/dist/prisma/client.js'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

interface UrlRecord {
  postId: string
  platform: string
  url: string
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'set':
      await setUrl(args.slice(1))
      break
    case 'import':
      await importUrls(args.slice(1))
      break
    case 'export':
      await exportUrls(args.slice(1))
      break
    case 'list':
      await listUrls(args.slice(1))
      break
    default:
      showHelp()
  }
}

/**
 * 设置单个 URL
 */
async function setUrl(args: string[]) {
  const postId = args[0]
  const platformIndex = args.indexOf('--platform')
  const urlIndex = args.indexOf('--url')

  if (!postId || platformIndex === -1 || urlIndex === -1) {
    console.error('❌ 缺少必要参数')
    console.log('\n用法:')
    console.log('  pnpm post:publish:url set <postId> --platform <platform> --url <url>')
    console.log('\n示例:')
    console.log('  pnpm post:publish:url hello-world --platform juejin --url https://juejin.cn/post/123456')
    process.exit(1)
  }

  const platform = args[platformIndex + 1]
  const url = args[urlIndex + 1]

  try {
    // 查找文章
    const post = await prisma.post.findUnique({
      where: { postId }
    })

    if (!post) {
      console.error(`❌ 文章未找到: ${postId}`)
      process.exit(1)
    }

    // 更新或创建发布记录
    await prisma.publishRecord.upsert({
      where: {
        id: `${postId}-${platform}` // 临时唯一标识
      },
      update: {
        url
      },
      create: {
        postId: post.id,
        platform,
        url
      }
    })

    console.log(`✅ 已设置发布 URL:`)
    console.log(`   文章: ${postId}`)
    console.log(`   平台: ${platform}`)
    console.log(`   URL: ${url}`)
  } catch (error) {
    console.error(`❌ 错误: ${error}`)
    process.exit(1)
  }
}

/**
 * 批量导入 URL
 */
async function importUrls(args: string[]) {
  const filePath = args[0]

  if (!filePath) {
    console.error('❌ 请提供 JSON 文件路径')
    console.log('\n用法:')
    console.log('  pnpm post:publish:url import <file.json>')
    console.log('\n文件格式:')
    console.log('  [')
    console.log('    {"postId": "hello-world", "platform": "juejin", "url": "https://juejin.cn/post/123"}')
    console.log('  ]')
    process.exit(1)
  }

  try {
    const fullPath = join(process.cwd(), filePath)
    const content = readFileSync(fullPath, 'utf-8')
    const records: UrlRecord[] = JSON.parse(content)

    let successCount = 0
    let failCount = 0

    console.log(`\n📥 开始导入 ${records.length} 条 URL 记录...\n`)

    for (const record of records) {
      try {
        const post = await prisma.post.findUnique({
          where: { postId: record.postId }
        })

        if (!post) {
          console.log(`  ⚠️  跳过: 文章不存在 - ${record.postId}`)
          failCount++
          continue
        }

        await prisma.publishRecord.upsert({
          where: {
            id: `${record.postId}-${record.platform}`
          },
          update: {
            url: record.url
          },
          create: {
            postId: post.id,
            platform: record.platform,
            url: record.url
          }
        })

        console.log(`  ✅ ${record.postId} - ${record.platform}`)
        successCount++
      } catch (error) {
        console.log(`  ❌ ${record.postId} - ${record.platform}: ${error}`)
        failCount++
      }
    }

    console.log(`\n✅ 导入完成!`)
    console.log(`   成功: ${successCount} 条`)
    console.log(`   失败: ${failCount} 条\n`)

  } catch (error) {
    console.error(`❌ 导入失败: ${error}`)
    process.exit(1)
  }
}

/**
 * 导出 URL
 */
async function exportUrls(args: string[]) {
  const filePath = args[0] || 'urls-export.json'

  try {
    const records = await prisma.publishRecord.findMany({
      include: {
        post: true
      }
    })

    const exportData = records.map(record => ({
      postId: record.post.postId,
      platform: record.platform,
      url: record.url,
      createdAt: record.createdAt
    }))

    const fullPath = join(process.cwd(), filePath)
    writeFileSync(fullPath, JSON.stringify(exportData, null, 2))

    console.log(`✅ 已导出 ${exportData.length} 条 URL 记录`)
    console.log(`   文件: ${fullPath}\n`)
  } catch (error) {
    console.error(`❌ 导出失败: ${error}`)
    process.exit(1)
  }
}

/**
 * 列出 URL
 */
async function listUrls(args: string[]) {
  const postIdFilter = args[0]

  try {
    const where = postIdFilter
      ? { post: { postId: postIdFilter } }
      : {}

    const records = await prisma.publishRecord.findMany({
      where,
      include: {
        post: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (records.length === 0) {
      console.log('\n📭 暂无 URL 记录\n')
      return
    }

    console.log('\n📜 平台 URL 列表\n')
    console.table(records.map(r => ({
      文章: r.post.postId,
      平台: r.platform,
      URL: r.url,
      发布时间: r.createdAt.toLocaleString('zh-CN')
    })))
    console.log()

  } catch (error) {
    console.error(`❌ 查询失败: ${error}`)
    process.exit(1)
  }
}

/**
 * 显示帮助
 */
function showHelp() {
  console.log('\n📖 平台 URL 管理工具\n')
  console.log('用法:')
  console.log('  pnpm post:publish:url set <postId> --platform <platform> --url <url>')
  console.log('  pnpm post:publish:url import <file.json>')
  console.log('  pnpm post:publish:url export [file.json]')
  console.log('  pnpm post:publish:url list [postId]\n')
  console.log('示例:')
  console.log('  # 设置 URL')
  console.log('  pnpm post:publish:url set hello-world --platform juejin --url https://juejin.cn/post/123')
  console.log('\n  # 批量导入')
  console.log('  pnpm post:publish:url import urls.json')
  console.log('\n  # 导出所有 URL')
  console.log('  pnpm post:publish:url export')
  console.log('\n  # 查看所有 URL')
  console.log('  pnpm post:publish:url list')
  console.log('  pnpm post:publish:url list hello-world\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
  .then(() => process.exit(0))
