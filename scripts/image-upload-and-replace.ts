#!/usr/bin/env tsx
/**
 * 微信图片上传和链接替换完整流程
 *
 * 功能：
 *   1. 读取文章内容
 *   2. 上传图片到微信
 *   3. 替换文章中的图片链接
 *   4. 保存替换后的文章
 *   5. 失败则生成图片列表
 */

import { ImageUploadManager } from '@content-hub/engine'
import { replaceImageUrls, generateReplacementReport } from '@content-hub/engine/src/image/image-url-replacer'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

async function main() {
  const args = process.argv.slice(2)
  const postId = args[0]

  if (!postId) {
    console.error('❌ 请提供文章ID')
    console.log('\n用法:')
    console.log('  pnpm image:upload:replace <postId> [options]')
    console.log('\n选项:')
    console.log('  --dry-run            仅显示替换结果，不保存文件')
    console.log('  --output <path>      指定输出文件路径（默认：覆盖原文件）')
    console.log('  --backup             在修改前创建备份')
    console.log('\n示例:')
    console.log('  pnpm image:upload:replace my-article')
    console.log('  pnpm image:upload:replace my-article --dry-run')
    console.log('  pnpm image:upload:replace my-article --backup')
    process.exit(1)
  }

  const isDryRun = args.includes('--dry-run')
  const shouldBackup = args.includes('--backup')

  // 查找输出路径参数
  const outputArgIndex = args.indexOf('--output')
  const outputPath = outputArgIndex >= 0 ? args[outputArgIndex + 1] : undefined

  try {
    // 1. 读取文章内容
    const postPath = join(process.cwd(), 'content/posts', `${postId}.md`)
    let content: string

    try {
      content = readFileSync(postPath, 'utf-8')
    } catch (error) {
      console.error(`❌ 文章不存在: ${postPath}`)
      process.exit(1)
    }

    // 分离 Frontmatter 和正文
    const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---\n/)
    const frontmatter = frontmatterMatch ? frontmatterMatch[0] : ''
    const body = frontmatterMatch ? content.slice(frontmatterMatch[0].length) : content

    console.log(`\n📷 处理文章图片: ${postId}`)
    console.log('─'.repeat(60))

    // 2. 上传图片到微信
    const manager = new ImageUploadManager()
    const results = await manager.processMultiPlatformImages(
      postId,
      body,
      ['wechat'],
      {
        outputDir: join(process.cwd(), 'output', 'temp'),
        fallbackToList: true,
        maxRetries: 2
      }
    )

    // 获取微信平台结果
    const wechatResult = results.find(r => r.platform === 'wechat')

    if (!wechatResult) {
      console.error('❌ 未找到微信平台处理结果')
      process.exit(1)
    }

    console.log('\n' + '─'.repeat(60))
    console.log('📊 上传结果:\n')

    console.log(`  ✅ 成功: ${wechatResult.success}`)
    console.log(`  ❌ 失败: ${wechatResult.failed}`)
    console.log(`  ⏭️  跳过: ${wechatResult.skipped}`)

    // 3. 生成替换报告
    const report = generateReplacementReport(wechatResult.uploaded)

    console.log('\n📝 详细结果:')
    for (const detail of report.details) {
      if (detail.url) {
        console.log(`  ✅ ${detail.path}`)
        console.log(`     → ${detail.url}`)
      } else if (detail.error) {
        console.log(`  ❌ ${detail.path}`)
        console.log(`     错误: ${detail.error}`)
      }
    }

    // 4. 如果有成功的上传，替换图片链接
    if (report.replaced > 0) {
      console.log('\n' + '─'.repeat(60))
      console.log('🔄 替换图片链接...\n')

      const replacedBody = replaceImageUrls(body, wechatResult.uploaded)
      const replacedContent = frontmatter + replacedBody

      // 显示替换预览
      const uploadedImages = wechatResult.uploaded.filter(r => r.success && r.url)
      if (uploadedImages.length > 0) {
        console.log(`📋 替换示例:`)
        for (const img of uploadedImages.slice(0, 3)) {
          console.log(`  旧: ${img.originalPath}`)
          console.log(`  新: ${img.url}`)
          console.log('')
        }
        if (uploadedImages.length > 3) {
          console.log(`  ... 还有 ${uploadedImages.length - 3} 张图片\n`)
        }
      }

      // 5. 保存替换后的内容
      if (!isDryRun) {
        // 创建备份
        if (shouldBackup) {
          const backupPath = postPath + '.backup'
          writeFileSync(backupPath, content, 'utf-8')
          console.log(`💾 备份已创建: ${backupPath}`)
        }

        // 确定输出路径
        const finalOutputPath = outputPath || postPath

        // 保存替换后的内容
        writeFileSync(finalOutputPath, replacedContent, 'utf-8')

        console.log(`✅ 文件已更新: ${finalOutputPath}`)
        console.log(`   替换了 ${report.replaced} 张图片`)
      } else {
        console.log(`🔍 Dry-run 模式：文件不会被修改`)
        console.log(`   将替换 ${report.replaced} 张图片`)
      }
    } else {
      console.log('\n' + '─'.repeat(60))
      console.log('⚠️  没有成功上传的图片，无需替换链接')
    }

    // 6. 如果有失败的图片，提示查看列表
    if (report.failed > 0) {
      console.log('\n' + '─'.repeat(60))
      console.log(`⚠️  ${report.failed} 张图片上传失败`)
      if (wechatResult.listFile) {
        console.log(`📄 请查看图片列表文件: ${wechatResult.listFile}`)
        console.log(`   手动上传这些图片后，需要再次替换链接`)
      }
    }

    console.log('\n' + '─'.repeat(60))
    console.log('✅ 处理完成\n')

  } catch (error) {
    console.error('\n❌ 错误:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
