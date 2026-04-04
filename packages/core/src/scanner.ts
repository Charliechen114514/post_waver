import { glob } from 'glob'
import { Post, ScanResult, IndexedPost } from './types.js'
import { parsePost } from './parser.js'
import { ContentIndexService } from '@content-hub/database'

/**
 * 扫描目录下的所有 Markdown 文件
 */
export async function scanDirectory(
  dir: string,
  options: {
    recursive?: boolean
    includeDrafts?: boolean
    inject?: boolean // 是否注入 frontmatter 到文件
  } = {}
): Promise<Post[]> {
  const { recursive = true, includeDrafts = false, inject = false } = options

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
      const post = await parsePost(file, {
        saveToFile: inject, // 如果启用 inject，则保存到文件
        injectMode: 'missing' // 只注入缺失的字段
      })

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
 * 从数据库读取所有索引
 */
export async function readIndex(): Promise<Map<string, IndexedPost>> {
  try {
    const allPosts = await ContentIndexService.getAll()
    const indexMap = new Map<string, IndexedPost>()

    for (const post of allPosts) {
      indexMap.set(post.id, {
        id: post.id,
        title: post.title,
        date: post.date.toISOString(),
        tags: JSON.parse(post.tags),
        contentHash: post.contentHash,
        filepath: post.filepath,
        draft: post.draft,
        prev: post.prev || undefined,
        next: post.next || undefined,
        related: post.related ? JSON.parse(post.related) : undefined
      })
    }

    return indexMap
  } catch (error) {
    // 数据库读取失败
    console.error('[Scanner] Failed to read index from database:', error)
    return new Map()
  }
}

/**
 * 写入索引到数据库
 */
export async function writeIndex(indexMap: Map<string, IndexedPost>): Promise<void> {
  try {
    const posts = Array.from(indexMap.values()).map(indexedPost => ({
      id: indexedPost.id,
      title: indexedPost.title,
      date: new Date(indexedPost.date),
      tags: indexedPost.tags,
      contentHash: indexedPost.contentHash,
      filepath: indexedPost.filepath,
      draft: indexedPost.draft,
      prev: indexedPost.prev,
      next: indexedPost.next,
      related: indexedPost.related
    }))

    await ContentIndexService.upsertMany(posts)
  } catch (error) {
    console.error('[Scanner] Failed to write index to database:', error)
    throw error
  }
}

/**
 * 检测新文章
 */
export function detectNewPosts(
  index: Map<string, IndexedPost>,
  posts: Post[]
): Post[] {
  if (index.size === 0) {
    return posts // 没有索引，所有文章都是新的
  }

  return posts.filter(post => !index.has(post.id))
}

/**
 * 检测已更新文章
 */
export function detectUpdatedPosts(
  index: Map<string, IndexedPost>,
  posts: Post[]
): Post[] {
  if (index.size === 0) {
    return []
  }

  return posts.filter(post => {
    const indexed = index.get(post.id)
    return indexed && indexed.contentHash !== post.contentHash
  })
}

/**
 * 构建索引
 */
export async function buildIndex(posts: Post[]): Promise<Map<string, IndexedPost>> {
  const indexedPosts = new Map<string, IndexedPost>()
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
    indexedPosts.set(post.id, {
      id: post.id,
      title: post.frontmatter.title,
      date: post.frontmatter.date,
      tags: post.frontmatter.tags,
      contentHash: post.contentHash,
      filepath: post.filepath,
      draft: post.frontmatter.draft || false
      // prev, next, related 将在下面通过 LinkOrchestrator 添加
    })
  }

  // 生成关联关系 (prev/next/related)
  try {
    // 动态导入 LinkOrchestrator 避免编译时的循环依赖问题
    // @ts-ignore - workspace 包路径在运行时可用
    const { LinkOrchestrator } = await import('@content-hub/linker')
    const orchestrator = new LinkOrchestrator()
    const relationships = await orchestrator.generateRelationships(posts)

    // 注入关联关系到索引条目
    for (const [id, indexedPost] of indexedPosts.entries()) {
      // 添加时间关系
      if (relationships.prevNext.has(id)) {
        const rel = relationships.prevNext.get(id)!
        indexedPost.prev = rel.prev
        indexedPost.next = rel.next
      }

      // 添加语义关系
      if (relationships.related.has(id)) {
        indexedPost.related = relationships.related.get(id)
      }
    }

    console.log('[Scanner] Relationship generation completed successfully')
  } catch (error) {
    // 关系生成失败不应阻止索引构建
    console.warn('[Scanner] Relationship generation failed, building index without relationships:', error)
    // 继续构建索引，不包含 prev/next/related 字段
  }

  console.log('[Scanner] Index built:', {
    totalPosts: posts.length,
    draftCount,
    allTags: Array.from(allTags).sort()
  })

  return indexedPosts
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
    inject?: boolean // 是否注入 frontmatter 到文件
  } = {}
): Promise<ScanResult> {
  const startTime = Date.now()
  const { recursive = true, includeDrafts = false, updateIndex = true, inject = false } = options

  // 读取现有索引
  const existingIndex = await readIndex()

  // 扫描目录
  const posts = await scanDirectory(dir, { recursive, includeDrafts, inject })

  // 检测新文章和已更新文章
  const newPosts = detectNewPosts(existingIndex, posts)
  const updatedPosts = detectUpdatedPosts(existingIndex, posts)

  // 更新索引
  if (updateIndex) {
    // 清理已删除文件的索引
    const currentFileIds = new Set(posts.map(p => p.id))
    const deletedIds: string[] = []

    for (const [id, indexedPost] of existingIndex.entries()) {
      if (!currentFileIds.has(id)) {
        // 检查文件是否真的不存在
        const { existsSync } = await import('fs')
        if (!existsSync(indexedPost.filepath)) {
          deletedIds.push(id)
        }
      }
    }

    if (deletedIds.length > 0) {
      console.log(`[Scanner] Cleaning up ${deletedIds.length} deleted post(s) from index:`, deletedIds)
      await ContentIndexService.deleteMany(deletedIds)
    }

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
