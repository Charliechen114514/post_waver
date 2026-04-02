import { ImageUploadManager } from '@content-hub/engine'
import { readFileSync } from 'fs'
import { join } from 'path'

async function main() {
  const args = process.argv.slice(2)
  const postId = args[0]

  if (!postId) {
    console.error('❌ 请提供文章ID')
    console.log('\n用法:')
    console.log('  pnpm image:upload-post <postId> [options]')
    console.log('\n选项:')
    console.log('  --platform <platform>  指定平台 (默认: juejin,wechat,html)')
    console.log('  --replace             上传后替换文章中的图片链接')
    console.log('\n示例:')
    console.log('  pnpm image:upload-post my-post')
    console.log('  pnpm image:upload-post my-post --platform wechat')
    process.exit(1)
  }

  const platformArg = args.indexOf('--platform')
  const platforms = platformArg >= 0
    ? [args[platformArg + 1]]
    : ['juejin', 'wechat', 'html']

  const shouldReplace = args.includes('--replace')

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
    const cleanContent = content.replace(/^---\n[\s\S]*?\n---\n/, '')

    console.log(`\n📷 处理文章图片: ${postId}`)
    console.log('─'.repeat(60))

    const manager = new ImageUploadManager()

    const results = await manager.processMultiPlatformImages(
      postId,
      cleanContent,
      platforms,
      {
        outputDir: join(process.cwd(), 'output', 'temp'),
        fallbackToList: true
      }
    )

    console.log('\n' + '─'.repeat(60))
    console.log('📊 处理结果:\n')

    for (const result of results) {
      console.log(`${result.platform}:`)
      console.log(`  ✅ 成功: ${result.success}`)
      console.log(`  ⏭️  跳过: ${result.skipped}`)
      console.log(`  ❌ 失败: ${result.failed}`)

      if (result.listFile) {
        console.log(`  📄 列表文件: ${result.listFile}`)
      }

      // 显示上传成功的图片
      if (result.uploaded && result.uploaded.length > 0) {
        const uploaded = result.uploaded.filter(r => r.success)
        if (uploaded.length > 0) {
          console.log(`  📤 已上传的图片:`)
          uploaded.forEach(img => {
            console.log(`     - ${img.originalPath}`)
            if (img.url) {
              console.log(`       → ${img.url}`)
            }
          })
        }
      }

      console.log('')
    }

    console.log('─'.repeat(60))
    console.log('\n💡 提示:')
    console.log('  - 查看生成的图片列表文件了解详情')
    console.log('  - 微信平台需要配置 API 才能自动上传')

  } catch (error) {
    console.error('\n❌ 错误:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
