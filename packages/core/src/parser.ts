import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { createHash } from 'crypto'
import { readFile, writeFile } from 'fs/promises'
import { Frontmatter, Post } from './types.js'
import { completeFrontmatter } from './frontmatter-generator.js'

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
 * 解析 Frontmatter（宽松模式，允许缺失）
 */
export function parseFrontmatterLoose(file: string): Partial<Frontmatter> {
  const { data } = matter(file)
  return data as Partial<Frontmatter>
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
 * 解析 Markdown 文件为 Post 对象（自动补全 Frontmatter）
 */
export async function parsePost(
  filepath: string,
  options: {
    autoComplete?: boolean // 是否自动补全缺失的 frontmatter
    saveToFile?: boolean // 是否保存到文件
  } = {}
): Promise<Post> {
  const { autoComplete = true, saveToFile = false } = options

  const content = await readFile(filepath, 'utf-8')
  const { data, content: markdownBody } = matter(content)

  let frontmatter = data as Frontmatter

  // 检查是否需要自动补全
  if (autoComplete) {
    const existingFrontmatter = data as Partial<Frontmatter>
    const isComplete = !!(
      existingFrontmatter.title &&
      existingFrontmatter.date &&
      existingFrontmatter.tags &&
      existingFrontmatter.tags.length > 0
    )

    if (!isComplete) {
      console.log(`[Parser] 检测到 ${filepath} 的 Frontmatter 不完整，开始自动生成...`)

      // 自动补全
      frontmatter = await completeFrontmatter(markdownBody, filepath, existingFrontmatter)

      console.log(`[Parser] ✅ Frontmatter 自动生成完成:`)
      console.log(`    title: ${frontmatter.title}`)
      console.log(`    tags: ${frontmatter.tags.join(', ')}`)
      console.log(`    categories: ${frontmatter.categories?.join(', ') || 'N/A'}`)

      // 如果需要保存到文件
      if (saveToFile) {
        await savePostWithFrontmatter(filepath, markdownBody, frontmatter)
        console.log(`[Parser] ✅ 已更新文件: ${filepath}`)
      }
    }
  }

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

/**
 * 保存文章（包含完整的 Frontmatter）
 */
export async function savePostWithFrontmatter(
  filepath: string,
  markdownBody: string,
  frontmatter: Frontmatter
): Promise<void> {
  const file = matter.stringify(markdownBody, frontmatter)
  await writeFile(filepath, file, 'utf-8')
}
