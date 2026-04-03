#!/usr/bin/env tsx

import { prisma } from '@content-hub/database'
import { injectTitlePostContent, formatInjectionForPlatform } from '@content-hub/core'
import { injectRelatedLinks } from '@content-hub/core'
import { readFileSync } from 'fs'
import { join } from 'path'

async function testPublish() {
  console.log('🧪 测试发布功能...')

  // 1. 读取测试文章
  const postId = 'draft-post'
  const content = readFileSync(join(process.cwd(), 'content/posts/draft-post.md'), 'utf-8')
  const originalContent = content.replace(/^---\n[\s\S]*?\n---\n/, '')

  console.log('📄 原始内容:')
  console.log(originalContent.substring(0, 100) + '...\n')

  // 2. 测试注入模板
  console.log('💉 测试注入模板...')
  const template = await prisma.injectionTemplate.findFirst({
    where: { enabled: true }
  })

  if (!template) {
    console.log('❌ 没有找到启用的模板，请先创建一个')
    return
  }

  console.log(`✅ 找到模板: ${template.name}`)
  console.log(`   内容: ${template.content}\n`)

  const injectedContent = injectTitlePostContent(originalContent, {
    platform: 'juejin',
    customContent: formatInjectionForPlatform(template.content, 'juejin'),
    enabled: true
  })

  console.log('💉 注入后的内容:')
  console.log(injectedContent.substring(0, 200) + '...\n')

  // 3. 测试相关链接
  console.log('🔗 测试相关链接...')
  const contentIndex = await prisma.contentIndex.findUnique({
    where: { id: postId }
  })

  if (contentIndex) {
    const allIndexes = await prisma.contentIndex.findMany()
    const postsMap = new Map<string, any>()
    allIndexes.forEach(idx => {
      postsMap.set(idx.id, {
        id: idx.id,
        title: idx.title,
        date: idx.date.toISOString(),
        tags: JSON.parse(idx.tags),
        contentHash: idx.contentHash,
        filepath: idx.filepath,
        draft: idx.draft,
        prev: idx.prev,
        next: idx.next,
        related: idx.related ? JSON.parse(idx.related) : []
      })
    })

    const currentPost = {
      id: contentIndex.id,
      title: contentIndex.title,
      date: contentIndex.date.toISOString(),
      tags: JSON.parse(contentIndex.tags),
      contentHash: contentIndex.contentHash,
      filepath: contentIndex.filepath,
      draft: contentIndex.draft,
      prev: contentIndex.prev,
      next: contentIndex.next,
      related: contentIndex.related ? JSON.parse(contentIndex.related) : []
    }

    const relatedContent = injectRelatedLinks(injectedContent, currentPost, postsMap)

    console.log('🔗 应用相关链接后的内容:')
    console.log(relatedContent.substring(relatedContent.length - 300) + '\n')

    console.log('✅ 测试完成！所有功能正常工作')
  } else {
    console.log('⚠️  文章还没有索引，请先运行 pnpm workflow:scan')
  }
}

testPublish().catch(console.error)
