import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

/**
 * 预览服务器接口
 */
export interface PreviewServer {
  port: number
  stop: () => Promise<void>
}

/**
 * 预览内容接口
 */
export interface PreviewContent {
  title: string
  platform: string
  content: string
  id: string
  timestamp: string
}

/**
 * 尝试在指定端口范围内启动服务器
 */
async function tryPorts(startPort: number, maxAttempts: number = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i
    try {
      // 尝试绑定端口
      const net = await import('net')
      const server = net.createServer()
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(port, () => {
          server.close(() => resolve())
        })
      })
      return port
    } catch (error) {
      // 端口被占用，继续尝试下一个
      continue
    }
  }
  throw new Error(`无法在端口 ${startPort}-${startPort + maxAttempts - 1} 范围内启动服务器`)
}

/**
 * 创建预览服务器
 */
export async function createPreviewServer(getPreviewContent: (id: string, platform: string) => Promise<PreviewContent>): Promise<PreviewServer> {
  const app = new Hono()

  // 启用 CORS
  app.use('/*', cors())

  // 健康检查端点
  app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // 主预览端点 - 支持包含斜杠的文件路径
  app.get('/preview/:platform/:id', async (c) => {
    const { platform, id } = c.req.param()

    try {
      // 解码 URL 编码的路径
      const decodedId = decodeURIComponent(id)
      const content = await getPreviewContent(decodedId, platform)

      // 返回 HTML 预览页面
      return c.html(generatePreviewHTML(content))
    } catch (error) {
      console.error('预览生成失败:', error)
      return c.html(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>预览错误</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; }
            .error { color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ 预览失败</h2>
            <p>${error instanceof Error ? error.message : '未知错误'}</p>
          </div>
        </body>
        </html>
      `, 500)
    }
  })

  // 替代路由：支持通配符路径
  app.get('/preview/:platform/*', async (c) => {
    const platform = c.req.param('platform')
    const id = c.req.param('*')

    if (!platform || !id) {
      return c.html('<h1>404 - Not Found</h1>', 404)
    }

    try {
      const content = await getPreviewContent(id, platform)

      // 返回 HTML 预览页面
      return c.html(generatePreviewHTML(content))
    } catch (error) {
      console.error('预览生成失败:', error)
      return c.html(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>预览错误</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; }
            .error { color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ 预览失败</h2>
            <p>${error instanceof Error ? error.message : '未知错误'}</p>
          </div>
        </body>
        </html>
      `, 500)
    }
  })

  // API 端点：获取预览内容
  app.get('/api/content/:platform/:id', async (c) => {
    const { platform, id } = c.req.param()

    try {
      const content = await getPreviewContent(id, platform)
      return c.json({ success: true, data: content })
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }, 500)
    }
  })

  // 查找可用端口
  const port = await tryPorts(3737)
  console.log(`🚀 预览服务器启动在端口 ${port}`)

  // 启动服务器
  const server = serve({
    fetch: app.fetch,
    port
  })

  // 返回服务器控制接口
  return {
    port,
    stop: async () => {
      console.log(`👋 正在关闭预览服务器 (端口 ${port})...`)
      server.close()
      await new Promise<void>((resolve) => {
        server.on('close', () => resolve())
      })
      console.log('✅ 预览服务器已关闭')
    }
  }
}

/**
 * 生成预览 HTML 页面
 */
function generatePreviewHTML(content: PreviewContent): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(content.title)} - ${content.platform} 预览</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .preview-container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
    }
    .platform-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }
    .content {
      padding: 32px;
      min-height: 400px;
    }
    .actions {
      padding: 24px 32px;
      background: #f9f9f9;
      border-top: 1px solid #e5e5e5;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .copy-btn {
      padding: 12px 24px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .copy-btn:hover {
      background: #0056b3;
      transform: translateY(-1px);
    }
    .copy-btn:active {
      transform: translateY(0);
    }
    .copy-status {
      font-size: 14px;
      color: #28a745;
      font-weight: 500;
    }
    .meta {
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="preview-container">
    <div class="header">
      <h1>${escapeHtml(content.title)}</h1>
      <span class="platform-badge">${escapeHtml(content.platform)}</span>
    </div>
    <div class="content">
      ${content.content}
    </div>
    <div class="actions">
      <button class="copy-btn" onclick="copyToClipboard()">📋 复制到剪贴板</button>
      <div>
        <span class="copy-status" id="copy-status"></span>
      </div>
    </div>
    <div style="padding: 12px 32px; background: #f9f9f9; border-top: 1px solid #e5e5e5;">
      <p class="meta">ID: ${escapeHtml(content.id)} | 时间: ${escapeHtml(content.timestamp)}</p>
    </div>
  </div>

  <script>
    function copyToClipboard() {
      const content = document.querySelector('.content').innerHTML;
      const status = document.getElementById('copy-status');

      navigator.clipboard.writeText(content).then(() => {
        status.textContent = '✅ 已复制!';
        setTimeout(() => {
          status.textContent = '';
        }, 2000);
      }).catch(err => {
        console.error('复制失败:', err);
        alert('复制失败: ' + err.message);
      });
    }
  </script>
</body>
</html>`
}

/**
 * HTML 转义函数
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
