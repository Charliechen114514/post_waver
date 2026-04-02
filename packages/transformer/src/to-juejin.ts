import { generatePlatformLinks, formatLinksAsMarkdown } from '@content-hub/core'
import type { IndexedPost } from '@content-hub/core'

/**
 * 掘金转换器选项
 */
export interface JuejinTransformOptions {
  /** 文章ID */
  postId?: string
  /** 相关文章列表 */
  relatedPosts?: IndexedPost[]
  /** 博客基础URL */
  blogBaseUrl?: string
  /** 是否添加相关文章链接 */
  includeRelatedLinks?: boolean
}

/**
 * 将 Markdown 转换为掘金格式（Markdown）
 * 掘金原生支持 Markdown，所以主要是格式标准化和元数据提取
 */
export async function transformForJuejin(
  markdown: string,
  options?: JuejinTransformOptions
): Promise<string> {
  let result = markdown

  // 如果提供了相关文章信息，添加平台链接
  if (options?.includeRelatedLinks && options.postId && options.relatedPosts) {
    const links = generatePlatformLinks(options.postId, options.relatedPosts, {
      platform: 'juejin',
      blogBaseUrl: options.blogBaseUrl || 'https://your-blog.github.io/'
    })

    const linksMarkdown = formatLinksAsMarkdown(links, 'juejin')
    result = markdown + '\n\n---\n\n' + linksMarkdown
  }

  return result
}
