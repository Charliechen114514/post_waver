import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PostList from './pages/PostList'
import PostDetail from './pages/PostDetail'
import PublishWorkspace from './pages/PublishWorkspace'
import PublishingWorkspace from './pages/PublishingWorkspace'
import PostPreview from './pages/PostPreview'
import InjectionTemplateManager from './pages/InjectionTemplateManager'
import DeploymentBanner from './components/DeploymentBanner'

export default function App() {
  return (
    <BrowserRouter basename="/post_waver">
      <div className="app">
        <DeploymentBanner />
        <header className="app-header">
          <h1>Content Hub</h1>
          <p className="subtitle">内容管理与发布平台</p>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/publish" replace />} />
            <Route path="/posts" element={<PostList />} />
            <Route path="/posts/:id" element={<PostDetail />} />
            <Route path="/publish" element={<PublishWorkspace />} />
            <Route path="/preview/:postId" element={<PostPreview />} />
            <Route path="/publishing/:batchId" element={<PublishingWorkspace />} />
            <Route path="/templates" element={<InjectionTemplateManager />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
