#!/usr/bin/env tsx
/**
 * 直接在 content/posts 目录下的文章中注入相关链接
 */
import { readIndex } from '../packages/core/src/scanner.js'
import { injectRelatedLinks } from '../packages/core/src/link-injector.js'
import { readFile, writeFile } from 'fs/promises'

async function main() {
  console.log('📖 正在读取内容索引...')
  const indexMap = await readIndex()

  if (!indexMap || indexMap.size === 0) {
    console.error('❌ 索引读取失败或为空')
    return
  }

  console.log(`📊 找到 ${indexMap.size} 篇文章`)

  let successCount = 0
  let skipCount = 0

  // 遍历所有文章
  for (const [postId, post] of indexMap.entries()) {
    try {
      // 获取原始文件路径
      const filepath = `content/posts/${postId}.md`

      // 读取原始文件
      const content = await readFile(filepath, 'utf-8')

      // 注入相关链接
      const enhanced = injectRelatedLinks(content, post, indexMap)

      // 检查内容是否有变化
      if (enhanced === content) {
        console.log(`⏭️  跳过: ${postId} (无需注入)`)
        skipCount++
        continue
      }

      // 写回到原始文件
      await writeFile(filepath, enhanced, 'utf-8')
      console.log(`✅ 已注入: ${postId}`)
      successCount++
    } catch (error) {
      console.error(`❌ 失败: ${postId}`, error)
    }
  }

  console.log(`\n📊 注入完成:`)
  console.log(`   - 成功: ${successCount} 篇`)
  console.log(`   - 跳过: ${skipCount} 篇`)
  console.log(`   - 总计: ${indexMap.size} 篇`)
}

main().catch(console.error)
