import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 平台发布信息
 */
export interface PlatformPublishInfo {
  postId: string
  url?: string
  publishedAt?: Date
}

/**
 * 平台 ID 映射服务：从数据库管理平台 ID（替代 platform-ids.json）
 */
export class PlatformIdService {
  /**
   * 获取文章在特定平台的 ID
   */
  static async get(postId: string, platform: string): Promise<PlatformPublishInfo | null> {
    const mapping = await prisma.platformIdMapping.findUnique({
      where: {
        postId_platform: {
          postId,
          platform
        }
      }
    })

    if (!mapping) {
      return null
    }

    return {
      postId: mapping.platformPostId,
      url: mapping.url ?? undefined,
      publishedAt: mapping.publishedAt ?? undefined
    }
  }

  /**
   * 获取文章在所有平台的 ID
   */
  static async getAllForPost(postId: string): Promise<Record<string, PlatformPublishInfo>> {
    const mappings = await prisma.platformIdMapping.findMany({
      where: { postId }
    })

    const result: Record<string, PlatformPublishInfo> = {}
    for (const mapping of mappings) {
      result[mapping.platform] = {
        postId: mapping.platformPostId,
        url: mapping.url ?? undefined,
        publishedAt: mapping.publishedAt ?? undefined
      }
    }

    return result
  }

  /**
   * 设置文章的平台 ID
   */
  static async set(
    postId: string,
    platform: string,
    platformPostId: string,
    url?: string
  ): Promise<void> {
    await prisma.platformIdMapping.upsert({
      where: {
        postId_platform: {
          postId,
          platform
        }
      },
      update: {
        platformPostId,
        url,
        publishedAt: new Date()
      },
      create: {
        postId,
        platform,
        platformPostId,
        url,
        publishedAt: new Date()
      }
    })
  }

  /**
   * 批量设置平台 ID
   */
  static async setMany(
    mappings: Array<{
      postId: string
      platform: string
      platformPostId: string
      url?: string
    }>
  ): Promise<void> {
    await prisma.$transaction(
      mappings.map(mapping =>
        prisma.platformIdMapping.upsert({
          where: {
            postId_platform: {
              postId: mapping.postId,
              platform: mapping.platform
            }
          },
          update: {
            platformPostId: mapping.platformPostId,
            url: mapping.url,
            publishedAt: new Date()
          },
          create: {
            postId: mapping.postId,
            platform: mapping.platform,
            platformPostId: mapping.platformPostId,
            url: mapping.url,
            publishedAt: new Date()
          }
        })
      )
    )
  }

  /**
   * 删除文章的平台 ID
   */
  static async delete(postId: string, platform: string): Promise<void> {
    await prisma.platformIdMapping.deleteMany({
      where: {
        postId,
        platform
      }
    })
  }

  /**
   * 删除文章的所有平台 ID
   */
  static async deleteAllForPost(postId: string): Promise<void> {
    await prisma.platformIdMapping.deleteMany({
      where: { postId }
    })
  }

  /**
   * 获取特定平台的所有映射
   */
  static async getAllForPlatform(platform: string): Promise<Array<{
    postId: string
    platformPostId: string
    url?: string
    publishedAt?: Date
  }>> {
    const mappings = await prisma.platformIdMapping.findMany({
      where: { platform },
      orderBy: { publishedAt: 'desc' }
    })

    return mappings.map(m => ({
      postId: m.postId,
      platformPostId: m.platformPostId,
      url: m.url ?? undefined,
      publishedAt: m.publishedAt ?? undefined
    }))
  }

  /**
   * 获取所有映射
   */
  static async getAll(): Promise<Record<string, Record<string, PlatformPublishInfo>>> {
    const mappings = await prisma.platformIdMapping.findMany()

    const result: Record<string, Record<string, PlatformPublishInfo>> = {}

    for (const mapping of mappings) {
      if (!result[mapping.postId]) {
        result[mapping.postId] = {}
      }

      result[mapping.postId][mapping.platform] = {
        postId: mapping.platformPostId,
        url: mapping.url ?? undefined,
        publishedAt: mapping.publishedAt ?? undefined
      }
    }

    return result
  }

  /**
   * 获取统计信息
   */
  static async getStats(): Promise<{
    totalMappings: number
    byPlatform: Record<string, number>
  }> {
    const all = await prisma.platformIdMapping.findMany()

    const byPlatform: Record<string, number> = {}
    for (const mapping of all) {
      byPlatform[mapping.platform] = (byPlatform[mapping.platform] || 0) + 1
    }

    return {
      totalMappings: all.length,
      byPlatform
    }
  }
}

// 导出便捷函数
export const getPlatformId = (postId: string, platform: string) =>
  PlatformIdService.get(postId, platform)
export const setPlatformId = (postId: string, platform: string, platformPostId: string, url?: string) =>
  PlatformIdService.set(postId, platform, platformPostId, url)
export const getAllPlatformIds = (postId: string) =>
  PlatformIdService.getAllForPost(postId)
