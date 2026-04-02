#!/usr/bin/env tsx
import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

async function main() {
  const postId = process.argv[2]
  if (!postId) {
    console.error('Usage: pnpm test:image:wechat <postId>')
    process.exit(1)
  }

  console.log(`🎯 测试平台: 微信公众号`)
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

  // 简单转换：将 Markdown 图片语法转换为 HTML img 标签
  const htmlContent = contentWithoutFrontmatter.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
    return `<img src="${src}" alt="${alt}" style="max-width: 100%; height: auto; display: block; margin: 20px 0;">`
  })

  // 提取 img 标签
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g
  const images = [...htmlContent.matchAll(imgRegex)]

  console.log(`\n📊 发现 ${images.length} 张图片:\n`)

  images.forEach((match, index) => {
    const src = match[1]
    console.log(`${index + 1}. ${src}`)
    console.log(`   类型: ${getImageType(src)}`)
    console.log(`   有效性: ${isLocalPath(src) ? '本地路径（需手动上传）' : '外部链接（应该可用）'}`)

    const styleMatch = match[0].match(/style="([^"]*)"/)
    if (styleMatch) {
      console.log(`   样式: ${styleMatch[1]}`)
    }
    console.log()
  })

  // 保存转换后的 HTML 内容供人工审查
  const outputDir = join(process.cwd(), 'output')
  const outputPath = join(outputDir, `wechat-${postId}.html`)

  // 创建输出目录
  mkdirSync(outputDir, { recursive: true })
  writeFileSync(outputPath, htmlContent, 'utf-8')

  console.log(`✅ 转换结果已保存: ${outputPath}`)
  console.log(`\n💡 下一步:`)
  console.log(`   1. 复制 ${outputPath} 的内容`)
  console.log(`   2. 粘贴到微信公众号编辑器测试图片是否正常显示`)
  console.log(`   3. 记录测试结果到调研报告`)
  console.log(`\n⚠️  重要提示 - 微信公众号图片处理:`)
  console.log(`   - 本地路径图片无法直接使用，需要手动上传`)
  console.log(`   - 外部链接图片可能需要在公众号后台配置白名单`)
  console.log(`   - 建议先在公众号素材库上传图片，然后插入到编辑器`)
  console.log(`   - 本测试主要用于验证 HTML img 标签的兼容性`)
}

function getImageType(src: string): string {
  if (src.startsWith('/assets/')) return '本地绝对路径'
  if (src.startsWith('./') || src.startsWith('../')) return '本地相对路径'
  if (src.startsWith('http://') || src.startsWith('https://')) return '外部链接'
  if (src.startsWith('data:image')) return 'Base64 编码'
  return '未知类型'
}

function isLocalPath(src: string): boolean {
  return src.startsWith('/assets/') || src.startsWith('./') || src.startsWith('../')
}

main().catch(console.error)
