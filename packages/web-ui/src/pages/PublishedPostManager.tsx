import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { showToast } from '../components/Toast'
import './PublishedPostManager.css'

interface PlatformUrl {
  platform: string
  url: string
  publishedAt?: string
}

interface PublishedPost {
  id: string
  postId: string
  title: string
  status: string
  publishedAt: string
  tags: string[]
  platformUrls: PlatformUrl[]
  contentIndexTags?: string[]
}

export default function PublishedPostManager() {
  const [posts, setPosts] = useState<PublishedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<string | null>(null)
  const [editData, setEditData] = useState<{
    platformUrls: Record<string, string>
    tags: string[]
  }>({ platformUrls: {}, tags: [] })

  useEffect(() => {
    fetchPublishedPosts()
  }, [])

  const fetchPublishedPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/posts/published')
      if (!response.ok) {
        throw new Error('获取已发布文章失败')
      }
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (post: PublishedPost) => {
    setEditingPost(post.postId)

    // 初始化编辑数据
    const platformUrls: Record<string, string> = {}
    post.platformUrls.forEach(pu => {
      platformUrls[pu.platform] = pu.url
    })

    // 优先使用 ContentIndex 的标签，如果没有则使用 Post 的标签
    const tags = post.contentIndexTags && post.contentIndexTags.length > 0
      ? post.contentIndexTags
      : post.tags

    setEditData({ platformUrls, tags: [...tags] })
  }

  const handleCancel = () => {
    setEditingPost(null)
    setEditData({ platformUrls: {}, tags: [] })
  }

  const handleSave = async () => {
    if (!editingPost) return

    try {
      const response = await fetch(`/api/posts/${editingPost}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      })

      if (!response.ok) {
        throw new Error('保存失败')
      }

      const data = await response.json()
      if (data.success) {
        showToast('✅ 保存成功', 'success')
        await fetchPublishedPosts() // 重新获取数据
        handleCancel()
      } else {
        throw new Error(data.error || '保存失败')
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : '保存失败', 'error')
    }
  }

  const handlePlatformUrlChange = (platform: string, url: string) => {
    setEditData(prev => ({
      ...prev,
      platformUrls: {
        ...prev.platformUrls,
        [platform]: url
      }
    }))
  }

  const handleTagsChange = (tags: string) => {
    // 解析标签，支持逗号、空格、分号分隔
    const tagArray = tags
      .split(/[,\s;，；]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0)

    setEditData(prev => ({
      ...prev,
      tags: tagArray
    }))
  }

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      juejin: '掘金',
      wechat: '微信公众号',
      html: 'HTML',
      csdn: 'CSDN',
      zhihu: '知乎'
    }
    return names[platform] || platform
  }

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      juejin: '⛏️',
      wechat: '💬',
      html: '🌐',
      csdn: '📝',
      zhihu: '🧠'
    }
    return icons[platform] || '📄'
  }

  if (loading) {
    return (
      <div className="published-post-manager">
        <div className="loading">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="published-post-manager">
        <div className="error">
          <h2>加载失败</h2>
          <p>{error}</p>
          <button onClick={fetchPublishedPosts} className="btn btn-primary">
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="published-post-manager">
      <div className="page-header">
        <div>
          <h1>📚 已发布文章管理</h1>
          <p className="subtitle">管理已发布文章的平台链接和标签</p>
        </div>
        <div className="actions">
          <Link to="/publish" className="btn btn-secondary">
            ← 返回发布工作台
          </Link>
          <button onClick={fetchPublishedPosts} className="btn btn-primary">
            🔄 刷新
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <p>暂无已发布的文章</p>
          <Link to="/publish" className="btn btn-primary">
            去发布文章
          </Link>
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map(post => (
            <div key={post.postId} className="post-card">
              {editingPost === post.postId ? (
                // 编辑模式
                <div className="post-card-edit">
                  <h3>{post.title}</h3>
                  <p className="post-id">{post.postId}</p>

                  <div className="form-section">
                    <h4>平台链接</h4>
                    {(['juejin', 'csdn', 'zhihu', 'wechat', 'html'] as const).map(platform => (
                      <div key={platform} className="form-group">
                        <label>
                          {getPlatformIcon(platform)} {getPlatformName(platform)}
                        </label>
                        <input
                          type="url"
                          value={editData.platformUrls[platform] || ''}
                          onChange={(e) => handlePlatformUrlChange(platform, e.target.value)}
                          placeholder={`输入 ${getPlatformName(platform)} 发布链接...`}
                          className="input"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="form-section">
                    <h4>标签</h4>
                    <div className="form-group">
                      <label>文章标签（用逗号或空格分隔）</label>
                      <input
                        type="text"
                        value={editData.tags.join(', ')}
                        onChange={(e) => handleTagsChange(e.target.value)}
                        placeholder="例如: React, TypeScript, 前端"
                        className="input"
                      />
                      <div className="tags-preview">
                        {editData.tags.map(tag => (
                          <span key={tag} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button onClick={handleSave} className="btn btn-primary">
                      💾 保存
                    </button>
                    <button onClick={handleCancel} className="btn btn-secondary">
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                // 查看模式
                <div className="post-card-view">
                  <div className="post-header">
                    <h3>{post.title}</h3>
                    <p className="post-id">{post.postId}</p>
                    <p className="post-date">
                      发布于: {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>

                  <div className="post-section">
                    <h4>平台链接</h4>
                    {post.platformUrls.length > 0 ? (
                      <div className="platform-links">
                        {post.platformUrls.map(pu => (
                          <div key={pu.platform} className="platform-link">
                            <span className="platform-badge">
                              {getPlatformIcon(pu.platform)} {getPlatformName(pu.platform)}
                            </span>
                            {pu.url ? (
                              <a
                                href={pu.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="url-link"
                              >
                                {pu.url.length > 50 ? `${pu.url.substring(0, 50)}...` : pu.url}
                              </a>
                            ) : (
                              <span className="url-empty">未设置</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-text">暂无平台链接</p>
                    )}
                  </div>

                  <div className="post-section">
                    <h4>标签</h4>
                    {(post.contentIndexTags && post.contentIndexTags.length > 0) ? (
                      <div className="tags-list">
                        {post.contentIndexTags.map(tag => (
                          <span key={tag} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : post.tags && post.tags.length > 0 ? (
                      <div className="tags-list">
                        {post.tags.map(tag => (
                          <span key={tag} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-text">暂无标签</p>
                    )}
                  </div>

                  <div className="post-actions">
                    <button
                      onClick={() => handleEdit(post)}
                      className="btn btn-primary btn-sm"
                    >
                      ✏️ 编辑
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
