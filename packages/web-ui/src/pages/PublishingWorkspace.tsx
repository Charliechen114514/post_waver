import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GridLayout } from '../components/GridLayout'
import './PublishingWorkspace.css'

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

export default function PublishingWorkspace() {
  const { batchId } = useParams<{ batchId: string }>()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<JobStatus[]>([])
  const [activeTab, setActiveTab] = useState<string>('')

  // 轮询批量任务状态
  useEffect(() => {
    if (!batchId) return

    const fetchBatchStatus = async () => {
      try {
        const response = await fetch(`/api/workflow/batch/${batchId}`)
        const data = await response.json()

        if (data.success) {
          setJobs(data.data.jobs)

          // 设置第一个为默认激活的 Tab
          if (jobs.length === 0 && data.data.jobs.length > 0) {
            setActiveTab(data.data.jobs[0].postId)
          }
        }
      } catch (error) {
        console.error('获取批量任务状态失败:', error)
      }
    }

    // 立即获取一次
    fetchBatchStatus()

    // 每秒轮询一次
    const interval = setInterval(fetchBatchStatus, 1000)

    return () => clearInterval(interval)
  }, [batchId])

  // 检查是否所有任务都已完成
  const allCompleted = jobs.length > 0 && jobs.every(
    job => job.status === 'completed' || job.status === 'failed'
  )

  const activeJob = jobs.find(job => job.postId === activeTab)

  return (
    <div className="publishing-workspace">
      {/* 顶部操作栏 */}
      <div className="top-bar">
        <h1>📦 批量发布任务</h1>
        <div className="actions">
          <div className="summary">
            总计: {jobs.length} |
            完成: {jobs.filter(j => j.status === 'completed').length} |
            进行中: {jobs.filter(j => j.status === 'running').length} |
            失败: {jobs.filter(j => j.status === 'failed').length}
          </div>
          {allCompleted && (
            <button
              onClick={() => navigate('/publish')}
              className="btn btn-secondary"
            >
              ← 返回
            </button>
          )}
        </div>
      </div>

      {/* Tab 栏 */}
      <div className="tab-bar">
        {jobs.map(job => (
          <button
            key={job.postId}
            className={`tab ${activeTab === job.postId ? 'active' : ''}`}
            onClick={() => setActiveTab(job.postId)}
          >
            <span className="tab-title">{job.postId}</span>
            {job.status === 'pending' && <span className="status-badge pending">⏳</span>}
            {job.status === 'running' && <span className="status-badge running">🔄</span>}
            {job.status === 'completed' && <span className="status-badge completed">✅</span>}
            {job.status === 'failed' && <span className="status-badge failed">❌</span>}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="tab-content">
        {activeJob ? (
          <GridLayout
            postId={activeJob.postId}
            job={activeJob}
          />
        ) : (
          <div className="empty-state">
            <p>请选择一个任务查看详情</p>
          </div>
        )}
      </div>

      {/* 完成提示 */}
      {allCompleted && (
        <div className="completion-banner">
          <h2>🎉 所有任务已完成！</h2>
          <p>您可以查看每个平台的发布结果并复制内容</p>
        </div>
      )}
    </div>
  )
}
