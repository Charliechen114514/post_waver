import { parsePost } from '@content-hub/core'
import { transformForWechat, transformForJuejin, markdownToHTML } from '@content-hub/transformer'
import { startPreview } from './preview/orchestrator.js'
import { copyToClipboard } from './clipboard.js'
import type { Platform } from './preview/orchestrator.js'

/**
 * 发布策略类型
 */
export type PublishStrategy = 'auto' | 'semi-auto' | 'copy'

/**
 * 发布结果接口
 */
export interface PublishResult {
  success: boolean
  message: string
  data?: {
    url?: string
    content?: string
    platform?: string
  }
}

/**
 * 根据平台转换内容
 */
async function transformForPlatform(content: string, platform: Platform): Promise<string> {
  switch (platform) {
    case 'wechat':
      return await transformForWechat(content)
    case 'juejin':
      return await transformForJuejin(content)
    case 'html':
      return await markdownToHTML(content)
    default:
      throw new Error(`不支持的平台: ${platform}`)
  }
}

/**
 * 执行发布策略
 *
 * @param postPath - Markdown 文件路径
 * @param platform - 目标平台
 * @param strategy - 发布策略
 * @returns Promise<PublishResult>
 */
export async function executeStrategy(
  postPath: string,
  platform: Platform,
  strategy: PublishStrategy
): Promise<PublishResult> {
  try {
    // 验证平台
    const validPlatforms: Platform[] = ['wechat', 'juejin', 'html']
    if (!validPlatforms.includes(platform)) {
      return {
        success: false,
        message: `不支持的平台: ${platform}`
      }
    }

    // 根据策略执行不同的操作
    switch (strategy) {
      case 'auto':
        // 自动发布（未来功能：直接调用平台 API）
        return {
          success: false,
          message: '自动发布功能尚未实现，请使用 semi-auto 或 copy 策略'
        }

      case 'semi-auto':
        // 半自动：打开预览页面
        console.log(`🔄 正在启动半自动发布流程...`)
        const server = await startPreview(postPath, platform)

        const url = `http://localhost:${server.port}/preview/${platform}/${postPath}`

        // 尝试在浏览器中打开
        try {
          const { default: open } = await import('open')
          await open(url)
        } catch (error) {
          console.log(`⚠️  无法自动打开浏览器，请手动访问: ${url}`)
        }

        return {
          success: true,
          message: '预览页面已在浏览器中打开，请手动复制内容并发布',
          data: { url, platform }
        }

      case 'copy':
        // 直接复制到剪贴板
        console.log(`🔄 正在转换为 ${platform} 格式...`)

        const post = await parsePost(postPath)
        const content = await transformForPlatform(post.content, platform)

        console.log(`📋 正在复制到剪贴板...`)
        await copyToClipboard(content)

        return {
          success: true,
          message: `已将 ${post.frontmatter.title} 的 ${platform} 格式内容复制到剪贴板`,
          data: { content, platform }
        }

      default:
        return {
          success: false,
          message: `未知的发布策略: ${strategy}`
        }
    }
  } catch (error) {
    console.error('❌ 执行发布策略失败:', error)
    return {
      success: false,
      message: `执行失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}
