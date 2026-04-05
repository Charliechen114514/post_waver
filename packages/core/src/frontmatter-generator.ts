import { Frontmatter } from './types.js'
import Anthropic from '@anthropic-ai/sdk'
import { getTagCacheManager } from './tag-cache.js'

/**
 * Frontmatter 生成选项
 */
export interface FrontmatterGeneratorOptions {
  /** 是否使用 AI 生成（默认自动检测） */
  useAI?: boolean
  /** API Key（可选，如果不提供则从环境变量读取） */
  apiKey?: string
  /** 常用标签库（用于 AI 生成时参考） */
  commonTags?: string[]
  /** 常用分类库（用于 AI 生成时参考） */
  commonCategories?: string[]
}

/**
 * Frontmatter 生成结果
 */
export interface FrontmatterGenerationResult {
  /** 生成的 frontmatter */
  frontmatter: Partial<Frontmatter>
  /** 使用的方案（'ai' 或 'rule'） */
  method: 'ai' | 'rule'
  /** 错误信息（如果失败） */
  error?: string
}

/**
 * 检测是否在 Claude Code 环境中
 */
function isInClaudeCodeEnvironment(): boolean {
  // 检查环境变量
  if (process.env.ANTHROPIC_API_KEY) {
    return true
  }

  // 检查是否有 Claude Code 相关的特征
  if (process.env.CLAUDE_CODE || process.env.VSCODE_PID) {
    return true
  }

  return false
}

/**
 * 提取文章的纯文本内容（用于 AI 分析）
 */
function extractTextContent(markdown: string): string {
  // 移除 Markdown 语法，保留纯文本
  return markdown
    .replace(/^#+\s+/gm, '') // 移除标题
    .replace(/\*\*(.+?)\*\*/g, '$1') // 移除粗体
    .replace(/\*(.+?)\*/g, '$1') // 移除斜体
    .replace(/`(.+?)`/g, '$1') // 移除行内代码
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留文本
    .replace(/\n{3,}/g, '\n\n') // 合并多余空行
    .trim()
}

/**
 * AI 智能生成 Frontmatter（方案2）
 */
async function generateWithAI(
  markdown: string,
  _filepath: string,
  options: FrontmatterGeneratorOptions
): Promise<FrontmatterGenerationResult> {
  try {
    // 获取 API Key
    const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return {
        frontmatter: {},
        method: 'rule',
        error: '未找到 ANTHROPIC_API_KEY，fallback 到规则方案'
      }
    }

    // 提取纯文本用于分析
    const textContent = extractTextContent(markdown)
    const previewText = textContent.slice(0, 3000) // 只取前 3000 字符

    // 构建提示词
    const commonTagsInfo = options.commonTags?.length
      ? `\n常用标签库：${options.commonTags.join(', ')}`
      : ''
    const commonCategoriesInfo = options.commonCategories?.length
      ? `\n常用分类库：${options.commonCategories.join(', ')}`
      : ''

    const prompt = `请分析以下文章内容，生成合适的 Frontmatter 元数据。

${commonTagsInfo}
${commonCategoriesInfo}

文章内容预览：
${previewText}

请以 JSON 格式返回，包含以下字段：
{
  "title": "文章标题",
  "tags": ["标签1", "标签2"],
  "categories": ["分类"],
  "description": "文章描述（1-2句话）"
}

要求：
1. title: 从文章中提取或生成一个简洁准确的标题
2. tags: 生成 3-5 个标签，尽量从常用标签库中选择
3. categories: 生成 1-2 个分类，尽量从常用分类库中选择
4. description: 生成简洁的文章摘要，不超过 100 字

只返回 JSON，不要有其他内容。`

    // 调用 Claude API
    const client = new Anthropic({
      apiKey,
      baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
      dangerouslyAllowBrowser: true // 在 Claude Code 环境中允许
    })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    // 解析响应
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      throw new Error('AI 返回的内容不是有效的 JSON')
    }

    const aiResult = JSON.parse(jsonMatch[0])

    return {
      frontmatter: {
        title: aiResult.title,
        tags: aiResult.tags || [],
        categories: aiResult.categories || [],
        description: aiResult.description
      },
      method: 'ai'
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`[FrontmatterGenerator] AI 生成失败: ${errorMessage}`)
    return {
      frontmatter: {},
      method: 'rule',
      error: errorMessage
    }
  }
}

/**
 * 规则生成 Frontmatter（方案1 - Fallback，支持标签缓存）
 */
async function generateWithRules(
  markdown: string,
  filepath: string,
  _options: FrontmatterGeneratorOptions // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<FrontmatterGenerationResult> {
  try {
    const frontmatter: Partial<Frontmatter> = {}

    // 1. 提取 title（第一个 # 标题）
    const titleMatch = markdown.match(/^#\s+(.+)$/m)
    if (titleMatch) {
      frontmatter.title = titleMatch[1].trim()
    } else {
      // 如果没有标题，使用文件名
      const filename = filepath.split('/').pop()?.replace(/\.md$/, '') || 'Untitled'
      frontmatter.title = filename
    }

    // 2. 生成 date（当前日期）
    frontmatter.date = new Date().toISOString()

    // 3. 提取 tags（优先使用缓存，然后基于关键词）
    let tags: string[] = []
    let category = 'general'

    // 先提取分类（用于缓存匹配）
    const pathParts = filepath.split('/')
    const postsIndex = pathParts.indexOf('posts')
    if (postsIndex >= 0 && postsIndex < pathParts.length - 1) {
      const extractedCategory = pathParts[postsIndex + 1]
      if (extractedCategory && extractedCategory !== '.md') {
        category = extractedCategory
        frontmatter.categories = [category]
      }
    }

    // 尝试从缓存中匹配标签
    try {
      const cacheManager = await getTagCacheManager()
      const cachedTags = await cacheManager.matchTagsFromContent(markdown, category, 5)
      if (cachedTags.length > 0) {
        tags = cachedTags
        console.log(`[FrontmatterGenerator] 🎯 从缓存匹配到 ${tags.length} 个标签: ${tags.join(', ')}`)
      }
    } catch (error) {
      console.warn('[FrontmatterGenerator] ⚠️  缓存加载失败，使用关键词提取')
    }

    // 如果缓存没有匹配到足够的标签，使用关键词提取作为补充
    if (tags.length < 3) {
      const keywordTags = new Set<string>(tags) // 保留已匹配的标签

      // 常见技术关键词
      const techKeywords = [
        'javascript',
        'typescript',
        'python',
        'java',
        'go',
        'rust',
        'react',
        'vue',
        'angular',
        'node',
        'frontend',
        'backend',
        'fullstack',
        'database',
        'api',
        'devops',
        'docker',
        'kubernetes',
        'git',
        'algorithm',
        'leetcode',
        'system-design',
        'tutorial',
        'beginner',
        'advanced'
      ]

      const lowerContent = markdown.toLowerCase()
      for (const keyword of techKeywords) {
        if (lowerContent.includes(keyword)) {
          keywordTags.add(keyword)
        }
      }

      tags = Array.from(keywordTags).slice(0, 5)
    }

    frontmatter.tags = tags

    // 如果没有从路径提取到分类，根据 tags 推断
    if (!frontmatter.categories || frontmatter.categories.length === 0) {
      if (frontmatter.tags.includes('tutorial') || frontmatter.tags.includes('beginner')) {
        frontmatter.categories = ['tutorial']
      } else if (frontmatter.tags.some(t => ['javascript', 'typescript', 'react', 'vue'].includes(t))) {
        frontmatter.categories = ['tech']
      } else {
        frontmatter.categories = ['general']
      }
    }

    // 5. 提取 description（第一段内容）
    const lines = markdown.split('\n').filter(line => line.trim() && !line.startsWith('#'))
    if (lines.length > 0) {
      const firstParagraph = lines[0]
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/`/g, '')
        .trim()
      frontmatter.description = firstParagraph.slice(0, 100) // 最多 100 字
    }

    return {
      frontmatter,
      method: 'rule'
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      frontmatter: {},
      method: 'rule',
      error: errorMessage
    }
  }
}

/**
 * 智能生成 Frontmatter（主函数）
 *
 * 自动检测环境：
 * - 如果在 Claude Code 环境中，优先使用 AI 方案
 * - 如果 AI 失败，fallback 到规则方案
 */
export async function generateFrontmatter(
  markdown: string,
  filepath: string,
  options: FrontmatterGeneratorOptions = {}
): Promise<FrontmatterGenerationResult> {
  // 决定使用哪个方案
  const useAI = options.useAI ?? isInClaudeCodeEnvironment()

  // 方案 2: AI 智能生成
  if (useAI) {
    console.log('[FrontmatterGenerator] 使用 AI 智能生成...')
    const aiResult = await generateWithAI(markdown, filepath, options)

    // 如果 AI 成功生成了完整的数据，保存到缓存并返回
    if (aiResult.frontmatter.title && aiResult.frontmatter.tags && !aiResult.error) {
      console.log('[FrontmatterGenerator] ✅ AI 生成成功')

      // 保存标签到缓存
      try {
        const cacheManager = await getTagCacheManager()
        const category = aiResult.frontmatter.categories?.[0] || extractCategoryFromPath(filepath)
        cacheManager.addTags(aiResult.frontmatter.tags, category, aiResult.frontmatter.tags)
        await cacheManager.save()
        console.log('[FrontmatterGenerator] 💾 标签已保存到缓存')
      } catch (error) {
        console.warn('[FrontmatterGenerator] ⚠️  保存缓存失败:', error)
      }

      return aiResult
    }

    // AI 失败或不完整，fallback 到规则方案
    console.log('[FrontmatterGenerator] ⚠️  AI 生成失败或不完整，fallback 到规则方案')
  }

  // 方案 1: 规则生成（Fallback）
  console.log('[FrontmatterGenerator] 使用规则生成...')
  const ruleResult = await generateWithRules(markdown, filepath, options)
  console.log('[FrontmatterGenerator] ✅ 规则生成完成')

  return ruleResult
}

/**
 * 检查 Frontmatter 是否完整
 */
export function isFrontmatterComplete(
  frontmatter: Partial<Frontmatter>
): boolean {
  return !!(
    frontmatter.title &&
    frontmatter.date &&
    frontmatter.tags &&
    frontmatter.tags.length > 0
  )
}

/**
 * 补全 Frontmatter 中缺失的字段
 */
export async function completeFrontmatter(
  markdown: string,
  filepath: string,
  existingFrontmatter: Partial<Frontmatter>,
  options: FrontmatterGeneratorOptions = {}
): Promise<Frontmatter> {
  const result: Frontmatter = {
    title: existingFrontmatter.title || '',
    date: existingFrontmatter.date || new Date().toISOString(),
    tags: existingFrontmatter.tags || [],
    categories: existingFrontmatter.categories,
    description: existingFrontmatter.description,
    draft: existingFrontmatter.draft || false
  }

  // 如果已经完整，直接返回
  if (isFrontmatterComplete(existingFrontmatter)) {
    return result
  }

  // 生成缺失的字段
  const generated = await generateFrontmatter(markdown, filepath, options)

  // 只填充缺失的字段
  if (!result.title && generated.frontmatter.title) {
    result.title = generated.frontmatter.title
  }
  if ((!result.tags || result.tags.length === 0) && generated.frontmatter.tags) {
    result.tags = generated.frontmatter.tags
  }
  if (!result.categories && generated.frontmatter.categories) {
    result.categories = generated.frontmatter.categories
  }
  if (!result.description && generated.frontmatter.description) {
    result.description = generated.frontmatter.description
  }

  return result
}

/**
 * 从文件路径提取分类
 */
function extractCategoryFromPath(filepath: string): string {
  const pathParts = filepath.split('/')
  const postsIndex = pathParts.indexOf('posts')
  if (postsIndex >= 0 && postsIndex < pathParts.length - 1) {
    const category = pathParts[postsIndex + 1]
    if (category && category !== '.md') {
      return category
    }
  }
  return 'general'
}
