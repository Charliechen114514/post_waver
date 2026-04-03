import { useState, useEffect } from 'react'
import { CopyButton } from './CopyButton'
import { showToast } from './Toast'
import './GridLayout.css'

interface JobOutputs {
  wechatReplacedContent?: string
  injectionTemplateId?: string
  includeRelatedLinks?: boolean
}

interface PlatformUrlData {
  postId: string
  url: string
  publishedAt: string
}

interface JobStatus {
  jobId: string
  postId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  currentStep: number
  totalSteps: number
  stepName: string
  progress: number
  error?: string
  outputs?: JobOutputs
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
  const [platformUrls, setPlatformUrls] = useState<Record<string, string>>({})
  const [showUrlDialog, setShowUrlDialog] = useState(false)
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null)
  const [newUrl, setNewUrl] = useState('')

  // 文章的平台 URL 数据
  const [postPlatformUrls, setPostPlatformUrls] = useState<Record<string, PlatformUrlData>>({})
  const [showPostUrlDialog, setShowPostUrlDialog] = useState(false)
  const [editingPostUrlPlatform, setEditingPostUrlPlatform] = useState<string | null>(null)
  const [newPostUrl, setNewPostUrl] = useState('')

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

  // 加载全局的平台发布 URLs（只加载一次）
  useEffect(() => {
    const loadPlatformUrls = async () => {
      try {
        const response = await fetch('/api/platform-urls')
        const data = await response.json()
        if (data.success) {
          setPlatformUrls(data.data || {})
        }
      } catch (error) {
        console.error('获取平台 URL 失败:', error)
      }
    }
    loadPlatformUrls()
  }, []) // 空依赖数组，只在组件挂载时加载一次

  // 加载文章的平台 URL（只加载一次）
  useEffect(() => {
    const loadPostPlatformUrls = async () => {
      try {
        const response = await fetch(`/api/posts/${postId}/platform-urls`)
        const data = await response.json()
        if (data.success) {
          setPostPlatformUrls(data.data || {})
        }
      } catch (error) {
        console.error('获取文章平台 URL 失败:', error)
      }
    }
    loadPostPlatformUrls()
  }, [postId]) // postId 改变时重新加载

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

          // 🔧 从 Job outputs 中获取模板配置
          const requestBody: any = { platform: platform.platform }
          if (platform.platform === 'wechat') {
            requestBody.theme = defaultThemes.wechat
          }

          // 添加注入模板和相关链接配置
          if (job.outputs?.injectionTemplateId) {
            requestBody.injectionTemplateId = job.outputs.injectionTemplateId
          }
          if (job.outputs?.includeRelatedLinks !== undefined) {
            requestBody.includeRelatedLinks = job.outputs.includeRelatedLinks
          }

          console.log(`[GridLayout] 获取 ${platform.name} 内容，参数:`, requestBody)

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

            // 显示成功提示
            if (response.status === 200 && data.hint) {
              showToast(data.hint, 'success')
            }
          } else {
            // 处理错误情况
            console.error(`获取 ${platform.name} 内容失败:`, data.error)

            if (response.status === 404) {
              // 文章已发布，提示用户
              showToast(`📄 文章已发布到 done 目录，已从发布目录加载`, 'success')
            } else {
              showToast(`获取 ${platform.name} 内容失败: ${data.error || '未知错误'}`, 'error')
            }
          }
        } catch (error) {
          console.error(`获取 ${platform.name} 内容失败:`, error)
          showToast(`网络错误，请检查API服务器是否运行`, 'error')
        } finally {
          setLoading(prev => ({ ...prev, [platform.platform]: false }))
        }
      })
    }
  }, [job.status, postId, defaultThemes])

  // URL 设置处理函数
  const handleSetUrl = (platform: string) => {
    setEditingPlatform(platform)
    setNewUrl(platformUrls[platform] || '')
    setShowUrlDialog(true)
  }

  const handleSaveUrl = async () => {
    if (!editingPlatform) return

    try {
      const response = await fetch('/api/platform-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: editingPlatform,
          url: newUrl
        })
      })

      if (response.ok) {
        setPlatformUrls(prev => ({ ...prev, [editingPlatform]: newUrl }))
        setShowUrlDialog(false)
        showToast(`${editingPlatform} 发布 URL 已设置！`, 'success')
      } else {
        const errorData = await response.json()
        showToast(`设置 URL 失败: ${errorData.error || '未知错误'}`, 'error')
      }
    } catch (error) {
      showToast(`设置 URL 失败: ${error instanceof Error ? error.message : String(error)}`, 'error')
    }
  }

  const handleDeleteUrl = async () => {
    if (!editingPlatform) return

    try {
      const response = await fetch('/api/platform-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: editingPlatform,
          url: '' // 空字符串表示删除URL
        })
      })

      if (response.ok) {
        setPlatformUrls(prev => {
          const newUrls = { ...prev }
          delete newUrls[editingPlatform]
          return newUrls
        })
        setShowUrlDialog(false)
        showToast(`${editingPlatform} 发布 URL 已清除`, 'success')
      } else {
        const errorData = await response.json()
        showToast(`清除 URL 失败: ${errorData.error || '未知错误'}`, 'error')
      }
    } catch (error) {
      showToast(`清除 URL 失败: ${error instanceof Error ? error.message : String(error)}`, 'error')
    }
  }

  // 文章平台 URL 处理函数
  const handleSetPostUrl = (platform: string) => {
    setEditingPostUrlPlatform(platform)
    setNewPostUrl(postPlatformUrls[platform]?.url || '')
    setShowPostUrlDialog(true)
  }

  const handleSavePostUrl = async () => {
    if (!editingPostUrlPlatform) return

    try {
      const response = await fetch(`/api/posts/${postId}/platform-urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: editingPostUrlPlatform,
          url: newPostUrl
        })
      })

      if (response.ok) {
        setPostPlatformUrls(prev => ({
          ...prev,
          [editingPostUrlPlatform]: {
            postId,
            url: newPostUrl,
            publishedAt: new Date().toISOString()
          }
        }))
        setShowPostUrlDialog(false)
        showToast(`${editingPostUrlPlatform} 平台 URL 已保存！`, 'success')
      } else {
        const errorData = await response.json()
        showToast(`保存失败: ${errorData.error || '未知错误'}`, 'error')
      }
    } catch (error) {
      showToast(`保存失败: ${error instanceof Error ? error.message : String(error)}`, 'error')
    }
  }

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

                      {/* 文章平台 URL 管理 */}
                      {postPlatformUrls[platform.platform] ? (
                        <button
                          className="btn btn-success"
                          onClick={() => window.open(postPlatformUrls[platform.platform].url, '_blank')}
                          title="已发布，点击查看"
                        >
                          ✅ 已发布
                        </button>
                      ) : (
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleSetPostUrl(platform.platform)}
                          title="注册发布后的文章 URL"
                        >
                          🔗 注册 URL
                        </button>
                      )}

                      {platformUrls[platform.platform] ? (
                        <>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleSetUrl(platform.platform)}
                            title="编辑发布页面 URL"
                          >
                            ✏️ 编辑
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() => window.open(platformUrls[platform.platform], '_blank')}
                            title="点击我直接跳转发布新内容"
                          >
                            🚀 发布新内容
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleSetUrl(platform.platform)}
                          title="设置发布页面 URL"
                        >
                          🔗 设置 URL
                        </button>
                      )}
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

      {/* URL 设置对话框 */}
      {showUrlDialog && (
        <div className="url-dialog-overlay" onClick={() => setShowUrlDialog(false)}>
          <div className="url-dialog" onClick={e => e.stopPropagation()}>
            <h3>设置发布页面 URL</h3>
            <p>请输入 {editingPlatform} 平台的发布页面 URL:</p>
            <input
              type="text"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="例如: https://juejin.cn/editor/drafts/new"
              className="url-input"
            />
            {/* 常用 URL 快捷按钮 */}
            <div className="url-presets">
              <span className="preset-label">快捷选择：</span>
              {editingPlatform === 'juejin' && (
                <button className="btn-preset" onClick={() => setNewUrl('https://juejin.cn/editor/drafts/new')}>
                  掘金编辑器
                </button>
              )}
              {editingPlatform === 'wechat' && (
                <button className="btn-preset" onClick={() => setNewUrl('https://mp.weixin.qq.com/')}>
                  微信公众平台
                </button>
              )}
              {editingPlatform === 'html' && (
                <>
                  <button className="btn-preset" onClick={() => setNewUrl('https://juejin.cn/editor/drafts/new')}>
                    掘金
                  </button>
                  <button className="btn-preset" onClick={() => setNewUrl('https://zhuanlan.zhihu.com/write')}>
                    知乎
                  </button>
                  <button className="btn-preset" onClick={() => setNewUrl('https://mp.csdn.net/mp_blog/creation/editor')}>
                    CSDN
                  </button>
                </>
              )}
            </div>
            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={() => setShowUrlDialog(false)}>
                取消
              </button>
              {platformUrls[editingPlatform!] && (
                <button className="btn btn-danger" onClick={handleDeleteUrl}>
                  清除 URL
                </button>
              )}
              <button className="btn btn-primary" onClick={handleSaveUrl}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 文章平台 URL 设置对话框 */}
      {showPostUrlDialog && (
        <div className="url-dialog-overlay" onClick={() => setShowPostUrlDialog(false)}>
          <div className="url-dialog" onClick={e => e.stopPropagation()}>
            <h3>🔗 注册文章发布 URL</h3>
            <p>请输入文章发布到 {editingPostUrlPlatform} 平台后的真实 URL:</p>
            <input
              type="text"
              value={newPostUrl}
              onChange={e => setNewPostUrl(e.target.value)}
              placeholder="例如: https://juejin.cn/post/7123456789012345"
              className="url-input"
            />
            <div className="url-presets">
              <span className="preset-label">提示：</span>
              <span style={{ fontSize: '13px', color: '#666' }}>
                发布文章后，将平台返回的真实 URL 填入此处。这将用于相关文章链接。
              </span>
            </div>
            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={() => setShowPostUrlDialog(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSavePostUrl}>
                💾 保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
