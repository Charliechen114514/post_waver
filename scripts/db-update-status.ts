#!/usr/bin/env tsx
import { StatusTransitionService } from '../packages/database/dist/services/status-transition.js'
import type { PostStatus } from '../packages/database/dist/dal/post.js'

async function main() {
  const postId = process.argv[2]
  const newStatus = process.argv[3] as PostStatus

  if (!postId || !newStatus) {
    console.error('Usage: pnpm post:update-status <postId> <status>')
    console.error('Valid statuses: draft, previewing, publishing, published, archived')
    process.exit(1)
  }

  const validStatuses: PostStatus[] = ['draft', 'previewing', 'publishing', 'published', 'archived']

  if (!validStatuses.includes(newStatus)) {
    console.error(`Invalid status: ${newStatus}`)
    console.error(`Valid statuses are: ${validStatuses.join(', ')}`)
    process.exit(1)
  }

  try {
    const result = await StatusTransitionService.transition(postId, newStatus)
    console.log(`✅ 文章状态已更新: ${postId} → ${newStatus}`)
    console.log(`   当前状态: ${result.status}`)
  } catch (error) {
    console.error(`❌ 错误: ${error}`)
    process.exit(1)
  }
}

main().catch(console.error)
