import { ConfigService } from '@content-hub/database'

/**
 * 主题元数据接口（与ThemeManager中的相同）
 */
export interface ThemeMetadata {
  name: string
  displayName: string
  description: string
  preview?: string
  cssFile: string
}

/**
 * 主题偏好配置接口
 */
export interface ThemePreferences {
  /** 各平台的默认主题 */
  platformDefaults: Record<string, string>  // platform -> themeName
  /** 自定义主题（按平台分组） */
  customThemes: Record<string, ThemeMetadata[]>
}

/**
 * 默认主题偏好配置
 */
const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  platformDefaults: {
    wechat: 'orangeheart',
    juejin: 'default',
    html: 'default'
  },
  customThemes: {}
}

/**
 * 配置分类名称（用于数据库存储）
 */
const CONFIG_CATEGORY = 'theme'

/**
 * 主题配置管理器（从数据库读取配置）
 * 管理用户的主题偏好设置和自定义主题
 */
export class ThemeConfigManager {
  private preferences: ThemePreferences
  private initialized: boolean = false

  constructor() {
    this.preferences = { ...DEFAULT_THEME_PREFERENCES }
  }

  /**
   * 确保配置已加载
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.loadPreferences()
      this.initialized = true
    }
  }

  /**
   * 加载主题偏好配置（从数据库）
   * @private
   */
  private async loadPreferences(): Promise<void> {
    try {
      const storedConfig = await ConfigService.getCategory(CONFIG_CATEGORY)
      if (storedConfig && Object.keys(storedConfig).length > 0) {
        // 合并默认配置，确保新字段存在
        this.preferences = {
          platformDefaults: { ...DEFAULT_THEME_PREFERENCES.platformDefaults, ...storedConfig.platformDefaults },
          customThemes: storedConfig.customThemes || {}
        }
      } else {
        this.preferences = { ...DEFAULT_THEME_PREFERENCES }
      }
    } catch (error) {
      console.error('加载主题配置失败，使用默认配置:', error)
      this.preferences = { ...DEFAULT_THEME_PREFERENCES }
    }
  }

  /**
   * 保存主题偏好配置（到数据库）
   * @private
   */
  private async savePreferences(): Promise<void> {
    try {
      await ConfigService.setCategory(CONFIG_CATEGORY, this.preferences)
    } catch (error) {
      console.error('保存主题配置失败:', error)
      throw error
    }
  }

  /**
   * 获取平台的默认主题名称
   * @param platform 平台名称
   * @returns 主题名称，如果未设置则返回null
   */
  async getPlatformDefaultTheme(platform: string): Promise<string | null> {
    await this.ensureInitialized()
    return this.preferences.platformDefaults[platform] || null
  }

  /**
   * 设置平台的默认主题
   * @param platform 平台名称
   * @param themeName 主题名称
   */
  async setPlatformDefaultTheme(platform: string, themeName: string): Promise<void> {
    await this.ensureInitialized()
    this.preferences.platformDefaults[platform] = themeName
    await this.savePreferences()
  }

  /**
   * 获取所有平台的默认主题设置
   * @returns 平台到主题名称的映射
   */
  async getAllPlatformDefaults(): Promise<Record<string, string>> {
    await this.ensureInitialized()
    return { ...this.preferences.platformDefaults }
  }

  /**
   * 添加自定义主题
   * @param platform 平台名称
   * @param theme 主题元数据
   */
  async addCustomTheme(platform: string, theme: ThemeMetadata): Promise<void> {
    await this.ensureInitialized()

    if (!this.preferences.customThemes[platform]) {
      this.preferences.customThemes[platform] = []
    }

    // 检查是否已存在同名主题
    const existingIndex = this.preferences.customThemes[platform].findIndex(t => t.name === theme.name)
    if (existingIndex >= 0) {
      // 更新现有主题
      this.preferences.customThemes[platform][existingIndex] = theme
    } else {
      // 添加新主题
      this.preferences.customThemes[platform].push(theme)
    }

    await this.savePreferences()
  }

  /**
   * 获取平台的自定义主题列表
   * @param platform 平台名称
   * @returns 自定义主题数组
   */
  async getCustomThemes(platform: string): Promise<ThemeMetadata[]> {
    await this.ensureInitialized()
    return this.preferences.customThemes[platform] || []
  }

  /**
   * 删除自定义主题
   * @param platform 平台名称
   * @param themeName 主题名称
   * @returns 是否删除成功
   */
  async removeCustomTheme(platform: string, themeName: string): Promise<boolean> {
    await this.ensureInitialized()

    if (!this.preferences.customThemes[platform]) {
      return false
    }

    const initialLength = this.preferences.customThemes[platform].length
    this.preferences.customThemes[platform] = this.preferences.customThemes[platform].filter(
      t => t.name !== themeName
    )

    if (this.preferences.customThemes[platform].length < initialLength) {
      await this.savePreferences()
      return true
    }

    return false
  }

  /**
   * 重置平台默认主题为系统默认
   * @param platform 平台名称
   */
  async resetPlatformDefault(platform: string): Promise<void> {
    await this.ensureInitialized()
    delete this.preferences.platformDefaults[platform]
    await this.savePreferences()
  }

  /**
   * 重置所有配置为默认值
   */
  async resetAll(): Promise<void> {
    this.preferences = { ...DEFAULT_THEME_PREFERENCES }
    await this.savePreferences()
  }
}

// 导出单例实例
export const themeConfigManager = new ThemeConfigManager()
