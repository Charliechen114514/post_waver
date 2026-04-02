#!/usr/bin/env tsx
import { FullPublishPipeline } from '../packages/engine/dist/publish/full-pipeline.js'
import { PromptManager } from '../packages/engine/dist/ui/prompt-manager.js'
import { StatusTransitionService } from '@content-hub/database/dist/services/status-transition.js'
import { PrismaClient } from '@content-hub/database/dist/prisma/client.js'
import type { FullPublishResult } from '../packages/engine/dist/ui/prompt-manager.js'

const prisma = new PrismaClient()

interface RepublishOptions {
  skipHexo: boolean
  skipPageGen: boolean
  openBrowser: boolean
  forceState: boolean
}

async function main() {
  const args = process.argv.slice(2)
  const postId = args[0]

  if (!postId) {
    console.error('\n❌ 请提供文章 ID\n')
    console.log('用法:')
    console.log('  pnpm post:publish:republish <postId> [options]\n')
    console.log('选项:')
    console.log('  --skip-hexo      跳过 Hexo 同步')
    console.log('  --skip-page      跳过页面生成')
    console.log('  --no-browser     不打开浏览器')
    console.log('  --force-state    强制更新状态（即使已发布）\n')
    console.log('示例:')
    console.log('  pnpm post:publish:republish hello-world')
    console.log('  pnpm post:publish:republish hello-world --skip-hexo --no-browser\n')
    process.exit(1)
  }

  // 解析选项
  const options: RepublishOptions = {
    skipHexo: args.includes('--skip-hexo'),
    skipPageGen: args.includes('--skip-page'),
    openBrowser: !args.includes('--no-browser'),
    forceState: args.includes('--force-state')
  }

  const prompts = new PromptManager()
  const pipeline = new FullPublishPipeline()

  try {
    // 检查文章是否存在
    const post = await prisma.post.findUnique({
      where: { postId }
    })

    if (!post) {
      console.error(`\n❌ 文章不存在: ${postId}\n`)
      process.exit(1)
    }

    console.log('\n┌─────────────────────────────────────────────────────┐')
    console.log('│' + ' '.repeat(18) + '🔄 重新发布' + ' '.repeat(20) + '│')
    console.log('├─────────────────────────────────────────────────────┤')
    console.log('│                                                     │')
    console.log(`│  文章 ID: ${postId}${' '.repeat(43 - postId.length)}│`)
    console.log(`│  当前状态: ${post.status}${' '.repeat(43 - post.status.length)}│`)
    console.log(`│  标题: ${post.title}${' '.repeat(49 - post.title.length)}│`)
    console.log('│                                                     │')
    console.log('└─────────────────────────────────────────────────────┘\n')

    // 确认重新发布
    const confirmed = await prompts.confirm('确定要重新发布这篇文章吗?')

    if (!confirmed) {
      console.log('\n❌ 重新发布已取消\n')
      process.exit(0)
    }

    // 如果强制状态更新，先回滚状态
    if (options.forceState) {
      try {
        await StatusTransitionService.transition(postId, 'previewing')
        console.log('  ✅ 状态已回滚: previewing\n')
      } catch (error) {
        console.log(`  ⚠️  状态回滚失败: ${error}\n`)
      }
    }

    // 执行发布
    const result = await pipeline.publish(postId, {
      skipHexo: options.skipHexo,
      skipPageGen: options.skipPageGen,
      openBrowser: options.openBrowser,
      mode: 'fast'
    })

    // 显示结果
    await prompts.showResult(result)

    if (result.success) {
      // 检查是否已有 URL 记录
      const existingRecords = await prisma.publishRecord.findMany({
        where: {
          post: {
            postId
          }
        }
      })

      if (existingRecords.length > 0) {
        console.log('┌─────────────────────────────────────────────────────┐')
        console.log('│' + ' '.repeat(15) + '📋 已有平台 URL' + ' '.repeat(18) + '│')
        console.log('├─────────────────────────────────────────────────────┤')
        console.log('│                                                     │')

        for (const record of existingRecords) {
          const truncatedUrl = record.url.length > 45 ? record.url.slice(0, 42) + '...' : record.url
          console.log(`│  ${record.platform}:${' '.repeat(10 - record.platform.length)} ${truncatedUrl}${' '.repeat(53 - truncatedUrl.length - 12)}│`)
        }

        console.log('│                                                     │')
        console.log('│  💡 提示: 这些 URL 仍然有效，无需重新设置          │')
        console.log('│                                                     │')
        console.log('└─────────────────────────────────────────────────────┘\n')
      }

      // 显示下一步操作
      await prompts.showNextSteps(result)
    } else {
      process.exit(1)
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    prompts.showError('重新发布失败', error as Error)
    process.exit(1)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
  .then(() => process.exit(0))
