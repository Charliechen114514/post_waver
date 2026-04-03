import { useState } from 'react'
import { MarkdownEditor } from './components/MarkdownEditor'
import { PlatformSelector } from './components/PlatformSelector'
import { SimplePreview } from './components/SimplePreview'
import { Platform } from './utils/transformer'
import './styles/main.css'

function App() {
  const [markdown, setMarkdown] = useState('# Hello World\n\n这是一个 **Markdown** 转换器。')
  const [platform, setPlatform] = useState<Platform>('html')

  return (
    <div className="app">
      {/* 顶部控制栏 */}
      <header className="app-header">
        <h1>🔄 Markdown 转换工具</h1>
        <PlatformSelector value={platform} onChange={setPlatform} />
      </header>

      {/* 主编辑器 */}
      <div className="editor-section">
        <MarkdownEditor value={markdown} onChange={setMarkdown} />
      </div>

      {/* 预览区域 */}
      <div className="preview-section">
        <SimplePreview markdown={markdown} platform={platform} />
      </div>
    </div>
  )
}

export default App
