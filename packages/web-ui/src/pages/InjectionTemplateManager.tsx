import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { InjectionTemplateEditor } from '../components/InjectionTemplateEditor'
import { showToast } from '../components/Toast'
import './InjectionTemplateManager.css'

interface InjectionTemplate {
  id: string
  name: string
  description: string
  content: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

interface TemplateInput {
  name: string
  description: string
  content: string
  enabled: boolean
}

export default function InjectionTemplateManager() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<InjectionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<InjectionTemplate | undefined>()
  const [deleting, setDeleting] = useState<string | null>(null)

  // 加载模板列表
  const loadTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/injection-templates')
      const data = await response.json()

      if (data.success) {
        setTemplates(data.templates || [])
      } else {
        showToast('❌ 加载模板失败', 'error')
      }
    } catch (error) {
      console.error('加载模板失败:', error)
      showToast('❌ 加载模板失败，请检查API服务器', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  // 创建或保存模板
  const handleSave = async (template: TemplateInput) => {
    try {
      let response
      if (editingTemplate) {
        // 更新
        response = await fetch(`/api/injection-templates/${editingTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template)
        })
      } else {
        // 创建
        response = await fetch('/api/injection-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template)
        })
      }

      const data = await response.json()

      if (data.success) {
        await loadTemplates()
        setShowEditor(false)
        setEditingTemplate(undefined)
        return data
      } else {
        throw new Error(data.error || '保存失败')
      }
    } catch (error: any) {
      throw error
    }
  }

  // 删除模板
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此模板吗？此操作不可撤销。')) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/injection-templates/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        showToast('✅ 模板已删除', 'success')
        await loadTemplates()
      } else {
        showToast(`❌ 删除失败: ${data.error}`, 'error')
      }
    } catch (error: any) {
      console.error('删除模板失败:', error)
      showToast('❌ 删除失败，请检查API服务器', 'error')
    } finally {
      setDeleting(null)
    }
  }

  // 切换启用状态
  const handleToggleEnabled = async (template: InjectionTemplate) => {
    try {
      const response = await fetch(`/api/injection-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !template.enabled })
      })

      const data = await response.json()

      if (data.success) {
        await loadTemplates()
        showToast(`✅ 模板已${template.enabled ? '禁用' : '启用'}`, 'success')
      } else {
        showToast(`❌ 操作失败: ${data.error}`, 'error')
      }
    } catch (error) {
      console.error('切换状态失败:', error)
      showToast('❌ 操作失败', 'error')
    }
  }

  // 打开编辑器
  const openCreate = () => {
    setEditingTemplate(undefined)
    setShowEditor(true)
  }

  const openEdit = (template: InjectionTemplate) => {
    setEditingTemplate(template)
    setShowEditor(true)
  }

  // 关闭编辑器
  const closeEditor = () => {
    setShowEditor(false)
    setEditingTemplate(undefined)
  }

  if (showEditor) {
    return (
      <div className="injection-template-manager">
        <div className="manager-header">
          <button onClick={closeEditor} className="btn btn-secondary">
            ← 返回列表
          </button>
        </div>
        <InjectionTemplateEditor
          template={editingTemplate}
          onSave={handleSave}
          onCancel={closeEditor}
        />
      </div>
    )
  }

  return (
    <div className="injection-template-manager">
      <div className="manager-header">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary back-button"
          title="返回上一页"
        >
          ← 返回
        </button>
        <div className="header-title">
          <h1>📝 注入模板管理</h1>
          <p className="subtitle">管理文章标题后的注入内容模板</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          ➕ 新建模板
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>加载中...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="empty-state">
          <p>还没有创建任何注入模板</p>
          <button onClick={openCreate} className="btn btn-primary">
            创建第一个模板
          </button>
        </div>
      ) : (
        <div className="templates-list">
          {templates.map((template) => (
            <div key={template.id} className="template-card">
              <div className="template-header">
                <h3 className="template-name">
                  {template.name}
                  {!template.enabled && <span className="badge-disabled">已禁用</span>}
                </h3>
                <div className="template-actions">
                  <button
                    onClick={() => handleToggleEnabled(template)}
                    className="btn-icon"
                    title={template.enabled ? '禁用' : '启用'}
                  >
                    {template.enabled ? '🔓' : '🔒'}
                  </button>
                  <button
                    onClick={() => openEdit(template)}
                    className="btn-icon"
                    title="编辑"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="btn-icon"
                    title="删除"
                    disabled={deleting === template.id}
                  >
                    {deleting === template.id ? '⏳' : '🗑️'}
                  </button>
                </div>
              </div>

              {template.description && (
                <p className="template-description">{template.description}</p>
              )}

              <div className="template-content">
                <strong>内容：</strong>
                <pre>{template.content}</pre>
              </div>

              <div className="template-meta">
                <span>字符数: {template.content.length}</span>
                <span>更新于: {new Date(template.updatedAt).toLocaleString('zh-CN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
