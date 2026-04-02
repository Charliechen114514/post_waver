import { TagCacheService, type TagCacheEntry } from '@content-hub/database'

/**
 * 标签缓存管理器（数据库版本）
 *
 * 所有数据存储在 SQLite 数据库中，不再使用 JSON 文件
 */
export class TagCacheManager {
  /**
   * 加载缓存（数据库不需要显式加载，但保留接口兼容性）
   */
  async load(): Promise<void> {
    // 数据库连接自动处理，无需显式加载
    console.log('[TagCache] ✅ 使用数据库存储')
  }

  /**
   * 保存缓存（数据库自动提交，但保留接口兼容性）
   */
  async save(): Promise<void> {
    // 数据库自动提交，无需显式保存
    console.log('[TagCache] ✅ 数据库已更新')
  }

  /**
   * 添加或更新标签
   */
  async addTags(
    tags: string[],
    category: string,
    keywords: string[] = []
  ): Promise<void> {
    await TagCacheService.addTags(tags, category, keywords)
  }

  /**
   * 从内容中智能匹配标签
   */
  matchTagsFromContent(
    content: string,
    category: string,
    limit: number = 5
  ): Promise<string[]> {
    return TagCacheService.matchTagsFromContent(content, category, limit)
  }

  /**
   * 获取热门标签
   */
  getPopularTags(limit: number = 20): Promise<TagCacheEntry[]> {
    return TagCacheService.getPopularTags(limit)
  }

  /**
   * 获取特定分类的标签
   */
  getTagsByCategory(category: string): Promise<string[]> {
    return TagCacheService.getTagsByCategory(category)
  }

  /**
   * 获取缓存统计
   */
  async getStats(): Promise<{
    totalTags: number
    totalUsage: number
    topTags: Array<{ tag: string; count: number }>
  }> {
    return await TagCacheService.getStats()
  }

  /**
   * 清理低频标签
   */
  async cleanup(minCount: number = 2): Promise<void> {
    const result = await TagCacheService.cleanup(minCount)
    console.log(`[TagCache] 清理完成: ${result.before} → ${result.after} 个标签`)
  }

  /**
   * 导出为常用标签列表（用于 AI 参考）
   */
  async exportCommonTags(limit: number = 50): Promise<string[]> {
    return await TagCacheService.exportCommonTags(limit)
  }
}

/**
 * 单例模式的全局缓存管理器
 */
let globalCacheManager: TagCacheManager | null = null

/**
 * 获取全局缓存管理器
 */
export async function getTagCacheManager(): Promise<TagCacheManager> {
  if (!globalCacheManager) {
    globalCacheManager = new TagCacheManager()
    await globalCacheManager.load()
  }
  return globalCacheManager
}

// 重新导出类型和服务函数
export * from '@content-hub/database'
export type { TagCacheEntry }
