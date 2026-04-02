import { PrismaClient, TagCache as PrismaTagCache } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 标签缓存条目
 */
export interface TagCacheEntry {
  tag: string
  count: number
  lastUsed: Date
  relatedKeywords: string[]
  categories: string[]
}

/**
 * 标签缓存服务：从数据库管理标签缓存（替代 frontmatter-tag-cache.json）
 */
export class TagCacheService {
  /**
   * 添加或更新标签
   */
  static async addTags(
    tags: string[],
    category: string,
    keywords: string[] = []
  ): Promise<void> {
    for (const tag of tags) {
      const existing = await prisma.tagCache.findUnique({
        where: { tag }
      })

      const allKeywords = new Set([
        ...(existing ? JSON.parse(existing.relatedKeywords) : []),
        ...keywords,
        tag.toLowerCase()
      ])

      const allCategories = new Set([
        ...(existing ? JSON.parse(existing.categories) : []),
        category
      ])

      await prisma.tagCache.upsert({
        where: { tag },
        update: {
          count: { increment: 1 },
          lastUsed: new Date(),
          relatedKeywords: JSON.stringify(Array.from(allKeywords)),
          categories: JSON.stringify(Array.from(allCategories))
        },
        create: {
          tag,
          count: 1,
          lastUsed: new Date(),
          relatedKeywords: JSON.stringify(Array.from(allKeywords)),
          categories: JSON.stringify(Array.from(allCategories))
        }
      })
    }
  }

  /**
   * 从内容中智能匹配标签
   */
  static async matchTagsFromContent(
    content: string,
    category: string,
    limit: number = 5
  ): Promise<string[]> {
    const lowerContent = content.toLowerCase()
    const allTags = await prisma.tagCache.findMany()

    const scores: Record<string, number> = {}

    for (const entry of allTags) {
      let score = 0

      // 解析 JSON 字段
      const categories = JSON.parse(entry.categories)
      const keywords = JSON.parse(entry.relatedKeywords)

      // 1. 分类匹配（权重：50）
      if (categories.includes(category)) {
        score += 50
      }

      // 2. 关键词匹配（权重：每次 10）
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          score += 10
        }
      }

      // 3. 标签名直接匹配（权重：20）
      if (lowerContent.includes(entry.tag.toLowerCase())) {
        score += 20
      }

      // 4. 使用频率加权（权重：次数的 0.1）
      score += entry.count * 0.1

      if (score > 0) {
        scores[entry.tag] = score
      }
    }

    // 按分数排序，返回前 N 个
    return Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag]) => tag)
  }

  /**
   * 获取热门标签
   */
  static async getPopularTags(limit: number = 20): Promise<TagCacheEntry[]> {
    const tags = await prisma.tagCache.findMany({
      orderBy: { count: 'desc' },
      take: limit
    })

    return tags.map(this.mapToEntry)
  }

  /**
   * 获取特定分类的标签
   */
  static async getTagsByCategory(category: string): Promise<string[]> {
    const allTags = await prisma.tagCache.findMany()

    // 过滤包含该分类的标签
    const filtered = allTags.filter(entry => {
      const categories = JSON.parse(entry.categories)
      return categories.includes(category)
    })

    // 按使用次数排序
    const sorted = filtered.sort((a, b) => b.count - a.count)

    return sorted.map(entry => entry.tag)
  }

  /**
   * 获取缓存统计
   */
  static async getStats(): Promise<{
    totalTags: number
    totalUsage: number
    topTags: Array<{ tag: string; count: number }>
  }> {
    const allTags = await prisma.tagCache.findMany()
    const totalUsage = allTags.reduce((sum, entry) => sum + entry.count, 0)
    const topTags = await prisma.tagCache.findMany({
      orderBy: { count: 'desc' },
      take: 10
    })

    return {
      totalTags: allTags.length,
      totalUsage,
      topTags: topTags.map(entry => ({ tag: entry.tag, count: entry.count }))
    }
  }

  /**
   * 清理低频标签
   */
  static async cleanup(minCount: number = 2): Promise<{ before: number; after: number }> {
    const before = await prisma.tagCache.count()

    await prisma.tagCache.deleteMany({
      where: { count: { lt: minCount } }
    })

    const after = await prisma.tagCache.count()

    return { before, after }
  }

  /**
   * 导出为常用标签列表（用于 AI 参考）
   */
  static async exportCommonTags(limit: number = 50): Promise<string[]> {
    const popular = await this.getPopularTags(limit)
    return popular.map(entry => entry.tag)
  }

  /**
   * 将 Prisma 模型映射为 TagCacheEntry
   */
  private static mapToEntry(prismaTag: PrismaTagCache): TagCacheEntry {
    return {
      tag: prismaTag.tag,
      count: prismaTag.count,
      lastUsed: prismaTag.lastUsed,
      relatedKeywords: JSON.parse(prismaTag.relatedKeywords),
      categories: JSON.parse(prismaTag.categories)
    }
  }
}

// 导出便捷函数
export const addTags = (tags: string[], category: string, keywords?: string[]) =>
  TagCacheService.addTags(tags, category, keywords)
export const matchTagsFromContent = (content: string, category: string, limit?: number) =>
  TagCacheService.matchTagsFromContent(content, category, limit)
export const getPopularTags = (limit?: number) => TagCacheService.getPopularTags(limit)
export const getTagsByCategory = (category: string) => TagCacheService.getTagsByCategory(category)
