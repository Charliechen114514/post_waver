import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PostList from './pages/PostList'
import PostDetail from './pages/PostDetail'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <h1>Content Hub</h1>
          <p className="subtitle">内容管理与发布平台</p>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<PostList />} />
            <Route path="/posts/:id" element={<PostDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
