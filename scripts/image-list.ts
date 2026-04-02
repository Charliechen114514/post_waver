import { readFileSync } from 'fs'
import { join } from 'path'
import {
  extractImagesFromMarkdown,
  generateImageListFile,
  generateImageListForPlatforms,
  type ImageListResult
} from '@content-hub/core'

async function main() {
  const args = process.argv.slice(2)
  const postId = args[0]

  if (!postId) {
    console.error('❌ 请提供文章ID')
    console.log('\n用法:')
    console.log('  pnpm image:list <postId> [options]')
    console.log('\n选项:')
    console.log('  --platform <platform>  指定平台（默认：juejin,wechat,html）')
    console.log('  --output <dir>         输出目录（默认：output/{hashId}）')
    console.log('  --json                 输出JSON格式')
    console.log('\n示例:')
    console.log('  pnpm image:list my-post')
    console.log('  pnpm image:list my-post --platform juejin')
    console.log('  pnpm image:list my-post --json')
    process.exit(1)
  }

  // 解析选项
  const platformArg = args.indexOf('--platform')
  const platforms = platformArg >= 0
    ? [args[platformArg + 1]]
    : ['juejin', 'wechat', 'html']

  const outputArg = args.indexOf('--output')
  const outputDir = outputArg >= 0
    ? args[outputArg + 1]
    : join(process.cwd(), 'output', 'temp')

  const jsonMode = args.includes('--json')

  try {
    // 读取文章内容
    const postPath = join(process.cwd(), 'content/posts', `${postId}.md`)

    try {
      readFileSync(postPath, 'utf-8')
    } catch (error) {
      console.error(`❌ 文章不存在: ${postPath}`)
      process.exit(1)
    }

    const content = readFileSync(postPath, 'utf-8')

    // 移除frontmatter
    const cleanContent = content.replace(/^---\n[\s\S]*?\n---\n/, '')

    console.log(`\n📷 分析文章图片: ${postId}`)
    console.log('─'.repeat(60))

    // 提取图片
    const result = extractImagesFromMarkdown(cleanContent, {
      baseDir: process.cwd(),
      includeFileStats: true
    })

    // 显示统计信息
    console.log(`\n📊 统计信息:`)
    console.log(`  本地图片：${result.localImages.length}个`)
    console.log(`  外链图片：${result.externalImages.length}个`)
    console.log(`  Base64图片：${result.base64Images.length}个`)
    console.log(`  总计：${result.totalImages}个`)

    // JSON模式
    if (jsonMode) {
      console.log('\n📄 JSON输出:')
      console.log(JSON.stringify(result, null, 2))
      return
    }

    // 显示本地图片详情
    if (result.localImages.length > 0) {
      console.log(`\n📁 本地图片详情:`)
      result.localImages.forEach((img, index) => {
        console.log(`\n  [${index + 1}] ${img.originalPath}`)
        if (img.absolutePath) {
          console.log(`      绝对路径：${img.absolutePath}`)
        }
        if (img.fileSizeHuman) {
          console.log(`      文件大小：${img.fileSizeHuman}`)
        }
        if (img.line) {
          console.log(`      位置：第${img.line}行`)
        }
      })
    }

    // 显示外链图片
    if (result.externalImages.length > 0) {
      console.log(`\n🔗 外链图片:`)
      result.externalImages.forEach((img, index) => {
        console.log(`  [${index + 1}] ${img.originalPath}`)
      })
    }

    // 生成图片列表文件
    console.log(`\n📝 生成图片列表文件...`)

    const filePaths = await generateImageListForPlatforms(
      postId,
      cleanContent,
      platforms,
      outputDir,
      {
        baseDir: process.cwd(),
        includeFileStats: true
      }
    )

    console.log('─'.repeat(60))
    console.log(`\n✅ 图片列表文件已生成:`)

    for (const [platform, filePath] of filePaths) {
      console.log(`  ${platform}: ${filePath}`)
    }

    console.log('\n💡 提示:')
    console.log('  - 查看生成的文件以获取详细的图片列表')
    console.log('  - 复制绝对路径到平台编辑器中手动上传图片')
    console.log('')

  } catch (error) {
    console.error('\n❌ 错误:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
