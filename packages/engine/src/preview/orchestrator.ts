import { parsePost } from '@content-hub/core'
import { transformForWechat, transformForJuejin, markdownToHTML } from '@content-hub/transformer'
import { createPreviewServer, PreviewContent, PreviewServer } from './server.js'

/**
 * 支持的平台类型
 */
export type Platform = 'wechat' | 'juejin' | 'html'

/**
 * 平台验证函数
 */
function isValidPlatform(platform: string): platform is Platform {
  return ['wechat', 'juejin', 'html'].includes(platform)
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
 * 启动预览服务器
 *
 * @param postPath - Markdown 文件路径
 * @param platform - 目标平台 (wechat, juejin, html)
 * @returns 预览服务器实例
 */
export async function startPreview(postPath: string, platform: string): Promise<PreviewServer> {
  // 验证平台
  if (!isValidPlatform(platform)) {
    throw new Error(
      `不支持的平台: ${platform}。支持的平台: wechat, juejin, html`
    )
  }

  console.log(`📖 正在解析文章: ${postPath}`)

  // 解析文章
  let post
  try {
    post = await parsePost(postPath)
    console.log(`✅ 文章解析成功: ${post.frontmatter.title}`)
  } catch (error) {
    console.error('❌ 文章解析失败:', error)
    throw new Error(`文章解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }

  console.log(`🔄 正在转换为 ${platform} 格式...`)

  // 创建预览内容获取函数
  const getPreviewContent = async (_id: string, platform: string): Promise<PreviewContent> => {
    try {
      // 转换内容
      const transformed = await transformForPlatform(post.content, platform as Platform)

      return {
        title: post.frontmatter.title,
        platform: platform,
        content: transformed,
        id: post.id,
        timestamp: new Date().toLocaleString('zh-CN')
      }
    } catch (error) {
      console.error('❌ 内容转换失败:', error)
      throw new Error(`内容转换失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 启动预览服务器
  console.log('🚀 正在启动预览服务器...')
  const server = await createPreviewServer(getPreviewContent)

  return server
}

/**
 * 获取预览 URL
 */
export function getPreviewURL(port: number, platform: string, id: string): string {
  return `http://localhost:${port}/preview/${platform}/${id}`
}
