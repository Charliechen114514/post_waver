#!/usr/bin/env tsx
import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

async function main() {
  const postId = process.argv[2]
  if (!postId) {
    console.error('Usage: pnpm test:image:juejin <postId>')
    process.exit(1)
  }

  console.log(`🎯 测试平台: 掘金`)
  console.log(`📄 文章: ${postId}`)

  // 读取文章内容
  const postPath = join(process.cwd(), 'content/posts', `${postId}.md`)

  let postContent: string
  try {
    postContent = readFileSync(postPath, 'utf-8')
  } catch (error) {
    console.error(`❌ 无法读取文章: ${postPath}`)
    process.exit(1)
  }

  // 移除 frontmatter
  const contentWithoutFrontmatter = postContent.replace(/^---\n[\s\S]*?\n---\n/, '')

  // 提取图片链接
  const imageRegex = /!\[.*?\]\((.*?)\)/g
  const images = [...contentWithoutFrontmatter.matchAll(imageRegex)]

  console.log(`\n📊 发现 ${images.length} 张图片:\n`)

  images.forEach((match, index) => {
    console.log(`${index + 1}. ${match[1]}`)
    console.log(`   类型: ${getImageType(match[1])}`)
    console.log(`   有效性: ${isLocalPath(match[1]) ? '本地路径（需测试）' : '外部链接（应该可用）'}`)
    console.log()
  })

  // 保存处理后的内容供人工审查
  const outputDir = join(process.cwd(), 'output')
  const outputPath = join(outputDir, `juejin-${postId}.md`)

  // 创建输出目录
  mkdirSync(outputDir, { recursive: true })

  // 保存处理后的 Markdown 内容（移除 frontmatter）
  writeFileSync(outputPath, contentWithoutFrontmatter, 'utf-8')

  console.log(`✅ 转换结果已保存: ${outputPath}`)
  console.log(`\n💡 下一步:`)
  console.log(`   1. 复制 ${outputPath} 的内容`)
  console.log(`   2. 粘贴到掘金编辑器测试图片是否正常显示`)
  console.log(`   3. 记录测试结果到调研报告`)
  console.log(`\n⚠️  注意事项:`)
  console.log(`   - 本地路径图片可能无法显示，需要使用外部图床`)
  console.log(`   - 外部链接（如 https://via.placeholder.com）应该可以正常显示`)
}

function getImageType(path: string): string {
  if (path.startsWith('/assets/')) return '本地绝对路径'
  if (path.startsWith('./') || path.startsWith('../')) return '本地相对路径'
  if (path.startsWith('http://') || path.startsWith('https://')) return '外部链接'
  return '未知类型'
}

function isLocalPath(path: string): boolean {
  return path.startsWith('/assets/') || path.startsWith('./') || path.startsWith('../')
}

main().catch(console.error)
