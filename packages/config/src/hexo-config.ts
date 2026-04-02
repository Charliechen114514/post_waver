import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { ConfigService } from '@content-hub/database'

export interface HexoSyncConfig {
  // Hexo 博客路径
  blogPath: string

  // 是否自动同步
  enabled: boolean

  // Git 配置
  git: {
    autoCommit: boolean
    autoPush: boolean
    commitMessage: string
    commitAuthor: {
      name: string
      email: string
    }
  }

  // 部署配置
  deploy: {
    enabled: boolean
    command: string
    timeout: number
  }

  // 路径映射
  paths: {
    posts: string
    images: string
    assets: string
  }
}

const DEFAULT_HEXO_CONFIG: HexoSyncConfig = {
  blogPath: './blog',
  enabled: false,
  git: {
    autoCommit: true,
    autoPush: false,
    commitMessage: 'docs: sync post from post_waver',
    commitAuthor: {
      name: 'Poster Wave',
      email: 'bot@posterwave.com'
    }
  },
  deploy: {
    enabled: false,
    command: 'hexo deploy',
    timeout: 60000
  },
  paths: {
    posts: 'source/_posts',
    images: 'source/images',
    assets: 'source/assets'
  }
}

/**
 * 配置分类名称（用于数据库存储）
 */
const CONFIG_CATEGORY = 'hexo'

export class HexoConfigManager {
  private config: HexoSyncConfig
  private initialized: boolean = false

  constructor(rootDir: string = process.cwd()) {
    // rootDir 参数保留用于 API 兼容性，但不再使用
    this.config = { ...DEFAULT_HEXO_CONFIG }
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
      if (storedConfig && Object.keys(storedConfig).length > 0) {
        this.config = deepMerge(DEFAULT_HEXO_CONFIG, storedConfig)
      } else {
        this.config = { ...DEFAULT_HEXO_CONFIG }
      }
    } catch (error) {
      console.warn(`⚠️  Hexo 配置加载失败，使用默认配置`)
      this.config = { ...DEFAULT_HEXO_CONFIG }
    }
  }

  /**
   * 保存配置（到数据库）
   */
  private async saveConfig(): Promise<void> {
    try {
      await ConfigService.setCategory(CONFIG_CATEGORY, this.config)
    } catch (error) {
      console.error('保存 Hexo 配置失败:', error)
      throw error
    }
  }

  /**
   * 获取配置项
   */
  async get<K extends keyof HexoSyncConfig>(key: K): Promise<HexoSyncConfig[K]> {
    await this.ensureInitialized()
    return this.config[key]
  }

  /**
   * 设置配置项
   */
  async set<K extends keyof HexoSyncConfig>(key: K, value: HexoSyncConfig[K]): Promise<void> {
    await this.ensureInitialized()
    this.config[key] = value
    await this.saveConfig()
  }

  /**
   * 获取完整配置
   */
  async getAll(): Promise<HexoSyncConfig> {
    await this.ensureInitialized()
    return { ...this.config }
  }

  /**
   * 验证配置
   */
  async validate(): Promise<{ valid: boolean; errors: string[] }> {
    await this.ensureInitialized()

    const errors: string[] = []

    // 检查博客路径
    const blogFullPath = resolve(process.cwd(), this.config.blogPath)
    if (!existsSync(blogFullPath)) {
      errors.push(`Hexo 博客路径不存在: ${blogFullPath}`)
    }

    // 检查 _posts 目录
    const postsPath = join(blogFullPath, this.config.paths.posts)
    if (!existsSync(postsPath)) {
      errors.push(`Hexo _posts 目录不存在: ${postsPath}`)
    }

    // 检查 Hexo 配置文件
    const hexoConfigPath = join(blogFullPath, '_config.yml')
    if (!existsSync(hexoConfigPath)) {
      errors.push(`Hexo 配置文件不存在: ${hexoConfigPath}`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

/**
 * 深度合并对象
 */
function deepMerge(target: any, source: any): any {
  const output = { ...target }
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] })
        } else {
          output[key] = deepMerge(target[key], source[key])
        }
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    })
  }
  return output
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item)
}