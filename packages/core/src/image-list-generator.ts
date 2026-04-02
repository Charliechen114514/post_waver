import { resolve, join } from 'path'
import { existsSync, statSync, writeFile, mkdirSync } from 'fs'
import { isExternalLink, isBase64Image } from './image-resolver.js'

/**
 * 图片引用类型
 */
export interface ImageReference {
  type: 'local' | 'external' | 'base64'
  originalPath: string
  absolutePath?: string
  filename?: string
  line?: number
  fileSize?: number
  fileSizeHuman?: string
  contextBefore?: string  // 图片前的文本（用于定位）
  contextAfter?: string   // 图片后的文本（用于定位）
}

/**
 * 图片列表结果
 */
export interface ImageListResult {
  totalImages: number
  localImages: ImageReference[]
  externalImages: ImageReference[]
  base64Images: ImageReference[]
}

/**
 * 图片列表生成选项
 */
export interface ImageListOptions {
  baseDir?: string
  includeFileStats?: boolean
  outputFormat?: 'txt' | 'json'
}

/**
 * 从Markdown内容中提取所有图片引用
 */
export function extractImagesFromMarkdown(
  content: string,
  options: ImageListOptions = {}
): ImageListResult {
  const { baseDir = process.cwd(), includeFileStats = true } = options

  const localImages: ImageReference[] = []
  const externalImages: ImageReference[] = []
  const base64Images: ImageReference[] = []

  // Markdown图片正则：![alt](src) 或 <img src="src">
  const patterns = [
    /!\[([^\]]*)\]\(([^)]+)\)/g, // ![alt](src)
    /<img[^>]+src=["']([^"']+)["'][^>]*>/gi // <img src="src">
  ]

  const lines = content.split('\n')

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      const src = match[2] || match[1]

      // 找到图片在哪个位置，然后计算行号
      const matchPosition = match.index
      const textBeforeMatch = content.substring(0, matchPosition)
      const lineIndex = textBeforeMatch.split('\n').length - 1

      // 判断图片类型
      if (isExternalLink(src)) {
        const ref: ImageReference = {
          type: 'external',
          originalPath: src,
          line: lineIndex >= 0 ? lineIndex + 1 : undefined
        }
        externalImages.push(ref)
      } else if (isBase64Image(src)) {
        const ref: ImageReference = {
          type: 'base64',
          originalPath: src,
          line: lineIndex >= 0 ? lineIndex + 1 : undefined
        }
        base64Images.push(ref)
      } else {
        // 处理 /assets/ 开头的路径，转换为相对于 content 目录的路径
        let normalizedSrc = src
        if (src.startsWith('/assets/')) {
          normalizedSrc = join(process.cwd(), 'content', src)
        }

        const absolutePath = resolve(baseDir, normalizedSrc)
        const ref: ImageReference = {
          type: 'local',
          originalPath: src,
          absolutePath,
          filename: src.split('/').pop() || src,
          line: lineIndex >= 0 ? lineIndex + 1 : undefined
        }

        // 获取上下文（前后各1行）
        if (lineIndex >= 0) {
          // 前一行文本（如果有）
          if (lineIndex > 0) {
            const prevLine = lines[lineIndex - 1].trim()
            // 跳过空行和图片行
            if (prevLine && !prevLine.startsWith('![') && !prevLine.startsWith('<img')) {
              ref.contextBefore = prevLine
            } else if (lineIndex > 1) {
              // 如果前一行是空行或图片，尝试再往前找一行
              const prevPrevLine = lines[lineIndex - 2].trim()
              if (prevPrevLine && !prevPrevLine.startsWith('![') && !prevPrevLine.startsWith('<img')) {
                ref.contextBefore = prevPrevLine
              }
            }
          }

          // 后一行文本（如果有）
          if (lineIndex < lines.length - 1) {
            const nextLine = lines[lineIndex + 1].trim()
            // 跳过空行和图片行
            if (nextLine && !nextLine.startsWith('![') && !nextLine.startsWith('<img')) {
              ref.contextAfter = nextLine
            } else if (lineIndex < lines.length - 2) {
              // 如果后一行是空行或图片，尝试再往后找一行
              const nextNextLine = lines[lineIndex + 2].trim()
              if (nextNextLine && !nextNextLine.startsWith('![') && !nextNextLine.startsWith('<img')) {
                ref.contextAfter = nextNextLine
              }
            }
          }
        }

        // 获取文件大小
        if (includeFileStats && existsSync(absolutePath)) {
          try {
            const stats = statSync(absolutePath)
            ref.fileSize = stats.size
            ref.fileSizeHuman = formatFileSize(stats.size)
          } catch (error) {
            // 忽略错误
          }
        }

        localImages.push(ref)
      }
    }
  }

  return {
    totalImages: localImages.length + externalImages.length + base64Images.length,
    localImages,
    externalImages,
    base64Images
  }
}

/**
 * 生成图片列表文件
 */
export async function generateImageListFile(
  postId: string,
  content: string,
  platform: string,
  outputDir: string,
  options: ImageListOptions = {}
): Promise<string> {
  const result = extractImagesFromMarkdown(content, options)

  // 确保输出目录存在
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  // 生成文件名
  const filename = `${platform}_imagelist.txt`
  const filePath = join(outputDir, filename)

  // 生成文件内容
  let fileContent = generateImageListText(postId, platform, result)

  // 写入文件
  writeFile(filePath, fileContent, 'utf-8', (err) => {
    if (err) throw err
  })

  return filePath
}

/**
 * 生成图片列表文本内容
 */
function generateImageListText(
  postId: string,
  platform: string,
  result: ImageListResult
): string {
  const lines: string[] = []

  // 头部信息
  lines.push(`# 文章ID：${postId}`)
  lines.push(`# 平台：${platform}`)
  lines.push(`# 生成时间：${new Date().toLocaleString('zh-CN')}`)
  lines.push(`# 说明：此平台不支持自动上传，请手动上传以下图片`)
  lines.push('')

  // 本地图片列表
  if (result.localImages.length > 0) {
    lines.push(`## 需要手动上传的图片（${result.localImages.length}个）`)
    lines.push('')

    result.localImages.forEach((img, index) => {
      lines.push(`[${index + 1}] ${img.originalPath}`)
      if (img.absolutePath) {
        lines.push(`    绝对路径：${img.absolutePath}`)
      }
      if (img.fileSizeHuman) {
        lines.push(`    文件大小：${img.fileSizeHuman}`)
      }
      if (img.contextBefore || img.contextAfter) {
        lines.push(`    位置：`)
        if (img.contextBefore) {
          const beforePreview = img.contextBefore.length > 80
            ? img.contextBefore.substring(0, 80) + '...'
            : img.contextBefore
          lines.push(`       前一句：${beforePreview}`)
        }
        if (img.contextAfter) {
          const afterPreview = img.contextAfter.length > 80
            ? img.contextAfter.substring(0, 80) + '...'
            : img.contextAfter
          lines.push(`       后一句：${afterPreview}`)
        }
      } else {
        lines.push(`    位置：第${img.line || '?'}行`)
      }
      lines.push(`    操作提示：复制绝对路径，在${platform}编辑器中插入图片`)
      lines.push('')
    })
  } else {
    lines.push('## ✅ 无需手动上传的图片')
    lines.push('')
    lines.push('所有图片都是外链或Base64格式，无需手动上传。')
    lines.push('')
  }

  // 统计信息
  lines.push('## 统计信息')
  lines.push('')
  lines.push(`- 本地图片：${result.localImages.length}个（需要上传）`)
  lines.push(`- 外链图片：${result.externalImages.length}个（无需上传）`)
  lines.push(`- Base64图片：${result.base64Images.length}个（无需上传）`)
  lines.push(`- 总计：${result.totalImages}个`)

  return lines.join('\n')
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * 生成JSON格式的图片列表
 */
export function generateImageListJSON(
  result: ImageListResult,
  postId: string,
  platform: string
): string {
  const data = {
    postId,
    platform,
    generatedAt: new Date().toISOString(),
    summary: {
      total: result.totalImages,
      local: result.localImages.length,
      external: result.externalImages.length,
      base64: result.base64Images.length
    },
    images: {
      local: result.localImages,
      external: result.externalImages,
      base64: result.base64Images
    }
  }

  return JSON.stringify(data, null, 2)
}

/**
 * 为多个平台批量生成图片列表
 */
export async function generateImageListForPlatforms(
  postId: string,
  content: string,
  platforms: string[],
  outputDir: string,
  options: ImageListOptions = {}
): Promise<Map<string, string>> {
  const filePaths = new Map<string, string>()

  for (const platform of platforms) {
    const filePath = await generateImageListFile(
      postId,
      content,
      platform,
      outputDir,
      options
    )
    filePaths.set(platform, filePath)
  }

  return filePaths
}
