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
 * 将 Markdown 转换为标准 HTML
 */
export async function markdownToHTML(markdown: string): Promise<string> {
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

  const html = String(result)

  // 添加 KaTeX CSS 样式 - 使用统一的基础样式文件
  const katexResources = `
<!-- KaTeX 基础样式 -->
<link rel="stylesheet" href="/katex-base.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV" crossorigin="anonymous">`

  return katexResources + html
}
