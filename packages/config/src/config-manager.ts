import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

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

export class ConfigManager {
  private configPath: string
  private config: PublishConfig

  constructor(rootDir: string = process.cwd()) {
    this.configPath = join(rootDir, '.post-waver', 'config.json')
    this.config = this.loadConfig()
  }

  /**
   * 加载配置
   */
  private loadConfig(): PublishConfig {
    if (existsSync(this.configPath)) {
      try {
        const data = readFileSync(this.configPath, 'utf-8')
        return { ...DEFAULT_CONFIG, ...JSON.parse(data) }
      } catch (error) {
        console.warn(`⚠️  配置文件加载失败，使用默认配置`)
        return DEFAULT_CONFIG
      }
    }
    return DEFAULT_CONFIG
  }

  /**
   * 保存配置
   */
  private saveConfig(): void {
    const dir = join(process.cwd(), '.post-waver')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(this.configPath, JSON.stringify(this.config, null, 2))
  }

  /**
   * 获取配置
   */
  get<K extends keyof PublishConfig>(key: K): PublishConfig[K] {
    return this.config[key]
  }

  /**
   * 设置配置
   */
  set<K extends keyof PublishConfig>(key: K, value: PublishConfig[K]): void {
    this.config[key] = value
    this.saveConfig()
  }

  /**
   * 获取全部配置
   */
  getAll(): PublishConfig {
    return { ...this.config }
  }

  /**
   * 重置为默认配置
   */
  reset(): void {
    this.config = DEFAULT_CONFIG
    this.saveConfig()
  }
}
