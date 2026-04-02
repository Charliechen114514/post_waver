import * as fs from 'fs'
import * as path from 'path'
import type { IndexedPost, PlatformIds, RelatedPostLinks } from './types.js'

/**
 * 平台链接配置
 */
export interface PlatformLinkConfig {
  /** 目标平台 */
  platform: string
  /** 博客基础URL（降级使用） */
  blogBaseUrl: string
  /** 平台ID映射表路径 */
  platformIdsPath?: string
}

/**
 * 生成平台特定的推介链接
 */
export function generatePlatformLinks(
  _postId: string,
  relatedPosts: IndexedPost[],
  config: PlatformLinkConfig
): RelatedPostLinks {
  // 读取平台ID映射表
  const platformIds = loadPlatformIds(config.platformIdsPath)

  const links: RelatedPostLinks = {
    related: []
  }

  // 生成上一篇链接（取第一篇相关文章）
  if (relatedPosts.length > 0) {
    const prevPost = relatedPosts[0]
    const prevLink = generatePostLink(prevPost, config.platform, config.blogBaseUrl, platformIds)
    links.prev = {
      title: prevPost.title,
      url: prevLink
    }
  }

  // 生成下一篇链接（取第二篇相关文章）
  if (relatedPosts.length > 1) {
    const nextPost = relatedPosts[1]
    const nextLink = generatePostLink(nextPost, config.platform, config.blogBaseUrl, platformIds)
    links.next = {
      title: nextPost.title,
      url: nextLink
    }
  }

  // 生成相关文章链接（最多3篇）
  links.related = relatedPosts.slice(0, 3).map(post => ({
    title: post.title,
    url: generatePostLink(post, config.platform, config.blogBaseUrl, platformIds)
  }))

  return links
}

/**
 * 生成单篇文章的平台链接
 */
function generatePostLink(
  post: IndexedPost,
  platform: string,
  blogBaseUrl: string,
  platformIds: PlatformIds
): string {
  // 检查是否有平台ID映射
  const postMapping = platformIds.mappings[post.id]
  if (postMapping && postMapping[platform]) {
    const platformInfo = postMapping[platform]
    // 如果有URL，使用URL；否则使用平台ID生成链接
    if (platformInfo && platformInfo.url) {
      return platformInfo.url
    }
    if (platformInfo) {
      return generatePlatformUrl(platform, platformInfo.postId)
    }
  }

  // 降级：使用博客链接
  return generateBlogLink(post.id, blogBaseUrl)
}

/**
 * 生成平台URL（根据平台ID）
 */
function generatePlatformUrl(platform: string, postId: string): string {
  switch (platform) {
    case 'juejin':
      return `https://juejin.cn/post/${postId}`
    case 'zhihu':
      return `https://zhuanlan.zhihu.com/p/${postId}`
    case 'csdn':
      // CSDN的URL格式需要用户名，这里只返回文章ID部分
      // 实际使用时应该从URL字段获取完整URL
      return `https://blog.csdn.net/xxx/article/details/${postId}`
    case 'wechat':
      // 微信公众号没有公开URL，使用锚点
      return `#article-${postId}`
    default:
      return `#article-${postId}`
  }
}

/**
 * 生成博客链接
 */
function generateBlogLink(postId: string, blogBaseUrl: string): string {
  const baseUrl = blogBaseUrl.endsWith('/') ? blogBaseUrl : `${blogBaseUrl}/`
  return `${baseUrl}${postId}.html`
}

/**
 * 格式化推介链接为 Markdown 文本
 */
export function formatLinksAsMarkdown(
  links: RelatedPostLinks,
  _platform: string
): string {
  const parts: string[] = []

  if (links.prev) {
    parts.push(`**上一篇：**[${links.prev.title}](${links.prev.url})`)
  }

  if (links.next) {
    parts.push(`**下一篇：**[${links.next.title}](${links.next.url})`)
  }

  if (links.related.length > 0) {
    parts.push('')
    parts.push('**相关阅读：**')
    links.related.forEach((link, index) => {
      parts.push(`${index + 1}. [${link.title}](${link.url})`)
    })
  }

  return parts.join('\n')
}

/**
 * 格式化推介链接为 HTML 文本
 */
export function formatLinksAsHTML(
  links: RelatedPostLinks,
  _platform: string
): string {
  const parts: string[] = []

  if (links.prev || links.next) {
    parts.push('<div class="post-navigation">')
    if (links.prev) {
      parts.push(`<p><strong>上一篇：</strong><a href="${links.prev.url}">${links.prev.title}</a></p>`)
    }
    if (links.next) {
      parts.push(`<p><strong>下一篇：</strong><a href="${links.next.url}">${links.next.title}</a></p>`)
    }
    parts.push('</div>')
  }

  if (links.related.length > 0) {
    parts.push('<div class="related-posts">')
    parts.push('<h4>相关阅读</h4>')
    parts.push('<ul>')
    links.related.forEach(link => {
      parts.push(`<li><a href="${link.url}">${link.title}</a></li>`)
    })
    parts.push('</ul>')
    parts.push('</div>')
  }

  return parts.join('\n')
}

/**
 * 加载平台ID映射表
 */
export function loadPlatformIds(customPath?: string): PlatformIds {
  const defaultPath = path.join(process.cwd(), 'content', 'platform-ids.json')
  const platformIdsPath = customPath || defaultPath

  try {
    const content = fs.readFileSync(platformIdsPath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    // 文件不存在或读取失败，返回空映射表
    return {
      version: 1,
      mappings: {},
      lastUpdated: new Date().toISOString()
    }
  }
}

/**
 * 保存平台ID映射表
 */
export function savePlatformIds(
  platformIds: PlatformIds,
  customPath?: string
): void {
  const defaultPath = path.join(process.cwd(), 'content', 'platform-ids.json')
  const platformIdsPath = customPath || defaultPath

  // 更新时间戳
  platformIds.lastUpdated = new Date().toISOString()

  // 确保目录存在
  const dir = path.dirname(platformIdsPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // 保存文件
  fs.writeFileSync(platformIdsPath, JSON.stringify(platformIds, null, 2), 'utf-8')
}

/**
 * 更新文章的平台ID
 */
export function updatePlatformId(
  postId: string,
  platform: string,
  postIdValue: string,
  url?: string,
  customPath?: string
): void {
  const platformIds = loadPlatformIds(customPath)

  // 初始化文章映射
  if (!platformIds.mappings[postId]) {
    platformIds.mappings[postId] = {}
  }

  // 更新平台ID
  platformIds.mappings[postId][platform] = {
    postId: postIdValue,
    url,
    publishedAt: new Date().toISOString()
  }

  savePlatformIds(platformIds, customPath)
}

/**
 * 删除文章的平台ID
 */
export function removePlatformId(
  postId: string,
  platform: string,
  customPath?: string
): void {
  const platformIds = loadPlatformIds(customPath)

  if (platformIds.mappings[postId]?.[platform]) {
    delete platformIds.mappings[postId][platform]
    savePlatformIds(platformIds, customPath)
  }
}

/**
 * 获取文章的平台ID信息
 */
export function getPlatformId(
  postId: string,
  platform: string,
  customPath?: string
): { postId: string; url?: string; publishedAt?: string } | null {
  const platformIds = loadPlatformIds(customPath)
  return platformIds.mappings[postId]?.[platform] || null
}

/**
 * 获取文章的所有平台ID信息
 */
export function getAllPlatformIds(
  postId: string,
  customPath?: string
): Record<string, { postId: string; url?: string; publishedAt?: string }> {
  const platformIds = loadPlatformIds(customPath)
  const mapping = platformIds.mappings[postId]
  if (!mapping) {
    return {}
  }

  // 转换为 Record 类型
  const result: Record<string, { postId: string; url?: string; publishedAt?: string }> = {}
  for (const [key, value] of Object.entries(mapping)) {
    if (value) {
      result[key] = value
    }
  }
  return result
}
