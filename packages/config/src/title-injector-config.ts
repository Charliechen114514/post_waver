import { existsSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '@content-hub/database'

export interface TitleInjectionRule {
  platform: 'juejin' | 'wechat' | 'html' | 'global'
  enabled: boolean
  content: string
  position: 'after_title' | 'before_content'
}

export interface PostInjectionOverride {
  postId: string
  content?: string
  enabled: boolean
}

const DEFAULT_RULES: Record<string, TitleInjectionRule> = {
  global: {
    platform: 'global',
    enabled: false,
    content: '',
    position: 'after_title'
  },
  juejin: {
    platform: 'juejin',
    enabled: false,
    content: '',
    position: 'after_title'
  },
  wechat: {
    platform: 'wechat',
    enabled: false,
    content: '',
    position: 'after_title'
  },
  html: {
    platform: 'html',
    enabled: false,
    content: '',
    position: 'after_title'
  }
}

/**
 * 标题注入配置管理器（从数据库读取配置）
 */
export class TitleInjectorConfigManager {
  private config: Record<string, TitleInjectionRule>
  private prisma: PrismaClient
  private initialized: boolean = false

  constructor(rootDir: string = process.cwd()) {
    // rootDir 参数保留用于 API 兼容性，但不再使用
    this.config = { ...DEFAULT_RULES }
    this.prisma = new PrismaClient()
  }

  /**
   * 确保配置已加载
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.loadConfig()
      this.initialized = true
    }
  }

  /**
   * 加载配置文件（从数据库）
   */
  private async loadConfig(): Promise<void> {
    try {
      // 从数据库加载所有规则
      const rules = await this.prisma.titleInjectionRule.findMany()

      if (rules.length > 0) {
        const loaded: Record<string, TitleInjectionRule> = {}
        for (const rule of rules) {
          loaded[rule.id] = {
            platform: rule.platform as any,
            enabled: rule.enabled,
            content: rule.content,
            position: rule.position as any
          }
        }
        this.config = { ...DEFAULT_RULES, ...loaded }
      } else {
        this.config = { ...DEFAULT_RULES }
      }
    } catch (error) {
      console.warn(`⚠️  标题注入配置加载失败，使用默认配置`)
      this.config = { ...DEFAULT_RULES }
    }
  }

  /**
   * 保存配置（到数据库）
   */
  private async saveConfig(): Promise<void> {
    try {
      for (const [key, rule] of Object.entries(this.config)) {
        if (key === 'global') continue

        await this.prisma.titleInjectionRule.upsert({
          where: { id: key },
          update: {
            enabled: rule.enabled,
            content: rule.content,
            position: rule.position
          },
          create: {
            id: key,
            platform: rule.platform,
            enabled: rule.enabled,
            content: rule.content,
            position: rule.position
          }
        })
      }
    } catch (error) {
      console.error('保存标题注入配置失败:', error)
      throw error
    }
  }

  /**
   * 获取平台配置
   */
  async getPlatformConfig(platform: string): Promise<TitleInjectionRule> {
    await this.ensureInitialized()

    // 先查找平台特定配置
    if (this.config[platform]) {
      return this.config[platform]
    }

    // 回退到全局配置
    return this.config.global
  }

  /**
   * 获取文章的注入配置（包含覆盖）
   */
  async getPostConfig(postId: string, platform: string): Promise<TitleInjectionRule> {
    await this.ensureInitialized()

    // 先检查数据库中的文章级别覆盖
    const override = await this.prisma.postInjectionOverride.findUnique({
      where: { postId }
    })

    if (override && override.enabled && override.content) {
      return {
        platform: platform as any,
        enabled: true,
        content: override.content,
        position: 'after_title'
      }
    }

    // 使用平台配置
    return this.getPlatformConfig(platform)
  }

  /**
   * 设置平台配置
   */
  async setPlatformConfig(
    platform: string,
    updates: Partial<Omit<TitleInjectionRule, 'platform'>>
  ): Promise<void> {
    await this.ensureInitialized()

    if (!this.config[platform]) {
      this.config[platform] = {
        platform: platform as any,
        enabled: false,
        content: '',
        position: 'after_title'
      }
    }

    this.config[platform] = {
      ...this.config[platform],
      ...updates
    }

    await this.saveConfig()
  }

  /**
   * 设置文章覆盖配置
   */
  async setPostOverride(
    postId: string,
    content: string,
    enabled: boolean = true
  ): Promise<void> {
    await this.prisma.postInjectionOverride.upsert({
      where: { postId },
      update: { content, enabled },
      create: { postId, content, enabled }
    })
  }

  /**
   * 删除文章覆盖配置
   */
  async removePostOverride(postId: string): Promise<void> {
    await this.prisma.postInjectionOverride.delete({
      where: { postId }
    }).catch(() => {
      // 忽略不存在的记录
    })
  }

  /**
   * 获取所有配置
   */
  async getAllConfig(): Promise<Record<string, TitleInjectionRule>> {
    await this.ensureInitialized()
    return { ...this.config }
  }

  /**
   * 重置为默认配置
   */
  async reset(): Promise<void> {
    this.config = { ...DEFAULT_RULES }
    await this.saveConfig()
  }

  /**
   * 同步配置到数据库（已废弃，配置现在自动同步）
   * @deprecated 配置现在自动保存到数据库，此方法保留用于兼容性
   */
  async syncToDatabase(): Promise<void> {
    // 配置现在自动保存，此方法为空操作
  }
}
