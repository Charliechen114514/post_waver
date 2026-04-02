import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { readIndex } from '@content-hub/core'
import { parsePost } from '@content-hub/core'
import { transformForJuejin, transformForWechat } from '@content-hub/transformer'

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
