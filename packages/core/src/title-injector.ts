export interface TitleInjectionOptions {
  platform: 'juejin' | 'wechat' | 'html'
  customContent?: string
  enabled?: boolean
  position?: 'after_title' | 'before_content'
}

/**
 * 在文章标题后注入文本内容
 *
 * @param content - 原始文章内容
 * @param options - 注入选项
 * @returns 注入后的文章内容
 */
export function injectTitlePostContent(
  content: string,
  options: TitleInjectionOptions
): string {
  const {
    customContent,
    enabled = true,
    position = 'after_title'
  } = options

  // 如果未启用或没有内容，直接返回原内容
  if (!enabled || !customContent || customContent.trim() === '') {
    return content
  }

  // 分离 Frontmatter 和正文内容
  const { frontmatter, body } = separateFrontmatter(content)

  // 在正文内容中查找第一个标题
  const injectedBody = injectAfterFirstHeading(body, customContent, position)

  // 重新组合 Frontmatter 和正文
  return frontmatter + injectedBody
}

/**
 * 分离 Frontmatter 和正文内容
 */
function separateFrontmatter(content: string): { frontmatter: string; body: string } {
  // 检查是否有 Frontmatter（以 --- 开头和结尾）
  const frontmatterRegex = /^---\n[\s\S]*?\n---\n/
  const match = content.match(frontmatterRegex)

  if (match) {
    return {
      frontmatter: match[0],
      body: content.slice(match[0].length)
    }
  }

  return {
    frontmatter: '',
    body: content
  }
}

/**
 * 在第一个标题后注入内容
 */
function injectAfterFirstHeading(
  body: string,
  injectionContent: string,
  position: 'after_title' | 'before_content'
): string {
  // 查找第一个一级标题（# 标题）
  const firstHeadingRegex = /^(#\s+[^\n]+\n)/m
  const match = body.match(firstHeadingRegex)

  if (!match || match.index === undefined) {
    // 如果没有找到标题，直接在开头注入
    return injectionContent + '\n\n' + body
  }

  const headingEnd = match.index + match[0].length

  if (position === 'after_title') {
    // 在标题后立即注入
    return (
      body.slice(0, headingEnd) +
      '\n\n' +
      injectionContent +
      '\n\n' +
      body.slice(headingEnd)
    )
  } else {
    // position === 'before_content'
    // 在标题后、正文内容前注入（跳过空行）
    const afterHeading = body.slice(headingEnd)
    const contentStart = afterHeading.search(/\S/)

    if (contentStart === -1) {
      // 标题后没有内容，直接添加
      return body.slice(0, headingEnd) + '\n\n' + injectionContent
    }

    return (
      body.slice(0, headingEnd) +
      afterHeading.slice(0, contentStart) +
      injectionContent +
      '\n\n' +
      afterHeading.slice(contentStart)
    )
  }
}

/**
 * 验证注入内容是否有效
 */
export function validateInjectionContent(content: string): { valid: boolean; error?: string } {
  if (!content || content.trim() === '') {
    return { valid: false, error: '注入内容不能为空' }
  }

  // 检查内容长度（建议不超过 500 字符）
  if (content.length > 500) {
    return { valid: false, error: '注入内容过长，建议不超过 500 字符' }
  }

  return { valid: true }
}

/**
 * 为不同平台格式化注入内容
 */
export function formatInjectionForPlatform(
  content: string,
  platform: 'juejin' | 'wechat' | 'html'
): string {
  switch (platform) {
    case 'wechat':
      // 微信公众号可以使用 HTML 样式
      return `<div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #07c160;">\n${content}\n</div>`

    case 'html':
      // 普通 HTML
      return `<div class="title-injection">\n${content}\n</div>`

    case 'juejin':
    default:
      // 掘金使用纯 Markdown
      return content
  }
}
