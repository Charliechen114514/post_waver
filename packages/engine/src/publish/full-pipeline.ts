import { StatusTransitionService } from '@content-hub/database/dist/services/status-transition.js'
import { ConfigManager } from '@content-hub/config/dist/config-manager.js'
import { generatePublishPage } from './page-generator.js'
import { readFileSync } from 'fs'
import { join } from 'path'
import open from 'open'

export interface FullPublishOptions {
  skipSync?: boolean
  skipPageGen?: boolean
  openBrowser?: boolean
}

export class FullPublishPipeline {
  private config: ConfigManager

  constructor() {
    this.config = new ConfigManager()
  }

  /**
   * 完整发布流程
   */
  async publish(postId: string, options: FullPublishOptions = {}) {
    const {
      skipSync = false,
      skipPageGen = false,
      openBrowser = true
    } = options

    console.log(`\n🚀 开始发布流程: ${postId}`)

    try {
      // 1. 解析文章
      console.log(`\n📖 1/5 解析文章...`)
      const postPath = join(process.cwd(), 'content/posts', `${postId}.md`)
      let postContent: string

      try {
        postContent = readFileSync(postPath, 'utf-8')
      } catch (error) {
        throw new Error(`无法读取文章: ${postPath}`)
      }

      // 提取标题
      const titleMatch = postContent.match(/^title:\s*(.+)$/m)
      const title = titleMatch ? titleMatch[1] : postId
      const content = postContent.replace(/^---\n[\s\S]*?\n---\n/, '')

      console.log(`   ✅ 文章解析成功: ${title}`)

      // 2. 更新状态
      console.log(`\n📊 2/5 更新状态...`)
      await StatusTransitionService.transition(postId, 'publishing')
      console.log(`   ✅ 状态已更新: publishing`)

      // 3. 同步到 Hexo（如果启用）
      const autoSync = this.config.get('autoSync')
      if (!skipSync && autoSync.enabled) {
        console.log(`\n🔄 3/5 同步到 Hexo 博客...`)
        // TODO: 调用 Hexo 同步逻辑
        console.log(`   ⚠️  Hexo 同步功能待实现`)
        console.log(`   ⏭️  跳过同步`)
      } else {
        console.log(`\n⏭️  3/5 跳过同步（未启用或手动跳过）`)
      }

      // 4. 生成发布页面
      if (!skipPageGen) {
        console.log(`\n📄 4/5 生成发布页面...`)

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
          openBrowser: false
        })

        console.log(`   ✅ 发布页面已生成`)
        console.log(`   路径: ${pagePath}`)

        if (openBrowser) {
          await open(pagePath)
        }
      } else {
        console.log(`\n⏭️  4/5 跳过页面生成`)
      }

      // 5. 更新状态为已发布
      console.log(`\n✅ 5/5 更新状态...`)
      await StatusTransitionService.transition(postId, 'published')
      console.log(`   ✅ 状态已更新: published`)

      console.log(`\n🎉 发布完成!\n`)

      return {
        success: true,
        message: '发布成功',
        title
      }

    } catch (error) {
      console.error(`\n❌ 发布失败: ${error}`)

      // 回滚状态
      try {
        await StatusTransitionService.transition(postId, 'previewing')
        console.log(`   ⚠️  状态已回滚: previewing`)
      } catch (rollbackError) {
        console.error(`   ❌ 状态回滚失败: ${rollbackError}`)
      }

      return {
        success: false,
        message: `发布失败: ${error}`,
        error
      }
    }
  }
}
