import { StatusTransitionService } from '@content-hub/database'
import { ConfigManager, HexoConfigManager } from '@content-hub/config'
import { HexoSyncEngine } from '../hexo/sync-engine.js'
import { generatePublishPage } from './page-generator.js'
import { PromptManager, FullPublishResult, PublishStep } from '../ui/prompt-manager.js'
import { FileMover } from '../workflow/file-mover.js'
import { ImageUploadManager } from '../image/upload-manager.js'
import { replaceImageUrls } from '../image/image-url-replacer.js'
import { transformForJuejin, transformForWechat, markdownToHTML } from '@content-hub/transformer'
import { readFileSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'
import open from 'open'

export interface FullPublishOptions {
  skipSync?: boolean
  skipPageGen?: boolean
  skipHexo?: boolean
  openBrowser?: boolean
  mode?: 'interactive' | 'fast' | 'preview-only'
  injectionTemplateId?: string
  includeRelatedLinks?: boolean
}

export class FullPublishPipeline {
  private config: ConfigManager
  private hexoConfig: HexoConfigManager
  private hexoEngine: HexoSyncEngine | null
  private prompts: PromptManager
  private fileMover: FileMover
  private imageManager: ImageUploadManager
  private steps: PublishStep[]
  private cachedPostContent: { title: string; content: string } | null = null
  private originalContent: string | null = null  // 存储原始内容（用于掘金/HTML）
  private wechatReplacedContent: string | null = null  // 存储微信替换后的内容

  constructor() {
    this.config = new ConfigManager()
    this.hexoConfig = new HexoConfigManager()
    this.hexoEngine = null
    this.prompts = new PromptManager()
    this.fileMover = new FileMover()
    this.imageManager = new ImageUploadManager()

    // 初始化步骤
    this.steps = [
      { name: '解析文章', status: 'pending' },
      { name: '更新状态', status: 'pending' },
      { name: '更新索引', status: 'pending' },
      { name: 'Hexo 同步', status: 'pending' },
      { name: '移动到 done', status: 'pending' },
      { name: '处理图片', status: 'pending' },
      { name: '生成发布页面', status: 'pending' },
      { name: '打开浏览器', status: 'pending' }
    ]
  }

  /**
   * 完整发布流程
   */
  async publish(postId: string, options: FullPublishOptions = {}): Promise<FullPublishResult> {
    const {
      skipSync = false,
      skipPageGen = false,
      skipHexo = false,
      openBrowser = true,
      mode = 'fast'
    } = options

    // 重置步骤状态
    this.steps.forEach(step => { step.status = 'pending' })

    const result: FullPublishResult = {
      success: false,
      postId,
      title: '',
      steps: this.steps,
      outputs: {
        platforms: []
      }
    }

    try {
      // Step 1: 解析文章
      await this.runStep(result, 0, async () => {
        // 支持两种文章路径格式：
        // 1. content/posts/{postId}.md
        // 2. content/posts/{postId}/index.md
        const postPath1 = join(process.cwd(), 'content/posts', `${postId}.md`)
        const postPath2 = join(process.cwd(), 'content/posts', postId, 'index.md')
        let postContent: string

        try {
          postContent = readFileSync(postPath1, 'utf-8')
        } catch (error1) {
          try {
            postContent = readFileSync(postPath2, 'utf-8')
          } catch (error2) {
            throw new Error(`无法读取文章，尝试了以下路径:\n  1. ${postPath1}\n  2. ${postPath2}`)
          }
        }

        // 提取标题
        const titleMatch = postContent.match(/^title:\s*(.+)$/m)
        const title = titleMatch ? titleMatch[1] : postId
        const content = postContent.replace(/^---\n[\s\S]*?\n---\n/, '')

        result.title = title

        // 缓存文章内容，供后续步骤使用
        this.cachedPostContent = { title, content }

        return { title, content }
      })

      // Step 2: 更新状态
      await this.runStep(result, 1, async () => {
        if (mode === 'preview-only') {
          console.log('  ⏭️  预览模式，跳过状态更新')
          return null
        }

        await StatusTransitionService.transition(postId, 'publishing')
        return true
      })

      // Step 3: Hexo 同步
      await this.runStep(result, 2, async () => {
        if (skipHexo || mode === 'preview-only' || !(await this.hexoConfig.get('enabled'))) {
          if (mode !== 'fast') {
            console.log('  ⏭️  跳过 Hexo 同步')
          }
          return null
        }

        // 初始化 Hexo 引擎
        if (!this.hexoEngine) {
          this.hexoEngine = new HexoSyncEngine(await this.hexoConfig.getAll())
        }

        const syncResult = await this.hexoEngine.syncPost(postId)

        if (syncResult.success) {
          if (mode !== 'fast') {
            console.log(`  📁 文件: ${syncResult.hexoPostPath}`)
            console.log(`  📦 资源: ${syncResult.assetsCopied} 个`)
          }

          if (syncResult.blogUrl) {
            result.outputs.hexoUrl = syncResult.blogUrl
            if (mode !== 'fast') {
              console.log(`  🔗 博客: ${syncResult.blogUrl}`)
            }
          }
        } else {
          throw new Error(syncResult.error || 'Hexo 同步失败')
        }

        return syncResult
      })

      // Step 4: 移动到 done
      await this.runStep(result, 3, async () => {
        if (mode === 'preview-only') {
          console.log('  ⏭️  预览模式，跳过文件移动')
          return null
        }

        // 使用 FileMover 移动文件到 done 目录
        const donePath = await this.fileMover.moveToDone(postId, {
          updateReferences: true,
          moveAssets: true,
          createBackup: false
        })

        if (mode !== 'fast') {
          console.log(`  📁 已移动到: ${donePath}`)
        }

        return donePath
      })

      // Step 4.5: 处理图片上传和链接替换
      let imageResults: any = {}
      await this.runStep(result, 4, async () => {
        // preview-only 模式：不上传图片
        if (mode === 'preview-only' || skipPageGen) {
          console.log('  ⏭️  跳过图片处理')
          return null
        }

        const { content, postDir } = await this.parsePost(postId)

        // 保存原始内容（用于掘金/HTML平台）
        this.originalContent = content

        // 准备输出目录
        const outputDir = join(process.cwd(), 'output', 'temp')

        // 处理所有平台的图片
        const platforms = ['juejin', 'csdn', 'zhihu', 'wechat', 'html']
        const results = await this.imageManager.processMultiPlatformImages(
          postId,
          content,
          platforms,
          {
            outputDir,
            postDir, // 传入文章所在目录
            fallbackToList: true
          }
        )

        // 整理结果
        for (const r of results) {
          imageResults[r.platform] = r
        }

        if (mode !== 'fast') {
          console.log(`  📷 图片处理完成`)
          for (const r of results) {
            if (r.listFile) {
              console.log(`     ${r.platform}: 列表已生成`)
            } else if (r.success > 0) {
              console.log(`     ${r.platform}: ${r.success}个已上传`)
            }
          }
        }

        // 替换微信图片链接（不写回文件，只在内存中保存）
        if (results.length > 0) {
          const wechatResult = results.find(r => r.platform === 'wechat')
          if (wechatResult && wechatResult.uploaded && wechatResult.uploaded.length > 0) {
            const uploadedImages = wechatResult.uploaded.filter(img => img.success && img.url)
            if (uploadedImages.length > 0) {
              console.log(`  🔄 替换微信图片链接 (${uploadedImages.length}张)`)
              const replacedContent = replaceImageUrls(content, wechatResult.uploaded)
              // 保存到内存，供生成发布页面时使用
              this.wechatReplacedContent = replacedContent
              console.log(`     ✅ 微信链接替换完成（内存中）`)
            }
          }
        }

        return results
      })

      // Step 5: 生成发布页面
      let publishPagePath: string | undefined
      await this.runStep(result, 5, async () => {
        if (skipPageGen) {
          if (mode !== 'fast') {
            console.log('  ⏭️  跳过页面生成')
          }
          return null
        }

        // 为不同平台使用不同的内容：
        // - 微信：使用替换后的内容（微信CDN）
        // - 掘金/HTML：使用原始内容（保持本地路径）
        let originalContent = this.originalContent || (await this.parsePost(postId)).content
        let wechatContent = this.wechatReplacedContent || originalContent

        // 🔍 调试：打印收到的选项
        console.log(`\n🔍 [DEBUG FullPipeline] Step 5 生成发布页面`)
        console.log(`  postId: ${postId}`)
        console.log(`  injectionTemplateId: ${options.injectionTemplateId || '(未指定)'}`)
        console.log(`  includeRelatedLinks: ${options.includeRelatedLinks}`)
        console.log(`  原始内容长度: ${originalContent.length} 字符`)

        // 应用注入模板（如果指定）
        if (options.injectionTemplateId) {
          console.log(`\n💉 [DEBUG] 开始应用注入模板...`)
          try {
            const { prisma } = await import('@content-hub/database')
            const template = await prisma.injectionTemplate.findUnique({
              where: { id: options.injectionTemplateId }
            })

            console.log(`  查询模板结果:`, template ? `找到模板 "${template.name}"` : '未找到模板')

            if (template && template.enabled && template.content) {
              console.log(`  模板内容: "${template.content}"`)
              const { injectTitlePostContent, formatInjectionForPlatform } = await import('@content-hub/core')

              // 为不同平台应用注入
              const juejinInjected = injectTitlePostContent(originalContent, {
                platform: 'juejin',
                customContent: formatInjectionForPlatform(template.content, 'juejin'),
                enabled: true
              })
              const wechatInjected = injectTitlePostContent(wechatContent, {
                platform: 'wechat',
                customContent: formatInjectionForPlatform(template.content, 'wechat'),
                enabled: true
              })
              const htmlInjected = injectTitlePostContent(originalContent, {
                platform: 'html',
                customContent: formatInjectionForPlatform(template.content, 'html'),
                enabled: true
              })

              // 更新内容为注入后的版本
              originalContent = juejinInjected
              wechatContent = wechatInjected  // 🔧 修复：更新微信内容

              console.log(`  ✅ 掘金注入后内容长度: ${juejinInjected.length} 字符`)
              console.log(`  ✅ 微信注入后内容长度: ${wechatInjected.length} 字符`)
              console.log(`  ✅ 已应用注入模板: ${template.name}`)
            } else {
              console.log(`  ⚠️ 模板未启用或内容为空`)
            }
          } catch (error) {
            console.warn('  ❌ 应用注入模板失败:', error)
          }
        } else {
          console.log(`  ⏭️ 跳过注入模板（未指定模板ID）`)
        }

        // 应用相关链接（如果启用）
        if (options.includeRelatedLinks !== false) {
          console.log(`\n🔗 [DEBUG] 开始应用相关链接...`)
          try {
            const { injectRelatedLinks, injectRelatedLinksWithPlatform } = await import('@content-hub/core')
            const { RelatedPostsService } = await import('@content-hub/database')

            // 从 Post 表获取当前文章
            const currentPost = await RelatedPostsService.getPublishedPost(postId)

            if (currentPost) {
              // 计算相关推荐
              const relatedPosts = await RelatedPostsService.findRelatedPosts(postId, 3)

              // 构建当前文章的完整信息
              const currentPostWithRelated = {
                ...currentPost,
                related: relatedPosts
              }

              // 获取所有已发布文章的Map（用于查找）
              const postsMap = await RelatedPostsService.getPublishedPostsMap()

              console.log(`  当前文章信息:`, {
                title: currentPostWithRelated.title,
                relatedCount: currentPostWithRelated.related?.length || 0
              })

              // 注入相关链接
              const beforeLength = originalContent.length
              const beforeWechatLength = wechatContent.length

              // 为掘金平台注入相关链接（使用掘金真实URL）
              console.log(`\n  🔗 [掘金平台] 开始应用平台真实 URL...`)
              try {
                originalContent = await injectRelatedLinksWithPlatform(
                  originalContent,
                  currentPostWithRelated,
                  postsMap,
                  'juejin'
                )
                console.log(`    ✅ 掘金平台相关链接已应用（使用平台真实 URL）`)
              } catch (error) {
                console.warn(`    ⚠️ 掘金平台 URL 查询失败，使用降级方案（Hexo 格式）:`, error)
                // 降级：使用原始链接格式
                originalContent = injectRelatedLinks(originalContent, currentPostWithRelated, postsMap)
              }

              // 为微信平台注入相关链接（使用微信真实URL）
              console.log(`\n  🔗 [微信平台] 开始应用平台真实 URL...`)
              try {
                wechatContent = await injectRelatedLinksWithPlatform(
                  wechatContent,
                  currentPostWithRelated,
                  postsMap,
                  'wechat'
                )
                console.log(`    ✅ 微信平台相关链接已应用（使用平台真实 URL）`)
              } catch (error) {
                console.warn(`    ⚠️ 微信平台 URL 查询失败，使用降级方案（Hexo 格式）:`, error)
                // 降级：使用原始链接格式
                wechatContent = injectRelatedLinks(wechatContent, currentPostWithRelated, postsMap)
              }

              const afterLength = originalContent.length
              const afterWechatLength = wechatContent.length

              console.log(`\n  ✅ 相关链接处理完成`)
              console.log(`  掘金: ${beforeLength} → ${afterLength} (+${afterLength - beforeLength})`)
              console.log(`  微信: ${beforeWechatLength} → ${afterWechatLength} (+${afterWechatLength - beforeWechatLength})`)
            } else {
              console.log(`  ⚠️ 文章没有索引，跳过相关链接`)
            }
          } catch (error) {
            console.warn('  ❌ 应用相关链接失败:', error)
          }
        } else {
          console.log(`  ⏭️ 跳过相关链接（已禁用）`)
        }

        console.log('  🔄 转换平台产物...')
        console.log(`     - 微信: 使用微信CDN链接`)
        console.log(`     - 掘金: 使用原始图片路径`)
        console.log(`     - HTML: 使用原始图片路径`)

        // 🔍 调试：打印即将转换的内容
        console.log(`\n🔍 [DEBUG] 准备生成平台产物`)
        console.log(`  originalContent 前100字符:`, originalContent.substring(0, 100))
        console.log(`  wechatContent 前100字符:`, wechatContent.substring(0, 100))

        const platforms = [
          {
            platform: 'juejin',
            name: '掘金',
            content: await transformForJuejin(originalContent)  // 使用处理后的内容
          },
          {
            platform: 'wechat',
            name: '微信公众号',
            content: await transformForWechat(wechatContent)  // 使用替换后的内容
          },
          {
            platform: 'html',
            name: 'HTML',
            content: await markdownToHTML(originalContent)  // 使用处理后的内容
          }
        ]

        // 🔍 调试：打印转换后的内容
        console.log(`\n🔍 [DEBUG] 平台产物生成完成`)
        console.log(`  掘金产物 前150字符:`, platforms[0].content.substring(0, 150))
        console.log(`  微信产物 前150字符:`, platforms[1].content.substring(0, 150))

        result.outputs.platforms = platforms

        const pagePath = await generatePublishPage(postId, result.title, originalContent, platforms, {
          openBrowser: false
        })

        publishPagePath = pagePath
        result.outputs.publishPage = pagePath

        return pagePath
      })

      // Step 6: 打开浏览器
      await this.runStep(result, 6, async () => {
        if (!openBrowser || !publishPagePath) {
          if (mode !== 'fast') {
            console.log('  ⏭️  跳过打开浏览器')
          }
          return null
        }

        await open(publishPagePath)
        return true
      })

      // Step 7: 更新状态为已发布
      if (mode === 'preview-only') {
        console.log('  ⏭️  预览模式，跳过状态更新')
      } else {
        await StatusTransitionService.transition(postId, 'published')
      }

      result.success = true

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      // 回滚状态
      try {
        await StatusTransitionService.transition(postId, 'previewing')
      } catch (rollbackError) {
        // 忽略回滚错误
      }

      throw new Error(errorMessage)
    }

    return result
  }

  /**
   * 执行单个步骤
   */
  private async runStep(
    result: FullPublishResult,
    stepIndex: number,
    fn: () => Promise<any>
  ): Promise<any> {
    const step = result.steps[stepIndex]

    if (step.status === 'failed') {
      return null  // 前置步骤失败，跳过
    }

    step.status = 'running'
    const startTime = Date.now()

    this.prompts.showStepProgress(stepIndex + 1, result.steps.length, step.name, 'running')

    try {
      const output = await fn()
      step.status = 'success'
      step.duration = Date.now() - startTime
      this.prompts.showStepProgress(stepIndex + 1, result.steps.length, step.name, 'success', step.duration)
      return output

    } catch (error) {
      step.status = 'failed'
      step.error = error instanceof Error ? error.message : String(error)
      step.duration = Date.now() - startTime
      this.prompts.showStepProgress(stepIndex + 1, result.steps.length, step.name, 'failed', step.duration)
      throw error
    }
  }

  /**
   * 解析文章（优先使用缓存）
   */
  private async parsePost(postId: string): Promise<{ title: string; content: string; postDir: string }> {
    // 优先使用缓存的内容
    if (this.cachedPostContent) {
      // 如果使用缓存，需要检测文章实际位置
      const postDir = await this.detectPostDir(postId)
      return { ...this.cachedPostContent, postDir }
    }

    // 缓存不存在，从文件读取
    // 先检测文章在哪个目录（posts 或 done）
    const postDir = await this.detectPostDir(postId)
    const postPath = join(postDir, `${postId}.md`)

    const postContent = readFileSync(postPath, 'utf-8')

    // 提取标题
    const titleMatch = postContent.match(/^title:\s*(.+)$/m)
    const title = titleMatch ? titleMatch[1] : postId
    const content = postContent.replace(/^---\n[\s\S]*?\n---\n/, '')

    return { title, content, postDir }
  }

  /**
   * 检测文章实际所在的目录
   */
  private async detectPostDir(postId: string): Promise<string> {
    const postsDir = join(process.cwd(), 'content/posts')
    const doneDir = join(process.cwd(), 'content/done')

    // 检查哪个目录包含该文章
    const postsPath = join(postsDir, `${postId}.md`)
    const donePath = join(doneDir, `${postId}.md`)

    if (existsSync(donePath)) {
      return doneDir
    } else if (existsSync(postsPath)) {
      return postsDir
    }

    // 默认返回 posts 目录
    return postsDir
  }
}
