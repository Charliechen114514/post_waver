import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 配置服务：从数据库读写配置（替代 JSON 配置文件）
 */
export class ConfigService {
  /**
   * 获取单个配置值
   */
  static async get(category: string, key: string): Promise<any> {
    const config = await prisma.config.findUnique({
      where: {
        key: `${category}.${key}`
      }
    })

    if (!config) {
      return null
    }

    try {
      return JSON.parse(config.value)
    } catch {
      return config.value
    }
  }

  /**
   * 设置单个配置值
   */
  static async set(category: string, key: string, value: any): Promise<void> {
    const fullKey = `${category}.${key}`
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value)

    await prisma.config.upsert({
      where: { key: fullKey },
      update: { value: valueStr },
      create: {
        key: fullKey,
        value: valueStr,
        category
      }
    })
  }

  /**
   * 获取整个分类的配置（JSON 对象）
   */
  static async getCategory(category: string): Promise<Record<string, any>> {
    const configs = await prisma.config.findMany({
      where: { category }
    })

    const result: Record<string, any> = {}
    for (const config of configs) {
      // 移除分类前缀，只保留 key 部分
      const shortKey = config.key.replace(`${category}.`, '')
      try {
        result[shortKey] = JSON.parse(config.value)
      } catch {
        result[shortKey] = config.value
      }
    }

    return result
  }

  /**
   * 设置整个分类的配置
   */
  static async setCategory(category: string, config: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(config)) {
      await this.set(category, key, value)
    }
  }

  /**
   * 删除配置
   */
  static async delete(category: string, key: string): Promise<void> {
    await prisma.config.deleteMany({
      where: {
        key: `${category}.${key}`
      }
    })
  }

  /**
   * 删除整个分类
   */
  static async deleteCategory(category: string): Promise<void> {
    await prisma.config.deleteMany({
      where: { category }
    })
  }

  /**
   * 获取所有分类
   */
  static async getAllCategories(): Promise<string[]> {
    const configs = await prisma.config.findMany({
      select: { category: true },
      distinct: ['category']
    })

    return configs.map(c => c.category)
  }
}

// 导出便捷函数
export const getConfig = (category: string, key: string) => ConfigService.get(category, key)
export const setConfig = (category: string, key: string, value: any) => ConfigService.set(category, key, value)
export const getConfigCategory = (category: string) => ConfigService.getCategory(category)
export const setConfigCategory = (category: string, config: Record<string, any>) => ConfigService.setCategory(category, config)
