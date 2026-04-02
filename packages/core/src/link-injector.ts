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
 * 为文章内容注入关联信息（上/下篇、相关阅读）
 *
 * @param content - 原始文章内容
 * @param post - 当前文章的索引信息
 * @param allPosts - 所有文章的索引（Map 或 Record）
 * @param permalinkPattern - Hexo permalink 模式，默认 ':year/:month/:day/:title/'
 * @returns 注入关联信息后的文章内容
 */
export function injectRelatedLinks(
  content: string,
  post: IndexedPost,
  allPosts: Map<string, IndexedPost> | Record<string, IndexedPost>,
  permalinkPattern: string = ':year/:month/:day/:title/'
): string {
  let footer = '\n\n---\n\n## 相关阅读\n\n'

  // 上/下篇（基于时间顺序）
  if (post.prev || post.next) {
    footer += '**相邻文章**：\n\n'

    if (post.prev) {
      const prevPost = allPosts instanceof Map ? allPosts.get(post.prev) : allPosts[post.prev]
      if (prevPost) {
        const permalink = generatePermalink(prevPost.id, prevPost.date, permalinkPattern)
        footer += `- [上一篇: ${prevPost.title}](${permalink}/)\n`
      }
    }

    if (post.next) {
      const nextPost = allPosts instanceof Map ? allPosts.get(post.next) : allPosts[post.next]
      if (nextPost) {
        const permalink = generatePermalink(nextPost.id, nextPost.date, permalinkPattern)
        footer += `- [下一篇: ${nextPost.title}](${permalink}/)\n`
      }
    }

    footer += '\n'
  }

  // 相关推荐（基于语义相似度）
  if (post.related && post.related.length > 0) {
    footer += '**推荐阅读**：\n\n'

    post.related
      .slice(0, 3) // 只显示前 3 篇
      .forEach((item, index) => {
        const relatedPost = allPosts instanceof Map ? allPosts.get(item.id) : allPosts[item.id]
        if (relatedPost) {
          const permalink = generatePermalink(relatedPost.id, relatedPost.date, permalinkPattern)
          footer += `${index + 1}. [${relatedPost.title}](${permalink}/) - 相似度 ${(item.score * 100).toFixed(0)}%\n`
        }
      })
  }

  // 如果没有任何关联信息，不添加 footer
  if (!post.prev && !post.next && (!post.related || post.related.length === 0)) {
    return content
  }

  return content + footer
}
