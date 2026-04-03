import { PrismaClient } from '@prisma/client'
import { PostDAL, PostStatus } from '../dal/post.js'

let prismaInstance: PrismaClient | null = null

function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient()
  }
  return prismaInstance
}

/**
 * 断开数据库连接
 */
export async function disconnectStatusTransition() {
  if (prismaInstance) {
    await prismaInstance.$disconnect()
    prismaInstance = null
  }
}

export class StatusTransitionService {
  private static transitions: Record<string, string[]> = {
    draft: ['previewing', 'archived'],
    previewing: ['draft', 'publishing', 'archived'],
    publishing: ['previewing', 'published', 'archived'],
    published: ['archived'],
    archived: []
  }

  /**
   * 验证状态转换是否合法
   */
  static canTransition(from: PostStatus, to: PostStatus): boolean {
    const allowed = this.transitions[from] || []
    return allowed.includes(to)
  }

  /**
   * 获取所有允许的状态转换
   */
  static getAllowedTransitions(from: PostStatus): PostStatus[] {
    return (this.transitions[from] || []) as PostStatus[]
  }

  /**
   * 执行状态转换
   */
  static async transition(postId: string, toStatus: PostStatus) {
    const dal = new PostDAL()
    const post = await dal.findByPostId(postId)

    if (!post) {
      throw new Error(`Post ${postId} not found`)
    }

    if (!this.canTransition(post.status as PostStatus, toStatus)) {
      throw new Error(
        `Cannot transition from ${post.status} to ${toStatus}`
      )
    }

    const prisma = getPrisma()
    const updated = await prisma.post.update({
      where: { postId },
      data: {
        status: toStatus,
        ...(toStatus === 'published' ? { publishedAt: new Date() } : {})
      }
    })

    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        postId: post.id,
        action: 'status_change',
        details: JSON.stringify({
          from: post.status,
          to: toStatus
        })
      }
    })

    return updated
  }
}
