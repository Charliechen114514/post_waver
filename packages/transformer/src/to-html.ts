import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'

/**
 * Markdown 转 HTML 选项
 */
export interface MarkdownToHTMLOptions {
  /** 是否移除本地图片（用于复制到外部平台） */
  removeLocalImages?: boolean
}

/**
 * 将本地图片路径转换为占位符
 * 用于防止复制到外部平台时带上本地路径
 */
function processLocalImages(html: string): string {
  // 匹配本地图片路径（以 /assets/ 开头）
  return html.replace(
    /<img([^>]*\s)src=(["'])\/assets\/([^"']+)\2([^>]*)>/gi,
    (_match, _before, _quote, filename, _after) => {
      // 提取文件名（不含路径）
      const displayName = filename.split('/').pop() || filename
      // 替换为占位符
      return `<p style="color: #999; background: #f5f5f5; padding: 10px; border: 1px dashed #ccc; text-align: center; margin: 10px 0;">📷 图片: ${displayName} (请手动上传)</p>`
    }
  )
}

/**
 * 将 Markdown 转换为标准 HTML
 */
export async function markdownToHTML(markdown: string, options?: MarkdownToHTMLOptions): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)  // 添加 GFM 支持（表格、删除线、任务列表等）
    .use(remarkMath, {
      singleDollarTextMath: true,  // 启用单美元符号作为行内公式
    })  // 添加数学公式支持
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex)  // KaTeX 数学公式渲染必须在 rehypeHighlight 之前
    .use(rehypeHighlight)  // 代码高亮
    .use(rehypeStringify)
    .process(markdown)

  let html = String(result)

  // 修复相对路径图片：将相对路径转换为绝对路径
  // 例如: src="assets/test-image.png" -> src="/assets/test-image.png"
  html = html.replace(
    /<img([^>]*\s)src=(["'])(?!https?:\/\/|\/\/)([^"']*?\.(png|jpg|jpeg|gif|svg|webp))\2([^>]*)>/gi,
    (_match, before, quote, src, _ext, after) => {
      // 如果路径不是以 / 开头，则添加 /
      const absoluteSrc = src.startsWith('/') ? src : `/${src}`
      return `<img${before}src=${quote}${absoluteSrc}${quote}${after}>`
    }
  )

  // 如果需要移除本地图片（用于复制到外部平台）
  if (options?.removeLocalImages) {
    html = processLocalImages(html)
  }

  // 添加 KaTeX CSS 样式 - 使用统一的基础样式文件
  const katexResources = `
<!-- KaTeX 基础样式 -->
<link rel="stylesheet" href="/katex-base.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV" crossorigin="anonymous">`

  return katexResources + html
}
