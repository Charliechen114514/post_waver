import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 主题元数据接口
 */
export interface ThemeMetadata {
  /** 主题名称（唯一标识） */
  name: string
  /** 主题显示名称 */
  displayName: string
  /** 主题描述 */
  description: string
  /** 主题预览图URL（可选） */
  preview?: string
  /** CSS文件名 */
  cssFile: string
}

/**
 * 主题注册表接口
 */
interface ThemeRegistry {
  /** 默认主题名称 */
  default: string
  /** 主题列表 */
  themes: ThemeMetadata[]
}

/**
 * 主题管理器类
 * 负责加载、验证和提供平台主题
 */
export class ThemeManager {
  private cache: Map<string, ThemeRegistry> = new Map()
  private cssCache: Map<string, string> = new Map()

  /**
   * 获取平台的所有主题
   * @param platform 平台名称（如 'wechat', 'juejin'）
   * @returns 主题元数据数组
   */
  async getPlatformThemes(platform: string): Promise<ThemeMetadata[]> {
    try {
      const registry = await this.loadRegistry(platform)
      return registry.themes
    } catch (error) {
      // 如果是"平台没有主题目录"的错误，静默返回空数组
      if (error instanceof Error && error.message.includes('has no theme directory')) {
        return []
      }
      // 其他错误才打印日志
      console.error(`加载平台主题失败 [${platform}]:`, error)
      return []
    }
  }

  /**
   * 获取平台的默认主题名称
   * @param platform 平台名称
   * @returns 默认主题名称，如果平台没有主题则返回null
   */
  async getDefaultThemeName(platform: string): Promise<string | null> {
    try {
      const registry = await this.loadRegistry(platform)
      return registry.default
    } catch (error) {
      // 如果平台没有主题目录，返回null
      if (error instanceof Error && error.message.includes('has no theme directory')) {
        return null
      }
      console.error(`加载默认主题失败 [${platform}]:`, error)
      return null
    }
  }

  /**
   * 获取指定主题的CSS内容
   * @param platform 平台名称
   * @param themeName 主题名称
   * @returns CSS内容字符串
   */
  async getThemeCSS(platform: string, themeName: string): Promise<string> {
    const cacheKey = `${platform}/${themeName}`

    // 检查缓存
    if (this.cssCache.has(cacheKey)) {
      return this.cssCache.get(cacheKey)!
    }

    try {
      // 验证主题是否存在
      const isValid = await this.validateTheme(platform, themeName)
      if (!isValid) {
        throw new Error(`主题 "${themeName}" 在平台 "${platform}" 中不存在`)
      }

      // 读取CSS文件
      const themesDir = join(__dirname, 'themes', platform)
      const cssPath = join(themesDir, `${themeName}.css`)
      const css = await readFile(cssPath, 'utf-8')

      // 缓存CSS内容
      this.cssCache.set(cacheKey, css)

      return css
    } catch (error) {
      console.error(`加载主题CSS失败 [${platform}/${themeName}]:`, error)
      throw error
    }
  }

  /**
   * 验证主题是否存在于指定平台
   * @param platform 平台名称
   * @param themeName 主题名称
   * @returns 是否存在
   */
  async validateTheme(platform: string, themeName: string): Promise<boolean> {
    try {
      const registry = await this.loadRegistry(platform)
      return registry.themes.some(theme => theme.name === themeName)
    } catch (error) {
      return false
    }
  }

  /**
   * 加载平台的主题注册表
   * @param platform 平台名称
   * @returns 主题注册表
   * @throws Error 如果主题目录不存在
   * @private
   */
  private async loadRegistry(platform: string): Promise<ThemeRegistry> {
    // 检查缓存
    if (this.cache.has(platform)) {
      return this.cache.get(platform)!
    }

    // 检查meta.json文件是否存在
    const metaPath = join(__dirname, 'themes', platform, 'meta.json')
    if (!existsSync(metaPath)) {
      throw new Error(`Platform "${platform}" has no theme directory`)
    }

    // 读取meta.json文件
    const content = await readFile(metaPath, 'utf-8')
    const registry: ThemeRegistry = JSON.parse(content)

    // 缓存注册表
    this.cache.set(platform, registry)

    return registry
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
    this.cssCache.clear()
  }
}

// 导出单例实例
export const themeManager = new ThemeManager()
