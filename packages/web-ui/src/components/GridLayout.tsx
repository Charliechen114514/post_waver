import { useState, useEffect } from 'react'
import { CopyButton } from './CopyButton'
import { showToast } from './Toast'
import './GridLayout.css'

interface JobStatus {
  jobId: string
  postId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  currentStep: number
  totalSteps: number
  stepName: string
  progress: number
  error?: string
}

interface Platform {
  platform: string
  name: string
  icon: string
}

interface GridLayoutProps {
  postId: string
  job: JobStatus
}

const platforms: Platform[] = [
  { platform: 'juejin', name: '掘金', icon: '⛏️' },
  { platform: 'wechat', name: '微信公众号', icon: '💬' },
  { platform: 'html', name: 'HTML', icon: '🌐' }
]

export function GridLayout({ postId, job }: GridLayoutProps) {
  const [contents, setContents] = useState<Record<string, string>>({})
  const [htmlContents, setHtmlContents] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [defaultThemes, setDefaultThemes] = useState<Record<string, string>>({})

  // 加载微信主题
  useEffect(() => {
    const loadWeChatThemes = async () => {
      try {
        const response = await fetch('/api/themes/wechat')
        const data = await response.json()
        if (data.success) {
          setDefaultThemes(prev => ({ ...prev, wechat: data.defaultTheme }))
        }
      } catch (error) {
        console.error('加载微信主题失败:', error)
      }
    }
    loadWeChatThemes()
  }, [])

  // 当任务完成时，获取各平台内容
  useEffect(() => {
    if (job.status === 'completed') {
      // 对于微信平台，等待主题加载完成
      if (!defaultThemes.wechat) {
        return
      }

      platforms.forEach(async (platform) => {
        try {
          setLoading(prev => ({ ...prev, [platform.platform]: true }))

          const requestBody: any = { platform: platform.platform }
          if (platform.platform === 'wechat') {
            requestBody.theme = defaultThemes.wechat
          }

          const response = await fetch(`/api/posts/${postId}/preview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          })

          const data = await response.json()
          if (data.success) {
            setContents(prev => ({ ...prev, [platform.platform]: data.content }))
            if (data.html) {
              setHtmlContents(prev => ({ ...prev, [platform.platform]: data.html }))
            }
          }
        } catch (error) {
          console.error(`获取 ${platform.name} 内容失败:`, error)
        } finally {
          setLoading(prev => ({ ...prev, [platform.platform]: false }))
        }
      })
    }
  }, [job.status, postId, defaultThemes])

  return (
    <div className="grid-layout-container">
      {/* 任务状态横幅 */}
      {job.status !== 'completed' && (
        <div className={`status-banner ${job.status}`}>
          {job.status === 'running' && (
            <>
              <span className="spinner">🔄</span>
              <span>正在处理: {job.stepName} ({job.currentStep}/{job.totalSteps})</span>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              <span className="progress-text">{job.progress}%</span>
            </>
          )}
          {job.status === 'pending' && (
            <span>⏳ 等待处理中...</span>
          )}
          {job.status === 'failed' && (
            <span>❌ 处理失败: {job.error || '未知错误'}</span>
          )}
        </div>
      )}

      {/* Grid 布局 */}
      <div className="grid">
        {platforms.map((platform) => (
          <div key={platform.platform} className="card">
            {/* 卡片标题 */}
            <div className="card-header">
              <h2>{platform.icon} {platform.name}</h2>
              {job.status === 'running' && (
                <div className="mini-progress">
                  <div
                    className="mini-progress-bar"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* 卡片内容 */}
            <div className="card-body">
              {job.status === 'completed' ? (
                loading[platform.platform] ? (
                  <div className="loading">加载中...</div>
                ) : contents[platform.platform] ? (
                  <>
                    <div className="content-preview">
                      {htmlContents[platform.platform] ? (
                        // 对于有 HTML 的平台（微信公众号），显示富文本预览
                        <div
                          className={`html-preview ${platform.platform === 'wechat' ? 'markdown-body' : ''}`}
                          dangerouslySetInnerHTML={{
                            __html: htmlContents[platform.platform]
                          }}
                          style={{ maxHeight: '300px', overflow: 'auto' }}
                        />
                      ) : (
                        // 对于其他平台，显示纯文本预览
                        <pre>{contents[platform.platform].substring(0, 200)}...</pre>
                      )}
                    </div>
                    <div className="card-actions">
                      <CopyButton
                        content={contents[platform.platform]}
                        htmlContent={htmlContents[platform.platform] || null}
                        platform={platform.platform as any}
                        onSuccess={() => showToast(`${platform.name} 内容已复制到剪贴板！`, 'success')}
                        onError={(err) => showToast(`复制失败: ${err.message}`, 'error')}
                      />
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          const newWindow = window.open('', '_blank')
                          if (newWindow) {
                            if (htmlContents[platform.platform]) {
                              // 对于有 HTML 的平台，显示完整 HTML
                              // 注意：微信主题 CSS 需要包裹在 .markdown-body 类中才能生效
                              const wrappedContent = platform.platform === 'wechat'
                                ? `<div class="markdown-body">${htmlContents[platform.platform]}</div>`
                                : htmlContents[platform.platform]

                              newWindow.document.write(`
                                <html>
                                  <head>
                                    <title>${platform.name} 预览</title>
                                    <meta charset="UTF-8">
                                    <style>
                                      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
                                      pre { background: #f4f4f4; padding: 1em; overflow-x: auto; }
                                      code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; }
                                    </style>
                                  </head>
                                  <body>${wrappedContent}</body>
                                </html>
                              `)
                              newWindow.document.close()
                            } else {
                              // 对于纯文本平台
                              newWindow.document.write(`
                                <html>
                                  <head><title>${platform.name} 预览</title></head>
                                  <body style="font-family: monospace; padding: 20px; line-height: 1.6;">
                                    <pre>${contents[platform.platform]}</pre>
                                  </body>
                                </html>
                              `)
                            }
                            newWindow.document.close()
                          }
                        }}
                      >
                        👁️ 预览
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="loading">加载中...</div>
                )
              ) : (
                <div className="waiting">
                  {job.status === 'running' ? '正在生成...' : '等待处理...'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
