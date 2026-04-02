import { PostDAL } from '@content-hub/database'
import type { PrismaClient } from '@prisma/client'

// Prisma client instance (lazy loaded)
let prismaInstance: PrismaClient | null = null

function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    const { PrismaClient } = require('@prisma/client')
    prismaInstance = new PrismaClient() as any
  }
  return prismaInstance
}

/**
 * 关闭数据库连接
 */
export async function disconnectPrisma() {
  if (prismaInstance) {
    await prismaInstance.$disconnect()
    prismaInstance = null
  }
}

export class PublishHistoryManager {
  /**
   * 记录发布历史
   */
  async recordPublish(postId: string, platform: string, details: {
    hashId?: string
    url?: string
    success: boolean
    error?: string
  }) {
    try {
      const dal = new PostDAL()
      const post = await dal.findByPostId(postId)

      if (!post) {
        throw new Error(`Post ${postId} not found`)
      }

      const prisma = getPrismaClient()
      return await prisma.publishRecord.create({
        data: {
          postId: post.id,
          platform,
          hashId: details.hashId,
          url: details.url,
          createdAt: new Date()
        }
      })
    } catch (error) {
      console.error(`记录发布历史失败: ${error}`)
      throw error
    }
  }

  /**
   * 查询文章发布历史
   */
  async getPostHistory(postId: string) {
    try {
      const dal = new PostDAL()
      const post = await dal.findByPostId(postId)

      if (!post) {
        throw new Error(`Post ${postId} not found`)
      }

      return post.publishRecords.map(record => ({
        平台: record.platform,
        HashID: record.hashId || '-',
        URL: record.url || '-',
        发布时间: record.createdAt.toLocaleString('zh-CN')
      }))
    } catch (error) {
      console.error(`查询发布历史失败: ${error}`)
      throw error
    }
  }

  /**
   * 查询平台发布历史
   */
  async getPlatformHistory(platform: string) {
    const prisma = getPrismaClient()
    return await prisma.publishRecord.findMany({
      where: { platform },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * 导出发布历史（JSON）
   */
  async exportHistory(postId: string, outputPath: string) {
    const { writeFileSync } = require('fs')
    const records = await this.getPostHistory(postId)

    writeFileSync(outputPath, JSON.stringify(records, null, 2))
    console.log(`✅ 历史已导出: ${outputPath}`)
  }

  /**
   * 统计发布数据
   */
  async getStats() {
    const prisma = getPrismaClient()
    const total = await prisma.publishRecord.count()
    const byPlatform = await prisma.publishRecord.groupBy({
      by: ['platform'],
      _count: true
    })

    return {
      总发布次数: total,
      按平台统计: byPlatform.map(p => ({
        平台: p.platform,
        次数: p._count
      }))
    }
  }
}
