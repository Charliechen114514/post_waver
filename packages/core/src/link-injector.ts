import { IndexedPost } from './types'

/**
 * 根据日期和 ID 生成 Hexo permalink
 * 支持 Hexo 的 permalink 配置格式，默认为 :year/:month/:day/:title/
 *
 * @param id - 文章 ID
 * @param dateString - 文章日期（ISO8601 格式）
 * @param permalinkPattern - Hexo permalink 模式，默认 ':year/:month/:day/:title/'
 * @returns 生成的 permalink 路径（以 / 开头的绝对路径）
 */
function generatePermalink(
  id: string,
  dateString: string,
  permalinkPattern: string = ':year/:month/:day/:title/'
): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  const permalink = permalinkPattern
    .replace(':year', String(year))
    .replace(':month', month)
    .replace(':day', day)
    .replace(':title', id)
    .replace(/\/+$/, '') // 移除末尾的斜杠

  // 返回绝对路径（以 / 开头）
  return '/' + permalink
}

/**
 * 为文章内容注入相关阅读信息
 *
 * @param content - 原始文章内容
 * @param post - 当前文章的索引信息
 * @param allPosts - 所有文章的索引（Map 或 Record）
 * @param permalinkPattern - Hexo permalink 模式，默认 ':year/:month/:day/:title/'
 * @param usePreviewLinks - 是否使用预览链接格式（用于 Web UI），默认 false
 * @returns 注入相关阅读信息后的文章内容
 */
export function injectRelatedLinks(
  content: string,
  post: IndexedPost,
  allPosts: Map<string, IndexedPost> | Record<string, IndexedPost>,
  permalinkPattern: string = ':year/:month/:day/:title/',
  usePreviewLinks: boolean = false
): string {
  // 只处理相关推荐
  if (!post.related || post.related.length === 0) {
    return content
  }

  // 检查是否已经包含相关阅读部分
  const hasRelatedLinks = content.includes('## 相关阅读')
  if (hasRelatedLinks) {
    // 已经注入过，直接返回原内容
    return content
  }

  let footer = '\n\n---\n\n## 相关阅读\n\n'

  post.related
    .slice(0, 3) // 只显示前 3 篇
    .forEach((item, index) => {
      const relatedPost = allPosts instanceof Map ? allPosts.get(item.id) : allPosts[item.id]
      if (relatedPost) {
        let link: string
        if (usePreviewLinks) {
          // 使用预览链接格式
          link = `/post_waver/preview/${relatedPost.id}`
        } else {
          // 使用 Hexo 链接格式
          const permalink = generatePermalink(relatedPost.id, relatedPost.date, permalinkPattern)
          link = permalink + '/'
        }
        footer += `${index + 1}. [${relatedPost.title}](${link}) - 相似度 ${(item.score * 100).toFixed(0)}%\n`
      }
    })

  return content + footer
}

/**
 * 为文章内容注入相关阅读信息（使用平台真实 URL）
 *
 * @param content - 原始文章内容
 * @param post - 当前文章的索引信息
 * @param allPosts - 所有文章的索引（Map 或 Record）
 * @param platform - 目标平台（juejin, wechat, html）
 * @returns 注入相关阅读信息后的文章内容
 */
export async function injectRelatedLinksWithPlatform(
  content: string,
  post: IndexedPost,
  allPosts: Map<string, IndexedPost> | Record<string, IndexedPost>,
  platform: string
): Promise<string> {
  // 只处理相关推荐
  if (!post.related || post.related.length === 0) {
    return content
  }

  // 检查是否已经包含相关阅读部分
  const hasRelatedLinks = content.includes('## 相关阅读')
  if (hasRelatedLinks) {
    // 移除旧的相关阅读部分
    content = content.replace(/\n\n---\n\n## 相关阅读\n\n[\s\S]*?$/, '')
  }

  let footer = '\n\n---\n\n## 相关阅读\n\n'

  let validCount = 0
  for (let i = 0; i < post.related.length && validCount < 3; i++) {
    const item = post.related[i]
    const relatedPost = allPosts instanceof Map ? allPosts.get(item.id) : allPosts[item.id]

    if (relatedPost) {
      try {
        // 动态导入 PlatformIdService
        const { PlatformIdService } = await import('@content-hub/database')

        // 查询该相关文章在当前平台的已注册 URL
        const platformInfo = await PlatformIdService.get(relatedPost.id, platform)

        if (platformInfo && platformInfo.url) {
          // 使用平台真实 URL
          footer += `${validCount + 1}. [${relatedPost.title}](${platformInfo.url}) - 相似度 ${(item.score * 100).toFixed(0)}%\n`
          validCount++
          console.log(`    ✓ [${relatedPost.title}] → ${platformInfo.url}`)
        } else {
          // 未注册平台 URL，跳过该相关文章
          console.log(`    ⊘ [${relatedPost.title}] → 未注册 ${platform} URL，已跳过`)
        }
      } catch (error) {
        console.warn(`    ❌ 查询平台 URL 失败: ${relatedPost.id}@${platform}`, error)
        // 发生错误时跳过该相关文章
      }
    }
  }

  // 如果没有找到任何已发布到目标平台的相关文章，不添加 footer
  if (validCount === 0) {
    console.log(`    ℹ️  没有相关文章已发布到 ${platform} 平台`)
    console.log(`    💡 提示：在发布页面注册平台 URL 后，相关链接将自动显示`)
    return content
  }

  return content + footer
}
