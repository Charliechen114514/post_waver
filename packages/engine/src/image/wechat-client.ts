import axios from 'axios'
import { writeFileSync, readFileSync, existsSync, mkdirSync, createReadStream } from 'fs'
import { join } from 'path'
import FormData from 'form-data'
import { ConfigService } from '@content-hub/database'

/**
 * 微信公众号配置
 */
export interface WechatConfig {
  appId: string
  appSecret: string
  apiBaseUrl: string
  tokenCachePath?: string  // 可选，用于向后兼容
}

/**
 * 上传结果
 */
export interface UploadResult {
  success: boolean
  mediaId?: string
  url?: string
  error?: string
}

/**
 * Access Token 缓存
 */
interface TokenCache {
  token: string
  expiresAt: number
  updatedAt: number
}

/**
 * 微信公众号素材API客户端
 */
export class WechatClient {
  private config: WechatConfig
  private accessToken: string | null = null
  private tokenLoaded: boolean = false

  constructor(config: WechatConfig) {
    this.config = config
    // 不在构造函数中加载token，改为延迟加载
  }

  /**
   * 获取 Access Token
   */
  async getAccessToken(): Promise<string> {
    // 首次调用时加载token
    if (!this.tokenLoaded) {
      await this.loadAccessToken()
      this.tokenLoaded = true
    }

    // 检查缓存是否有效
    if (this.accessToken && await this.isTokenValid()) {
      return this.accessToken
    }

    // 从微信 API 获取新 token
    const url = `${this.config.apiBaseUrl}/token`
    const params = {
      grant_type: 'client_credential',
      appid: this.config.appId,
      secret: this.config.appSecret
    }

    try {
      const response = await axios.get(url, { params })
      const { access_token, expires_in, errcode, errmsg } = response.data

      if (errcode) {
        throw new Error(`获取 Access Token 失败: [${errcode}] ${errmsg}`)
      }

      if (!access_token) {
        throw new Error(`获取 Access Token 失败: ${JSON.stringify(response.data)}`)
      }

      // 保存 token 和过期时间
      this.accessToken = access_token
      this.saveAccessToken(access_token, Date.now() + expires_in * 1000)

      console.log(`✅ Access Token 已更新`)
      return access_token

    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`获取 Access Token 失败: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * 上传图片到素材库
   */
  async uploadImage(imagePath: string): Promise<UploadResult> {
    try {
      console.log(`📤 上传图片: ${imagePath}`)

      // 1. 获取 Access Token
      const accessToken = await this.getAccessToken()

      // 2. 检查文件是否存在
      if (!existsSync(imagePath)) {
        return {
          success: false,
          error: `图片文件不存在: ${imagePath}`
        }
      }

      // 3. 构建 FormData
      const formData = new FormData()
      formData.append('media', createReadStream(imagePath))
      formData.append('type', 'image')

      // 4. 上传到微信
      const url = `${this.config.apiBaseUrl}/material/add_material?access_token=${accessToken}&type=image`

      const response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders()
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      })

      const { media_id, url: mediaUrl, errcode, errmsg } = response.data

      if (errcode) {
        return {
          success: false,
          error: `上传失败: [${errcode}] ${errmsg}`
        }
      }

      if (!media_id) {
        return {
          success: false,
          error: `上传失败: ${JSON.stringify(response.data)}`
        }
      }

      console.log(`✅ 上传成功: ${media_id}`)
      console.log(`   URL: ${mediaUrl}`)

      return {
        success: true,
        mediaId: media_id,
        url: mediaUrl
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.errmsg || error.message

        // 处理 API 限流
        if (error.response?.status === 429 || error.response?.data?.errcode === 450) {
          return {
            success: false,
            error: 'API 限流，请稍后重试'
          }
        }

        return {
          success: false,
          error: `上传失败: ${errorMsg}`
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 批量上传图片
   */
  async uploadImages(imagePaths: string[]): Promise<UploadResult[]> {
    const results: UploadResult[] = []

    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i]

      console.log(`\n[${i + 1}/${imagePaths.length}]`)

      // API 限流：每上传 10 张图片后等待 1 秒
      if (i > 0 && i % 10 === 0) {
        console.log(`⏳ 等待 1 秒避免 API 限流...`)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      const result = await this.uploadImage(imagePath)
      results.push(result)

      // 失败不自动重试，由调用者决定是否重试
      if (!result.success) {
        console.log(`⚠️  上传失败: ${result.error}`)
      }
    }

    return results
  }

  /**
   * 检查 Token 是否有效（从数据库）
   */
  private async isTokenValid(): Promise<boolean> {
    try {
      const expiresAt = await ConfigService.get('wechatToken', 'expiresAt')
      if (!expiresAt) {
        return false
      }

      const now = Date.now()
      const expiresAtNum = parseInt(expiresAt)

      // 提前 5 分钟过期，避免边界问题
      return expiresAtNum > now + 300000
    } catch {
      return false
    }
  }

  /**
   * 保存 Access Token（到数据库）
   */
  private async saveAccessToken(token: string, expiresAt: number): Promise<void> {
    const updatedAt = Date.now()

    try {
      await ConfigService.set('wechatToken', 'token', token)
      await ConfigService.set('wechatToken', 'expiresAt', expiresAt.toString())
      await ConfigService.set('wechatToken', 'updatedAt', updatedAt.toString())
    } catch (error) {
      console.error('保存 token 到数据库失败:', error)
    }

    // 同时保存到文件作为备份（如果配置了路径）
    if (this.config.tokenCachePath) {
      const cache: TokenCache = {
        token,
        expiresAt,
        updatedAt
      }

      const dir = join(this.config.tokenCachePath, '..')
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      writeFileSync(this.config.tokenCachePath, JSON.stringify(cache, null, 2))
    }
  }

  /**
   * 加载 Access Token（从数据库）
   */
  private async loadAccessToken(): Promise<void> {
    try {
      const token = await ConfigService.get('wechatToken', 'token')
      if (token) {
        this.accessToken = token
      }
    } catch {
      // 忽略错误
    }
  }

  /**
   * 清除缓存的 Access Token
   */
  clearAccessToken(): void {
    this.accessToken = null
  }
}
