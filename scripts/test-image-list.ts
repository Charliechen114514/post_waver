import { extractImagesFromMarkdown, generateImageListFile } from '@content-hub/core'
import { readFileSync } from 'fs'

async function main() {
  try {
    const content = readFileSync('/tmp/test-post.md', 'utf-8')
    const cleanContent = content.replace(/^---\n[\s\S]*?\n---\n/, '')

    console.log('测试图片提取功能...\n')
    const result = extractImagesFromMarkdown(cleanContent, {
      baseDir: '/tmp',
      includeFileStats: true
    })

    console.log('总图片数:', result.totalImages)
    console.log('本地图片:', result.localImages.length)
    console.log('外链图片:', result.externalImages.length)
    console.log('Base64图片:', result.base64Images.length)

    console.log('\n生成图片列表文件...\n')
    await generateImageListFile('test-post', cleanContent, 'juejin', '/tmp/output', {
      baseDir: '/tmp',
      includeFileStats: true
    })

    console.log('\n检查生成的文件...\n')
    const fileList = readFileSync('/tmp/output/juejin_imagelist.txt', 'utf-8')
    console.log(fileList)

    console.log('\n✅ 测试完成！')
  } catch (error) {
    console.error('错误:', error)
    process.exit(1)
  }
}

main()
