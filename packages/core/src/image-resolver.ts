import { resolve, basename } from 'path'
import { existsSync } from 'fs'

/**
 * 检查是否为外链
 */
export function isExternalLink(src: string): boolean {
  return /^https?:\/\//i.test(src)
}

/**
 * 检查是否为 base64 图片
 */
export function isBase64Image(src: string): boolean {
  return /^data:image\/[a-z]+;base64/i.test(src)
}

/**
 * 规范化本地图片路径
 */
export function normalizePath(
  src: string,
  baseDir: string,
  options: {
    onMissing?: (path: string) => void
  } = {}
): string {
  const { onMissing } = options

  // 外链：保持不变
  if (isExternalLink(src)) {
    return src
  }

  // base64：保持不变
  if (isBase64Image(src)) {
    return src
  }

  // 解析绝对路径
  const absolutePath = resolve(baseDir, src)

  // 检查文件是否存在
  if (!existsSync(absolutePath)) {
    onMissing?.(src)
    return src // 保持原路径，由调用者决定是否报错
  }

  // 计算相对 assets 目录的路径
  const filename = basename(absolutePath)
  const normalizedPath = `/assets/images/${filename}`

  return normalizedPath
}

/**
 * 检查图片是否存在
 */
export function imageExists(src: string, baseDir: string): boolean {
  if (isExternalLink(src) || isBase64Image(src)) {
    return true // 外链和 base64 不检查
  }

  const absolutePath = resolve(baseDir, src)
  return existsSync(absolutePath)
}

/**
 * 生成唯一文件名（处理重复）
 */
export function generateUniqueFilename(
  filename: string,
  existingFilenames: Set<string>
): string {
  if (!existingFilenames.has(filename)) {
    return filename
  }

  // 分离文件名和扩展名
  const lastDotIndex = filename.lastIndexOf('.')
  const name = lastDotIndex !== -1 ? filename.slice(0, lastDotIndex) : filename
  const ext = lastDotIndex !== -1 ? filename.slice(lastDotIndex) : ''

  // 生成唯一名称
  let counter = 1
  let uniqueFilename: string
  do {
    uniqueFilename = `${name}-${counter}${ext}`
    counter++
  } while (existingFilenames.has(uniqueFilename))

  return uniqueFilename
}
