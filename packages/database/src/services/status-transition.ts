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

    // 当状态转换为 published 时，从文件读取 tags 并保存
    let updateData: any = {
      status: toStatus,
      ...(toStatus === 'published' ? { publishedAt: new Date() } : {})
    }

    if (toStatus === 'published') {
      // 从文件读取 tags
      const tags = await this.extractTagsFromFile(postId)
      if (tags && tags.length > 0) {
        updateData.tags = JSON.stringify(tags)
      }
    }

    const updated = await prisma.post.update({
      where: { postId },
      data: updateData
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

  /**
   * 从文章文件中提取 tags
   */
  private static async extractTagsFromFile(postId: string): Promise<string[] | null> {
    try {
      const { readFileSync } = await import('fs')
      const { join } = await import('path')

      // 尝试从 posts 和 done 目录读取
      const postsPath = join(process.cwd(), 'content/posts', `${postId}.md`)
      const donePath = join(process.cwd(), 'content/done', `${postId}.md`)

      let content: string | null = null

      try {
        content = readFileSync(postsPath, 'utf-8')
      } catch {
        try {
          content = readFileSync(donePath, 'utf-8')
        } catch {
          return null
        }
      }

      if (!content) return null

      // 提取 frontmatter 中的 tags
      const tagsMatch = content.match(/^tags:\s*\n((?:[ \t]+-\s+.+\n?)+)/m)
      if (tagsMatch) {
        const tagsText = tagsMatch[1]
        const tags = tagsText
          .split('\n')
          .map(line => line.replace(/^\s*-\s+/, '').trim())
          .filter(tag => tag.length > 0)

        return tags.length > 0 ? tags : null
      }

      // 尝试单行格式: tags: [tag1, tag2]
      const singleLineMatch = content.match(/^tags:\s*\[(.+)\]/m)
      if (singleLineMatch) {
        const tags = singleLineMatch[1]
          .split(',')
          .map(tag => tag.trim().replace(/^['"]|['"]$/g, ''))
          .filter(tag => tag.length > 0)

        return tags.length > 0 ? tags : null
      }

      return null
    } catch (error) {
      console.warn(`[StatusTransitionService] Failed to extract tags for ${postId}:`, error)
      return null
    }
  }
}
