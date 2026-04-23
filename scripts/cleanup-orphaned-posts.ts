/**
 * 清理无文件路径的异常数据库记录
 *
 * 删除符合以下条件的 Post 记录：
 * 1. currentPath 为空
 * 2. 对应的文件不存在于文件系统中
 */

import { prisma } from '../packages/database/src/prisma/client.js'
import { existsSync } from 'fs'
import { join } from 'path'

async function cleanupOrphanedPosts() {
  console.log('🔍 检查无文件路径的异常记录...\n')

  try {
    // 1. 查找所有 currentPath 为空的记录
    const orphanedPosts = await prisma.post.findMany({
      where: {
        currentPath: null
      }
    })

    if (orphanedPosts.length === 0) {
      console.log('✅ 没有发现异常记录')
      await prisma.$disconnect()
      return
    }

    console.log(`📋 发现 ${orphanedPosts.length} 条 currentPath 为空的记录:\n`)

    const toDelete: string[] = []

    for (const post of orphanedPosts) {
      console.log(`📄 ${post.postId}`)
      console.log(`   标题: ${post.title}`)
      console.log(`   状态: ${post.status}`)

      // 检查可能的文件路径
      const possiblePaths = [
        join(process.cwd(), 'content/posts', `${post.postId}.md`),
        join(process.cwd(), 'content/posts', post.postId, 'index.md'),
        join(process.cwd(), 'content/done', `${post.postId}.md`),
        join(process.cwd(), 'content/done', post.postId, 'index.md')
      ]

      let fileExists = false
      for (const path of possiblePaths) {
        if (existsSync(path)) {
          console.log(`   ✅ 文件存在: ${path}`)
          fileExists = true
          break
        }
      }

      if (!fileExists) {
        console.log(`   ❌ 文件不存在，标记为待删除`)
        toDelete.push(post.postId)
      }

      console.log('')
    }

    // 2. 删除确认
    if (toDelete.length > 0) {
      console.log(`\n🗑️  准备删除 ${toDelete.length} 条异常记录:`)
      toDelete.forEach(id => console.log(`   - ${id}`))

      // 删除关联记录（外键会自动处理）
      console.log('\n⏳ 正在删除...')

      for (const postId of toDelete) {
        await prisma.post.delete({
          where: { postId }
        })
        console.log(`   ✅ 已删除: ${postId}`)
      }

      console.log('\n✅ 清理完成！')
    } else {
      console.log('\n✅ 所有记录都有对应的文件，无需删除')
    }

  } catch (error) {
    console.error('❌ 清理失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupOrphanedPosts()
