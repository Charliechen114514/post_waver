import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CopyButton } from '../components/CopyButton'
import { PlatformIdManager } from '../components/PlatformIdManager'

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

type Platform = 'juejin' | 'wechat' | 'html'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [transformedContent, setTransformedContent] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('juejin')
  const [loading, setLoading] = useState(true)
  const [transforming, setTransforming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchPost(id)
    }
  }, [id])

  const fetchPost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`)
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

  const handleTransform = async () => {
    if (!id) return

    setTransforming(true)
    try {
      const response = await fetch(`/api/posts/${id}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ platform: selectedPlatform })
      })

      if (!response.ok) {
        throw new Error('转换失败')
      }

      const data = await response.json()
      setTransformedContent(data.content)
    } catch (err) {
      alert(err instanceof Error ? err.message : '转换失败')
    } finally {
      setTransforming(false)
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

        {/* 平台内容转换和复制 */}
        <div className="actions">
          <h3>📋 发布到平台</h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              选择目标平台：
            </label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value as Platform)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px',
                minWidth: '200px'
              }}
            >
              <option value="juejin">掘金</option>
              <option value="wechat">微信公众号</option>
              <option value="html">HTML</option>
            </select>
          </div>

          <div className="button-group">
            <button
              className="btn btn-primary"
              onClick={handleTransform}
              disabled={transforming}
            >
              {transforming ? '转换中...' : '🔄 转换内容'}
            </button>

            {transformedContent && (
              <CopyButton
                content={transformedContent}
                platform={selectedPlatform}
                onSuccess={() => alert('✅ 已复制到剪贴板！')}
                onError={(err) => alert(`❌ 复制失败: ${err.message}`)}
              />
            )}
          </div>
        </div>

        {/* 转换后的内容预览 */}
        {transformedContent && (
          <div className="preview-section">
            <div className="preview-header">
              <h3>📝 转换后内容预览</h3>
            </div>
            <div className="preview-content">
              <pre style={{
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                fontSize: '14px',
                lineHeight: '1.6',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                {transformedContent}
              </pre>
            </div>
          </div>
        )}

        {/* 平台ID管理 */}
        {id && (
          <div style={{ marginTop: '32px' }}>
            <PlatformIdManager
              postId={id}
              onUpdate={() => console.log('平台ID已更新')}
            />
          </div>
        )}

        {/* 文章导航 */}
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

        {/* 相关文章 */}
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
