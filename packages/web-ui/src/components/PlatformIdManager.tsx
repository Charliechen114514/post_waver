import { useState, useEffect } from 'react'
import { showToast } from './Toast'
import './PlatformIdManager.css'

interface PlatformIdInfo {
  postId: string
  url?: string
  publishedAt?: string
}

interface PlatformIdData {
  juejin?: PlatformIdInfo
  zhihu?: PlatformIdInfo
  csdn?: PlatformIdInfo
  wechat?: PlatformIdInfo
}

interface PlatformIdManagerProps {
  /** 文章ID */
  postId: string
  /** 更新成功回调 */
  onUpdate?: () => void
}

const platforms = [
  { key: 'juejin', name: '掘金', color: 'blue' },
  { key: 'zhihu', name: '知乎', color: 'purple' },
  { key: 'csdn', name: 'CSDN', color: 'red' },
  { key: 'wechat', name: '微信公众号', color: 'green' }
] as const

/**
 * 平台ID管理组件
 */
export function PlatformIdManager({ postId, onUpdate }: PlatformIdManagerProps) {
  const [platformIds, setPlatformIds] = useState<PlatformIdData>({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState({ postId: '', url: '' })
  const [saving, setSaving] = useState(false)

  // 加载平台ID数据
  useEffect(() => {
    if (postId) {
      loadPlatformIds()
    }
  }, [postId])

  const loadPlatformIds = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/platform-ids/${postId}`)
      if (response.ok) {
        const data = await response.json()
        setPlatformIds(data)
      }
    } catch (error) {
      console.error('加载平台ID失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (platform: string) => {
    const info = platformIds[platform as keyof PlatformIdData]
    setEditing(platform)
    setEditData({
      postId: info?.postId || '',
      url: info?.url || ''
    })
  }

  const handleCancel = () => {
    setEditing(null)
    setEditData({ postId: '', url: '' })
  }

  const handleSave = async (platform: string) => {
    try {
      setSaving(true)
      const response = await fetch(`/api/platform-ids/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          postId: editData.postId,
          url: editData.url || undefined
        })
      })

      if (response.ok) {
        setEditing(null)
        loadPlatformIds()
        onUpdate?.()
      } else {
        showToast('保存失败', 'error')
      }
    } catch (error) {
      console.error('保存失败:', error)
      showToast('保存失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (platform: string) => {
    if (!confirm(`确定要删除${platforms.find(p => p.key === platform)?.name}的平台ID吗？`)) {
      return
    }

    try {
      const response = await fetch(`/api/platform-ids/${postId}/${platform}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadPlatformIds()
        onUpdate?.()
      } else {
        showToast('删除失败', 'error')
      }
    } catch (error) {
      console.error('删除失败:', error)
      showToast('删除失败', 'error')
    }
  }

  if (loading) {
    return <div className="text-center py-4">加载中...</div>
  }

  return (
    <div className="platform-id-manager">
      <h3>平台发布状态</h3>

      <div>
        {platforms.map(platform => {
          const info = platformIds[platform.key as keyof PlatformIdData]
          const isEditing = editing === platform.key

          return (
            <div key={platform.key} className="platform-card">
              <div className="platform-card-header">
                <h4>{platform.name}</h4>
                {info && !isEditing && (
                  <span className="platform-status published">✓ 已发布</span>
                )}
                {!info && !isEditing && (
                  <span className="platform-status unpublished">未发布</span>
                )}
              </div>

              {isEditing ? (
                <div>
                  <input
                    type="text"
                    placeholder="平台文章ID"
                    value={editData.postId}
                    onChange={(e) => setEditData({ ...editData, postId: e.target.value })}
                    className="platform-input"
                  />
                  <input
                    type="text"
                    placeholder="文章URL（可选）"
                    value={editData.url}
                    onChange={(e) => setEditData({ ...editData, url: e.target.value })}
                    className="platform-input"
                  />
                  <div className="platform-actions">
                    <button
                      onClick={() => handleSave(platform.key)}
                      disabled={saving || !editData.postId}
                      className="btn btn-primary"
                    >
                      {saving ? '保存中...' : '保存'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="btn"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {info ? (
                    <div className="platform-info">
                      <p><strong>文章ID:</strong> {info.postId}</p>
                      {info.url && (
                        <p><strong>URL:</strong> <a href={info.url} target="_blank" rel="noopener noreferrer">{info.url}</a></p>
                      )}
                      {info.publishedAt && (
                        <p><strong>发布时间:</strong> {new Date(info.publishedAt).toLocaleString('zh-CN')}</p>
                      )}
                      <div className="platform-actions">
                        <button
                          onClick={() => handleEdit(platform.key)}
                          className="btn btn-primary"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(platform.key)}
                          className="btn"
                          style={{ background: '#ef4444', color: 'white' }}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(platform.key)}
                      className="btn btn-primary"
                    >
                      添加平台ID
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
