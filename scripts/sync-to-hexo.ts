#!/usr/bin/env tsx
import { readIndex } from '../packages/core/src/scanner.js'
import { injectRelatedLinks } from '../packages/core/src/link-injector.js'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * 读取 Hexo 配置文件中的 permalink 设置
 * 使用简单的字符串解析，避免引入额外的 YAML 依赖
 */
async function readHexoPermalink(): Promise<string> {
  try {
    const configPath = join('blog', '_config.yml')
    const content = await readFile(configPath, 'utf-8')

    // 查找 permalink 行
    const match = content.match(/^permalink:\s*(.+)$/m)
    if (match && match[1]) {
      return match[1].trim()
    }

    // 默认格式
    return ':year/:month/:day/:title/'
  } catch (error) {
    console.warn('⚠️  无法读取 Hexo 配置文件，使用默认 permalink 格式')
    return ':year/:month/:day/:title/'
  }
}

/**
 * 同步内容到 Hexo 博客目录
 */
async function sync() {
  // 检查 blog 目录是否存在
  if (!existsSync('blog')) {
    console.error('❌ Blog 目录不存在！')
    console.error('💡 请先设置 Hexo 博客：')
    console.error('   方式1: ln -s /path/to/your/blog ./blog')
    console.error('   方式2: hexo init blog')
    process.exit(1)
  }

  // 读取索引
  console.log('📖 正在读取内容索引...')
  const index = await readIndex()
  if (!index) {
    console.error('❌ 索引不存在，请先运行 pnpm scan')
    process.exit(1)
  }

  // 读取 Hexo 配置
  console.log('📖 正在读取 Hexo 配置...')
  const permalinkPattern = await readHexoPermalink()
  console.log(`📋 使用 permalink 格式: ${permalinkPattern}`)

  // 过滤非草稿文章
  const publishedPosts = Object.values(index.posts).filter(post => !post.draft)

  console.log(`📊 找到 ${publishedPosts.length} 篇已发布文章`)

  // 创建 Hexo 文章目录
  const hexoDir = join('blog', 'source', '_posts')
  await mkdir(hexoDir, { recursive: true })

  // 同步图片资源（如果存在）
  const assetsSourceDir = join('content', 'assets')
  const assetsTargetDir = join('blog', 'source', 'assets')

  if (existsSync(assetsSourceDir)) {
    console.log('📷 正在同步图片资源...')
    try {
      const { cp } = await import('fs/promises')
      await cp(assetsSourceDir, assetsTargetDir, { recursive: true })
      console.log('✅ 图片资源同步完成')
    } catch (error) {
      console.warn('⚠️  图片资源同步失败:', error)
    }
  }

  // 同步每篇文章
  let successCount = 0
  let errorCount = 0

  for (const post of publishedPosts) {
    try {
      // 读取原始文件
      const content = await readFile(post.filepath, 'utf-8')

      // 注入关联信息（上/下篇、相关阅读）
      const enhanced = injectRelatedLinks(content, post, index.posts, permalinkPattern)

      // 写入 Hexo 目录
      const outputFile = join(hexoDir, `${post.id}.md`)
      await writeFile(outputFile, enhanced, 'utf-8')

      console.log(`✅ 已同步: ${post.id}`)
      successCount++
    } catch (error) {
      console.error(`❌ 同步失败: ${post.id}`, error)
      errorCount++
    }
  }

  console.log(`\n📊 同步完成:`)
  console.log(`   - 成功: ${successCount} 篇`)
  if (errorCount > 0) {
    console.log(`   - 失败: ${errorCount} 篇`)
  }
  console.log(`\n💡 提示：如需提交到自己的博客仓库，运行: pnpm sync:blog`)
}

sync().catch(error => {
  console.error('❌ 同步失败:', error)
  process.exit(1)
})
