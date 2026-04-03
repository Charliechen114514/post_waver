import { useState, useEffect } from 'react'
import { CopyButton } from './CopyButton'
import { showToast } from './Toast'
import { transformMarkdown, type TransformResult, type Platform } from '../utils/transformer'
import { WECHAT_THEMES } from '../utils/themes'
import '../styles/CopyButton.css'
import '../styles/Toast.css'
import '../styles/SimplePreview.css'

interface SimplePreviewProps {
  markdown: string
  platform: Platform
}

export function SimplePreview({ markdown, platform }: SimplePreviewProps) {
  const [theme, setTheme] = useState('orangeheart')
  const [result, setResult] = useState<TransformResult | null>(null)
  const [loading, setLoading] = useState(false)

  const isWeChat = platform === 'wechat'

  // 执行转换（防抖 500ms）
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!markdown.trim()) {
        setResult(null)
        return
      }

      setLoading(true)
      try {
        const transformed = await transformMarkdown(markdown, platform, theme)
        setResult(transformed)
      } catch (error) {
        console.error('Transform failed:', error)
        showToast('转换失败，请检查输入', 'error')
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [markdown, platform, theme])

  return (
    <div className="simple-preview">
      {/* 顶部栏 */}
      <div className="preview-header">
        <div className="header-left">
          <h1>Markdown 转换器</h1>
          <span className="platform-badge">{platform}</span>
        </div>
        <div className="header-right">
          {isWeChat && (
            <div className="theme-selector">
              <label>🎨 主题:</label>
              <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                {WECHAT_THEMES.map(t => (
                  <option key={t.name} value={t.name}>{t.displayName}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 左右分栏 */}
      <div className="split-container">
        {/* 左侧：原始内容 */}
        <div className="panel panel-left">
          <div className="panel-header">📝 准备复制的内容</div>
          <div className="content">
            <pre>{result?.text || markdown}</pre>
          </div>
        </div>

        {/* 右侧：预览 */}
        <div className="panel panel-right">
          <div className="panel-header">👁️ 预览效果</div>
          <div className="content">
            {loading ? (
              <div className="loading">转换中...</div>
            ) : result?.html ? (
              <div className="markdown-body" dangerouslySetInnerHTML={{ __html: result.html }} />
            ) : (
              <div className="placeholder">请输入 Markdown 内容</div>
            )}
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="preview-actions">
        <div className="actions-left">
          <span className="meta">
            {markdown.length} 字符 | {markdown.split('\n').length} 行
          </span>
        </div>
        <div className="actions-right">
          <CopyButton
            content={result?.text || markdown}
            htmlContent={result?.html || null}
            platform={platform}
            onSuccess={() => showToast('已复制到剪贴板！', 'success')}
            onError={(err) => showToast(`复制失败: ${err.message}`, 'error')}
            className="btn-lg"
          />
        </div>
      </div>
    </div>
  )
}
