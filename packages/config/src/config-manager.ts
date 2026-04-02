import { ConfigService } from '@content-hub/database'

export interface PublishConfig {
  autoSync: {
    enabled: boolean
    blogPath: string
    commitMessage: string
  }
  cleanup: {
    enabled: boolean
    retainDays: number
  }
  platforms: {
    juejin: {
      enabled: boolean
      autoCopy: boolean
    }
    wechat: {
      enabled: boolean
      autoCopy: boolean
    }
  }
}

const DEFAULT_CONFIG: PublishConfig = {
  autoSync: {
    enabled: false,
    blogPath: './blog',
    commitMessage: 'docs: sync post from post_waver'
  },
  cleanup: {
    enabled: true,
    retainDays: 30
  },
  platforms: {
    juejin: {
      enabled: true,
      autoCopy: true
    },
    wechat: {
      enabled: true,
      autoCopy: true
    }
  }
}

/**
 * 配置分类名称（用于数据库存储）
 */
const CONFIG_CATEGORY = 'publish'

export class ConfigManager {
  private config: PublishConfig
  private initialized: boolean = false

  constructor(rootDir: string = process.cwd()) {
    // rootDir 参数保留用于 API 兼容性，但不再使用
    this.config = DEFAULT_CONFIG
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
   * 加载配置
   */
  private async loadConfig(): Promise<void> {
    try {
      const storedConfig = await ConfigService.getCategory(CONFIG_CATEGORY)
      this.config = { ...DEFAULT_CONFIG, ...storedConfig }
    } catch (error) {
      console.warn(`⚠️  配置加载失败，使用默认配置`)
      this.config = DEFAULT_CONFIG
    }
  }

  /**
   * 保存配置
   */
  private async saveConfig(): Promise<void> {
    try {
      await ConfigService.setCategory(CONFIG_CATEGORY, this.config)
    } catch (error) {
      console.error('保存配置失败:', error)
      throw error
    }
  }

  /**
   * 获取配置
   */
  async get<K extends keyof PublishConfig>(key: K): Promise<PublishConfig[K]> {
    await this.ensureInitialized()
    return this.config[key]
  }

  /**
   * 设置配置
   */
  async set<K extends keyof PublishConfig>(key: K, value: PublishConfig[K]): Promise<void> {
    await this.ensureInitialized()
    this.config[key] = value
    await this.saveConfig()
  }

  /**
   * 获取全部配置
   */
  async getAll(): Promise<PublishConfig> {
    await this.ensureInitialized()
    return { ...this.config }
  }

  /**
   * 重置为默认配置
   */
  async reset(): Promise<void> {
    this.config = DEFAULT_CONFIG
    await this.saveConfig()
    this.initialized = true
  }

  /**
   * 同步获取配置（用于向后兼容，不推荐使用）
   * @deprecated 使用 get() 方法代替
   */
  getSync<K extends keyof PublishConfig>(key: K): PublishConfig[K] {
    return this.config[key]
  }

  /**
   * 同步获取全部配置（用于向后兼容，不推荐使用）
   * @deprecated 使用 getAll() 方法代替
   */
  getAllSync(): PublishConfig {
    return { ...this.config }
  }
}
