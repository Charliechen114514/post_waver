#!/usr/bin/env tsx
import { scan } from '../packages/core/src/scanner.js'
import { Command } from 'commander'

const program = new Command()

program
  .name('scan')
  .description('扫描内容目录并生成索引')
  .option('-d, --dir <directory>', '扫描目录', 'content/posts')
  .option('-r, --recursive', '递归扫描子目录', true)
  .option('--include-drafts', '包含草稿文章', false)
  .option('--update-index', '更新索引文件', true)
  .option('-o, --output <format>', '输出格式 (json|table)', 'json')
  .action(async (options) => {
    try {
      const result = await scan(options.dir, {
        recursive: options.recursive,
        includeDrafts: options.includeDrafts,
        updateIndex: options.updateIndex
      })

      if (options.output === 'json') {
        console.log(JSON.stringify(result, null, 2))
      } else if (options.output === 'table') {
        console.table(result.posts.map(p => ({
          ID: p.id,
          标题: p.frontmatter.title,
          日期: p.frontmatter.date,
          标签: p.frontmatter.tags.join(', '),
          草稿: p.frontmatter.draft ? '是' : '否'
        })))
      }

      console.log(`\n✅ 扫描完成:`)
      console.log(`   - 总文章数: ${result.posts.length}`)
      console.log(`   - 新文章: ${result.newPosts.length}`)
      console.log(`   - 已更新: ${result.updatedPosts.length}`)
      console.log(`   - 耗时: ${result.duration}ms`)
    } catch (error) {
      console.error('❌ 扫描失败:', error)
      process.exit(1)
    }
  })

program.parse()
