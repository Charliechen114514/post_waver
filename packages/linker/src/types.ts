/**
 * Types for the linker package
 * These are copied from @content-hub/core to avoid circular dependencies
 */

/**
 * Article Frontmatter data structure
 */
export interface Frontmatter {
  /** Article title (required) */
  title: string

  /** Publication time, ISO8601 format (required) */
  date: string

  /** Article tags, at least 1 (required) */
  tags: string[]

  /** Article categories (optional) */
  categories?: string[]

  /** Article summary/description (optional) */
  description?: string

  /** Whether draft, true means not published (optional, default false) */
  draft?: boolean

  /** Platform publishing strategy override (optional) */
  platforms?: PlatformConfig
}

/**
 * Platform publishing configuration
 */
export interface PlatformConfig {
  /** Juejin publishing strategy */
  juejin?: PublishStrategy

  /** CSDN publishing strategy */
  csdn?: PublishStrategy

  /** Zhihu publishing strategy */
  zhihu?: PublishStrategy

  /** WeChat official account publishing strategy */
  wechat?: PublishStrategy
}

/**
 * Publishing strategy type
 */
export type PublishStrategy = 'auto' | 'semi-auto' | 'copy'

/**
 * Article data structure
 */
export interface Post {
  /** Article ID (filename without .md) */
  id: string

  /** Absolute file path */
  filepath: string

  /** Frontmatter data */
  frontmatter: Frontmatter

  /** Markdown body */
  content: string

  /** Parsed AST */
  ast: unknown // Remark AST, to be defined later

  /** Content hash (SHA256) */
  contentHash: string

  /** Scan time */
  scannedAt: Date
}

/**
 * Related article
 */
export interface RelatedPost {
  /** Article ID */
  id: string

  /** Article title */
  title: string

  /** Similarity score (0-1) */
  score: number
}
