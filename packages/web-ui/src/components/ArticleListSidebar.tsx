import './ArticleListSidebar.css'

interface JobStatus {
  jobId: string
  postId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  currentStep: number
  totalSteps: number
  stepName: string
  progress: number
  startedAt: string
  completedAt?: string
  error?: string
}

interface ArticleListSidebarProps {
  jobs: JobStatus[]
  selectedPostIds: string[]
  onToggle: (postId: string) => void
  onSelectPost: (postId: string) => void
}

export function ArticleListSidebar({
  jobs,
  selectedPostIds,
  onToggle,
  onSelectPost
}: ArticleListSidebarProps) {
  return (
    <div className="article-list-sidebar">
      <div className="sidebar-header">
        <h3>文章列表</h3>
        <span className="count">{selectedPostIds.length} / {jobs.length}</span>
      </div>

      <div className="sidebar-content">
        {jobs.map((job) => (
          <div
            key={job.postId}
            className="article-item"
            onClick={() => onSelectPost(job.postId)}
          >
            <input
              type="checkbox"
              checked={selectedPostIds.includes(job.postId)}
              onChange={() => onToggle(job.postId)}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="article-id">{job.postId}</span>
            <span className="article-status">
              {job.status === 'pending' && '⏳'}
              {job.status === 'running' && '🔄'}
              {job.status === 'completed' && '✅'}
              {job.status === 'failed' && '❌'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
