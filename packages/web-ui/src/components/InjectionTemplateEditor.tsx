import { useState } from 'react'
import { showToast } from './Toast'
import './InjectionTemplateEditor.css'

interface InjectionTemplate {
  id?: string
  name: string
  description: string
  content: string
  enabled: boolean
  createdAt?: string
  updatedAt?: string
}

interface InjectionTemplateEditorProps {
  template?: InjectionTemplate
  onSave: (template: Omit<InjectionTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onCancel: () => void
}

export function InjectionTemplateEditor({ template, onSave, onCancel }: InjectionTemplateEditorProps) {
  const [name, setName] = useState(template?.name || '')
  const [description, setDescription] = useState(template?.description || '')
  const [content, setContent] = useState(template?.content || '')
  const [enabled, setEnabled] = useState(template?.enabled ?? true)
  const [saving, setSaving] = useState(false)

  // 验证
  const isValid = name.trim() !== '' && content.trim() !== '' && content.length <= 500
  const contentLength = content.length
  const isContentTooLong = contentLength > 500

  const handleSave = async () => {
    if (!isValid) {
      if (isContentTooLong) {
        showToast('注入内容过长，请控制在500字符以内', 'error')
      } else {
        showToast('请填写模板名称和内容', 'error')
      }
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        content: content.trim(),
        enabled
      })
      showToast('✅ 模板保存成功', 'success')
    } catch (error: any) {
      showToast(`❌ 保存失败: ${error.message || '未知错误'}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  // 平台预览示例
  const previews = [
    {
      platform: 'juejin',
      name: '掘金',
      preview: content
    },
    {
      platform: 'wechat',
      name: '微信',
      preview: `<div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #07c160;">\n${content}\n</div>`
    },
    {
      platform: 'html',
      name: 'HTML',
      preview: `<div class="title-injection">\n${content}\n</div>`
    }
  ]

  return (
    <div className="injection-template-editor">
      <div className="editor-header">
        <h2>{template?.id ? '编辑注入模板' : '新建注入模板'}</h2>
        <div className="editor-actions">
          <button onClick={onCancel} className="btn btn-secondary" disabled={saving}>
            取消
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={!isValid || saving}
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <div className="editor-body">
        <div className="form-group">
          <label>
            模板名称 <span className="required">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：订阅引导、版权声明"
            className="input"
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label>模板描述</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="简要描述此模板的用途"
            className="input"
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label>
            注入内容 <span className="required">*</span>
            <span className={`char-count ${isContentTooLong ? 'error' : ''}`}>
              ({contentLength}/500)
            </span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="支持Markdown格式，例如：🔥 欢迎订阅我的专栏，获取更多优质内容！"
            className="textarea"
            rows={6}
            disabled={saving}
          />
          {isContentTooLong && (
            <div className="error-message">
              ⚠️ 内容过长，请控制在500字符以内
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={saving}
            />
            <span>启用此模板</span>
          </label>
        </div>

        {content && (
          <div className="preview-section">
            <h3>平台预览</h3>
            <div className="preview-grid">
              {previews.map((p) => (
                <div key={p.platform} className="preview-card">
                  <h4>{p.name}</h4>
                  <pre className="preview-content">{p.preview || '(无内容)'}</pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
