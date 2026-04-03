import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SplitPreview } from '../components/SplitPreview'
import { showToast } from '../components/Toast'
import './PostPreview.css'

export default function PostPreview() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const [platform, setPlatform] = useState<string>('wechat')
  const [content, setContent] = useState<string>('')
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (postId) {
      loadPreview()
    }
  }, [postId, platform])

  const loadPreview = async () => {
    if (!postId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      })

      const data = await response.json()
      if (data.success) {
        setTitle(data.title)
        setContent(data.content)
        setHtmlContent(data.html || '')
      } else {
        showToast(`加载失败: ${data.error}`, 'error')
      }
    } catch (error) {
      console.error('加载预览失败:', error)
      showToast('加载预览失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div className="preview-page">
      {/* 平台选择器 */}
      <div className="platform-selector-bar">
        <button
          onClick={() => navigate('/publish')}
          className="back-btn"
        >
          ← 返回
        </button>
        <div className="platform-options">
          {[
            { value: 'juejin', label: '掘金', icon: '⛏️' },
            { value: 'csdn', label: 'CSDN', icon: '📝' },
            { value: 'zhihu', label: '知乎', icon: '🧠' },
            { value: 'wechat', label: '微信公众号', icon: '💬' },
            { value: 'html', label: 'HTML', icon: '🌐' }
          ].map((p) => (
            <button
              key={p.value}
              className={`platform-option ${platform === p.value ? 'active' : ''}`}
              onClick={() => setPlatform(p.value)}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 左右横栏预览 */}
      <SplitPreview
        postId={postId || ''}
        title={title}
        platform={platform}
        content={content}
        htmlContent={htmlContent}
      />
    </div>
  )
}
