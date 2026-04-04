import { markdownToHTML, MarkdownToHTMLOptions } from './to-html.js'
import { generatePlatformLinks, formatLinksAsHTML } from '@content-hub/core'
import type { IndexedPost } from '@content-hub/core'
import juice from 'juice'

/**
 * 微信转换器选项
 */
export interface WechatTransformOptions {
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
  /** 主题名称 */
  theme?: string
}

/**
 * 将 Markdown 转换为微信公众号格式的 HTML（带内联样式）
 * 使用 Juice 库将 CSS 内联化，确保兼容性
 */
export async function transformForWechat(
  markdown: string,
  options?: WechatTransformOptions
): Promise<string> {
  const htmlOptions: MarkdownToHTMLOptions = {
    removeLocalImages: options?.removeLocalImages
  }
  let html = await markdownToHTML(markdown, htmlOptions)

  // 如果提供了相关文章信息，生成平台链接HTML
  let relatedLinksHTML = ''
  if (options?.includeRelatedLinks && options.postId && options.relatedPosts) {
    const links = generatePlatformLinks(options.postId, options.relatedPosts, {
      platform: 'wechat',
      blogBaseUrl: options.blogBaseUrl || 'https://your-blog.github.io/'
    })
    relatedLinksHTML = formatLinksAsHTML(links, 'wechat')
  }

  // 移除 KaTeX CSS 链接（不需要）
  const cleanedHtml = html.replace(/<link[^>]*katex[^>]*>/gi, '')

  // 准备完整的 HTML 文档，包含 CSS 样式
  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        /* 基础样式 */
        .markdown-body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
          font-size: 16px;
          line-height: 1.6;
          color: #333;
          word-wrap: break-word;
        }

        /* 标题样式 */
        .markdown-body h1,
        .markdown-body h2,
        .markdown-body h3,
        .markdown-body h4,
        .markdown-body h5,
        .markdown-body h6 {
          margin-top: 24px;
          margin-bottom: 16px;
          font-weight: 600;
          line-height: 1.25;
          color: #333;
        }

        .markdown-body h1 {
          font-size: 2em;
          border-bottom: 1px solid #eaecef;
          padding-bottom: 0.3em;
        }

        .markdown-body h2 {
          font-size: 1.5em;
          border-bottom: 1px solid #eaecef;
          padding-bottom: 0.3em;
        }

        .markdown-body h3 {
          font-size: 1.25em;
        }

        .markdown-body h4 {
          font-size: 1em;
        }

        .markdown-body h5 {
          font-size: 0.875em;
        }

        .markdown-body h6 {
          font-size: 0.85em;
          color: #6a737d;
        }

        /* 段落样式 - 白色背景 */
        .markdown-body p {
          margin-top: 0;
          margin-bottom: 16px;
          background: #ffffff !important;
        }

        /* 列表样式 */
        .markdown-body ul,
        .markdown-body ol {
          margin-top: 0;
          margin-bottom: 16px;
          padding-left: 2em;
        }

        .markdown-body li {
          margin-top: 0.25em;
        }

        /* 代码块样式 - 白色背景 */
        .markdown-body pre {
          padding: 16px;
          overflow: auto;
          font-size: 85%;
          line-height: 1.45;
          background-color: #ffffff !important;
          border-radius: 6px;
          margin-bottom: 16px;
          border: 1px solid #e1e4e8;
          white-space: pre-wrap; /* 保留空白字符和换行，支持自动换行 */
          word-break: break-word;
        }

        .markdown-body pre code {
          padding: 0;
          margin: 0;
          font-size: 100%;
          background: transparent !important;
          white-space: pre-wrap; /* 保留代码缩进和换行 */
          font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
        }

        /* 行内代码样式 - 白色背景 */
        .markdown-body code {
          padding: 0.2em 0.4em;
          margin: 0;
          font-size: 85%;
          background-color: #ffffff !important;
          border-radius: 6px;
          font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
          white-space: pre-wrap; /* 保留行内代码的空白字符 */
        }

        .markdown-body p code {
          background-color: #ffffff !important;
          padding: 2px 6px;
        }

        /* 引用样式 - 白色背景 */
        .markdown-body blockquote {
          margin: 0 0 16px;
          padding: 0 1em;
          color: #6a737d;
          border-left: 0.25em solid #dfe2e5;
          background: #ffffff !important;
        }

        .markdown-body blockquote > :first-child {
          margin-top: 0;
        }

        .markdown-body blockquote > :last-child {
          margin-bottom: 0;
        }

        /* 链接样式 */
        .markdown-body a {
          color: #0366d6;
          text-decoration: none;
        }

        .markdown-body a:hover {
          text-decoration: underline;
        }

        /* 图片样式 */
        .markdown-body img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 20px auto;
        }

        /* 分隔线样式 */
        .markdown-body hr {
          height: 0.25em;
          padding: 0;
          margin: 24px 0;
          background-color: #e1e4e8;
          border: 0;
        }

        /* 表格样式 */
        .markdown-body table {
          border-spacing: 0;
          border-collapse: collapse;
          margin-bottom: 16px;
        }

        .markdown-body table th,
        .markdown-body table td {
          padding: 6px 13px;
          border: 1px solid #dfe2e5;
        }

        .markdown-body table th {
          font-weight: 600;
          background-color: #f6f8fa;
        }

        /* KaTeX 样式 */
        .katex {
          font-size: 1.1em;
        }

        .katex-display {
          margin: 20px 0;
          overflow-x: auto;
          overflow-y: hidden;
        }
      </style>
    </head>
    <body>
      <div class="markdown-body">
        ${cleanedHtml}
      </div>
    </body>
    </html>
  `

  // 使用 Juice 将 CSS 内联化
  try {
    const inlined = juice(fullHtml, {
      removeStyleTags: true,
      preserveImportant: true,
      preserveMediaQueries: false,
      preserveFontFaces: false,
      applyWidthAttributes: true,
      applyHeightAttributes: true,
      applyAttributesTableElements: true
    })

    // 提取 body 内容（去掉 HTML 和 body 标签）
    const bodyMatch = inlined.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    const content = bodyMatch ? bodyMatch[1] : inlined

    // 移除外层 div 容器，保留内部的 styled HTML
    const divMatch = content.match(/<div class="markdown-body"([^>]*)>([\s\S]*?)<\/div>/i)
    const result = divMatch ? divMatch[2] : content

    // 添加相关文章链接（如果有的话）
    if (relatedLinksHTML) {
      return result + '\n\n' + relatedLinksHTML
    }

    return result
  } catch (error) {
    console.error('Juice inline error:', error)
    // 如果 Juice 失败，返回原始 HTML
    return cleanedHtml
  }
}
