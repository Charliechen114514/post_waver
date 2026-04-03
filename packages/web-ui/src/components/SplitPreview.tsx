import { useState, useEffect } from 'react'
import { CopyButton } from './CopyButton'
import './SplitPreview.css'

interface SplitPreviewProps {
  postId: string
  title: string
  platform: string
  content: string
  htmlContent?: string
}

export function SplitPreview({ postId, title, platform, content, htmlContent }: SplitPreviewProps) {
  const [theme, setTheme] = useState<string>('orangeheart')
  const [themes, setThemes] = useState<any[]>([])
  const [currentHtml, setCurrentHtml] = useState<string>(htmlContent || '')
  const [loading, setLoading] = useState(false)

  // 加载主题列表
  useEffect(() => {
    if (platform === 'wechat') {
      loadThemes()
    }
  }, [platform])

  // 加载主题
  const loadThemes = async () => {
    try {
      const response = await fetch('/api/themes/wechat')
      const data = await response.json()
      if (data.success) {
        setThemes(data.themes || [])
        if (data.defaultTheme) {
          setTheme(data.defaultTheme)
          // 🔥 自动应用默认主题
          await applyTheme(data.defaultTheme)
        }
      }
    } catch (error) {
      console.error('加载主题失败:', error)
    }
  }

  // 应用主题
  const applyTheme = async (themeName: string) => {
    if (platform !== 'wechat') return

    setLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, theme: themeName })
      })

      const data = await response.json()
      if (data.success && data.html) {
        setCurrentHtml(data.html)
      }
    } catch (error) {
      console.error('应用主题失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 主题切换
  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme)
    await applyTheme(newTheme)
  }

  // 保存主题偏好
  const handleSetTheme = async (themeName: string) => {
    try {
      await fetch(`/api/themes/wechat/${themeName}`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('保存主题失败:', error)
    }
  }

  return (
    <div className="split-preview-container">
      {/* 顶部操作栏 */}
      <div className="preview-header">
        <div className="header-left">
          <h1>{title}</h1>
          <span className="platform-badge">{platform}</span>
        </div>
        <div className="header-right">
          {platform === 'wechat' && themes.length > 0 && (
            <div className="theme-selector">
              <label>🎨 主题:</label>
              <select
                value={theme}
                onChange={(e) => {
                  handleThemeChange(e.target.value)
                  handleSetTheme(e.target.value)
                }}
                disabled={loading}
              >
                {themes.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 左右横栏 */}
      <div className="split-container">
        {/* 左侧：原始内容 */}
        <div className="panel panel-left">
          <div className="panel-header">📝 准备复制的内容</div>
          <div className="content">
            <pre>{content}</pre>
          </div>
        </div>

        {/* 右侧：预览效果 */}
        <div className="panel panel-right">
          <div className="panel-header">👁️ 预览效果</div>
          <div className="content">
            {currentHtml ? (
              <div
                className="markdown-body"
                dangerouslySetInnerHTML={{ __html: currentHtml }}
              />
            ) : (
              <div className="loading">加载中...</div>
            )}
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="preview-actions">
        <div className="actions-left">
          <span className="meta">ID: {postId}</span>
        </div>
        <div className="actions-right">
          <CopyButton
            content={content}
            htmlContent={currentHtml || null}
            platform={platform}
            onSuccess={() => {
              const toast = document.createElement('div')
              toast.className = 'toast success'
              toast.textContent = '✅ 已复制到剪贴板！'
              document.body.appendChild(toast)
              setTimeout(() => toast.remove(), 2000)
            }}
            onError={(err) => alert(`❌ 复制失败: ${err.message}`)}
            className="btn-lg"
          />
        </div>
      </div>
    </div>
  )
}
