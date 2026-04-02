#!/usr/bin/env tsx
import { PostDAL } from '../packages/database/dist/dal/post.js'

async function main() {
  const dal = new PostDAL()
  const posts = await dal.findAll()

  console.log('\n📊 文章状态列表\n')

  const stats = posts.reduce((acc, post) => {
    acc[post.status] = (acc[post.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('状态统计:')
  Object.entries(stats).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`)
  })

  console.log('\n文章列表:')
  console.table(
    posts.map(p => ({
      ID: p.postId,
      标题: p.title,
      状态: p.status,
      创建时间: p.createdAt.toLocaleString('zh-CN')
    }))
  )
}

main().catch(console.error)
