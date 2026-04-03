import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import juice from 'juice'
import { getThemeCSS } from './themes'

export type Platform = 'html' | 'wechat' | 'juejin' | 'csdn' | 'zhihu'

export interface TransformResult {
  html: string
  text?: string
}

/**
 * 将本地图片路径转换为占位符
 */
function processLocalImages(html: string): string {
  return html.replace(
    /<img([^>]*\s)src=(["'])\/assets\/([^"']+)\2([^>]*)>/gi,
    (_match, _before, _quote, filename, _after) => {
      const displayName = filename.split('/').pop() || filename
      return `<p style="color: #999; background: #f5f5f5; padding: 10px; border: 1px dashed #ccc; text-align: center; margin: 10px 0;">📷 图片: ${displayName} (请手动上传)</p>`
    }
  )
}

/**
 * 将 Markdown 转换为标准 HTML
 */
export async function markdownToHTML(markdown: string, removeLocalImages = false): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath, {
      singleDollarTextMath: true,
    })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(markdown)

  let html = String(result)

  // 修复相对路径图片
  html = html.replace(
    /<img([^>]*\s)src=(["'])(?!https?:\/\/|\/\/)([^"']*?\.(png|jpg|jpeg|gif|svg|webp))\2([^>]*)>/gi,
    (_match, before, quote, src, _ext, after) => {
      const absoluteSrc = src.startsWith('/') ? src : `/${src}`
      return `<img${before}src=${quote}${absoluteSrc}${quote}${after}>`
    }
  )

  // 如果需要移除本地图片（用于复制到外部平台）
  if (removeLocalImages) {
    html = processLocalImages(html)
  }

  // 添加 KaTeX CSS 样式
  const katexResources = `
<!-- KaTeX 基础样式 -->
<link rel="stylesheet" href="/post_waver/converter/katex-base.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV" crossorigin="anonymous">`

  return katexResources + html
}

/**
 * 将 Markdown 转换为微信公众号格式的 HTML
 * 使用 Juice 库将 CSS 内联化，确保兼容性
 * 支持主题样式
 */
export async function transformForWechat(markdown: string, removeLocalImages = false, theme = 'orangeheart'): Promise<string> {
  const html = await markdownToHTML(markdown, removeLocalImages)

  // 移除 KaTeX CSS 链接（不需要）
  const cleanedHtml = html.replace(/<link[^>]*katex[^>]*>/gi, '')

  // 加载主题 CSS
  let themeCSS = ''
  try {
    themeCSS = await getThemeCSS(theme)
  } catch (error) {
    console.warn(`Failed to load theme ${theme}:`, error)
  }

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

        /* 标题样式 - 白色背景 */
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
          background: #ffffff;
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
          background-color: #ffffff;
          border-radius: 6px;
          margin-bottom: 16px;
          border: 1px solid #e1e4e8;
        }

        .markdown-body pre code {
          padding: 0;
          margin: 0;
          font-size: 100%;
          background: transparent;
        }

        /* 行内代码样式 - 白色背景 */
        .markdown-body code {
          padding: 0.2em 0.4em;
          margin: 0;
          font-size: 85%;
          background-color: #ffffff;
          border-radius: 6px;
          font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
        }

        .markdown-body p code {
          background-color: #ffffff;
          padding: 2px 6px;
        }

        /* 引用样式 */
        .markdown-body blockquote {
          margin: 0 0 16px;
          padding: 0 1em;
          color: #6a737d;
          border-left: 0.25em solid #dfe2e5;
          background: #ffffff;
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

        /* 主题样式 */
        ${themeCSS}
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
    return divMatch ? divMatch[2] : content
  } catch (error) {
    console.error('Juice inline error:', error)
    // 如果 Juice 失败，返回原始 HTML
    return cleanedHtml
  }
}

export async function transformMarkdown(
  markdown: string,
  platform: Platform,
  theme?: string
): Promise<TransformResult> {
  try {
    switch (platform) {
      case 'html':
        const html = await markdownToHTML(markdown)
        return { html, text: markdown }

      case 'wechat':
        const wechatHtml = await transformForWechat(markdown, true, theme)
        return { html: wechatHtml, text: markdown }

      case 'juejin':
      case 'csdn':
      case 'zhihu':
        const previewHtml = await markdownToHTML(markdown, false)
        return { html: previewHtml, text: markdown }

      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }
  } catch (error) {
    console.error('Transform error:', error)
    throw error
  }
}
