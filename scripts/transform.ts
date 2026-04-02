#!/usr/bin/env tsx
import { markdownToHTML, transformForWechat, transformForJuejin } from '../packages/transformer/src/index.js'
import { injectRepoReference } from '../packages/core/src/repo-injector.js'
import { readFileSync } from 'fs'
import { Command } from 'commander'

const program = new Command()

program
  .name('transform')
  .description('转换 Markdown 文章为不同平台格式')
  .argument('<platform>', '目标平台: html, wechat, juejin')
  .argument('<file>', 'Markdown 文件路径')
  .option('--repo-owner <owner>', '仓库拥有者（用于添加仓库引用）')
  .option('--repo-name <name>', '仓库名称（用于添加仓库引用）')
  .option('--repo-branch <branch>', '仓库分支（默认 main）', 'main')
  .option('--repo-desc <desc>', '仓库描述（可选）')
  .action(async (platform: string, file: string, options) => {
    try {
      // 读取文件内容
      const content = readFileSync(file, 'utf-8')

      let transformed: string

      // 根据平台进行转换
      switch (platform) {
        case 'html':
          transformed = await markdownToHTML(content)
          if (options.repoOwner && options.repoName) {
            const post = {
              id: file,
              filepath: file,
              frontmatter: {},
              content,
              ast: null,
              contentHash: '',
              scannedAt: new Date()
            }
            transformed = injectRepoReference(
              transformed,
              post,
              {
                owner: options.repoOwner,
                repo: options.repoName,
                branch: options.repoBranch,
                description: options.repoDesc
              },
              'html'
            )
          }
          console.log(transformed)
          break

        case 'wechat':
          transformed = await transformForWechat(content)
          if (options.repoOwner && options.repoName) {
            const post = {
              id: file,
              filepath: file,
              frontmatter: {},
              content,
              ast: null,
              contentHash: '',
              scannedAt: new Date()
            }
            transformed = injectRepoReference(
              transformed,
              post,
              {
                owner: options.repoOwner,
                repo: options.repoName,
                branch: options.repoBranch,
                description: options.repoDesc
              },
              'wechat'
            )
          }
          console.log(transformed)
          break

        case 'juejin':
          transformed = await transformForJuejin(content)
          if (options.repoOwner && options.repoName) {
            const post = {
              id: file,
              filepath: file,
              frontmatter: {},
              content,
              ast: null,
              contentHash: '',
              scannedAt: new Date()
            }
            transformed = injectRepoReference(
              transformed,
              post,
              {
                owner: options.repoOwner,
                repo: options.repoName,
                branch: options.repoBranch,
                description: options.repoDesc
              },
              'juejin'
            )
          }
          console.log(transformed)
          break

        default:
          console.error(`❌ 不支持的平台: ${platform}`)
          console.error('   支持的平台: html, wechat, juejin')
          process.exit(1)
      }

      console.error(`\n✅ 转换成功: ${platform}`)
    } catch (error) {
      console.error('❌ 转换失败:', error)
      process.exit(1)
    }
  })

program.parse()
