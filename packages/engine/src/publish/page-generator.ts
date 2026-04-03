import { generateHashID } from '@content-hub/core'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { generateImageListFile } from '@content-hub/core'

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
  writeFileSync(indexPath, html, 'utf-8')

  console.log(`✅ 发布页面已生成: ${indexPath}`)

  // 保存各平台内容
  for (const platform of platforms) {
    const contentPath = join(pageDir, `${platform.platform}.txt`)
    writeFileSync(contentPath, platform.content, 'utf-8')

    // 🔍 调试：显示写入内容的前150字符
    console.log(`   ✅ 已写入 ${platform.platform}.txt (${platform.content.length} 字符)`)
    console.log(`      前150字符: ${platform.content.substring(0, 150)}`)
  }

  // 生成图片列表文件到产物目录
  console.log('📝 生成图片列表文件...')
  for (const platform of platforms) {
    try {
      await generateImageListFile(
        postId,
        content,
        platform.platform,
        pageDir,
        {
          includeFileStats: true
        }
      )
      console.log(`   ✓ ${platform.name}: 图片列表已生成`)
    } catch (error) {
      console.warn(`   ⚠ ${platform.name}: 图片列表生成失败 - ${error}`)
    }
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

    .card .url-input-section {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
    }

    .card .url-input-group {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }

    .card .url-input {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s;
    }

    .card .url-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .card .url-display {
      padding: 10px 12px;
      background: #f9fafb;
      border-radius: 6px;
      font-size: 13px;
      color: #606570;
      word-break: break-all;
      margin-top: 10px;
    }

    .card .url-display a {
      color: #667eea;
      text-decoration: none;
    }

    .card .url-display a:hover {
      text-decoration: underline;
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

    .card .button-small {
      flex: 0;
      min-width: auto;
      padding: 8px 16px;
      font-size: 13px;
    }

    .card .button-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .card .button-primary:hover {
      opacity: 0.9;
      transform: scale(1.05);
    }

    .card .button-richtext {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    .card .button-richtext:hover {
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

    .card .button-success {
      background: #10b981;
      color: white;
    }

    .card .button-success:hover {
      background: #059669;
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

    .image-status-section {
      margin-top: 30px;
    }

    .image-status-section .header {
      background: white;
      padding: 20px 30px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .image-status-section h2 {
      color: #333;
      margin-bottom: 5px;
    }

    .image-status-section p {
      color: #666;
      font-size: 14px;
    }

    .status-badge {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 15px;
    }

    .status-checking {
      background: #fef3c7;
      color: #92400e;
    }

    .status-success {
      background: #d1fae5;
      color: #065f46;
    }

    .status-warning {
      background: #fef3c7;
      color: #92400e;
    }

    .status-error {
      background: #fee2e2;
      color: #991b1b;
    }

    .status-details {
      font-size: 13px;
      color: #666;
      line-height: 1.6;
    }

    .status-details a {
      color: #667eea;
      text-decoration: none;
    }

    .status-details a:hover {
      text-decoration: underline;
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
          ${platform.platform === 'wechat' ? `
            <button class="button button-primary button-richtext" onclick="copyRichText('${platform.platform}')">
              📋 复制富文本
            </button>
            <button class="button button-secondary" onclick="copyContent('${platform.platform}')">
              📄 复制源码
            </button>
          ` : `
            <button class="button button-primary" onclick="copyContent('${platform.platform}')">
              📋 复制内容
            </button>
          `}
          <button class="button button-secondary" onclick="previewContent('${platform.platform}')">
            👁️ 预览与对比
          </button>
          <button class="button button-secondary" onclick="checkImageList('${platform.platform}')">
            📷 图片状态
          </button>
        </div>
        <div class="url-input-section">
          <div style="font-size: 13px; color: #666; margin-bottom: 8px;">🔗 发布链接管理</div>
          <div id="url-display-${platform.platform}" class="url-display" style="display: none;">
            <span id="url-text-${platform.platform}"></span>
            <a id="url-link-${platform.platform}" href="#" target="_blank" style="margin-left: 8px;">🔗 打开</a>
          </div>
          <div class="url-input-group" id="url-input-group-${platform.platform}">
            <input
              type="url"
              class="url-input"
              id="url-input-${platform.platform}"
              placeholder="输入发布后的URL..."
              onkeypress="if(event.key === 'Enter') saveUrl('${platform.platform}')"
            />
            <button class="button button-small button-success" onclick="saveUrl('${platform.platform}')">
              💾 保存
            </button>
          </div>
        </div>
      </div>
      `).join('')}
    </div>

    <div class="image-status-section">
      <div class="header">
        <h2>📷 图片上传状态</h2>
        <p>查看各平台的图片处理情况</p>
      </div>
      <div class="grid" id="image-status-grid">
        ${platforms.map(platform => `
        <div class="card image-status-card" id="image-status-${platform.platform}">
          <h3>${escapeHtml(platform.name)}</h3>
          <div class="status-badge status-checking">
            🔍 检查中...
          </div>
          <div class="status-details"></div>
        </div>
        `).join('')}
      </div>
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
    const postId = '${escapeHtml(postId)}';
    const apiBaseUrl = 'http://localhost:3001';

    // 页面加载时初始化
    window.addEventListener('DOMContentLoaded', function() {
      loadAllUrls();
      checkAllImageStatus();
    });

    // 加载所有平台的URL
    async function loadAllUrls() {
      for (const platform of platforms) {
        await loadPlatformUrl(platform.platform);
      }
    }

    // 加载单个平台的URL
    async function loadPlatformUrl(platform) {
      try {
        const response = await fetch(\`\${apiBaseUrl}/api/platform-ids/\${postId}\`);
        if (response.ok) {
          const data = await response.json();
          const platformData = data[platform];

          if (platformData && platformData.url) {
            // 显示URL
            document.getElementById(\`url-display-\${platform}\`).style.display = 'block';
            document.getElementById(\`url-text-\${platform}\`).textContent = platformData.url;
            document.getElementById(\`url-link-\${platform}\`).href = platformData.url;

            // 隐藏输入框
            document.getElementById(\`url-input-group-\${platform}\`).style.display = 'none';
          }
        }
      } catch (error) {
        console.warn(\`加载 \${platform} URL失败:\`, error);
        // API服务器未运行，显示输入框
      }
    }

    // 保存URL
    async function saveUrl(platform) {
      const input = document.getElementById(\`url-input-\${platform}\`);
      const url = input.value.trim();

      if (!url) {
        alert('请输入URL');
        return;
      }

      try {
        const response = await fetch(\`\${apiBaseUrl}/api/platform-ids/\${postId}\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            platform: platform,
            postId: postId,
            url: url
          })
        });

        if (response.ok) {
          alert('✅ URL保存成功!');

          // 刷新显示
          await loadPlatformUrl(platform);
        } else {
          const error = await response.json();
          alert(\`❌ 保存失败: \${error.error || '未知错误'}\`);
        }
      } catch (error) {
        alert('❌ 无法连接到API服务器，请确保API服务器正在运行 (pnpm dev:api)');
      }
    }

    function copyContent(platform) {
      const platformData = platforms.find(p => p.platform === platform);
      if (platformData) {
        navigator.clipboard.writeText(platformData.content).then(() => {
          alert('✅ 已复制到剪贴板!');
        });
      }
    }

    // 富文本复制(用于微信平台)
    async function copyRichText(platform) {
      const platformData = platforms.find(p => p.platform === platform);
      if (!platformData) return;

      const htmlContent = platformData.content;

      // 提取纯文本作为fallback
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';

      // 方案A: 尝试使用 Clipboard API (text/html)
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          const blobHtml = new Blob([htmlContent], { type: 'text/html' });
          const blobText = new Blob([textContent], { type: 'text/plain' });
          const data = [new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobText
          })];
          await navigator.clipboard.write(data);
          alert('✅ 富文本已复制到剪贴板!\n\n可以直接粘贴到微信公众号编辑器');
          return;
        } catch (err) {
          console.warn('Clipboard API失败，尝试降级方案:', err);
          // 降级到方案B
        }
      }

      // 方案B: 降级使用 Selection API (兼容性更好)
      try {
        const div = document.createElement('div');
        div.innerHTML = htmlContent;
        div.style.position = 'absolute';
        div.style.left = '-9999px';
        div.style.top = '0';
        div.style.opacity = '0';
        document.body.appendChild(div);

        const range = document.createRange();
        range.selectNodeContents(div);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        const success = document.execCommand('copy');

        // 清理
        selection.removeAllRanges();
        document.body.removeChild(div);

        if (success) {
          alert('✅ 富文本已复制到剪贴板!\n\n可以直接粘贴到微信公众号编辑器');
        } else {
          throw new Error('execCommand failed');
        }
      } catch (err) {
        console.error('富文本复制失败:', err);
        alert('❌ 富文本复制失败\n\n请使用"复制源码"按钮，手动粘贴HTML代码');
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

    // 检查图片列表文件
    async function checkImageStatus(platform) {
      const card = document.getElementById(\`image-status-\${platform}\`);
      const badge = card.querySelector('.status-badge');
      const details = card.querySelector('.status-details');

      try {
        const response = await fetch(\`\${platform}_imagelist.txt\`);
        if (response.ok) {
          const content = await response.text();
          const lines = content.split('\\n');

          // 解析图片列表
          const localImages = lines.filter(line => line.includes('[1]') || line.includes('[2]') || line.includes('[3]') || line.includes('[4]') || line.includes('[5]') || line.includes('[6]') || line.includes('[7]') || line.includes('[8]') || line.includes('[9]')).length;
          const hasManualUpload = content.includes('需要手动上传');

          badge.className = 'status-badge ' + (hasManualUpload ? 'status-warning' : 'status-success');
          badge.textContent = hasManualUpload ? '⚠️ 需手动上传' : '✅ 无需上传';

          if (hasManualUpload) {
            details.innerHTML = \`
              此平台不支持自动上传。<br>
              共 \${localImages} 张图片需要手动上传。<br>
              <a href="\${platform}_imagelist.txt" target="_blank">📄 查看图片列表</a>
            \`;
          } else {
            details.textContent = '所有图片都是外链或Base64格式，无需手动上传。';
          }
        } else {
          badge.className = 'status-badge status-success';
          badge.textContent = '✅ 无图片';
          details.textContent = '文章中没有本地图片引用。';
        }
      } catch (error) {
        badge.className = 'status-badge status-error';
        badge.textContent = '❌ 检查失败';
        details.textContent = '无法加载图片列表文件。';
      }
    }

    // 检查所有平台的图片状态
    function checkAllImageStatus() {
      ${platforms.map(p => `checkImageStatus('${p.platform}');`).join('\n      ')}
    }

    // 打开图片列表
    function checkImageList(platform) {
      window.open(\`\${platform}_imagelist.txt\`, '_blank');
    }

    // 注意：页面加载时的初始化已在上面统一处理
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
