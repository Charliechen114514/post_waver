import { glob } from 'glob'
import { readFile, writeFile } from 'fs/promises'
import { Post, ScanResult, ContentIndex, IndexedPost } from './types.js'
import { parsePost } from './parser.js'

/**
 * 扫描目录下的所有 Markdown 文件
 */
export async function scanDirectory(
  dir: string,
  options: {
    recursive?: boolean
    includeDrafts?: boolean
  } = {}
): Promise<Post[]> {
  const { recursive = true, includeDrafts = false } = options

  // 扫描所有 .md 文件
  const pattern = recursive ? '**/*.md' : '*.md'
  const files = await glob(pattern, {
    cwd: dir,
    absolute: true
  })

  // 解析所有文件
  const posts: Post[] = []
  for (const file of files) {
    try {
      const post = await parsePost(file)

      // 过滤草稿
      if (!includeDrafts && post.frontmatter.draft) {
        continue
      }

      posts.push(post)
    } catch (error) {
      console.error(`解析文件失败: ${file}`, error)
      // 继续处理其他文件
    }
  }

  return posts
}

/**
 * 过滤草稿文章
 */
export function filterDrafts(posts: Post[]): Post[] {
  return posts.filter(post => !post.frontmatter.draft)
}

/**
 * 读取索引文件
 */
export async function readIndex(
  filepath: string = 'content-index.json'
): Promise<ContentIndex | null> {
  try {
    const content = await readFile(filepath, 'utf-8')
    return JSON.parse(content) as ContentIndex
  } catch (error) {
    // 文件不存在或解析失败
    return null
  }
}

/**
 * 写入索引文件
 */
export async function writeIndex(
  index: ContentIndex,
  filepath: string = 'content-index.json'
): Promise<void> {
  const content = JSON.stringify(index, null, 2)
  await writeFile(filepath, content, 'utf-8')
}

/**
 * 检测新文章
 */
export function detectNewPosts(
  index: ContentIndex | null,
  posts: Post[]
): Post[] {
  if (!index) {
    return posts // 没有索引，所有文章都是新的
  }

  return posts.filter(post => !index.posts[post.id])
}

/**
 * 检测已更新文章
 */
export function detectUpdatedPosts(
  index: ContentIndex | null,
  posts: Post[]
): Post[] {
  if (!index) {
    return []
  }

  return posts.filter(post => {
    const indexed = index.posts[post.id]
    return indexed && indexed.contentHash !== post.contentHash
  })
}

/**
 * 构建索引
 */
export async function buildIndex(posts: Post[]): Promise<ContentIndex> {
  const indexedPosts: Record<string, IndexedPost> = {}
  const allTags = new Set<string>()
  let draftCount = 0

  for (const post of posts) {
    // 收集标签
    post.frontmatter.tags.forEach(tag => allTags.add(tag))

    // 统计草稿
    if (post.frontmatter.draft) {
      draftCount++
    }

    // 创建索引条目
    indexedPosts[post.id] = {
      id: post.id,
      title: post.frontmatter.title,
      date: post.frontmatter.date,
      tags: post.frontmatter.tags,
      contentHash: post.contentHash,
      filepath: post.filepath,
      draft: post.frontmatter.draft || false
      // prev, next, related 在后续里程碑中添加
    }
  }

  return {
    version: 1,
    posts: indexedPosts,
    lastUpdated: new Date().toISOString(),
    metadata: {
      totalPosts: posts.length,
      draftCount,
      allTags: Array.from(allTags).sort()
    }
  }
}

/**
 * 执行完整扫描
 */
export async function scan(
  dir: string,
  options: {
    recursive?: boolean
    includeDrafts?: boolean
    updateIndex?: boolean
  } = {}
): Promise<ScanResult> {
  const startTime = Date.now()
  const { recursive = true, includeDrafts = false, updateIndex = true } = options

  // 读取现有索引
  const existingIndex = await readIndex()

  // 扫描目录
  const posts = await scanDirectory(dir, { recursive, includeDrafts })

  // 检测新文章和已更新文章
  const newPosts = detectNewPosts(existingIndex, posts)
  const updatedPosts = detectUpdatedPosts(existingIndex, posts)

  // 更新索引
  if (updateIndex) {
    const newIndex = await buildIndex(posts)
    await writeIndex(newIndex)
  }

  const duration = Date.now() - startTime

  return {
    posts,
    newPosts,
    updatedPosts,
    duration
  }
}
