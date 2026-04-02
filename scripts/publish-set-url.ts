#!/usr/bin/env tsx
import { PrismaClient } from '../packages/database/dist/dal/post.js'

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 4) {
    console.error('Usage: pnpm post:publish:set-url <postId> --platform <platform> --url <url>')
    process.exit(1)
  }

  const postId = args[0]
  const platformIndex = args.indexOf('--platform')
  const urlIndex = args.indexOf('--url')

  if (platformIndex === -1 || urlIndex === -1) {
    console.error('Error: --platform and --url are required')
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
        id: postId + '-' + platform // 临时唯一标识
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

main().catch(console.error)
