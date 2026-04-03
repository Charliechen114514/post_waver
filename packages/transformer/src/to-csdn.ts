import { generatePlatformLinks, formatLinksAsMarkdown } from '@content-hub/core'
import type { IndexedPost } from '@content-hub/core'
import { extractImagesFromMarkdown } from '@content-hub/core'

/**
 * CSDN转换器选项
 */
export interface CsdnTransformOptions {
  /** 文章ID */
  postId?: string
  /** 相关文章列表 */
  relatedPosts?: IndexedPost[]
  /** 博客基础URL */
  blogBaseUrl?: string
  /** 是否添加相关文章链接 */
  includeRelatedLinks?: boolean
  /** 是否移除本地图片（用于复制到外部平台） */
  removeLocalImages?: boolean
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 将 Markdown 转换为 CSDN 格式（Markdown）
 * CSDN 原生支持 Markdown，所以主要是格式标准化和元数据提取
 */
export async function transformForCsdn(
  markdown: string,
  options?: CsdnTransformOptions
): Promise<string> {
  let result = markdown

  // 如果需要移除本地图片
  if (options?.removeLocalImages) {
    const imageResult = extractImagesFromMarkdown(result)
    // 处理所有本地图片
    const allLocalImages = [
      ...imageResult.localImages,
      ...imageResult.base64Images
    ]
    for (const image of allLocalImages) {
      if (image.originalPath.startsWith('/assets/') || image.originalPath.startsWith('assets/')) {
        const filename = image.filename || image.originalPath.split('/').pop() || image.originalPath
        const placeholder = `\n📷 图片: ${filename} (请手动上传)\n`

        // 替换 Markdown 格式的图片: ![alt](path)
        result = result.replace(new RegExp(`!\\[[^\\]]*\\]\\(${escapeRegExp(image.originalPath)}\\)`, 'g'), placeholder)

        // 替换 HTML 格式的图片: <img src="path">
        result = result.replace(new RegExp(`<img[^>]+src=["']${escapeRegExp(image.originalPath)}["'][^>]*>`, 'gi'), placeholder)
      }
    }
  }

  // 如果提供了相关文章信息，添加平台链接
  if (options?.includeRelatedLinks && options.postId && options.relatedPosts) {
    const links = generatePlatformLinks(options.postId, options.relatedPosts, {
      platform: 'csdn',
      blogBaseUrl: options.blogBaseUrl || 'https://your-blog.github.io/'
    })

    const linksMarkdown = formatLinksAsMarkdown(links, 'csdn')
    result = result + '\n\n---\n\n' + linksMarkdown
  }

  return result
}
