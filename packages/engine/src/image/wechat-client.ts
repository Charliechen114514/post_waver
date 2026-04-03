import axios from 'axios'
import { existsSync, createReadStream } from 'fs'
import FormData from 'form-data'
import { ConfigService } from '@content-hub/database'

/**
 * 微信公众号配置
 */
export interface WechatConfig {
  appId: string
  appSecret: string
  apiBaseUrl: string
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
    const startTime = Date.now()

    try {
      console.log(`📤 开始上传图片: ${imagePath}`)

      // 1. 获取 Access Token
      console.log(`  🔑 获取 Access Token...`)
      const accessToken = await this.getAccessToken()
      console.log(`  ✅ Token 获取成功`)

      // 2. 检查文件是否存在
      console.log(`  🔍 检查文件是否存在...`)
      if (!existsSync(imagePath)) {
        console.error(`  ❌ 文件不存在: ${imagePath}`)
        return {
          success: false,
          error: `图片文件不存在: ${imagePath}`
        }
      }
      console.log(`  ✅ 文件存在`)

      // 3. 构建 FormData
      console.log(`  📦 构建 FormData...`)
      const formData = new FormData()
      formData.append('media', createReadStream(imagePath))
      formData.append('type', 'image')
      console.log(`  ✅ FormData 构建完成`)

      // 4. 上传到微信
      const url = `${this.config.apiBaseUrl}/material/add_material?access_token=${accessToken}&type=image`
      console.log(`  🚀 发起上传请求...`)
      console.log(`     API URL: ${this.config.apiBaseUrl}/material/add_material`)

      const response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders()
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      })

      const duration = Date.now() - startTime
      console.log(`  📡 收到响应 (耗时: ${duration}ms)`)

      const { media_id, url: mediaUrl, errcode, errmsg } = response.data

      if (errcode) {
        console.error(`  ❌ API 返回错误:`)
        console.error(`     错误码: ${errcode}`)
        console.error(`     错误信息: ${errmsg}`)

        // 常见错误码提示
        const errorTips: Record<number, string> = {
          40001: 'AppSecret 错误，请检查配置',
          40002: '不合法的凭证类型',
          40004: '不合法的媒体文件类型',
          40005: '不合法的文件类型',
          40006: '不合法的文件大小',
          40007: '媒体文件为空',
          41001: '缺少 access_token 参数',
          41002: '缺少appid 参数',
          41003: '缺少 refresh_token 参数',
          42001: 'access_token 超时',
          42002: 'refresh_token 超时',
          43001: '需要 GET 请求',
          43002: '需要 POST 请求',
          43003: '需要 HTTPS 请求',
          44001: '多媒体文件为空',
          44002: 'POST 的数据包为空',
          44003: '图文消息内容为空',
          45001: '多媒体文件大小超过限制',
          45002: '消息内容超过限制',
          45003: '标题字段超过限制',
          45004: '描述字段超过限制',
          45005: '链接字段超过限制',
          45006: '图片链接字段超过限制',
          45007: '语音播放时间超过限制',
          45008: '图文消息超过限制',
          45009: '接口调用超过限制',
          45010: '创建菜单个数超过限制',
          45011: 'API 调用太频繁，请稍后重试',
          45012: '某个菜单项不存在'
        }

        const tip = errorTips[errcode]
        if (tip) {
          console.error(`     💡 提示: ${tip}`)
        }

        return {
          success: false,
          error: `上传失败: [${errcode}] ${errmsg}${tip ? ` (${tip})` : ''}`
        }
      }

      if (!media_id) {
        console.error(`  ❌ API 响应异常，未返回 media_id`)
        console.error(`     完整响应: ${JSON.stringify(response.data)}`)
        return {
          success: false,
          error: `上传失败: ${JSON.stringify(response.data)}`
        }
      }

      console.log(`  ✅ 上传成功!`)
      console.log(`     Media ID: ${media_id}`)
      console.log(`     URL: ${mediaUrl}`)
      console.log(`     总耗时: ${duration}ms`)

      return {
        success: true,
        mediaId: media_id,
        url: mediaUrl
      }

    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`  ❌ 上传异常 (耗时: ${duration}ms)`)

      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.errmsg || error.message

        console.error(`  错误详情:`)
        console.error(`    状态码: ${error.response?.status}`)
        console.error(`    错误信息: ${errorMsg}`)

        if (error.response?.data) {
          console.error(`    响应数据: ${JSON.stringify(error.response.data)}`)
        }

        // 处理 API 限流
        if (error.response?.status === 429 || error.response?.data?.errcode === 450) {
          console.error(`  💡 API 限流，请稍后重试`)
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

      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`    未知错误: ${errorMsg}`)

      return {
        success: false,
        error: errorMsg
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
   * 保存 Access Token
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
