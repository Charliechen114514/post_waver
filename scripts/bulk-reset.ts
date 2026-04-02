#!/usr/bin/env tsx
import { PrismaClient } from '../packages/database/dist/prisma/client.js'
import { existsSync, readdirSync, renameSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 开始批量回滚所有文章...\n')

  // 1. 将 content/done/ 中的文件移回 content/posts/
  const doneDir = join(process.cwd(), 'content/done')
  const postsDir = join(process.cwd(), 'content/posts')

  if (existsSync(doneDir)) {
    const files = readdirSync(doneDir).filter(f => f.endsWith('.md'))

    if (files.length > 0) {
      console.log(`📁 找到 ${files.length} 个文件在 done 目录中`)

      for (const file of files) {
        const fromPath = join(doneDir, file)
        const toPath = join(postsDir, file)

        try {
          renameSync(fromPath, toPath)
          console.log(`  ✅ 已移动: ${file}`)
        } catch (error) {
          console.log(`  ⚠️  移动失败: ${file} - ${error}`)
        }
      }
    } else {
      console.log('📁 done 目录为空')
    }
  }

  // 2. 重置所有文章状态为 draft
  console.log('\n📊 重置文章状态...')

  const posts = await prisma.post.findMany()

  for (const post of posts) {
    try {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'draft',
          workflowStatus: 'pending',
          workflowLocation: 'posts'
        }
      })
      console.log(`  ✅ ${post.postId}: draft`)
    } catch (error) {
      console.log(`  ❌ ${post.postId}: 失败 - ${error}`)
    }
  }

  console.log('\n✅ 批量回滚完成！\n')
  console.log('📋 文章列表:')
  const updatedPosts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' }
  })

  console.table(updatedPosts.map(p => ({
    ID: p.postId,
    状态: p.status,
    工作流: p.workflowStatus,
    位置: p.workflowLocation
  })))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
  .then(() => process.exit(0))
