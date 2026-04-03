import { WorkflowStatusManager, WorkflowStatusEnum } from './status-manager.js'
import { FileMover } from './file-mover.js'
import { FullPublishPipeline } from '../publish/full-pipeline.js'
import { StatusTransitionService } from '@content-hub/database'

/**
 * 工作流编排器
 */
export class WorkflowOrchestrator {
  private statusManager: WorkflowStatusManager
  private fileMover: FileMover
  private publishPipeline: FullPublishPipeline

  constructor() {
    this.statusManager = new WorkflowStatusManager()
    this.fileMover = new FileMover()
    this.publishPipeline = new FullPublishPipeline()
  }

  /**
   * 处理单个文章
   */
  async processPost(
    postId: string,
    options: {
      fast?: boolean
      injectionTemplateId?: string
      includeRelatedLinks?: boolean
      onProgress?: (step: number, total: number, stepName: string) => void
    } = {}
  ): Promise<{ success: boolean; wechatReplacedContent?: string }> {
    console.log(`\n🔄 开始处理: ${postId}`)

    const { fast = false, onProgress } = options

    try {
      // 1. 标记为处理中
      console.log(`\n📊 1/5 更新状态...`)
      onProgress?.(1, 5, '更新状态')
      await this.statusManager.markAsProcessing(postId)
      console.log(`   ✅ 状态已更新: processing`)

      // 2. 预览确认（fast 模式跳过）
      if (!fast) {
        console.log(`\n👀 2/5 预览确认...`)
        onProgress?.(2, 5, '预览确认')
        await this.previewAndConfirm(postId)
      } else {
        console.log(`\n⏭️  2/5 跳过预览确认（fast 模式）`)
        onProgress?.(2, 5, '跳过预览确认')
      }

      // 3. 确保文章状态为previewing（满足发布流程的要求）
      try {
        await StatusTransitionService.transition(postId, 'previewing')
        console.log(`   ✅ 文章状态已设置为: previewing`)
      } catch (error: any) {
        // 如果状态转换失败，继续尝试发布
        if (!error.message.includes('Cannot transition')) {
          throw error
        }
      }

      // 4. 生成平台产物（FullPublishPipeline 内部会处理文件移动）
      console.log(`\n📝 4/5 生成平台产物...`)
      onProgress?.(4, 5, '生成平台产物')

      // 🔍 调试：打印传递给publishPipeline的参数
      console.log(`\n🔍 [DEBUG Orchestrator] 传递给FullPublishPipeline:`)
      console.log(`  postId: ${postId}`)
      console.log(`  injectionTemplateId: ${options.injectionTemplateId || '(无)'}`)
      console.log(`  includeRelatedLinks: ${options.includeRelatedLinks}`)

      const result = await this.publishPipeline.publish(postId, {
        skipSync: false,
        skipPageGen: false,
        openBrowser: fast,  // fast 模式下打开浏览器
        mode: 'fast',
        injectionTemplateId: options.injectionTemplateId,
        includeRelatedLinks: options.includeRelatedLinks ?? true
      })

      if (!result.success) {
        // 找到失败的步骤
        const failedStep = result.steps.find((s: any) => s.status === 'failed')
        throw new Error(failedStep?.error || '发布失败')
      }

      // 5. 标记为完成
      console.log(`\n✅ 5/5 更新状态...`)
      onProgress?.(5, 5, '完成')
      // FullPublishPipeline 已经处理了文件移动和状态更新，这里只需要记录完成
      console.log(`   ✅ 处理完成: ${postId}`)

      console.log(`\n✅ 处理完成: ${postId}\n`)

      // 获取微信替换后的内容
      const wechatReplacedContent = (this.publishPipeline as any).wechatReplacedContent

      return { success: true, wechatReplacedContent }

    } catch (error) {
      // 区分用户取消和真正的错误
      const isUserCancelled = error instanceof Error && error.name === 'USER_CANCELLED'

      if (isUserCancelled) {
        console.log(`\n⏸️  处理已取消: ${postId}`)
      } else {
        console.error(`\n❌ 处理失败: ${postId}`, error)
      }

      // 回滚状态
      try {
        await this.statusManager.updateStatus(
          postId,
          WorkflowStatusEnum.PENDING as any
        )
        if (isUserCancelled) {
          console.log(`   ✅ 状态保持: pending`)
        } else {
          console.log(`   ⚠️  状态已回滚: pending`)
        }
      } catch (rollbackError) {
        console.error(`   ❌ 状态回滚失败:`, rollbackError)
      }

      throw error
    }
  }

  /**
   * 预览并等待用户确认
   */
  private async previewAndConfirm(postId: string): Promise<void> {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')

    // 读取文章内容
    const postPath = join(process.cwd(), 'content/posts', `${postId}.md`)
    const postContent = readFileSync(postPath, 'utf-8')

    // 提取标题和内容
    const titleMatch = postContent.match(/^title:\s*(.+)$/m)
    const title = titleMatch ? titleMatch[1] : postId
    const rawContent = postContent.replace(/^---\n[\s\S]*?\n---\n/, '')

    // 导入预览服务器和转换器
    const { createPreviewServer } = await import('../preview/server.js')
    const { transformForJuejin, transformForWechat, markdownToHTML } = await import('@content-hub/transformer')
    const open = await import('open')

    // 创建预览内容缓存
    const previewContentMap = new Map<string, any>()

    const getPreviewContent = async (id: string, platform: string) => {
      const cacheKey = `${platform}-${rawContent}`

      if (!previewContentMap.has(cacheKey)) {
        let transformedContent: string
        let htmlContent: string

        switch (platform) {
          case 'juejin':
            transformedContent = await transformForJuejin(rawContent)
            htmlContent = await markdownToHTML(transformedContent)
            break
          case 'wechat':
            transformedContent = await transformForWechat(rawContent)
            // transformForWechat 已经返回HTML，不需要再次转换
            htmlContent = transformedContent
            break
          case 'html':
            transformedContent = await markdownToHTML(rawContent)
            htmlContent = transformedContent
            break
          default:
            transformedContent = rawContent
            htmlContent = await markdownToHTML(rawContent)
        }

        previewContentMap.set(cacheKey, {
          id,
          title,
          platform,
          content: transformedContent,
          html: htmlContent,
          timestamp: new Date().toISOString()
        })
      }

      return previewContentMap.get(cacheKey)
    }

    // 启动预览服务器
    const server = await createPreviewServer(getPreviewContent)

    console.log(`\n   ✅ 预览服务器已启动！端口: ${server.port}`)
    console.log(`   📱 预览链接：`)

    const platforms = ['juejin', 'wechat', 'html']
    const platformNames: Record<string, string> = {
      juejin: '掘金',
      wechat: '微信公众号',
      html: 'HTML'
    }

    for (const platform of platforms) {
      const url = `http://localhost:${server.port}/preview/${platform}/${postId}`
      console.log(`      ${platformNames[platform]}: ${url}`)
    }

    console.log(`\n   💡 提示：`)
    console.log(`      - 在浏览器中打开以上链接查看各平台渲染效果`)
    console.log(`      - 确认无误后返回终端继续发布`)
    console.log(`      - 按 Ctrl+C 可取消发布\n`)

    // 自动打开浏览器
    try {
      await open.default(`http://localhost:${server.port}/preview/juejin/${postId}`)
      console.log(`   🌐 已在浏览器中打开掘金平台预览\n`)
    } catch (error) {
      console.log(`   ⚠️  无法自动打开浏览器，请手动访问上面的链接\n`)
    }

    // 等待用户确认
    const prompts = await import('prompts')

    const response = await prompts.default({
      type: 'confirm',
      name: 'confirmed',
      message: '预览无误，是否继续发布？',
      initial: false
    })

    // 关闭预览服务器
    await server.stop()
    console.log('   ✅ 预览服务器已关闭\n')

    if (response.confirmed) {
      console.log(`   ✅ 用户确认继续`)
    } else {
      console.log(`   ⏸️  用户取消发布`)
      // 用户取消是正常操作，不是错误
      // 抛出特殊的错误代码，让主进程区分是用户取消还是真正的错误
      const error = new Error('USER_CANCELLED')
      error.name = 'USER_CANCELLED'
      throw error
    }
  }

  /**
   * 批量处理所有待处理文章
   */
  async processAll(): Promise<void> {
    const pendingPosts = await this.statusManager.getPendingPosts()

    if (pendingPosts.length === 0) {
      console.log('✅ 没有待处理的文章')
      return
    }

    console.log(`\n📋 找到 ${pendingPosts.length} 篇待处理文章\n`)

    let successCount = 0
    let failCount = 0

    for (const post of pendingPosts) {
      try {
        await this.processPost(post.postId)
        successCount++
      } catch (error) {
        console.error(`处理失败: ${post.postId}`, error)
        failCount++
        // 继续处理下一篇
      }
    }

    console.log('\n🎉 批量处理完成')
    console.log(`✅ 成功: ${successCount} 篇`)
    console.log(`❌ 失败: ${failCount} 篇`)
  }

  /**
   * 回滚文章
   */
  async rollback(postId: string): Promise<void> {
    console.log(`\n⏪ 回滚: ${postId}`)

    try {
      const { existsSync } = await import('fs')
      const { join } = await import('path')
      const { PrismaClient } = await import('@prisma/client')

      const postsPath = join(process.cwd(), 'content/posts', `${postId}.md`)
      const donePath = join(process.cwd(), 'content/done', `${postId}.md`)

      const inPosts = existsSync(postsPath)
      const inDone = existsSync(donePath)

      if (inPosts && !inDone) {
        // 文件已在 posts 目录，只需要重置状态
        console.log(`   📁 文件已在 posts 目录，跳过文件移动`)
      } else if (inDone) {
        // 文件在 done 目录，需要移动回 posts
        await this.fileMover.rollbackToPosts(postId)
      } else {
        console.log(`   ⚠️  文件不存在，跳过文件移动`)
      }

      // 重置工作流状态
      await this.statusManager.updateStatus(
        postId,
        WorkflowStatusEnum.PENDING as any
      )

      // 重置发布状态为 draft
      const prisma = new PrismaClient()
      try {
        await prisma.post.update({
          where: { postId },
          data: { status: 'draft' }
        })
        console.log(`   ✅ 状态已重置: draft`)
      } finally {
        await prisma.$disconnect()
      }

      console.log(`✅ 回滚完成: ${postId}\n`)

    } catch (error) {
      console.error(`❌ 回滚失败: ${postId}`, error)
      throw error
    }
  }

  /**
   * 扫描并初始化新文章
   */
  async scanAndInitialize(): Promise<void> {
    const { readdirSync } = await import('fs')
    const { join } = await import('path')

    const postsDir = join(process.cwd(), 'content/posts')
    const files = readdirSync(postsDir).filter(f => f.endsWith('.md'))

    console.log(`\n📋 扫描 content/posts/: ${files.length} 个文件\n`)

    for (const file of files) {
      const postId = file.replace('.md', '')

      const status = await this.statusManager.getStatus(postId)

      if (!status) {
        console.log(`🆕 ${postId} - 初始化为待处理`)
        await this.statusManager.initializePost(postId)
      } else if (status.status === 'done') {
        console.log(`✅ ${postId} - 已处理`)
      } else {
        console.log(`🔄 ${postId} - ${status.status}`)
      }
    }

    console.log()
  }
}
