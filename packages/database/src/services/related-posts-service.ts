import { prisma } from '../prisma/client.js'

export interface RelatedPost {
  id: string
  title: string
  score: number
}

/**
 * 相关推荐服务（基于Post表）
 *
 * 不依赖文件路径，即使done目录被清理也能工作
 */
export class RelatedPostsService {
  /**
   * 计算标签相似度
   */
  private static calculateTagSimilarity(tagsA: string[], tagsB: string[]): number {
    const setA = new Set(tagsA)
    const setB = new Set(tagsB)

    // 找到交集
    const intersection = [...setA].filter(tag => setB.has(tag))

    if (intersection.length === 0) {
      return 0
    }

    // 标准化Jaccard相似度（二元向量的余弦相似度）
    const denominator = Math.sqrt(setA.size * setB.size)
    return intersection.length / denominator
  }

  /**
   * 为指定文章查找相关推荐
   *
   * @param postId - 文章ID
   * @param limit - 返回数量限制，默认3
   * @returns 相关文章列表
   */
  static async findRelatedPosts(postId: string, limit: number = 3): Promise<RelatedPost[]> {
    // 获取所有已发布的文章（包含tags）
    const allPosts = await prisma.post.findMany({
      where: {
        status: 'published',
        tags: { not: null }  // 只考虑有tags的文章
      },
      select: {
        postId: true,
        title: true,
        tags: true
      }
    })

    // 找到当前文章
    const currentPost = allPosts.find(p => p.postId === postId)
    if (!currentPost || !currentPost.tags) {
      return []
    }

    const currentTags = JSON.parse(currentPost.tags)

    // 计算与其他文章的相似度
    const similarities = allPosts
      .filter(post => post.postId !== postId)  // 排除自己
      .map(post => {
        if (!post.tags) {
          return { post, score: 0 }
        }

        const tags = JSON.parse(post.tags)
        const score = this.calculateTagSimilarity(currentTags, tags)

        return { post, score }
      })
      .filter(item => item.score > 0)  // 只保留有相似度的
      .sort((a, b) => b.score - a.score)  // 按相似度降序排序
      .slice(0, limit)  // 取前N个

    // 转换为RelatedPost格式
    return similarities.map(({ post, score }) => ({
      id: post.postId,
      title: post.title,
      score
    }))
  }

  /**
   * 获取所有已发布文章的Map（用于注入相关链接）
   */
  static async getPublishedPostsMap(): Promise<Map<string, any>> {
    const allPosts = await prisma.post.findMany({
      where: { status: 'published' },
      select: {
        postId: true,
        title: true,
        tags: true
      }
    })

    const postsMap = new Map<string, any>()

    for (const post of allPosts) {
      postsMap.set(post.postId, {
        id: post.postId,
        title: post.title,
        tags: post.tags ? JSON.parse(post.tags) : []
      })
    }

    return postsMap
  }

  /**
   * 获取单个已发布文章的信息
   */
  static async getPublishedPost(postId: string): Promise<any | null> {
    const post = await prisma.post.findUnique({
      where: { postId },
      select: {
        postId: true,
        title: true,
        tags: true,
        status: true
      }
    })

    if (!post || post.status !== 'published') {
      return null
    }

    return {
      id: post.postId,
      title: post.title,
      tags: post.tags ? JSON.parse(post.tags) : []
    }
  }
}
