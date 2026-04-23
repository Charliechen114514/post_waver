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

  // 启用 CORS（支持所有必要的HTTP方法）
  app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }))

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
      const formattedPosts = posts.map(post => {
        // 解析 tags JSON 字符串
        let tags: string[] = []
        if (post.tags) {
          try {
            tags = JSON.parse(post.tags)
          } catch {
            tags = []
          }
        }

        return {
          id: post.postId,
          title: post.title || post.postId,
          date: post.createdAt?.toISOString() || new Date().toISOString(),
          tags,
          draft: post.status !== 'published',
          filepath: post.currentPath || post.originalPath || '',
          status: post.status,
          workflowStatus: post.workflowStatus,
          cleanedAt: post.cleanedAt?.toISOString()
        }
      })

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

  // 获取已发布的文章列表（包含平台URL和标签）
  app.get('/api/posts/published', async (c) => {
    try {
      const { prisma } = await import('@content-hub/database')

      // 获取所有已发布的文章
      const posts = await prisma.post.findMany({
        where: { status: 'published' },
        include: { publishRecords: true },
        orderBy: { publishedAt: 'desc' }
      })

      // 获取所有文章的平台URL映射
      const platformIdMappings = await prisma.platformIdMapping.findMany()
      const platformUrlMap = new Map<string, Array<{ platform: string; url: string; publishedAt: string | null }>>()

      platformIdMappings.forEach(mapping => {
        if (!platformUrlMap.has(mapping.postId)) {
          platformUrlMap.set(mapping.postId, [])
        }
        platformUrlMap.get(mapping.postId)!.push({
          platform: mapping.platform,
          url: mapping.url || '',
          publishedAt: mapping.publishedAt?.toISOString() || null
        })
      })

      // 组装数据
      const result = posts.map((post) => {
        // 从Post表获取标签（持久化，不依赖文件系统）
        let postTags: string[] = []
        if (post.tags) {
          try {
            postTags = JSON.parse(post.tags)
          } catch {
            postTags = []
          }
        }

        // 获取平台URL
        const platformUrls = platformUrlMap.get(post.postId) || []

        return {
          id: post.id,
          postId: post.postId,
          title: post.title || post.postId,
          status: post.status,
          publishedAt: post.publishedAt?.toISOString() || post.updatedAt?.toISOString() || new Date().toISOString(),
          tags: postTags,
          platformUrls
        }
      })

      return c.json({
        success: true,
        posts: result
      })
    } catch (error) {
      console.error('❌ 获取已发布文章列表失败:', error)
      return c.json({ error: '获取已发布文章列表失败', details: error instanceof Error ? error.message : String(error) }, 500)
    }
  })

  // 删除已发布的文章（删除数据库记录，保留原始文件）
  // 注意：这个路由必须放在 /api/posts/:id 之前
  app.delete('/api/posts/:postId', async (c) => {
    try {
      const { postId } = c.req.param()
      const { prisma, PlatformIdService } = await import('@content-hub/database')

      console.log(`[DELETE] 开始删除文章: ${postId}`)

      // 检查文章是否存在
      const post = await prisma.post.findUnique({
        where: { postId }
      })

      if (!post) {
        console.log(`[DELETE] 文章不存在: ${postId}`)
        return c.json({ error: '文章不存在' }, 404)
      }

      // 删除平台 ID 映射
      console.log(`[DELETE] 删除平台 ID 映射`)
      await PlatformIdService.deleteAllForPost(postId)

      // 删除发布记录（注意：postId 外键引用的是 Post.id，不是 Post.postId）
      console.log(`[DELETE] 删除发布记录`)
      await prisma.publishRecord.deleteMany({
        where: { postId: post.id }
      })

      // 删除文章记录
      console.log(`[DELETE] 删除文章记录`)
      await prisma.post.delete({
        where: { postId }
      })

      console.log(`[DELETE] 文章删除成功: ${postId}`)

      return c.json({
        success: true,
        message: '文章删除成功'
      })
    } catch (error) {
      console.error(`[DELETE] 删除文章失败:`, error)
      return c.json({ error: '删除文章失败', details: error instanceof Error ? error.message : String(error) }, 500)
    }
  })

  // 获取全局的平台发布 URL 配置（从数据库 Config 表）
  app.get('/api/platform-urls', async (c) => {
    try {
      const { prisma } = await import('@content-hub/database')

      const configs = await prisma.config.findMany({
        where: { category: 'platform-urls' }
      })

      const result: Record<string, string> = {}
      for (const config of configs) {
        // 移除分类前缀，只保留 key 部分
        const shortKey = config.key.replace('platform-urls.', '')
        // URL 直接作为字符串，不需要 JSON.parse
        result[shortKey] = config.value
      }

      return c.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('获取平台 URL 失败:', error)
      return c.json({ error: '获取平台 URL 失败', details: error instanceof Error ? error.message : String(error) }, 500)
    }
  })

  // 设置全局的平台发布 URL（保存到数据库 Config 表）
  app.post('/api/platform-urls', async (c) => {
    try {
      const { platform, url } = await c.req.json()

      if (!platform) {
        return c.json({ error: '缺少 platform 参数' }, 400)
      }

      const { prisma } = await import('@content-hub/database')

      const fullKey = `platform-urls.${platform}`

      // 直接保存字符串值，不使用 JSON.stringify
      await prisma.config.upsert({
        where: { key: fullKey },
        update: { value: url || '' },
        create: {
          key: fullKey,
          value: url || '',
          category: 'platform-urls'
        }
      })

      console.log(`✅ 已保存 ${platform} 平台的发布 URL: ${url}`)

      return c.json({
        success: true,
        message: `${platform} 平台的发布 URL 已保存`
      })
    } catch (error) {
      console.error('保存平台 URL 失败:', error)
      return c.json({ error: '保存平台 URL 失败', details: error instanceof Error ? error.message : String(error) }, 500)
    }
  })

  // 获取文章的平台发布 URL（从数据库）
  // 注意：这个路由必须放在 /api/posts/:id 之前，因为 Hono 按照定义顺序匹配路由
  app.get('/api/posts/:postId/platform-urls', async (c) => {
    try {
      const { postId } = c.req.param()
      const { PlatformIdService } = await import('@content-hub/database')

      const platformUrls = await PlatformIdService.getAllForPost(postId)

      return c.json({
        success: true,
        data: platformUrls
      })
    } catch (error) {
      console.error('获取平台 URL 失败:', error)
      return c.json({ error: '获取平台 URL 失败', details: error instanceof Error ? error.message : String(error) }, 500)
    }
  })

  // 设置文章的平台发布 URL（保存到数据库）
  app.post('/api/posts/:postId/platform-urls', async (c) => {
    try {
      const { postId } = c.req.param()
      const { platform, url } = await c.req.json()

      if (!platform) {
        return c.json({ error: '缺少 platform 参数' }, 400)
      }

      const { PlatformIdService } = await import('@content-hub/database')

      // 保存URL到数据库，使用空字符串作为 platformPostId
      await PlatformIdService.set(postId, platform, '', url || '')

      console.log(`✅ 已保存 ${platform} 平台的发布 URL: ${url}`)

      return c.json({
        success: true,
        message: `${platform} 平台的发布 URL 已保存`
      })
    } catch (error) {
      console.error('保存平台 URL 失败:', error)
      return c.json({ error: '保存平台 URL 失败', details: error instanceof Error ? error.message : String(error) }, 500)
    }
  })

  // 更新文章的元数据（平台URL和标签）
  app.put('/api/posts/:postId/metadata', async (c) => {
    try {
      const { postId } = c.req.param()
      const { platformUrls, tags } = await c.req.json()

      const { prisma, PlatformIdService } = await import('@content-hub/database')

      // 更新平台URL
      if (platformUrls && typeof platformUrls === 'object') {
        for (const [platform, url] of Object.entries(platformUrls)) {
          // 使用空字符串作为 platformPostId，因为我们只关心URL
          await PlatformIdService.set(postId, platform, '', url as string)
        }
      }

      // 更新标签（更新Post表，持久化且不依赖文件系统）
      if (Array.isArray(tags)) {
        await prisma.post.update({
          where: { postId },
          data: {
            tags: JSON.stringify(tags),
            updatedAt: new Date()
          }
        })
        console.log(`✅ 已更新文章 ${postId} 的标签:`, tags)
      }

      return c.json({
        success: true,
        message: '元数据更新成功'
      })
    } catch (error) {
      console.error('❌ 更新元数据失败:', error)
      return c.json({ error: '更新元数据失败', details: error instanceof Error ? error.message : String(error) }, 500)
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
      const { platform, theme, injectionTemplateId, includeRelatedLinks = true } = await c.req.json()

      if (!['juejin', 'csdn', 'zhihu', 'wechat', 'html'].includes(platform)) {
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
        // 尝试多个可能的路径
        const possiblePaths = [
          path.join(process.cwd(), 'content/posts', `${id}.md`),
          path.join(process.cwd(), 'content/posts', id, 'index.md'),
          path.join(process.cwd(), 'content/done', `${id}.md`),
          path.join(process.cwd(), 'content/done', id, 'index.md'),
          path.join(process.cwd(), 'content/test', `${id}.md`),
        ]

        for (const testPath of possiblePaths) {
          try {
            await fs.access(testPath)
            filepath = testPath
            console.log(`✅ 找到文章文件: ${filepath}`)
            break
          } catch {
            // 继续尝试下一个路径
          }
        }

        if (!filepath) {
          console.error(`❌ 文章文件未找到，已尝试以下路径:`, possiblePaths)
          return c.json({
            error: '文章文件不存在',
            message: '文章可能在其他目录或已被删除',
            hint: '尝试刷新页面或重新扫描文章'
          }, 404)
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

      // 应用标题注入（如果指定了模板）
      if (injectionTemplateId) {
        try {
          const { prisma } = await import('@content-hub/database')
          const template = await prisma.injectionTemplate.findUnique({
            where: { id: injectionTemplateId }
          })

          if (template && template.enabled && template.content) {
            const { injectTitlePostContent, formatInjectionForPlatform } = await import('@content-hub/core')

            // 格式化注入内容
            const formattedContent = formatInjectionForPlatform(template.content, platform)

            // 注入到内容中
            useContent = injectTitlePostContent(useContent, {
              platform,
              customContent: formattedContent,
              enabled: true,
              position: 'after_title'
            })

            console.log(`✅ 已应用注入模板: ${template.name}`)
          }
        } catch (error) {
          console.warn('应用注入模板失败:', error)
        }
      }

      // 应用相关链接（如果启用）
      if (includeRelatedLinks) {
        try {
          const { injectRelatedLinksWithPlatform } = await import('@content-hub/core')
          const { RelatedPostsService } = await import('@content-hub/database')

          // 从 Post 表获取当前文章（支持已发布和草稿）
          const currentPost = await RelatedPostsService.getPublishedPost(id)

          if (currentPost) {
            // 计算相关推荐
            const relatedPosts = await RelatedPostsService.findRelatedPosts(id, 3)

            // 构建当前文章的完整信息
            const currentPostWithRelated = {
              ...currentPost,
              related: relatedPosts
            }

            // 获取所有已发布文章的Map（用于查找）
            const postsMap = await RelatedPostsService.getPublishedPostsMap()

            // 使用平台真实URL注入相关链接
            console.log(`\n🔗 [Preview API] 为 ${platform} 平台应用相关链接...`)
            console.log(`  找到 ${currentPostWithRelated.related?.length || 0} 篇相关文章`)

            const beforeLength = useContent.length

            try {
              useContent = await injectRelatedLinksWithPlatform(useContent, currentPostWithRelated, postsMap, platform)
              console.log(`  ✅ ${platform} 平台相关链接已应用（使用平台真实 URL）`)
            } catch (error) {
              console.warn(`  ⚠️ ${platform} 平台URL查询失败，使用降级方案:`, error)
              // 降级：使用原始链接格式
              const { injectRelatedLinks } = await import('@content-hub/core')
              useContent = injectRelatedLinks(useContent, currentPostWithRelated, postsMap, ':year/:month/:day/:title/', true)
            }

            // 如果内容长度没有改变（说明没有找到平台URL），使用降级方案
            if (useContent.length === beforeLength) {
              console.log(`  ℹ️  没有找到平台URL，使用预览链接格式`)
              const { injectRelatedLinks } = await import('@content-hub/core')
              useContent = injectRelatedLinks(useContent, currentPostWithRelated, postsMap, ':year/:month/:day/:title/', true)
            }
          } else {
            console.log(`  ⚠️ 文章 ${id} 未发布或不存在，跳过相关链接`)
          }
        } catch (error) {
          console.warn('应用相关链接失败:', error)
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
        case 'csdn':
          // 用于复制的内容：移除本地图片
          const { transformForCsdn } = await import('@content-hub/transformer')
          transformedContent = await transformForCsdn(useContent, { removeLocalImages: true })
          // 用于预览的内容：保留本地图片显示
          htmlContent = await markdownToHTML(useContent, { removeLocalImages: false })
          break
        case 'zhihu':
          // 用于复制的内容：移除本地图片
          const { transformForZhihu } = await import('@content-hub/transformer')
          transformedContent = await transformForZhihu(useContent, { removeLocalImages: true })
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

  // ========== 注入模板管理 ==========

  // 获取所有注入模板
  app.get('/api/injection-templates', async (c) => {
    try {
      const { prisma } = await import('@content-hub/database')

      const templates = await prisma.injectionTemplate.findMany({
        orderBy: { createdAt: 'desc' }
      })

      return c.json({
        success: true,
        templates
      })
    } catch (error) {
      console.error('获取注入模板失败:', error)
      return c.json({ error: '获取注入模板失败', details: error instanceof Error ? error.message : String(error) }, 500)
    }
  })

  // 创建注入模板
  app.post('/api/injection-templates', async (c) => {
    try {
      const { name, description, content, enabled = true } = await c.req.json()

      if (!name || !content) {
        return c.json({ error: '缺少必要参数 (name, content)' }, 400)
      }

      // 验证内容长度
      if (content.length > 500) {
        return c.json({ error: '注入内容过长，建议不超过 500 字符' }, 400)
      }

      const { prisma } = await import('@content-hub/database')

      const template = await prisma.injectionTemplate.create({
        data: {
          name,
          description: description || '',
          content,
          enabled
        }
      })

      console.log(`✅ 已创建注入模板: ${name}`)

      return c.json({
        success: true,
        message: '注入模板创建成功',
        template
      })
    } catch (error: any) {
      console.error('创建注入模板失败:', error)

      // 处理唯一约束冲突
      if (error.code === 'P2002') {
        return c.json({ error: '模板名称已存在' }, 400)
      }

      return c.json({ error: '创建注入模板失败', details: error instanceof Error ? error.message : String(error) }, 500)
    }
  })

  // 更新注入模板
  app.put('/api/injection-templates/:id', async (c) => {
    try {
      const { id } = c.req.param()
      const { name, description, content, enabled } = await c.req.json()

      // 验证内容长度
      if (content && content.length > 500) {
        return c.json({ error: '注入内容过长，建议不超过 500 字符' }, 400)
      }

      const { prisma } = await import('@content-hub/database')

      const updateData: any = {}
      if (name !== undefined) updateData.name = name
      if (description !== undefined) updateData.description = description
      if (content !== undefined) updateData.content = content
      if (enabled !== undefined) updateData.enabled = enabled

      const template = await prisma.injectionTemplate.update({
        where: { id },
        data: updateData
      })

      console.log(`✅ 已更新注入模板: ${template.name}`)

      return c.json({
        success: true,
        message: '注入模板更新成功',
        template
      })
    } catch (error: any) {
      console.error('更新注入模板失败:', error)

      // 处理记录不存在
      if (error.code === 'P2025') {
        return c.json({ error: '模板不存在' }, 404)
      }

      // 处理唯一约束冲突
      if (error.code === 'P2002') {
        return c.json({ error: '模板名称已存在' }, 400)
      }

      return c.json({ error: '更新注入模板失败', details: error instanceof Error ? error.message : String(error) }, 500)
    }
  })

  // 删除注入模板
  app.delete('/api/injection-templates/:id', async (c) => {
    try {
      const { id } = c.req.param()

      const { prisma } = await import('@content-hub/database')

      await prisma.injectionTemplate.delete({
        where: { id }
      })

      console.log(`✅ 已删除注入模板: ${id}`)

      return c.json({
        success: true,
        message: '注入模板删除成功'
      })
    } catch (error: any) {
      console.error('删除注入模板失败:', error)

      // 处理记录不存在
      if (error.code === 'P2025') {
        return c.json({ error: '模板不存在' }, 404)
      }

      return c.json({ error: '删除注入模板失败', details: error instanceof Error ? error.message : String(error) }, 500)
    }
  })

  // 预览注入模板在不同平台的渲染效果
  app.post('/api/injection-templates/preview', async (c) => {
    try {
      const { content } = await c.req.json()

      if (!content) {
        return c.json({ error: '缺少content参数' }, 400)
      }

      const { formatInjectionForPlatform } = await import('@content-hub/core')

      // 支持的平台预览（CSDN和知乎使用掘金的Markdown格式）
      const platformConfigs = [
        { platform: 'juejin' as const, name: '掘金' },
        { platform: 'wechat' as const, name: '微信公众号' },
        { platform: 'html' as const, name: 'HTML' },
        { platform: 'juejin' as const, name: 'CSDN', actualPlatform: 'csdn' },
        { platform: 'juejin' as const, name: '知乎', actualPlatform: 'zhihu' }
      ]

      const previews = platformConfigs.map(config => {
        const formatted = formatInjectionForPlatform(content, config.platform)
        return {
          platform: config.actualPlatform || config.platform,
          name: config.name,
          preview: formatted
        }
      })

      return c.json({
        success: true,
        previews
      })
    } catch (error) {
      console.error('生成预览失败:', error)
      return c.json({ error: '生成预览失败', details: error instanceof Error ? error.message : String(error) }, 500)
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
      const { postIds, skipPreview = true, templateMap = {}, includeRelatedLinks = true } = await c.req.json()

      // 🔍 调试：打印接收到的数据
      console.log('\n🚀 [DEBUG API] 收到批量发布请求')
      console.log('  postIds:', postIds)
      console.log('  templateMap:', JSON.stringify(templateMap, null, 2))
      console.log('  includeRelatedLinks:', includeRelatedLinks)

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

            // 🔍 调试：打印每篇文章的配置
            const articleTemplateId = templateMap[postId]
            console.log(`\n📝 [DEBUG] 处理文章: ${postId}`)
            console.log(`  注入模板ID: ${articleTemplateId || '(无)'}`)
            console.log(`  相关链接: ${includeRelatedLinks}`)

            const result = await orchestrator.processPost(postId, {
              fast: skipPreview,
              injectionTemplateId: articleTemplateId,
              includeRelatedLinks,
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
                wechatReplacedContent: result.wechatReplacedContent,
                injectionTemplateId: articleTemplateId,
                includeRelatedLinks
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

  // 清理文章文件（保留数据库记录）
  app.post('/api/posts/:id/clean', async (c) => {
    try {
      const { id } = c.req.param()
      const body = await c.req.json().catch(() => ({}))
      const { dryRun = false } = body

      console.log(`\n🧹 ${dryRun ? '[预演]' : '[实际]'}清理文章: ${id}`)

      const { PostCleaner } = await import('./workflow/post-cleaner.js')
      const cleaner = new PostCleaner()

      const result = await cleaner.clean(id, { dryRun })

      if (result.success) {
        return c.json({
          success: true,
          deletedFiles: result.deletedFiles,
          savedTags: result.savedTags,
          message: dryRun ? '预演完成' : '清理完成'
        })
      } else {
        return c.json({
          success: false,
          error: result.error
        }, 400)
      }
    } catch (error) {
      console.error('清理失败:', error)
      return c.json({
        success: false,
        error: '清理失败',
        details: error instanceof Error ? error.message : String(error)
      }, 500)
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
