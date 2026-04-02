import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { readIndex } from '@content-hub/core'
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
  indexPath?: string
  port?: number
}): Promise<APIServer> {
  const { indexPath = 'content-index.json', port = 3001 } = options

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
      const index = await readIndex(indexPath)
      if (!index) {
        return c.json({ posts: [], metadata: { totalPosts: 0, draftCount: 0, allTags: [] } })
      }

      const posts = Object.values(index.posts || {})
      return c.json({
        posts,
        metadata: index.metadata
      })
    } catch (error) {
      console.error('获取文章列表失败:', error)
      return c.json({ error: '获取文章列表失败' }, 500)
    }
  })

  // 获取单个文章详情
  app.get('/api/posts/:id', async (c) => {
    try {
      const { id } = c.req.param()
      const index = await readIndex(indexPath)

      if (!index || !index.posts[id]) {
        return c.json({ error: '文章不存在' }, 404)
      }

      const indexedPost = index.posts[id]

      // 解析完整文章（filepath 已经是绝对路径）
      const post = await parsePost(indexedPost.filepath)

      return c.json({
        ...indexedPost,
        content: post.content,
        frontmatter: post.frontmatter
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

      const index = await readIndex(indexPath)
      if (!index || !index.posts[id]) {
        return c.json({ error: '文章不存在' }, 404)
      }

      const indexedPost = index.posts[id]

      // 解析完整文章（filepath 已经是绝对路径）
      const post = await parsePost(indexedPost.filepath)

      let transformedContent: string
      switch (platform) {
        case 'juejin':
          transformedContent = await transformForJuejin(post.content)
          break
        case 'wechat':
          transformedContent = await transformForWechat(post.content)
          break
        default:
          transformedContent = post.content
      }

      return c.json({
        success: true,
        content: transformedContent,
        title: post.frontmatter.title
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
