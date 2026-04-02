import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface IndexedPost {
  id: string
  title: string
  date: string
  tags: string[]
  draft: boolean
  filepath: string
}

export default function PostList() {
  const [posts, setPosts] = useState<IndexedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/posts')
      if (!response.ok) {
        throw new Error('获取文章列表失败')
      }
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  if (error) {
    return (
      <div className="error">
        <h2>加载失败</h2>
        <p>{error}</p>
        <button onClick={fetchPosts}>重试</button>
      </div>
    )
  }

  return (
    <div className="post-list">
      <div className="page-header">
        <h2>文章列表</h2>
        <p className="post-count">共 {posts.length} 篇文章</p>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <p>暂无文章</p>
        </div>
      ) : (
        <table className="posts-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>日期</th>
              <th>标签</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={post.id}>
                <td className="title-cell">
                  <Link to={`/posts/${post.id}`}>{post.title}</Link>
                </td>
                <td className="date-cell">{new Date(post.date).toLocaleDateString('zh-CN')}</td>
                <td className="tags-cell">
                  {post.tags.map(tag => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </td>
                <td className="status-cell">
                  {post.draft ? (
                    <span className="badge badge-draft">草稿</span>
                  ) : (
                    <span className="badge badge-published">已发布</span>
                  )}
                </td>
                <td className="actions-cell">
                  <Link to={`/posts/${post.id}`} className="btn btn-view">
                    查看
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
