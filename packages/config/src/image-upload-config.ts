import { ConfigService } from '@content-hub/database'

/**
 * 图片上传配置
 */
export interface ImageUploadConfig {
  wechat?: {
    appId: string
    appSecret: string
  }
  github?: {
    token: string
    gistOwner?: string
  }
}

/**
 * 配置分类名称（用于数据库存储）
 */
const CONFIG_CATEGORY = 'imageUpload'

/**
 * 图片上传配置管理器（从数据库读取配置）
 */
export class ImageUploadConfigManager {
  private config: ImageUploadConfig
  private initialized: boolean = false

  constructor(rootDir: string = process.cwd()) {
    // rootDir 参数保留用于 API 兼容性，但不再使用
    this.config = {}
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
   * 加载配置（从数据库）
   */
  private async loadConfig(): Promise<void> {
    try {
      const storedConfig = await ConfigService.getCategory(CONFIG_CATEGORY)
      this.config = storedConfig || {}
    } catch (error) {
      console.warn(`⚠️  图片上传配置加载失败，使用默认配置`)
      this.config = {}
    }
  }

  /**
   * 保存配置（到数据库）
   */
  private async saveConfig(): Promise<void> {
    try {
      await ConfigService.setCategory(CONFIG_CATEGORY, this.config)
    } catch (error) {
      console.error('保存图片上传配置失败:', error)
      throw error
    }
  }

  /**
   * 获取全部配置
   */
  async getAll(): Promise<ImageUploadConfig> {
    await this.ensureInitialized()
    return { ...this.config }
  }

  /**
   * 获取微信配置
   */
  async getWechatConfig(): Promise<{ appId: string; appSecret: string } | undefined> {
    await this.ensureInitialized()
    return this.config.wechat
  }

  /**
   * 设置微信配置
   */
  async setWechatConfig(appId: string, appSecret: string): Promise<void> {
    await this.ensureInitialized()
    this.config.wechat = { appId, appSecret }
    await this.saveConfig()
  }

  /**
   * 获取GitHub配置
   */
  async getGithubConfig(): Promise<{ token: string; gistOwner?: string } | undefined> {
    await this.ensureInitialized()
    return this.config.github
  }

  /**
   * 设置GitHub配置
   */
  async setGithubConfig(token: string, gistOwner?: string): Promise<void> {
    await this.ensureInitialized()
    this.config.github = { token, gistOwner }
    await this.saveConfig()
  }

  /**
   * 清除配置
   */
  async clearConfig(platform?: 'wechat' | 'github'): Promise<void> {
    await this.ensureInitialized()
    if (platform) {
      delete this.config[platform]
    } else {
      this.config = {}
    }
    await this.saveConfig()
  }

  /**
   * 检查平台是否已配置
   */
  async isConfigured(platform: 'wechat' | 'github'): Promise<boolean> {
    await this.ensureInitialized()
    return !!this.config[platform]
  }

  /**
   * 验证配置是否有效
   */
  async validateConfig(platform: 'wechat' | 'github'): Promise<{ valid: boolean; error?: string }> {
    await this.ensureInitialized()

    if (platform === 'wechat') {
      const wechatConfig = this.config.wechat
      if (!wechatConfig) {
        return { valid: false, error: '微信配置不存在' }
      }
      if (!wechatConfig.appId || !wechatConfig.appSecret) {
        return { valid: false, error: '微信配置不完整：缺少 appId 或 appSecret' }
      }
      return { valid: true }
    }

    if (platform === 'github') {
      const githubConfig = this.config.github
      if (!githubConfig) {
        return { valid: false, error: 'GitHub配置不存在' }
      }
      if (!githubConfig.token) {
        return { valid: false, error: 'GitHub配置不完整：缺少 token' }
      }
      return { valid: true }
    }

    return { valid: false, error: '未知平台' }
  }
}
