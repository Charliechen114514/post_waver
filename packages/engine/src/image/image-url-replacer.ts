/**
 * 图片链接替换器
 *
 * 功能：上传图片成功后，将文章中的本地图片路径替换为平台图片 URL
 */

import { ImageUploadResult } from './upload-manager'

/**
 * 替换文章中的图片链接
 */
export function replaceImageUrls(
  content: string,
  uploadResults: ImageUploadResult[]
): string {
  let replacedContent = content

  for (const result of uploadResults) {
    if (!result.success || !result.url) {
      continue // 跳过上传失败的图片
    }

    // 替换所有形式的图片引用
    const originalPath = result.originalPath

    // 1. Markdown 格式: ![alt](path)
    replacedContent = replacedContent.replaceAll(
      new RegExp(`!\\[[^\\]]*\\]\\(${escapeRegExp(originalPath)}\\)`, 'g'),
      `![](${result.url})`
    )

    // 2. HTML 格式: <img src="path">
    replacedContent = replacedContent.replaceAll(
      new RegExp(`<img[^>]+src=["']${escapeRegExp(originalPath)}["'][^>]*>`, 'gi'),
      `<img src="${result.url}">`
    )
  }

  return replacedContent
}

/**
 * 生成替换报告
 */
export function generateReplacementReport(
  uploadResults: ImageUploadResult[]
): { replaced: number; failed: number; details: Array<{ path: string; url?: string; error?: string }> } {
  const details = uploadResults.map(r => ({
    path: r.originalPath,
    url: r.url,
    error: r.error
  }))

  const replaced = uploadResults.filter(r => r.success).length
  const failed = uploadResults.filter(r => !r.success).length

  return { replaced, failed, details }
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
