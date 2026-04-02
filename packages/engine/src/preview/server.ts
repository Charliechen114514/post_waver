import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import { themeManager } from './theme-manager.js'
import { ThemeConfigManager } from '@content-hub/config'

// 创建主题配置管理器实例
const themeConfigManager = new ThemeConfigManager()

// 配置 marked 使用 highlight.js 进行代码高亮
marked.use(markedHighlight({
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (err) {
        console.error('代码高亮失败:', err)
      }
    }
    return hljs.highlightAuto(code).value
  },
  langPrefix: 'hljs language-'
}))

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
  content: string    // 原始Markdown内容（用于复制）
  html?: string      // 渲染后的HTML（用于显示）
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

  // 添加请求日志中间件（用于调试assets路径问题）
  app.use('/*', async (c, next) => {
    const path = c.req.path
    // 记录所有assets相关的请求
    if (path.includes('assets') || path.includes('Assets')) {
      console.log(`📥 Assets请求: ${path}`)
    }
    await next()
  })

  // 健康检查端点
  app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // 静态文件服务 - 提供图片等资源文件
  app.get('/assets/*', async (c) => {
    const reqPath = c.req.path

    // 直接映射到 content/posts/assets/ 目录
    let relativePath = reqPath.replace('/assets/', '')

    // 处理空路径
    if (!relativePath || relativePath === '') {
      console.error('❌ /assets/ 路径为空:', { url: c.req.url, path: reqPath })
      return c.text('无效的资源路径：路径为空', 400)
    }

    const fullPath = join(process.cwd(), 'content', 'posts', 'assets', relativePath)

    try {
      const fileContent = await readFile(fullPath)

      // 根据文件扩展名设置Content-Type
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

      console.log(`✅ 静态文件: ${reqPath} -> ${fullPath}`)

      return new Response(fileContent, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600'
        }
      })
    } catch (error) {
      console.error('❌ 静态文件未找到:', reqPath)
      console.error('   完整路径:', fullPath)
      return c.text('文件不存在', 404)
    }
  })

  // 静态文件服务 - 预览页面下的图片路径（处理相对路径）
  app.get('/preview/:platform/assets/*', async (c) => {
    const platform = c.req.param('platform')
    const fullPath = c.req.path // 获取完整路径

    // 手动解析路径，提取 assets 后面的部分
    // 例如: /preview/juejin/assets/test-image.png -> test-image.png
    const match = fullPath.match(/^\/preview\/[^/]+\/assets\/(.+)$/)
    if (!match || !match[1]) {
      console.error('❌ 资源路径解析失败:', { platform, fullPath, url: c.req.url })
      return c.text('无效的资源路径', 400)
    }

    const assetsPath = match[1]

    // 直接映射到 content/posts/assets/ 目录
    const diskPath = join(process.cwd(), 'content', 'posts', 'assets', assetsPath)

    try {
      const fileContent = await readFile(diskPath)

      // 根据文件扩展名设置Content-Type
      const ext = assetsPath.split('.').pop()?.toLowerCase()
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

      console.log(`✅ 预览图片: ${fullPath} -> ${diskPath}`)

      return new Response(fileContent, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600'
        }
      })
    } catch (error) {
      console.error('❌ 预览图片未找到:', assetsPath)
      console.error('   完整路径:', diskPath)
      return c.text('文件不存在', 404)
    }
  })

  // 也支持从 done 目录读取（用于已发布的文章）
  app.get('/done-assets/*', async (c) => {
    let filePath = c.req.param('*')

    // 验证参数
    if (!filePath || filePath === '' || filePath === '/') {
      console.error('❌ 文件路径为空:', { url: c.req.url })
      return c.text('无效的文件路径：路径为空', 400)
    }

    // 移除开头的斜杠（如果有）
    if (filePath.startsWith('/')) {
      filePath = filePath.substring(1)
    }

    try {
      const fullPath = join(process.cwd(), 'content', 'done', filePath)
      const fileContent = await readFile(fullPath)

      const ext = filePath.split('.').pop()?.toLowerCase()
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

      return new Response(fileContent, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600'
        }
      })
    } catch (error) {
      console.error('静态文件读取失败:', error)
      return c.text('文件不存在', 404)
    }
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

  // 主题相关 API 端点

  // 获取平台的所有主题
  app.get('/api/themes/:platform', async (c) => {
    const { platform } = c.req.param()

    try {
      const themes = await themeManager.getPlatformThemes(platform)
      const defaultTheme = await themeManager.getDefaultThemeName(platform)
      const userPreference = await themeConfigManager.getPlatformDefaultTheme(platform)

      return c.json({
        success: true,
        data: {
          platform,
          themes,
          default: userPreference || defaultTheme
        }
      })
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : '获取主题列表失败'
      }, 500)
    }
  })

  // 获取主题 CSS
  app.get('/api/themes/:platform/:themeName', async (c) => {
    const { platform, themeName } = c.req.param()

    try {
      const css = await themeManager.getThemeCSS(platform, themeName)

      return new Response(css, {
        headers: {
          'Content-Type': 'text/css; charset=utf-8',
          'Cache-Control': 'public, max-age=3600'
        }
      })
    } catch (error) {
      console.error('获取主题CSS失败:', error)
      return c.text(`/* 主题加载失败: ${error instanceof Error ? error.message : '未知错误'} */`, 500)
    }
  })

  // 保存主题偏好
  app.post('/api/themes/preference', async (c) => {
    try {
      const body = await c.req.json()
      const { platform, themeName } = body

      if (!platform || !themeName) {
        return c.json({
          success: false,
          error: '缺少必要参数: platform 和 themeName'
        }, 400)
      }

      // 验证主题是否存在
      const isValid = await themeManager.validateTheme(platform, themeName)
      if (!isValid) {
        return c.json({
          success: false,
          error: `主题 "${themeName}" 在平台 "${platform}" 中不存在`
        }, 400)
      }

      // 保存偏好设置
      themeConfigManager.setPlatformDefaultTheme(platform, themeName)

      return c.json({
        success: true,
        message: '主题偏好已保存'
      })
    } catch (error) {
      console.error('保存主题偏好失败:', error)
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : '保存主题偏好失败'
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

      // 等待服务器关闭，但最多等待2秒
      await Promise.race([
        new Promise<void>((resolve) => {
          server.on('close', () => resolve())
        }),
        new Promise<void>((resolve) => setTimeout(() => resolve(), 2000))
      ])

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
    /* Highlight.js 主题样式 - GitHub Dark (用于代码块) */
    @import url('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css');

    /* 主题CSS将动态加载 */
    #theme-css { /* 主题CSS链接 */ }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      background: #f5f5f5;
      padding: 20px;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .preview-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      max-height: calc(100vh - 40px);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .header-left {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
    }
    .header-controls {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .platform-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }
    .theme-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.15);
      padding: 8px 16px;
      border-radius: 20px;
    }
    .theme-selector label {
      font-size: 14px;
      font-weight: 500;
    }
    .theme-selector select {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      background: white;
      color: #333;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .theme-selector select:hover {
      background: #f8f9fa;
    }
    .theme-selector select:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
    }
    .split-container {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    .panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .panel-left {
      border-right: 1px solid #e5e5e5;
    }
    .panel-header {
      padding: 16px 24px;
      background: #f9f9f9;
      border-bottom: 1px solid #e5e5e5;
      font-weight: 600;
      color: #333;
      font-size: 14px;
    }
    .content {
      flex: 1;
      padding: 32px;
      overflow-y: auto;
    }
    .panel-left .content {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
      background: #fafafa;
      color: #24292f;
    }
    .panel-right .content {
      background: white;
      overflow-x: auto;
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
      <div class="header-left">
        <h1>${escapeHtml(content.title)}</h1>
      </div>
      <div class="header-controls">
        <span class="platform-badge">${escapeHtml(content.platform)}</span>
        <div class="theme-selector" id="theme-selector-container">
          <label for="theme-select">🎨 主题:</label>
          <select id="theme-select">
            <option value="loading">加载中...</option>
          </select>
        </div>
      </div>
    </div>
    <div class="split-container">
      <!-- 左侧：原始内容 -->
      <div class="panel panel-left">
        <div class="panel-header">📝 准备复制的内容（Markdown）</div>
        <div class="content">${escapeHtml(content.content || '')}</div>
      </div>
      <!-- 右侧：预览效果 -->
      <div class="panel panel-right">
        <div class="panel-header">👁️ 预览效果（渲染后）</div>
        <div class="content markdown-body">${content.html || marked(content.content)}</div>
      </div>
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

  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script>
    // 平台和主题配置
    const PLATFORM = '${escapeHtml(content.platform)}';
    const API_BASE = window.location.origin;

    // 存储原始Markdown内容用于复制
    const originalMarkdown = ${JSON.stringify(content.content || '')};
    let currentTheme = null;
    let availableThemes = [];

    // 页面加载后初始化
    document.addEventListener('DOMContentLoaded', function() {
      // 对所有代码块执行高亮
      document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });

      // 初始化主题系统
      initThemeSystem();
    });

    // 初始化主题系统
    async function initThemeSystem() {
      try {
        // 加载主题列表
        await loadThemes();

        // 应用默认主题
        await applyDefaultTheme();
      } catch (error) {
        console.error('主题系统初始化失败:', error);
        // 如果主题系统初始化失败，隐藏主题选择器
        const selector = document.getElementById('theme-selector-container');
        if (selector) selector.style.display = 'none';
      }
    }

    // 加载主题列表
    async function loadThemes() {
      const themeSelect = document.getElementById('theme-select');

      try {
        const response = await fetch(\`\${API_BASE}/api/themes/\${PLATFORM}\`);

        if (!response.ok) {
          throw new Error('获取主题列表失败');
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error('主题数据格式错误');
        }

        availableThemes = result.data.themes;
        const defaultTheme = result.data.default;

        // 如果没有可用主题，隐藏主题选择器
        if (!availableThemes || availableThemes.length === 0) {
          console.log('ℹ️  当前平台没有可用主题');
          const selector = document.getElementById('theme-selector-container');
          if (selector) selector.style.display = 'none';
          return;
        }

        // 清空选择器
        themeSelect.innerHTML = '';

        // 添加主题选项
        availableThemes.forEach(theme => {
          const option = document.createElement('option');
          option.value = theme.name;
          option.textContent = theme.displayName;
          option.dataset.description = theme.description || '';
          themeSelect.appendChild(option);
        });

        // 设置默认选中项
        if (defaultTheme) {
          themeSelect.value = defaultTheme;
          currentTheme = defaultTheme;
        }

        // 添加主题切换监听
        themeSelect.addEventListener('change', onThemeChange);

        console.log('✅ 主题列表加载成功:', availableThemes.length, '个主题');
      } catch (error) {
        console.error('❌ 加载主题列表失败:', error);
        // 加载失败时隐藏主题选择器
        const selector = document.getElementById('theme-selector-container');
        if (selector) selector.style.display = 'none';
      }
    }

    // 应用默认主题
    async function applyDefaultTheme() {
      if (!currentTheme) return;

      try {
        await applyTheme(currentTheme);
      } catch (error) {
        console.error('应用默认主题失败:', error);
      }
    }

    // 主题切换事件处理
    async function onThemeChange(event) {
      const newTheme = event.target.value;

      if (!newTheme || newTheme === currentTheme) {
        return;
      }

      console.log('🎨 切换主题:', currentTheme, '->', newTheme);

      try {
        // 应用新主题
        await applyTheme(newTheme);

        // 保存用户偏好
        await saveThemePreference(newTheme);

        // 更新当前主题
        currentTheme = newTheme;

        console.log('✅ 主题切换成功:', newTheme);
      } catch (error) {
        console.error('❌ 主题切换失败:', error);
        alert('主题切换失败: ' + error.message);

        // 恢复原来的选择
        event.target.value = currentTheme;
      }
    }

    // 应用指定主题
    async function applyTheme(themeName) {
      // 查找或创建主题CSS链接元素
      let themeLink = document.getElementById('theme-css-link');

      if (!themeLink) {
        // 创建新的链接元素
        themeLink = document.createElement('link');
        themeLink.id = 'theme-css-link';
        themeLink.rel = 'stylesheet';
        document.head.appendChild(themeLink);
      }

      // 更新CSS链接
      themeLink.href = \`\${API_BASE}/api/themes/\${PLATFORM}/\${themeName}\`;

      // 等待CSS加载完成
      return new Promise((resolve, reject) => {
        themeLink.onload = () => {
          console.log('✅ 主题CSS加载成功:', themeName);
          resolve();
        };

        themeLink.onerror = () => {
          reject(new Error(\`主题CSS加载失败: \${themeName}\`));
        };

        // 设置超时
        setTimeout(() => {
          reject(new Error('主题CSS加载超时'));
        }, 5000);
      });
    }

    // 保存主题偏好
    async function saveThemePreference(themeName) {
      try {
        const response = await fetch(\`\${API_BASE}/api/themes/preference\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            platform: PLATFORM,
            themeName: themeName
          })
        });

        if (!response.ok) {
          throw new Error('保存主题偏好失败');
        }

        const result = await response.json();

        if (result.success) {
          console.log('✅ 主题偏好已保存:', themeName);
        } else {
          console.warn('⚠️ 保存主题偏好失败:', result.error);
        }
      } catch (error) {
        console.error('❌ 保存主题偏好出错:', error);
        // 不显示错误提示，因为这只是保存偏好，不影响主题切换
      }
    }

    // 复制到剪贴板
    function copyToClipboard() {
      const status = document.getElementById('copy-status');

      // 复制原始Markdown内容
      navigator.clipboard.writeText(originalMarkdown).then(() => {
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
