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

  console.log(`\n  📝 开始替换图片链接...`)
  console.log(`  📄 内容片段 (前200字符): ${content.substring(0, 200)}`)

  for (const result of uploadResults) {
    if (!result.success || !result.url) {
      console.log(`  ⏭️  跳过失败的图片: ${result.originalPath}`)
      continue
    }

    // 替换所有形式的图片引用
    const originalPath = result.originalPath

    console.log(`\n  🔍 处理图片: ${originalPath}`)
    console.log(`     微信URL: ${result.url}`)

    // 生成多种可能的路径格式
    const pathVariants = [
      originalPath,                                    // 原始路径: assets/test-image.png
      originalPath.startsWith('/') ? originalPath.substring(1) : `/${originalPath}`,  // 添加/或移除/: /assets/test-image.png
    ]

    // 如果路径包含文件名，提取文件名
    const filename = originalPath.split('/').pop()
    if (filename && filename !== originalPath) {
      pathVariants.push(filename)                      // 只用文件名: test-image.png
      pathVariants.push(`/assets/${filename}`)         // assets/ + 文件名
    }

    console.log(`     尝试匹配的路径变体:`, pathVariants)

    // 对每种路径格式进行替换
    for (const pathVariant of pathVariants) {
      // 1. Markdown 格式: ![alt](path)
      const markdownRegex = new RegExp(
        `!\\[[^\\]]*\\]\\(${escapeRegExp(pathVariant)}\\)`,
        'g'
      )
      const markdownBefore = replacedContent
      replacedContent = replacedContent.replaceAll(
        markdownRegex,
        `![](${result.url})`
      )
      if (replacedContent !== markdownBefore) {
        console.log(`     ✅ Markdown 格式已替换: "${pathVariant}" → "${result.url}"`)
      }

      // 2. HTML 格式: <img src="path">
      const htmlRegex = new RegExp(
        `<img[^>]+src=["']${escapeRegExp(pathVariant)}["'][^>]*>`,
        'gi'
      )
      const htmlBefore = replacedContent
      replacedContent = replacedContent.replaceAll(
        htmlRegex,
        `<img src="${result.url}">`
      )
      if (replacedContent !== htmlBefore) {
        console.log(`     ✅ HTML 格式已替换: "${pathVariant}" → "${result.url}"`)
      }
    }

    // 检查是否替换成功
    if (replacedContent.includes(result.url)) {
      console.log(`     ✅ 成功！内容中已包含微信URL`)
    } else {
      console.error(`     ❌ 失败！内容中未找到微信URL`)
      console.error(`     当前内容中的图片路径:`)
      // 查找内容中的所有图片路径
      const imgMatches = replacedContent.match(/!\[([^\]]*)\]\(([^)]+)\)|<img[^>]+src=["']([^"']+)["'][^>]*>/gi)
      if (imgMatches) {
        imgMatches.forEach(match => console.log(`       - ${match}`))
      }
    }
  }

  console.log(`\n  ✅ 图片链接替换完成\n`)
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
