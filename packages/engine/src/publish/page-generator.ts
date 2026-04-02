import { generateHashID } from '@content-hub/core'
import { mkdirSync, writeFile } from 'fs'
import { join } from 'path'

export interface PublishPageOptions {
  outputDir?: string
  openBrowser?: boolean
}

export interface PlatformContent {
  platform: string
  name: string
  content: string
  url?: string
}

/**
 * 生成发布页面
 */
export async function generatePublishPage(
  postId: string,
  title: string,
  content: string,
  platforms: PlatformContent[],
  options: PublishPageOptions = {}
): Promise<string> {
  const {
    outputDir = join(process.cwd(), 'output')
  } = options

  // 生成 HashID
  const hashId = generateHashID()

  // 生成 HTML 页面
  const html = generatePublishPageHTML({
    hashId,
    postId,
    title,
    content,
    platforms
  })

  // 确保输出目录存在
  const pageDir = join(outputDir, hashId)
  mkdirSync(pageDir, { recursive: true })

  // 写入文件
  const indexPath = join(pageDir, 'index.html')
  writeFile(indexPath, html, 'utf-8', (err) => {
    if (err) throw err
  })

  console.log(`✅ 发布页面已生成: ${indexPath}`)

  // 保存各平台内容
  for (const platform of platforms) {
    const contentPath = join(pageDir, `${platform.platform}.txt`)
    writeFile(contentPath, platform.content, 'utf-8', (err) => {
      if (err) throw err
    })
  }

  return indexPath
}

/**
 * 生成发布页面 HTML
 */
function generatePublishPageHTML(options: {
  hashId: string
  postId: string
  title: string
  content: string
  platforms: PlatformContent[]
}): string {
  const { hashId, postId, title, content, platforms } = options

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - 发布页面</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      background: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .header h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 28px;
    }

    .header .meta {
      color: #666;
      font-size: 14px;
      line-height: 1.6;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .card {
      background: white;
      border-radius: 10px;
      padding: 25px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
    }

    .card h2 {
      color: #333;
      margin-bottom: 15px;
      font-size: 20px;
    }

    .card .hash-id {
      color: #999;
      font-size: 12px;
      margin-bottom: 15px;
      font-family: monospace;
    }

    .card .buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .card .button {
      flex: 1;
      min-width: 120px;
      padding: 12px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .card .button-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .card .button-primary:hover {
      opacity: 0.9;
      transform: scale(1.05);
    }

    .card .button-secondary {
      background: #f3f4f6;
      color: #333;
    }

    .card .button-secondary:hover {
      background: #e5e7eb;
    }

    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      overflow: auto;
    }

    .modal.active {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-content {
      background: white;
      border-radius: 10px;
      padding: 30px;
      max-width: 90%;
      max-height: 90%;
      overflow: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .modal-header h3 {
      color: #333;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
    }

    .preview-content {
      line-height: 1.6;
      color: #333;
    }

    .preview-content img {
      max-width: 100%;
      height: auto;
    }

    .comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .comparison-panel {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
    }

    .comparison-panel h4 {
      margin-bottom: 15px;
      color: #333;
    }

    @media (max-width: 768px) {
      .comparison {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">
        文章ID: ${escapeHtml(postId)}<br>
        发布时间: ${new Date().toLocaleString('zh-CN')}<br>
        HashID: <code>${escapeHtml(hashId)}</code>
      </div>
    </div>

    <div class="grid">
      ${platforms.map(platform => `
      <div class="card">
        <h2>${escapeHtml(platform.name)}</h2>
        <div class="hash-id">ID: ${escapeHtml(hashId)}</div>
        <div class="buttons">
          <button class="button button-primary" onclick="copyContent('${platform.platform}')">
            📋 复制内容
          </button>
          <button class="button button-secondary" onclick="previewContent('${platform.platform}')">
            👁️ 预览与对比
          </button>
          ${platform.url ? `
          <button class="button button-secondary" onclick="openUrl('${platform.url}')">
            🔗 跳转链接
          </button>
          ` : ''}
        </div>
      </div>
      `).join('')}
    </div>
  </div>

  <div id="modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="modal-title">预览</h3>
        <button class="close-button" onclick="closeModal()">&times;</button>
      </div>
      <div id="modal-body"></div>
    </div>
  </div>

  <script>
    const platforms = ${JSON.stringify(platforms)};
    const originalContent = ${JSON.stringify(content)};

    function copyContent(platform) {
      const platformData = platforms.find(p => p.platform === platform);
      if (platformData) {
        navigator.clipboard.writeText(platformData.content).then(() => {
          alert('✅ 已复制到剪贴板!');
        });
      }
    }

    function previewContent(platform) {
      const platformData = platforms.find(p => p.platform === platform);
      if (platformData) {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');

        title.textContent = platformData.name + ' - 预览与对比';
        body.innerHTML = \`
          <div class="comparison">
            <div class="comparison-panel">
              <h4>原文</h4>
              <div class="preview-content">\${escapeHtmlForJS(originalContent)}</div>
            </div>
            <div class="comparison-panel">
              <h4>预览效果</h4>
              <div class="preview-content">\${escapeHtmlForJS(platformData.content)}</div>
            </div>
          </div>
        \`;

        modal.classList.add('active');
      }
    }

    function openUrl(url) {
      window.open(url, '_blank');
    }

    function closeModal() {
      document.getElementById('modal').classList.remove('active');
    }

    // 点击模态框外部关闭
    document.getElementById('modal').addEventListener('click', function(e) {
      if (e.target === this) {
        closeModal();
      }
    });

    function escapeHtmlForJS(text) {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\\n/g, '<br>');
    }
  </script>
</body>
</html>`
}

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
