import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { SplitPreview } from '../components/SplitPreview'
import { ArticleListSidebar } from '../components/ArticleListSidebar'
import { showToast } from '../components/Toast'
import './PublishWorkspace.css'

interface Post {
  id: string
  title: string
  date: string
  status: string
  workflowStatus?: string
}

interface Theme {
  name: string
  displayName: string
  description: string
  cssFile: string
}

type Platform = 'juejin' | 'wechat' | 'html'

export default function PublishWorkspace() {
  const navigate = useNavigate()
  const location = useLocation()
  const hasInitialized = useRef(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([])
  const [currentPreviewId, setCurrentPreviewId] = useState<string>('')
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('juejin')
  const [previewContent, setPreviewContent] = useState<string>('')
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [themes, setThemes] = useState<Theme[]>([])
  const [selectedTheme, setSelectedTheme] = useState<string>('orangeheart')
  const [showSidebar, setShowSidebar] = useState<boolean>(true)

  // 从 localStorage 读取左侧栏显示状态
  useEffect(() => {
    const saved = localStorage.getItem('publishSidebarVisible')
    if (saved !== null) {
      setShowSidebar(JSON.parse(saved))
    }
  }, [])

  // 扫描文章
  const handleScan = async (showAlert = true) => {
    setLoading(true)
    try {
      const response = await fetch('/api/workflow/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()
      if (data.success) {
        setPosts(data.posts || [])
        if (data.posts && data.posts.length > 0) {
          setCurrentPreviewId(data.posts[0].id)
        }
        if (showAlert) {
          showToast(`✅ 扫描完成！找到 ${data.total} 篇文章`, 'success')
        }
      } else {
        if (showAlert) {
          showToast(`❌ 扫描失败: ${data.error}`, 'error')
        }
      }
    } catch (error) {
      console.error('扫描失败:', error)
      if (showAlert) {
        showToast('❌ 扫描失败，请检查 API 服务器是否运行', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  // 初始加载（只执行一次）
  useEffect(() => {
    if (!hasInitialized.current) {
      handleScan(false) // 初始化扫描不显示提示
      loadThemes()
      hasInitialized.current = true
    }
  }, [])

  // 从发布页面返回时重新扫描（但不重复初始化）
  useEffect(() => {
    if (hasInitialized.current) {
      handleScan(false) // 返回时重新扫描但不显示提示
    }
  }, [location.pathname])

  // 加载微信主题列表
  const loadThemes = async () => {
    try {
      const response = await fetch('/api/themes/wechat')
      const data = await response.json()
      if (data.success) {
        setThemes(data.themes || [])
        if (data.defaultTheme) {
          setSelectedTheme(data.defaultTheme)
        }
      }
    } catch (error) {
      console.error('加载主题失败:', error)
    }
  }

  // 设置主题（静默切换，不弹提示）
  const handleSetTheme = async (themeName: string) => {
    try {
      const response = await fetch(`/api/themes/wechat/${themeName}`, {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        setSelectedTheme(themeName)
        // 重新获取预览内容以应用新主题
        if (currentPreviewId) {
          const previewResponse = await fetch(`/api/posts/${currentPreviewId}/preview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              platform: selectedPlatform,
              theme: themeName
            })
          })
          const previewData = await previewResponse.json()
          if (previewData.success) {
            setPreviewContent(previewData.content)
            setHtmlContent(previewData.html || '')
          }
        }
      }
    } catch (error) {
      console.error('设置主题失败:', error)
      // 失败时也不弹出提示，避免打断用户操作
    }
  }

  // 预览内容
  useEffect(() => {
    if (!currentPreviewId) return

    const fetchPreview = async () => {
      try {
        const response = await fetch(`/api/posts/${currentPreviewId}/preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: selectedPlatform,
            theme: selectedPlatform === 'wechat' ? selectedTheme : undefined
          })
        })

        const data = await response.json()
        if (data.success) {
          setPreviewContent(data.content)
          setHtmlContent(data.html || '')
        }
      } catch (error) {
        console.error('预览失败:', error)
      }
    }

    fetchPreview()
  }, [currentPreviewId, selectedPlatform, selectedTheme])

  // 切换平台
  const currentPost = posts.find(p => p.id === currentPreviewId)

  // 切换预览文章
  const handlePreviewChange = (postId: string) => {
    setCurrentPreviewId(postId)
  }

  // 批量发布
  const handleBatchPublish = () => {
    if (selectedPostIds.length === 0) {
      showToast('请先选择要发布的文章', 'warning')
      return
    }
    setShowBatchModal(true)
  }

  // 确认批量发布
  const handleBatchPublishConfirm = async (postIds: string[]) => {
    try {
      const response = await fetch('/api/workflow/batch-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postIds,
          skipPreview: true  // 在 GUI 中已完成预览确认
        })
      })

      const data = await response.json()
      if (data.success) {
        setShowBatchModal(false)
        // 跳转到发布界面
        navigate(`/publishing/${data.batchId}`)
      } else {
        showToast(`❌ 发布失败: ${data.error}`, 'error')
      }
    } catch (error) {
      console.error('批量发布失败:', error)
      showToast('❌ 批量发布失败，请检查 API 服务器是否运行', 'error')
    }
  }

  // 切换左侧栏显示
  const toggleSidebar = () => {
    const newState = !showSidebar
    setShowSidebar(newState)
    localStorage.setItem('publishSidebarVisible', JSON.stringify(newState))
  }

  // 切换文章勾选状态
  const togglePostId = (postId: string) => {
    if (selectedPostIds.includes(postId)) {
      setSelectedPostIds(selectedPostIds.filter(id => id !== postId))
    } else {
      setSelectedPostIds([...selectedPostIds, postId])
    }
  }

  return (
    <div className="publish-workspace">
      {/* 顶部操作栏 */}
      <div className="top-bar">
        <div className="top-bar-left">
          <button
            onClick={toggleSidebar}
            className="btn-icon"
            title={showSidebar ? '隐藏文章列表' : '显示文章列表'}
          >
            {showSidebar ? '◀' : '▶'}
          </button>
          <h1>📝 发布工作台</h1>
        </div>
        <div className="actions">
          <button
            onClick={() => handleScan(true)}
            disabled={loading}
            className="btn btn-secondary"
          >
            {loading ? '🔄 扫描中...' : '🔄 扫描文章'}
          </button>
          <button
            onClick={handleBatchPublish}
            disabled={selectedPostIds.length === 0}
            className="btn btn-primary"
          >
            📦 批量发布 ({selectedPostIds.length})
          </button>
        </div>
      </div>

      {/* 工作区容器 */}
      <div className="workspace-container">
        {/* 左侧文章列表栏 */}
        {showSidebar && (
          <ArticleListSidebar
            jobs={posts.map(post => ({
              jobId: post.id,
              postId: post.id,
              status: 'pending' as const,
              currentStep: 0,
              totalSteps: 1,
              stepName: '准备发布',
              progress: 0,
              startedAt: post.date
            }))}
            selectedPostIds={selectedPostIds}
            onToggle={togglePostId}
            onSelectPost={(postId) => setCurrentPreviewId(postId)}
          />
        )}

        {/* 右侧主内容区 */}
        <div className="main-content">
          {/* 选择器区域 */}
          <div className="selection-area">
            <div className="selector-group">
              <label>选择文章：</label>
              {posts.length > 0 ? (
                <select
                  value={currentPreviewId}
                  onChange={(e) => handlePreviewChange(e.target.value)}
                  className="select"
                >
                  {posts.map(post => (
                    <option key={post.id} value={post.id}>
                      {post.title} ({post.id})
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value=""
                  disabled
                  className="select disabled"
                >
                  <option>暂无文章，请先扫描</option>
                </select>
              )}
            </div>

            <div className="selector-group">
              <label>目标平台：</label>
              <div className="platform-selector">
                {[
                  { value: 'juejin', label: '掘金', icon: '⛏️' },
                  { value: 'wechat', label: '微信公众号', icon: '💬' },
                  { value: 'html', label: 'HTML', icon: '🌐' }
                ].map(platform => (
                  <button
                    key={platform.value}
                    className={`platform-btn ${selectedPlatform === platform.value ? 'active' : ''}`}
                    onClick={() => setSelectedPlatform(platform.value as Platform)}
                  >
                    {platform.icon} {platform.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 微信主题选择器 */}
            {selectedPlatform === 'wechat' && (
              <div className="selector-group">
                <label>微信主题：</label>
                <select
                  value={selectedTheme}
                  onChange={(e) => handleSetTheme(e.target.value)}
                  className="select"
                >
                  {themes.map(theme => (
                    <option key={theme.name} value={theme.name}>
                      {theme.displayName} - {theme.description}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={selectedPostIds.includes(currentPreviewId)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPostIds([...selectedPostIds, currentPreviewId])
                    } else {
                      setSelectedPostIds(selectedPostIds.filter(id => id !== currentPreviewId))
                    }
                  }}
                  disabled={!currentPreviewId}
                />
                加入发布列表
              </label>
            </div>
          </div>

          {/* 预览区域 */}
          <div className="preview-area">
            {currentPost ? (
              <div className="preview-content">
                {htmlContent ? (
                  <SplitPreview
                    postId={currentPreviewId}
                    title={currentPost.title}
                    platform={selectedPlatform}
                    content={previewContent}
                    htmlContent={htmlContent}
                    externalTheme={selectedPlatform === 'wechat' ? selectedTheme : undefined}
                  />
                ) : (
                  <div className="loading">加载中...</div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <p>请选择一篇文章进行预览</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 批量发布模态框 */}
      {showBatchModal && (
        <div className="modal-overlay" onClick={() => setShowBatchModal(false)}>
          <div className="modal-content batch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>批量发布 ({selectedPostIds.length} 篇文章)</h2>
              <button className="close-btn" onClick={() => setShowBatchModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-tip">💡 建议预览每篇文章后再确认发布</p>
              <ul className="post-list">
                {selectedPostIds.map(id => {
                  const post = posts.find(p => p.id === id)
                  return (
                    <li key={id} className="post-item">
                      <span className="post-title">{post?.title || id}</span>
                    </li>
                  )
                })}
              </ul>

              {/* 预览确认提示 */}
              <div className="preview-checklist">
                <h3>发布前确认清单：</h3>
                <label>
                  <input type="checkbox" id="confirm-preview" />
                  <span>我已经预览了所有选中的文章</span>
                </label>
                <label>
                  <input type="checkbox" id="confirm-content" />
                  <span>确认文章内容正确无误</span>
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowBatchModal(false)}
                className="btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const previewChecked = (document.getElementById('confirm-preview') as HTMLInputElement)?.checked
                  const contentChecked = (document.getElementById('confirm-content') as HTMLInputElement)?.checked

                  if (!previewChecked || !contentChecked) {
                    showToast('请确认已完成预览和内容检查', 'warning')
                    return
                  }

                  handleBatchPublishConfirm(selectedPostIds)
                }}
                className="btn btn-primary"
              >
                ✅ 确认发布
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
