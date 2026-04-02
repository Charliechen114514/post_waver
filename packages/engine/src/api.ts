import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { parsePost } from '@content-hub/core'
import { transformForJuejin, transformForWechat } from '@content-hub/transformer'
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
      const { platform } = await c.req.json()

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

      let transformedContent: string
      switch (platform) {
        case 'juejin':
          transformedContent = await transformForJuejin(parsed.content)
          break
        case 'wechat':
          transformedContent = await transformForWechat(parsed.content)
          break
        default:
          transformedContent = parsed.content
      }

      return c.json({
        success: true,
        content: transformedContent,
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

  // 启动服务器
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
