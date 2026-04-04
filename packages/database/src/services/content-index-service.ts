import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 内容索引服务：从数据库管理内容索引（替代 content-index.json）
 */
export class ContentIndexService {
  /**
   * 获取单个文章索引
   */
  static async get(postId: string) {
    return await prisma.contentIndex.findUnique({
      where: { id: postId }
    })
  }

  /**
   * 批量获取文章索引
   */
  static async getMany(postIds: string[]) {
    return await prisma.contentIndex.findMany({
      where: {
        id: { in: postIds }
      }
    })
  }

  /**
   * 获取所有索引
   */
  static async getAll() {
    return await prisma.contentIndex.findMany({
      orderBy: { date: 'desc' }
    })
  }

  /**
   * 更新或创建索引
   */
  static async upsert(data: {
    id: string
    title: string
    date: Date
    tags: string[]
    contentHash: string
    filepath: string
    draft?: boolean
    prev?: string
    next?: string
    related?: Array<{ id: string; title: string; score: number }>
  }) {
    await prisma.contentIndex.upsert({
      where: { id: data.id },
      update: {
        title: data.title,
        date: data.date,
        tags: JSON.stringify(data.tags),
        contentHash: data.contentHash,
        filepath: data.filepath,
        draft: data.draft ?? false,
        prev: data.prev,
        next: data.next,
        related: data.related ? JSON.stringify(data.related) : null
      },
      create: {
        id: data.id,
        title: data.title,
        date: data.date,
        tags: JSON.stringify(data.tags),
        contentHash: data.contentHash,
        filepath: data.filepath,
        draft: data.draft ?? false,
        prev: data.prev,
        next: data.next,
        related: data.related ? JSON.stringify(data.related) : null
      }
    })
  }

  /**
   * 批量更新索引
   */
  static async upsertMany(posts: Array<{
    id: string
    title: string
    date: Date
    tags: string[]
    contentHash: string
    filepath: string
    draft?: boolean
    prev?: string
    next?: string
    related?: Array<{ id: string; title: string; score: number }>
  }>) {
    // 使用事务批量更新
    await prisma.$transaction(
      posts.map(post =>
        prisma.contentIndex.upsert({
          where: { id: post.id },
          update: {
            title: post.title,
            date: post.date,
            tags: JSON.stringify(post.tags),
            contentHash: post.contentHash,
            filepath: post.filepath,
            draft: post.draft ?? false,
            prev: post.prev,
            next: post.next,
            related: post.related ? JSON.stringify(post.related) : null
          },
          create: {
            id: post.id,
            title: post.title,
            date: post.date,
            tags: JSON.stringify(post.tags),
            contentHash: post.contentHash,
            filepath: post.filepath,
            draft: post.draft ?? false,
            prev: post.prev,
            next: post.next,
            related: post.related ? JSON.stringify(post.related) : null
          }
        })
      )
    )
  }

  /**
   * 删除索引
   */
  static async delete(postId: string) {
    await prisma.contentIndex.delete({
      where: { id: postId }
    })
  }

  /**
   * 批量删除索引
   */
  static async deleteMany(postIds: string[]) {
    await prisma.contentIndex.deleteMany({
      where: {
        id: { in: postIds }
      }
    })
  }

  /**
   * 获取草稿文章
   */
  static async getDrafts() {
    return await prisma.contentIndex.findMany({
      where: { draft: true },
      orderBy: { date: 'desc' }
    })
  }

  /**
   * 获取已发布文章
   */
  static async getPublished() {
    return await prisma.contentIndex.findMany({
      where: { draft: false },
      orderBy: { date: 'desc' }
    })
  }

  /**
   * 按标签搜索
   */
  static async searchByTag(tag: string) {
    const all = await this.getAll()
    return all.filter(entry => {
      const tags = JSON.parse(entry.tags)
      return tags.includes(tag)
    })
  }

  /**
   * 按分类搜索（通过标签推断）
   */
  static async searchByCategory(category: string) {
    const all = await this.getAll()
    return all.filter(entry => {
      const filepath = entry.filepath
      return filepath.includes(`/posts/${category}/`)
    })
  }

  /**
   * 获取统计信息
   */
  static async getStats() {
    const total = await prisma.contentIndex.count()
    const drafts = await prisma.contentIndex.count({
      where: { draft: true }
    })

    // 提取所有标签
    const all = await this.getAll()
    const allTags = new Set<string>()
    for (const entry of all) {
      const tags = JSON.parse(entry.tags)
      tags.forEach((tag: string) => allTags.add(tag))
    }

    return {
      totalPosts: total,
      draftCount: drafts,
      allTags: Array.from(allTags).sort()
    }
  }
}

// 导出便捷函数
export const getContentIndex = (postId: string) => ContentIndexService.get(postId)
export const upsertContentIndex = (data: Parameters<typeof ContentIndexService.upsert>[0]) =>
  ContentIndexService.upsert(data)
export const upsertContentIndexMany = (posts: Parameters<typeof ContentIndexService.upsertMany>[0]) =>
  ContentIndexService.upsertMany(posts)
export const deleteContentIndex = (postId: string) => ContentIndexService.delete(postId)
