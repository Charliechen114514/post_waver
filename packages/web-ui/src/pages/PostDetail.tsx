import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

interface Frontmatter {
  title: string
  date: string
  tags: string[]
  description?: string
  draft?: boolean
}

interface Post {
  id: string
  title: string
  date: string
  tags: string[]
  content: string
  frontmatter: Frontmatter
  prev?: string
  next?: string
  related?: Array<{ id: string; title: string; score: number }>
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [previewContent, setPreviewContent] = useState<{ content: string; title: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (id) {
      fetchPost(id)
    }
  }, [id])

  const fetchPost = async (postId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/posts/${postId}`)
      if (!response.ok) {
        throw new Error('获取文章详情失败')
      }
      const data = await response.json()
      setPost(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async (platform: 'juejin' | 'wechat') => {
    if (!id) return

    setPreviewLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/api/posts/${id}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ platform })
      })

      if (!response.ok) {
        throw new Error('预览失败')
      }

      const data = await response.json()
      setPreviewContent({ content: data.content, title: data.title })
      setShowPreview(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : '预览失败')
    } finally {
      setPreviewLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  if (error || !post) {
    return (
      <div className="error">
        <h2>加载失败</h2>
        <p>{error || '文章不存在'}</p>
        <Link to="/" className="btn">
          返回列表
        </Link>
      </div>
    )
  }

  return (
    <div className="post-detail">
      <div className="breadcrumb">
        <Link to="/">文章列表</Link>
        <span className="separator">/</span>
        <span className="current">{post.title}</span>
      </div>

      <article className="post-content">
        <header className="post-header">
          <h1>{post.title}</h1>
          <div className="post-meta">
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString('zh-CN')}
            </time>
            <div className="tags">
              {post.tags.map(tag => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </header>

        <div className="actions">
          <h3>发布操作</h3>
          <div className="button-group">
            <button
              className="btn btn-primary"
              onClick={() => handlePreview('juejin')}
              disabled={previewLoading}
            >
              {previewLoading ? '加载中...' : '预览掘金'}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handlePreview('wechat')}
              disabled={previewLoading}
            >
              {previewLoading ? '加载中...' : '预览微信'}
            </button>
          </div>
        </div>

        {showPreview && previewContent && (
          <div className="preview-section">
            <div className="preview-header">
              <h3>预览内容</h3>
              <button
                className="btn btn-secondary"
                onClick={() => setShowPreview(false)}
              >
                关闭预览
              </button>
            </div>
            <div className="preview-content">
              <h4>{previewContent.title}</h4>
              <div
                dangerouslySetInnerHTML={{ __html: previewContent.content }}
              />
            </div>
          </div>
        )}

        {post.prev && (
          <div className="navigation prev">
            <span className="nav-label">上一篇：</span>
            <Link to={`/posts/${post.prev}`}>查看</Link>
          </div>
        )}

        {post.next && (
          <div className="navigation next">
            <span className="nav-label">下一篇：</span>
            <Link to={`/posts/${post.next}`}>查看</Link>
          </div>
        )}

        {post.related && post.related.length > 0 && (
          <div className="related-posts">
            <h3>相关文章</h3>
            <ul>
              {post.related.map(r => (
                <li key={r.id}>
                  <Link to={`/posts/${r.id}`}>{r.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </div>
  )
}
