import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { parsePost } from '@content-hub/core'
import { transformForJuejin, transformForWechat, markdownToHTML } from '@content-hub/transformer'
import {
  loadPlatformIds,
  savePlatformIds,
  getAllPlatformIds
} from '@content-hub/core'

/**
 * API Server 接口
 */
export interface APIServer {
  port: number
  stop: () => Promise<void>
}

/**
 * 创建 API 服务器
 */
export async function createAPIServer(options: {
  contentDir?: string
  port?: number
}): Promise<APIServer> {
  const { port = 3001 } = options

  const app = new Hono()

  // 启用 CORS
  app.use('*', cors())

  // 健康检查
  app.get('/api/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // 获取文章列表
  app.get('/api/posts', async (c) => {
    try {
      const { PostDAL } = await import('@content-hub/database')
      const dal = new PostDAL()

      console.log('🔍 正在查询文章列表...')
      const posts = await dal.findAll()
      console.log(`✅ 找到 ${posts.length} 篇文章`)

      // 转换为前端需要的格式
      const formattedPosts = posts.map(post => ({
        id: post.postId,
        title: post.title || post.postId,
        date: post.createdAt?.toISOString() || new Date().toISOString(),
        tags: [], // 数据库暂无 tags 字段，先返回空数组
        draft: post.status !== 'published',
        filepath: post.currentPath || post.originalPath || '',
        status: post.status,
        workflowStatus: post.workflowStatus
      }))

      console.log(`📤 返回 ${formattedPosts.length} 篇文章给前端`)

      return c.json({
        posts: formattedPosts,
        metadata: {
          totalPosts: posts.length,
          draftCount: posts.filter(p => p.status !== 'published').length
        }
      })
    } catch (error) {
      console.error('❌ 获取文章列表失败:', error)
      return c.json({ error: '获取文章列表失败', details: error instanceof Error ? error.message : String(error) }, 500)
    }
  })

  // 获取单个文章详情
  app.get('/api/posts/:id', async (c) => {
    try {
      const { id } = c.req.param()

      const { PostDAL } = await import('@content-hub/database')
      const dal = new PostDAL()

      const post = await dal.findByPostId(id)

      if (!post) {
        return c.json({ error: '文章不存在' }, 404)
      }

      // 从文件系统读取文章内容
      const fs = await import('fs/promises')
      const path = await import('path')

      // 确定文件路径
      let filepath = post.currentPath || post.originalPath
      if (!filepath) {
        // 尝试从 posts 目录查找
        const testPath = path.join(process.cwd(), 'content/posts', `${id}.md`)
        try {
          await fs.access(testPath)
          filepath = testPath
        } catch {
          return c.json({ error: '文章文件不存在' }, 404)
        }
      }

      // 解析文章内容
      const parsed = await parsePost(filepath)

      return c.json({
        id: post.postId,
        title: post.title,
        date: post.createdAt?.toISOString() || new Date().toISOString(),
        tags: [],
        draft: post.status !== 'published',
        filepath,
        status: post.status,
        workflowStatus: post.workflowStatus,
        content: parsed.content,
        frontmatter: parsed.frontmatter
      })
    } catch (error) {
      console.error('获取文章详情失败:', error)
      return c.json({ error: '获取文章详情失败' }, 500)
    }
  })

  // 预览转换后的内容
  app.post('/api/posts/:id/preview', async (c) => {
    try {
      const { id } = c.req.param()
      const { platform, theme } = await c.req.json()

      if (!['juejin', 'wechat', 'html'].includes(platform)) {
        return c.json({ error: '不支持的平台' }, 400)
      }

      const { PostDAL } = await import('@content-hub/database')
      const dal = new PostDAL()

      const post = await dal.findByPostId(id)

      if (!post) {
        return c.json({ error: '文章不存在' }, 404)
      }

      // 从文件系统读取文章内容
      const fs = await import('fs/promises')
      const path = await import('path')

      let filepath = post.currentPath || post.originalPath
      if (!filepath) {
        const testPath = path.join(process.cwd(), 'content/posts', `${id}.md`)
        try {
          await fs.access(testPath)
          filepath = testPath
        } catch {
          return c.json({ error: '文章文件不存在' }, 404)
        }
      }

      const parsed = await parsePost(filepath)

      // 对于微信平台，尝试从job中获取替换后的内容
      let useContent = parsed.content
      if (platform === 'wechat') {
        try {
          const { jobManager } = await import('./workflow/job-manager.js')
          const latestJob = jobManager.getLatestJobByPostId(id)
          if (latestJob && latestJob.status === 'completed' && latestJob.outputs?.wechatReplacedContent) {
            console.log(`✅ 使用job中的微信替换内容: ${id}`)
            useContent = latestJob.outputs.wechatReplacedContent
          }
        } catch (error) {
          console.warn('获取job内容失败，使用文件内容:', error)
        }
      }

      let transformedContent: string
      let htmlContent: string | null = null

      switch (platform) {
        case 'juejin':
          // 用于复制的内容：移除本地图片
          transformedContent = await transformForJuejin(useContent, { removeLocalImages: true })
          // 用于预览的内容：保留本地图片显示
          htmlContent = await markdownToHTML(useContent, { removeLocalImages: false })
          break
        case 'wechat':
          // 用于复制的内容：移除本地图片
          transformedContent = await transformForWechat(useContent, { removeLocalImages: true })
          // 用于预览的内容：保留本地图片显示
          const baseHTML = await markdownToHTML(useContent, { removeLocalImages: false })
          let themeCSS = ''

          // 如果指定了主题，加载主题 CSS
          if (theme) {
            try {
              const { ThemeManager } = await import('./preview/theme-manager.js')
              const themeManager = new ThemeManager()
              themeCSS = await themeManager.getThemeCSS('wechat', theme)
            } catch (error) {
              console.warn('加载主题 CSS 失败，使用默认样式:', error)
            }
          }

          // 将 CSS 和 HTML 组合
          htmlContent = `
            <style>
              ${themeCSS}
            </style>
            ${baseHTML}
          `
          break
        case 'html':
          // 用于复制和预览的内容
          transformedContent = await markdownToHTML(useContent, { removeLocalImages: true })
          // 用于预览的内容：保留本地图片显示
          htmlContent = await markdownToHTML(useContent, { removeLocalImages: false })
          break
        default:
          transformedContent = useContent
      }

      return c.json({
        success: true,
        content: transformedContent,
        html: htmlContent,
        title: post.title
      })
    } catch (error) {
      console.error('预览失败:', error)
      return c.json({ error: '预览失败' }, 500)
    }
  })

  // 获取文章的平台ID信息
  app.get('/api/platform-ids/:postId', async (c) => {
    try {
      const { postId } = c.req.param()
      const platformIds = getAllPlatformIds(postId)
      return c.json(platformIds)
    } catch (error) {
      console.error('获取平台ID失败:', error)
      return c.json({ error: '获取平台ID失败' }, 500)
    }
  })

  // 提供 KaTeX 基础样式文件
  app.get('/katex-base.css', async (c) => {
    try {
      const { readFile } = await import('fs/promises')
      const { join } = await import('path')

      const cssPath = join('packages/engine/src/preview/styles/katex-base.css')
      const css = await readFile(cssPath, 'utf-8')

      c.header('Content-Type', 'text/css')
      return c.body(css)
    } catch (error) {
      console.error('读取 katex-base.css 失败:', error)
      return c.text('/* KaTeX base CSS not found */', 404)
    }
  })

  // 静态文件服务 - 提供图片等资源文件
  app.get('/assets/*', async (c) => {
    try {
      const { readFile } = await import('fs/promises')
      const { join } = await import('path')

      const reqPath = c.req.path
      // 提取 /assets/ 后面的相对路径
      let relativePath = reqPath.replace(/^\/assets\//, '')

      // 处理空路径
      if (!relativePath || relativePath === '') {
        console.error('❌ /assets/ 路径为空:', { url: c.req.url, path: reqPath })
        return c.text('无效的资源路径：路径为空', 400)
      }

      // 尝试多个可能的目录位置
      const baseDir = process.cwd()
      const possiblePaths = [
        join(baseDir, 'content/posts/assets', relativePath),  // posts 目录
        join(baseDir, 'content/done/assets', relativePath),    // done 目录
        join(baseDir, 'content/assets/images', relativePath),  // assets/images 目录
        join(baseDir, 'content/assets', relativePath)          // assets 目录
      ]

      let fileContent: Buffer | null = null

      // 依次尝试每个路径
      for (const fullPath of possiblePaths) {
        try {
          fileContent = await readFile(fullPath)
          break
        } catch (err) {
          // 继续尝试下一个路径
          continue
        }
      }

      if (!fileContent) {
        console.error('❌ 静态文件未找到，已尝试以下路径:', possiblePaths)
        return c.text('文件不存在', 404)
      }

      // 根据文件扩展名设置 Content-Type
      const ext = relativePath.split('.').pop()?.toLowerCase()
      const contentTypes: Record<string, string> = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'webp': 'image/webp',
        'ico': 'image/x-icon'
      }

      const contentType = contentTypes[ext || ''] || 'application/octet-stream'

      // 将 Buffer 转换为 Uint8Array 以兼容 Hono 的类型系统
      return c.body(new Uint8Array(fileContent), 200, {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      })
    } catch (error) {
      console.error('❌ 读取静态文件失败:', error)
      return c.text('文件不存在', 404)
    }
  })

  // 获取平台的可用主题列表
  app.get('/api/themes/:platform', async (c) => {
    try {
      const { platform } = c.req.param()
      const { ThemeManager } = await import('./preview/theme-manager.js')
      const { themeConfigManager } = await import('@content-hub/config')

      const themeManager = new ThemeManager()

      // 获取所有可用主题
      const themes = await themeManager.getPlatformThemes(platform)

      // 获取当前设置的默认主题
      const defaultTheme = await themeConfigManager.getPlatformDefaultTheme(platform)

      return c.json({
        success: true,
        themes,
        defaultTheme
      })
    } catch (error) {
      console.error('获取主题列表失败:', error)
      return c.json({ error: '获取主题列表失败', details: error instanceof Error ? error.message : String(error) }, 500)
    }
  })

  // 设置平台的默认主题
  app.post('/api/themes/:platform/:themeName', async (c) => {
    try {
      const { platform, themeName } = c.req.param()
      const { themeConfigManager } = await import('@content-hub/config')

      await themeConfigManager.setPlatformDefaultTheme(platform, themeName)

      return c.json({
        success: true,
        message: `已将 ${themeName} 设置为 ${platform} 的默认主题`
      })
    } catch (error) {
      console.error('设置主题失败:', error)
      return c.json({ error: '设置主题失败', details: error instanceof Error ? error.message : String(error) }, 500)
    }
  })

  // 重置平台的默认主题
  app.delete('/api/themes/:platform', async (c) => {
    try {
      const { platform } = c.req.param()
      const { themeConfigManager } = await import('@content-hub/config')

      await themeConfigManager.resetPlatformDefault(platform)

      return c.json({
        success: true,
        message: `已重置 ${platform} 的默认主题`
      })
    } catch (error) {
      console.error('重置主题失败:', error)
      return c.json({ error: '重置主题失败', details: error instanceof Error ? error.message : String(error) }, 500)
    }
  })

  // 更新文章的平台ID
  app.post('/api/platform-ids/:postId', async (c) => {
    try {
      const { postId } = c.req.param()
      const { platform, postId: platformPostId, url } = await c.req.json()

      if (!platform || !platformPostId) {
        return c.json({ error: '缺少必要参数' }, 400)
      }

      const platformIds = loadPlatformIds()

      // 初始化文章映射
      if (!platformIds.mappings[postId]) {
        platformIds.mappings[postId] = {}
      }

      // 更新平台ID
      platformIds.mappings[postId][platform] = {
        postId: platformPostId,
        url,
        publishedAt: new Date().toISOString()
      }

      savePlatformIds(platformIds)

      return c.json({
        success: true,
        message: '平台ID更新成功'
      })
    } catch (error) {
      console.error('更新平台ID失败:', error)
      return c.json({ error: '更新平台ID失败' }, 500)
    }
  })

  // 删除文章的平台ID
  app.delete('/api/platform-ids/:postId/:platform', async (c) => {
    try {
      const { postId, platform } = c.req.param()

      const platformIds = loadPlatformIds()

      if (platformIds.mappings[postId]?.[platform]) {
        delete platformIds.mappings[postId][platform]
        savePlatformIds(platformIds)

        return c.json({
          success: true,
          message: '平台ID删除成功'
        })
      } else {
        return c.json({ error: '平台ID不存在' }, 404)
      }
    } catch (error) {
      console.error('删除平台ID失败:', error)
      return c.json({ error: '删除平台ID失败' }, 500)
    }
  })

  // ========== Workflow 相关 API ==========

  // 扫描 content/posts/ 目录
  app.post('/api/workflow/scan', async (c) => {
    try {
      const { WorkflowOrchestrator } = await import('./workflow/orchestrator.js')
      const orchestrator = new WorkflowOrchestrator()

      await orchestrator.scanAndInitialize()

      // 获取所有文章
      const { PostDAL } = await import('@content-hub/database')
      const dal = new PostDAL()
      const posts = await dal.findAll()

      // 过滤出在 content/posts/ 目录下实际存在的文章
      const { existsSync } = await import('fs')
      const { join } = await import('path')

      const postsInWorkspace = posts.filter(post => {
        // 检查文件是否在 content/posts/ 目录下存在
        const postsPath = join(process.cwd(), 'content/posts', `${post.postId}.md`)
        return existsSync(postsPath)
      })

      return c.json({
        success: true,
        message: '扫描完成',
        posts: postsInWorkspace.map(post => ({
          id: post.postId,
          title: post.title || post.postId,
          date: post.createdAt?.toISOString() || new Date().toISOString(),
          status: post.status,
          workflowStatus: post.workflowStatus
        })),
        total: postsInWorkspace.length
      })
    } catch (error) {
      console.error('扫描失败:', error)
      return c.json({ error: '扫描失败', details: error instanceof Error ? error.message : String(error) }, 500)
    }
  })

  // 批量发布（非阻塞）
  app.post('/api/workflow/batch-publish', async (c) => {
    try {
      const { postIds, skipPreview = true } = await c.req.json()

      if (!Array.isArray(postIds) || postIds.length === 0) {
        return c.json({ error: '请选择要发布的文章' }, 400)
      }

      const { jobManager } = await import('./workflow/job-manager.js')
      const { WorkflowOrchestrator } = await import('./workflow/orchestrator.js')
      const orchestrator = new WorkflowOrchestrator()

      // 生成批量任务 ID
      const batchId = `batch-${Date.now()}`

      // 为每篇文章创建任务
      const jobs = postIds.map((postId: string) => {
        const job = jobManager.createJob(postId, batchId)
        return { postId, jobId: job.jobId }
      })

      // 后台执行任务
      setImmediate(async () => {
        for (const { postId, jobId } of jobs) {
          try {
            jobManager.updateJob(jobId, { status: 'running', stepName: '开始处理' })

            const result = await orchestrator.processPost(postId, {
              fast: skipPreview,
              onProgress: (step, total, stepName) => {
                jobManager.updateJob(jobId, {
                  currentStep: step,
                  totalSteps: total,
                  stepName,
                  progress: Math.round((step / total) * 100)
                })
              }
            })

            jobManager.updateJob(jobId, {
              status: 'completed',
              stepName: '完成',
              progress: 100,
              outputs: {
                wechatReplacedContent: result.wechatReplacedContent
              }
            })
          } catch (error: any) {
            // 区分用户取消和真正的错误
            const isUserCancelled = error?.name === 'USER_CANCELLED'

            jobManager.updateJob(jobId, {
              status: isUserCancelled ? 'failed' : 'failed',
              error: isUserCancelled ? '用户取消' : error?.message || '未知错误',
              stepName: '失败'
            })

            console.error(`Job ${jobId} failed:`, error)
          }
        }
      })

      return c.json({
        success: true,
        message: `已启动 ${jobs.length} 个发布任务`,
        batchId,
        jobs
      })
    } catch (error) {
      console.error('批量发布失败:', error)
      return c.json({ error: '批量发布失败', details: error instanceof Error ? error.message : String(error) }, 500)
    }
  })

  // 查询任务状态
  app.get('/api/workflow/job/:jobId', async (c) => {
    try {
      const { jobId } = c.req.param()
      const { jobManager } = await import('./workflow/job-manager.js')

      const job = jobManager.getJob(jobId)

      if (!job) {
        return c.json({ error: '任务不存在' }, 404)
      }

      return c.json({
        success: true,
        data: job
      })
    } catch (error) {
      console.error('查询任务状态失败:', error)
      return c.json({ error: '查询任务状态失败' }, 500)
    }
  })

  // 查询批量任务状态
  app.get('/api/workflow/batch/:batchId', async (c) => {
    try {
      const { batchId } = c.req.param()
      const { jobManager } = await import('./workflow/job-manager.js')

      const jobs = jobManager.getJobsByBatch(batchId)
      const stats = jobManager.getStats(batchId)

      return c.json({
        success: true,
        data: {
          batchId,
          jobs,
          summary: stats
        }
      })
    } catch (error) {
      console.error('查询批量任务状态失败:', error)
      return c.json({ error: '查询批量任务状态失败' }, 500)
    }
  })

  // 获取处理结果
  app.get('/api/workflow/results/:postId', async (c) => {
    try {
      const { postId } = c.req.param()
      const { jobManager } = await import('./workflow/job-manager.js')

      // 获取最新的任务
      const job = jobManager.getLatestJobByPostId(postId)

      if (!job) {
        return c.json({ error: '未找到该文章的任务' }, 404)
      }

      if (job.status !== 'completed') {
        return c.json({
          success: true,
          data: {
            postId,
            status: job.status,
            progress: job.progress,
            stepName: job.stepName
          }
        })
      }

      // 任务已完成，返回结果
      const { PostDAL } = await import('@content-hub/database')
      const dal = new PostDAL()
      const post = await dal.findByPostId(postId)

      if (!post) {
        return c.json({ error: '文章不存在' }, 404)
      }

      // 读取发布页面 URL
      const fs = await import('fs/promises')
      const path = await import('path')

      // 查找生成的发布页面
      const outputDir = path.join(process.cwd(), 'output')
      let publishPageUrl = null

      try {
        const files = await fs.readdir(outputDir)
        const hashDirs = files.filter(f => !f.includes('.'))

        for (const hashDir of hashDirs) {
          const indexPath = path.join(outputDir, hashDir, 'index.html')
          try {
            await fs.access(indexPath)
            // 找到发布页面，假设最新的是当前文章的
            publishPageUrl = `/output/${hashDir}/index.html`
            break
          } catch {
            // 继续查找
          }
        }
      } catch {
        // output 目录不存在
      }

      return c.json({
        success: true,
        data: {
          postId,
          status: job.status,
          publishPageUrl,
          title: post.title,
          completedAt: job.completedAt
        }
      })
    } catch (error) {
      console.error('获取处理结果失败:', error)
      return c.json({ error: '获取处理结果失败' }, 500)
    }
  })

  // 回滚文章
  app.post('/api/workflow/rollback/:postId', async (c) => {
    try {
      const { postId } = c.req.param()
      const { WorkflowOrchestrator } = await import('./workflow/orchestrator.js')
      const orchestrator = new WorkflowOrchestrator()

      await orchestrator.rollback(postId)

      return c.json({
        success: true,
        message: '回滚完成'
      })
    } catch (error) {
      console.error('回滚失败:', error)
      return c.json({ error: '回滚失败', details: error instanceof Error ? error.message : String(error) }, 500)
    }
  })

  // ========== 启动服务器 ==========
  const server = serve({
    fetch: app.fetch,
    port
  })

  console.log(`🚀 API 服务器启动在端口 ${port}`)

  return {
    port,
    stop: async () => {
      console.log(`👋 正在关闭 API 服务器 (端口 ${port})...`)
      server.close()
      await new Promise<void>((resolve) => {
        server.on('close', () => resolve())
      })
      console.log('✅ API 服务器已关闭')
    }
  }
}
