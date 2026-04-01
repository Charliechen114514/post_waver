import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { createHash } from 'crypto'
import { readFile } from 'fs/promises'
import { Frontmatter, Post } from './types.js'

/**
 * 解析 Frontmatter
 */
export function parseFrontmatter(file: string): Frontmatter {
  const { data } = matter(file)

  // 验证必填字段
  if (!data.title) {
    throw new Error('Frontmatter 缺少 title 字段')
  }
  if (!data.date) {
    throw new Error('Frontmatter 缺少 date 字段')
  }
  if (!data.tags || !Array.isArray(data.tags) || data.tags.length === 0) {
    throw new Error('Frontmatter 缺少 tags 字段或 tags 为空')
  }

  return data as Frontmatter
}

/**
 * 解析 Markdown 为 AST
 */
export function parseMarkdown(content: string): unknown {
  const processor = unified()
    .use(remarkParse)
    .use(remarkStringify)

  return processor.parse(content)
}

/**
 * 计算内容哈希（SHA256）
 */
export function computeHash(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

/**
 * 解析 Markdown 文件为 Post 对象
 */
export async function parsePost(filepath: string): Promise<Post> {
  const content = await readFile(filepath, 'utf-8')
  const { data, content: markdownBody } = matter(content)

  const frontmatter = data as Frontmatter
  const ast = parseMarkdown(markdownBody)
  const contentHash = computeHash(markdownBody)

  // 从文件路径提取 ID
  const id = filepath.split('/').pop()?.replace(/\.md$/, '') || ''

  return {
    id,
    filepath,
    frontmatter,
    content: markdownBody,
    ast,
    contentHash,
    scannedAt: new Date()
  }
}
