/**
 * 文章 Frontmatter 数据结构
 */
export interface Frontmatter {
  /** 文章标题（必填） */
  title: string

  /** 发布时间，ISO8601 格式（必填） */
  date: string

  /** 文章标签，至少包含 1 个（必填） */
  tags: string[]

  /** 文章分类（可选） */
  categories?: string[]

  /** 文章摘要/描述（可选） */
  description?: string

  /** 是否为草稿，true 时不进入发布流水线（可选，默认 false） */
  draft?: boolean

  /** 平台发布策略覆盖（可选） */
  platforms?: PlatformConfig
}

/**
 * 平台发布配置
 */
export interface PlatformConfig {
  /** 掘金发布策略 */
  juejin?: PublishStrategy

  /** CSDN 发布策略 */
  csdn?: PublishStrategy

  /** 知乎发布策略 */
  zhihu?: PublishStrategy

  /** 微信公众号发布策略 */
  wechat?: PublishStrategy
}

/**
 * 发布策略类型
 */
export type PublishStrategy = 'auto' | 'semi-auto' | 'copy'

/**
 * 文章数据结构
 */
export interface Post {
  /** 文章 ID（文件名，不含 .md） */
  id: string

  /** 文件绝对路径 */
  filepath: string

  /** Frontmatter 数据 */
  frontmatter: Frontmatter

  /** Markdown 正文 */
  content: string

  /** 解析后的 AST */
  ast: unknown // Remark AST，后续定义

  /** 内容哈希（SHA256） */
  contentHash: string

  /** 扫描时间 */
  scannedAt: Date
}

/**
 * 已索引文章（存储在 content-index.json 中）
 */
export interface IndexedPost {
  /** 文章 ID */
  id: string

  /** 文章标题 */
  title: string

  /** 发布时间（ISO8601） */
  date: string

  /** 标签列表 */
  tags: string[]

  /** 内容哈希（SHA256） */
  contentHash: string

  /** 文件路径 */
  filepath: string

  /** 是否为草稿 */
  draft: boolean

  /** 上一篇文章 ID */
  prev?: string

  /** 下一篇文章 ID */
  next?: string

  /** 相关文章（Top 3） */
  related?: RelatedPost[]
}

/**
 * 相关文章
 */
export interface RelatedPost {
  /** 文章 ID */
  id: string

  /** 文章标题 */
  title: string

  /** 相似度分数（0-1） */
  score: number
}

/**
 * 内容索引（content-index.json 结构）
 */
export interface ContentIndex {
  /** Schema 版本 */
  version: number

  /** 所有文章 */
  posts: Record<string, IndexedPost>

  /** 最后更新时间 */
  lastUpdated: string

  /** 索引元数据 */
  metadata: IndexMetadata
}

/**
 * 索引元数据
 */
export interface IndexMetadata {
  /** 总文章数 */
  totalPosts: number

  /** 草稿数量 */
  draftCount: number

  /** 所有标签 */
  allTags: string[]
}

/**
 * 扫描结果
 */
export interface ScanResult {
  /** 扫描到的文章 */
  posts: Post[]

  /** 新文章（未在索引中） */
  newPosts: Post[]

  /** 已更新文章（内容哈希变化） */
  updatedPosts: Post[]

  /** 扫描耗时（毫秒） */
  duration: number
}
