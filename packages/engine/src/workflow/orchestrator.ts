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
  async processPost(postId: string): Promise<void> {
    console.log(`\n🔄 开始处理: ${postId}`)

    try {
      // 1. 标记为处理中
      console.log(`\n📊 1/5 更新状态...`)
      await this.statusManager.markAsProcessing(postId)
      console.log(`   ✅ 状态已更新: processing`)

      // 2. 预览确认
      console.log(`\n👀 2/5 预览确认...`)
      await this.previewAndConfirm(postId)

      // 3. 确保文章状态为previewing（满足发布流程的要求）
      try {
        await StatusTransitionService.transition(postId, 'previewing')
        console.log(`   ✅ 文章状态已设置为: previewing`)
      } catch (error) {
        // 如果状态转换失败，继续尝试发布
        if (!error.message.includes('Cannot transition')) {
          throw error
        }
      }

      // 4. 生成平台产物
      console.log(`\n📝 4/5 生成平台产物...`)
      const result = await this.publishPipeline.publish(postId, {
        skipSync: false,
        skipPageGen: false,
        openBrowser: false
      })

      if (!result.success) {
        throw new Error(result.message || '发布失败')
      }

      // 5. 移动到 done 目录
      console.log(`\n📦 5/5 移动到 done 目录...`)
      const donePath = await this.fileMover.moveToDone(postId, {
        updateReferences: true,
        moveAssets: true,
        createBackup: false
      })

      // 6. 标记为完成
      console.log(`\n✅ 6/6 更新状态...`)
      await this.statusManager.markAsDone(postId, donePath)
      console.log(`   ✅ 状态已更新: done`)

      console.log(`\n✅ 处理完成: ${postId}\n`)

    } catch (error) {
      console.error(`\n❌ 处理失败: ${postId}`, error)

      // 回滚状态
      try {
        await this.statusManager.updateStatus(
          postId,
          WorkflowStatusEnum.PENDING as any
        )
        console.log(`   ⚠️  状态已回滚: pending`)
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
    const { createInterface } = await import('readline')
    const { readFileSync } = await import('fs')
    const { join } = await import('path')

    // 读取文章内容
    const postPath = join(process.cwd(), 'content/posts', `${postId}.md`)
    const postContent = readFileSync(postPath, 'utf-8')

    // 提取标题和内容
    const titleMatch = postContent.match(/^title:\s*(.+)$/m)
    const title = titleMatch ? titleMatch[1] : postId
    const content = postContent.replace(/^---\n[\s\S]*?\n---\n/, '')

    // 生成预览页面（不调用FullPublishPipeline，避免状态转换）
    const { generatePublishPage } = await import('../publish/page-generator.js')

    const platforms = [
      {
        platform: 'juejin',
        name: '掘金',
        content: content
      },
      {
        platform: 'wechat',
        name: '微信公众号',
        content: content
      },
      {
        platform: 'html',
        name: 'HTML',
        content: content
      }
    ]

    const pagePath = await generatePublishPage(postId, title, content, platforms, {
      openBrowser: true
    })

    console.log(`   ✅ 预览页面已生成`)
    console.log(`   路径: ${pagePath}`)

    // 等待用户确认
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    })

    return new Promise((resolve, reject) => {
      rl.question(`\n   确认继续发布？[y/N]: `, (answer) => {
        rl.close()

        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          console.log(`   ✅ 用户确认继续`)
          resolve()
        } else {
          console.log(`   ❌ 用户取消发布`)
          reject(new Error('用户取消发布'))
        }
      })
    })
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
      // 1. 移回 posts 目录
      await this.fileMover.rollbackToPosts(postId)

      // 2. 更新状态
      await this.statusManager.updateStatus(
        postId,
        WorkflowStatusEnum.PENDING as any
      )

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
