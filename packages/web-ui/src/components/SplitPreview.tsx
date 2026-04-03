import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CopyButton } from './CopyButton'
import { showToast } from './Toast'
import './SplitPreview.css'

interface SplitPreviewProps {
  postId: string
  title: string
  platform: string
  content: string
  htmlContent?: string
  externalTheme?: string // External theme from parent component
}

export function SplitPreview({ postId, title, platform, content, htmlContent, externalTheme }: SplitPreviewProps) {
  const [theme, setTheme] = useState<string>(externalTheme || 'orangeheart')
  const [themes, setThemes] = useState<any[]>([])
  const [currentHtml, setCurrentHtml] = useState<string>(htmlContent || '')
  const [loading, setLoading] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // 是否为微信平台
  const isWeChat = platform === 'wechat'

  // 加载主题列表（仅微信平台）
  useEffect(() => {
    if (isWeChat) {
      loadThemes()
    }
  }, [isWeChat])

  // 监听 htmlContent prop 变化
  useEffect(() => {
    if (htmlContent) {
      setCurrentHtml(htmlContent)
    }
  }, [htmlContent])

  // 在 HTML 内容更新后重新绑定链接拦截器
  useEffect(() => {
    const previewElement = previewRef.current
    if (!previewElement) return

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a') as HTMLAnchorElement

      if (anchor && anchor.href) {
        const url = new URL(anchor.href)
        const pathname = url.pathname

        // 检查是否是 Hexo 风格的相关链接 (如 /2026/04/03/test-01-js-basics/)
        const hexoLinkPattern = /^\/\d{4}\/\d{2}\/\d{2}\/[^/]+\/?$/
        if (hexoLinkPattern.test(pathname)) {
          e.preventDefault()
          // 提取文章 ID
          const id = pathname.split('/').filter(Boolean).pop()
          if (id) {
            console.log(`📎 相关链接跳转: ${anchor.textContent} -> /post_waver/preview/${id}`)
            navigate(`/preview/${id.replace(/\/$/, '')}`)
          }
        }
      }
    }

    previewElement.addEventListener('click', handleLinkClick)

    return () => {
      previewElement.removeEventListener('click', handleLinkClick)
    }
  }, [currentHtml, navigate])

  // 监听外部主题变化（仅微信平台）
  useEffect(() => {
    if (isWeChat && externalTheme) {
      setTheme(externalTheme)
      // 注意：不在这里调用 applyTheme，因为 PublishWorkspace 已经重新获取了预览内容
    }
  }, [externalTheme, isWeChat])

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

  // 应用主题（仅微信平台）
  const applyTheme = async (themeName: string) => {
    if (!isWeChat) return

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
          {isWeChat && themes.length > 0 && (
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
                ref={previewRef}
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
              showToast('已复制到剪贴板！', 'success')
            }}
            onError={(err) => showToast(`复制失败: ${err.message}`, 'error')}
            className="btn-lg"
          />
        </div>
      </div>
    </div>
  )
}
