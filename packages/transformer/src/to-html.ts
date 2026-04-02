import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'

/**
 * 将 Markdown 转换为标准 HTML
 */
export async function markdownToHTML(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeHighlight)  // 添加代码高亮
    .use(rehypeStringify)
    .process(markdown)

  return String(result)
}
