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
    injectMode?: 'missing' | 'always' // 注入模式：missing=只注入缺失字段, always=总是注入
  } = {}
): Promise<Post> {
  const { autoComplete = true, saveToFile = false, injectMode = 'missing' } = options

  const content = await readFile(filepath, 'utf-8')
  const { data, content: markdownBody } = matter(content)

  let frontmatter = data as Frontmatter
  let wasModified = false

  // 检查是否需要自动补全
  if (autoComplete) {
    const existingFrontmatter = data as Partial<Frontmatter>
    const isComplete = !!(
      existingFrontmatter.title &&
      existingFrontmatter.date &&
      existingFrontmatter.tags &&
      existingFrontmatter.tags.length > 0
    )

    if (!isComplete || injectMode === 'always') {
      // 记录原始 frontmatter 用于比较
      const originalFields = {
        title: existingFrontmatter.title,
        date: existingFrontmatter.date,
        tags: existingFrontmatter.tags,
        categories: existingFrontmatter.categories,
        description: existingFrontmatter.description,
        draft: existingFrontmatter.draft
      }

      if (!isComplete) {
        console.log(`[Parser] 📝 ${filepath.split('/').pop()} 的 Frontmatter 不完整，开始自动生成...`)
      }

      // 自动补全（只填充缺失字段）
      frontmatter = await completeFrontmatter(markdownBody, filepath, existingFrontmatter)

      // 检测是否有字段被修改或添加
      const newFields = {
        title: frontmatter.title,
        date: frontmatter.date,
        tags: frontmatter.tags,
        categories: frontmatter.categories,
        description: frontmatter.description,
        draft: frontmatter.draft
      }

      // 比较字段变化
      const changes: string[] = []
      if (!originalFields.title && newFields.title) changes.push('title')
      if (!originalFields.date && newFields.date) changes.push('date')
      if ((!originalFields.tags || originalFields.tags.length === 0) && newFields.tags.length > 0) changes.push('tags')
      if (!originalFields.categories && newFields.categories) changes.push('categories')
      if (!originalFields.description && newFields.description) changes.push('description')

      wasModified = changes.length > 0

      if (wasModified) {
        console.log(`[Parser] ✅ 自动生成完成，添加字段: ${changes.join(', ')}`)
        console.log(`    title: ${frontmatter.title}`)
        console.log(`    tags: ${frontmatter.tags.join(', ')}`)
        console.log(`    categories: ${frontmatter.categories?.join(', ') || 'N/A'}`)
      }

      // 如果需要保存到文件，且确实有修改
      if (saveToFile && wasModified) {
        await savePostWithFrontmatter(filepath, markdownBody, frontmatter)
        console.log(`[Parser] 💾 已更新文件: ${filepath}`)
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
