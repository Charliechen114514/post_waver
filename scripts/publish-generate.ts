#!/usr/bin/env tsx
import { readFileSync } from 'fs'
import { join } from 'path'
import { generatePublishPage } from '../packages/engine/dist/publish/page-generator.js'
import open from 'open'

async function main() {
  const postId = process.argv[2]
  if (!postId) {
    console.error('Usage: pnpm publish:generate <postId>')
    process.exit(1)
  }

  console.log(`📄 生成发布页面: ${postId}`)

  // 读取文章内容
  const postPath = join(process.cwd(), 'content/posts', `${postId}.md`)
  let postContent: string

  try {
    postContent = readFileSync(postPath, 'utf-8')
  } catch (error) {
    console.error(`❌ 无法读取文章: ${postPath}`)
    process.exit(1)
  }

  // 提取标题（从 frontmatter 或第一个 # 标题）
  const titleMatch = postContent.match(/^title:\s*(.+)$/m)
  const title = titleMatch ? titleMatch[1] : postId

  // 移除 frontmatter
  const content = postContent.replace(/^---\n[\s\S]*?\n---\n/, '')

  // 准备平台内容
  const platforms = [
    {
      platform: 'juejin',
      name: '掘金',
      content: content // 保持 Markdown 格式
    },
    {
      platform: 'wechat',
      name: '微信公众号',
      content: content // 保持 Markdown 格式，后续转换
    },
    {
      platform: 'html',
      name: 'HTML',
      content: content
    }
  ]

  try {
    const pagePath = await generatePublishPage(postId, title, content, platforms, {
      openBrowser: true
    })

    console.log(`\n✅ 发布页面已生成!`)
    console.log(`   路径: ${pagePath}`)

    // 打开浏览器
    await open(pagePath)
  } catch (error) {
    console.error(`❌ 生成失败: ${error}`)
    process.exit(1)
  }
}

main().catch(console.error)
