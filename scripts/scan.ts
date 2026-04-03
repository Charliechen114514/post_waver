#!/usr/bin/env tsx
import { scan } from '../packages/core/src/scanner.js'
import { Command } from 'commander'

const program = new Command()

program
  .name('scan')
  .description('扫描内容目录并生成索引')
  .option('-d, --dir <directory>', '扫描目录', 'content/posts')
  .option('-r, --recursive', '递归扫描子目录', true)
  .option('--include-drafts', '包含草稿文章（默认：包含所有）', true)
  .option('--exclude-drafts', '排除草稿文章', false)
  .option('--update-index', '更新索引文件', true)
  .option('--inject', '注入 frontmatter 到文件（只补充缺失字段）', false)
  .option('-o, --output <format>', '输出格式 (json|table|summary)', 'table')
  .action(async (options) => {
    try {
      // 如果指定了 --exclude-drafts，则不包含草稿；否则默认包含所有
      const includeDrafts = !options.excludeDrafts

      if (options.inject) {
        console.log('💉 注入模式已启用，将自动补充缺失的 frontmatter 字段...\n')
      }

      const result = await scan(options.dir, {
        recursive: options.recursive,
        includeDrafts: includeDrafts,
        updateIndex: options.updateIndex,
        inject: options.inject
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

      // summary 模式或任何模式下都显示简短摘要
      console.log(`\n✅ 扫描完成:`)
      console.log(`   - 总文章数: ${result.posts.length}`)
      console.log(`   - 新文章: ${result.newPosts.length}`)
      console.log(`   - 已更新: ${result.updatedPosts.length}`)
      console.log(`   - 耗时: ${result.duration}ms`)

      if (options.inject) {
        console.log(`   - 💾 注入模式: 已将缺失的 frontmatter 写入文件`)
      }
    } catch (error) {
      console.error('❌ 扫描失败:', error)
      process.exit(1)
    }
  })

program.parse()
