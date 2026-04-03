#!/usr/bin/env tsx
import { FullPublishPipeline } from '../packages/engine/src/publish/full-pipeline.js'
import { PromptManager } from '../packages/engine/src/ui/prompt-manager.js'
import { PostDAL } from '../packages/database/src/dal/post.js'
import { StatusTransitionService } from '../packages/database/src/services/status-transition.js'
import { transformForJuejin, transformForWechat, markdownToHTML } from '@content-hub/transformer'
import { readFileSync } from 'fs'
import { join } from 'path'
import prompts from 'prompts'

// 类型定义
interface PlatformNames {
  juejin: string
  wechat: string
  html: string
}

interface PublishOptions {
  mode: 'interactive' | 'fast' | 'preview-only'
  skipHexo: boolean
  skipPageGen: boolean
  openBrowser: boolean
}

async function main() {
  const args = process.argv.slice(2)

  // 解析选项
  const options: PublishOptions = {
    mode: 'interactive',
    skipHexo: false,
    skipPageGen: false,
    openBrowser: true
  }

  // 查找 postId（第一个不是选项的参数）
  let postId = args.find(arg =>
    !arg.startsWith('--') &&
    arg !== 'fast' &&
    arg !== 'preview-only' &&
    arg !== 'interactive'
  )

  if (!postId) {
    console.error('\n❌ 请提供文章 ID\n')
    console.log('用法:')
    console.log('  pnpm post:publish <postId>              # 交互式发布（强制预览）')
    console.log('  pnpm post:publish <postId> fast         # 快速发布（跳过预览）')
    console.log('  pnpm post:publish <postId> preview-only # 仅预览\n')
    console.log('示例:')
    console.log('  pnpm post:publish hello-world')
    console.log('  pnpm post:publish hello-world fast')
    console.log('  pnpm post:publish hello-world preview-only\n')
    process.exit(1)
  }

  // 检查文章是否存在（先检查数据库，再检查文件系统）
  const postPath = join(process.cwd(), 'content/posts', `${postId}.md`)
  const donePath = join(process.cwd(), 'content/done', `${postId}.md`)

  // 先查询数据库
  const dal = new PostDAL()
  try {
    const existingPost = await dal.findByPostId(postId)

    if (existingPost) {
      // 文章在数据库中，检查状态
      if (existingPost.status === 'published') {
        console.log(`\n⚠️  文章已发布: ${postId}`)
        console.log(`   状态: published`)
        console.log(`   发布时间: ${existingPost.publishedAt?.toLocaleString('zh-CN')}\n`)

        // 检查文件位置
        const { existsSync } = await import('fs')
        const inPosts = existsSync(postPath)
        const inDone = existsSync(donePath)

        if (inDone) {
          console.log(`   📁 文件位置: content/done/`)
        } else if (inPosts) {
          console.log(`   📁 文件位置: content/posts/`)
          console.log(`   ⚠️  注意: 状态是published但文件在posts目录\n`)
        } else {
          console.log(`   📁 文件不存在，可能已被删除\n`)
        }

        console.log(`💡 建议:`)
        console.log(`   如需重新发布，请先回滚:`)
        console.log(`   pnpm workflow:rollback ${postId}\n`)

        process.exit(1)
      } else if (existingPost.status === 'previewing') {
        console.log(`\n⚠️  文章正在预览中: ${postId}`)
        console.log(`   状态: previewing`)
        console.log(`   可以继续发布流程\n`)
      }
    }
  } catch (error) {
    // 数据库查询失败，继续检查文件
  }

  // 检查文件是否存在
  try {
    readFileSync(postPath, 'utf-8')
  } catch (error) {
    // 如果 posts 目录没有，尝试 done 目录
    try {
      readFileSync(donePath, 'utf-8')
      console.error(`\n❌ 文章已在 done 目录（已发布）: ${postId}`)
      console.error(`   如需重新发布，请先回滚:`)
      console.error(`   pnpm workflow:rollback ${postId}\n`)
      process.exit(1)
    } catch (error2) {
      console.error(`\n❌ 文章不存在: ${postId}`)
      console.error(`   尝试的路径:`)
      console.error(`   - ${postPath}`)
      console.error(`   - ${donePath}\n`)
      process.exit(1)
    }
  }

  // 解析模式参数
  if (args.includes('fast')) {
    options.mode = 'fast'
  } else if (args.includes('preview-only')) {
    options.mode = 'preview-only'
  }

  // 解析其他选项
  if (args.includes('--skip-hexo')) {
    options.skipHexo = true
  }

  if (args.includes('--skip-page')) {
    options.skipPageGen = true
  }

  if (args.includes('--no-browser')) {
    options.openBrowser = false
  }

  const prompts = new PromptManager()

  try {
    // 检查文章状态
    const post = await dal.findByPostId(postId)

    if (!post) {
      console.error(`\n❌ 文章不存在于数据库: ${postId}\n`)
      process.exit(1)
    }

    // 交互式模式：强制预览确认
    if (options.mode === 'interactive') {
      // 如果是draft状态，先生成预览并等待确认
      if (post.status === 'draft') {
        console.log('\n📋 文章状态: draft（草稿）')
        console.log('👀 启动预览服务器，确认无误后再发布...\n')

        // 读取文章内容
        const postContent = readFileSync(postPath, 'utf-8')
        const titleMatch = postContent.match(/^title:\s*(.+)$/m)
        const title = titleMatch ? titleMatch[1] : postId
        const rawContent = postContent.replace(/^---\n[\s\S]*?\n---\n/, '')

        // 导入预览服务器
        const { createPreviewServer } = await import('../packages/engine/src/preview/server.js')

        // 创建预览内容生成器
        const previewContentMap = new Map<string, any>()

        const getPreviewContent = async (id: string, platform: string) => {
          const cacheKey = `${platform}-${rawContent}`

          if (!previewContentMap.has(cacheKey)) {
            let transformedContent: string
            let htmlContent: string

            switch (platform) {
              case 'juejin':
                transformedContent = await transformForJuejin(rawContent)
                // 转换为HTML用于预览显示
                htmlContent = await markdownToHTML(transformedContent)
                break
              case 'wechat':
                transformedContent = await transformForWechat(rawContent)
                // transformForWechat 已经返回HTML，不需要再次转换
                htmlContent = transformedContent
                break
              case 'html':
                transformedContent = await markdownToHTML(rawContent)
                htmlContent = transformedContent  // HTML平台就是HTML
                break
              default:
                transformedContent = rawContent
                htmlContent = await markdownToHTML(rawContent)
            }

            previewContentMap.set(cacheKey, {
              id,
              title,
              platform,
              content: transformedContent,  // 原始Markdown（用于复制）
              html: htmlContent,            // HTML（用于显示）
              timestamp: new Date().toISOString()
            })
          }

          return previewContentMap.get(cacheKey)
        }

        // 启动预览服务器
        const server = await createPreviewServer(getPreviewContent)

        console.log(`\n✅ 预览服务器已启动！端口: ${server.port}`)
        console.log(`\n📱 预览链接：`)

        const platforms: Array<keyof PlatformNames> = ['juejin', 'wechat', 'html']
        const platformNames: PlatformNames = {
          juejin: '掘金',
          wechat: '微信公众号',
          html: 'HTML'
        }

        for (const platform of platforms) {
          const url = `http://localhost:${server.port}/preview/${platform}/${postId}`
          console.log(`   ${platformNames[platform]}: ${url}`)
        }

        console.log(`\n💡 提示：`)
        console.log(`   - 在浏览器中打开以上链接查看各平台渲染效果`)
        console.log(`   - 确认无误后返回终端继续发布`)
        console.log(`   - 按 Ctrl+C 可取消发布\n`)

        // 自动打开浏览器（可选）
        if (options.openBrowser) {
          try {
            const openModule = await import('open')
            // 只打开第一个平台（掘金）
            await openModule.default(`http://localhost:${server.port}/preview/juejin/${postId}`)
            console.log(`🌐 已在浏览器中打开掘金平台预览\n`)
          } catch (error) {
            console.log(`⚠️  无法自动打开浏览器，请手动访问上面的链接\n`)
          }
        }

        // 等待用户确认
        const confirmed = await waitForConfirmation('预览无误，是否继续发布?')

        // 关闭预览服务器
        await server.stop()
        console.log('✅ 预览服务器已关闭\n')

        if (!confirmed) {
          console.log('\n❌ 发布已取消\n')
          process.exit(0)
        }

        // 将状态改为previewing，允许后续的发布流程
        await StatusTransitionService.transition(postId, 'previewing')
        console.log('✅ 状态已更新: previewing\n')
      } else {
        // 非draft状态，显示发布计划
        await prompts.showPublishPlan(postId)

        const confirmed = await prompts.confirm('是否继续发布?')

        if (!confirmed) {
          console.log('\n❌ 发布已取消\n')
          process.exit(0)
        }
      }
    }

    // 执行发布
    const pipeline = new FullPublishPipeline()
    const result = await pipeline.publish(postId, {
      skipHexo: options.skipHexo,
      skipPageGen: options.skipPageGen,
      openBrowser: options.openBrowser,
      mode: options.mode
    })

    // 显示结果
    await prompts.showResult(result)

    if (result.success) {
      // 显示下一步操作
      await prompts.showNextSteps(result)
    } else {
      process.exit(1)
    }

  } catch (error) {
    prompts.showError('发布失败', error as Error)
    process.exit(1)
  } finally {
    // 确保断开所有数据库连接
    const { disconnectDatabase, disconnectStatusTransition } = await import('../packages/database/dist/index.js')
    await disconnectDatabase()
    await disconnectStatusTransition()
  }
}

/**
 * 等待用户确认
 */
async function waitForConfirmation(question: string): Promise<boolean> {
  // 检查是否在交互式终端中
  if (!process.stdin.isTTY) {
    return true // 非交互式环境默认确认
  }

  const response = await prompts({
    type: 'confirm',
    name: 'confirmed',
    message: question,
    initial: true
  })

  return response.confirmed ?? false
}

main().catch(error => {
  console.error('\n发布失败:', error)
  process.exit(1)
}).then(() => process.exit(0))
