import { existsSync } from 'fs'
import { WechatClient } from './wechat-client.js'
import { ImageUploadConfigManager } from '@content-hub/config'
import { replaceImageUrls, generateReplacementReport } from './image-url-replacer.js'

// 动态导入core包的函数
// @ts-ignore - core包会在运行时从dist加载
async function getImageListFunctions() {
  const module = await import('@content-hub/core')
  return {
    extractImagesFromMarkdown: module.extractImagesFromMarkdown,
    generateImageListFile: module.generateImageListFile
  }
}

/**
 * 单个图片上传结果
 */
export interface ImageUploadResult {
  originalPath: string
  platform: string
  success: boolean
  mediaId?: string
  url?: string
  error?: string
  fallbackToList?: boolean
}

/**
 * 上传管理器结果
 */
export interface UploadManagerResult {
  platform: string
  uploaded: ImageUploadResult[]
  listFile?: string
  success: number
  failed: number
  skipped: number
  replacedContent?: string  // 新增：替换后的内容
}

/**
 * 上传选项
 */
export interface UploadOptions {
  outputDir: string
  postDir?: string // 文章所在目录，用于解析相对路径
  fallbackToGithub?: boolean
  fallbackToList?: boolean
  maxRetries?: number
}

/**
 * 图片上传管理器
 */
export class ImageUploadManager {
  private configManager: ImageUploadConfigManager
  private wechatClient: WechatClient | null = null

  constructor() {
    this.configManager = new ImageUploadConfigManager()
  }

  /**
   * 处理单个平台的图片上传
   * 策略：
   * 1. 尝试平台特定上传（如微信）
   * 2. 失败则降级到生成图片列表
   */
  async processPlatformImages(
    postId: string,
    content: string,
    platform: string,
    options: UploadOptions
  ): Promise<UploadManagerResult> {
    const { fallbackToList = true, outputDir, postDir = process.cwd() } = options

    console.log(`\n📷 处理 [${platform}] 平台的图片...`)

    // 动态导入函数
    const { extractImagesFromMarkdown, generateImageListFile } = await getImageListFunctions()

    // 提取图片引用，使用文章所在目录作为baseDir
    const imageResult = extractImagesFromMarkdown(content, {
      baseDir: postDir,
      includeFileStats: true
    })

    // 过滤出需要上传的本地图片
    const localImages = imageResult.localImages.filter(img => img.absolutePath && existsSync(img.absolutePath))

    if (localImages.length === 0) {
      console.log(`  ✅ 没有需要上传的图片`)
      return {
        platform,
        uploaded: [],
        success: 0,
        failed: 0,
        skipped: imageResult.localImages.length
      }
    }

    console.log(`  📁 找到 ${localImages.length} 个本地图片`)

    // 根据平台决定上传策略
    if (platform === 'wechat' && await this.configManager.isConfigured('wechat')) {
      return await this.uploadToWechat(postId, content, localImages, options)
    }

    // 其他平台降级到生成图片列表
    if (fallbackToList) {
      return await this.generateListOnly(postId, content, platform, localImages, options, generateImageListFile)
    }

    // 不降级，返回空结果
    return {
      platform,
      uploaded: [],
      success: 0,
      failed: localImages.length,
      skipped: 0
    }
  }

  /**
   * 上传到微信公众号
   */
  private async uploadToWechat(
    postId: string,
    content: string,
    images: Array<{ absolutePath?: string; originalPath: string }>,
    options: UploadOptions
  ): Promise<UploadManagerResult> {
    const { maxRetries = 2, outputDir, fallbackToList = true } = options

    console.log(`  🔧 开始初始化微信客户端...`)

    // 初始化微信客户端
    if (!this.wechatClient) {
      console.log(`  📱 加载微信配置...`)
      const wechatConfig = await this.configManager.getWechatConfig()
      if (!wechatConfig) {
        console.error(`  ❌ 微信配置不存在，请检查配置文件`)
        throw new Error('微信配置不存在')
      }
      console.log(`  ✅ 微信配置加载成功 (appId: ${wechatConfig.appId})`)

      this.wechatClient = new WechatClient({
        appId: wechatConfig.appId,
        appSecret: wechatConfig.appSecret,
        apiBaseUrl: 'https://api.weixin.qq.com/cgi-bin'
      })
      console.log(`  ✅ 微信客户端初始化完成`)
    }

    const uploaded: ImageUploadResult[] = []
    let success = 0
    let failed = 0

    console.log(`  📤 开始上传 ${images.length} 张图片...`)

    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      console.log(`\n  [${i + 1}/${images.length}] 处理图片: ${img.originalPath}`)

      if (!img.absolutePath) {
        console.error(`    ❌ 文件路径不存在`)
        failed++
        uploaded.push({
          originalPath: img.originalPath,
          platform: 'wechat',
          success: false,
          error: '文件路径不存在'
        })
        continue
      }

      console.log(`    📁 本地路径: ${img.absolutePath}`)

      // 带重试的上传
      let lastError = ''
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`    🔄 尝试上传 (第 ${attempt}/${maxRetries} 次)...`)

        try {
          const result = await this.wechatClient.uploadImage(img.absolutePath)

          if (result.success) {
            success++
            console.log(`    ✅ 上传成功!`)
            console.log(`       Media ID: ${result.mediaId}`)
            console.log(`       URL: ${result.url}`)

            uploaded.push({
              originalPath: img.originalPath,
              platform: 'wechat',
              success: true,
              mediaId: result.mediaId,
              url: result.url
            })
            lastError = ''
            break
          } else {
            lastError = result.error || '未知错误'
            console.log(`    ⚠️  上传失败: ${lastError}`)
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error)
          console.error(`    ❌ 上传异常: ${lastError}`)
        }

        // 等待后重试
        if (attempt < maxRetries) {
          console.log(`    ⏳ 等待 2 秒后重试...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }

      // 所有重试都失败
      if (lastError) {
        failed++
        console.error(`    ❌ 图片上传失败（已达最大重试次数）: ${img.originalPath}`)
        console.error(`       错误原因: ${lastError}`)

        uploaded.push({
          originalPath: img.originalPath,
          platform: 'wechat',
          success: false,
          error: lastError
        })
      }
    }

    console.log(`\n  📊 上传统计:`)
    console.log(`     ✅ 成功: ${success}`)
    console.log(`     ❌ 失败: ${failed}`)
    console.log(`     📝 成功率: ${success > 0 ? ((success / images.length) * 100).toFixed(1) : 0}%`)

    // 如果有失败的，生成图片列表
    let listFile: string | undefined
    if (failed > 0 && fallbackToList) {
      console.log(`  ⚠️  部分图片上传失败，生成图片列表供手动上传...`)

      // 动态导入生成函数
      const { generateImageListFile } = await getImageListFunctions()

      // 生成包含所有图片的列表（用户可以手动处理失败的）
      listFile = await generateImageListFile(
        postId,
        content,
        'wechat',
        outputDir,
        {
          baseDir: process.cwd(),
          includeFileStats: true
        }
      )

      console.log(`  ✅ 已生成失败图片列表: ${listFile}`)
    }

    return {
      platform: 'wechat',
      uploaded,
      listFile,
      success,
      failed,
      skipped: 0,
      replacedContent: undefined  // 在上层调用replaceImageUrls
    }
  }

  /**
   * 仅生成图片列表（不实际上传）
   */
  private async generateListOnly(
    postId: string,
    content: string,
    platform: string,
    images: any[],
    options: UploadOptions,
    generateImageListFile: any
  ): Promise<UploadManagerResult> {
    console.log(`  📝 生成图片列表文件...`)

    const listFile = await generateImageListFile(
      postId,
      content,
      platform,
      options.outputDir,
      {
        baseDir: process.cwd(),
        includeFileStats: true
      }
    )

    console.log(`  ✅ 已生成: ${listFile}`)

    // 标记所有图片为需要手动上传
    const uploaded: ImageUploadResult[] = images.map(img => ({
      originalPath: img.originalPath,
      platform,
      success: false,
      fallbackToList: true,
      error: '此平台不支持自动上传，请手动上传'
    }))

    return {
      platform,
      uploaded,
      listFile,
      success: 0,
      failed: 0,
      skipped: images.length
    }
  }

  /**
   * 处理多个平台的图片上传
   */
  async processMultiPlatformImages(
    postId: string,
    content: string,
    platforms: string[],
    options: UploadOptions
  ): Promise<UploadManagerResult[]> {
    const results: UploadManagerResult[] = []

    for (const platform of platforms) {
      const result = await this.processPlatformImages(postId, content, platform, options)
      results.push(result)
    }

    return results
  }
}
