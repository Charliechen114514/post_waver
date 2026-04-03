/**
 * 任务管理器
 * 管理 workflow 的后台任务状态
 */

export interface JobOutputs {
  wechatReplacedContent?: string
  injectionTemplateId?: string
  includeRelatedLinks?: boolean
}

export interface JobStatus {
  jobId: string
  postId: string
  batchId?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  currentStep: number
  totalSteps: number
  stepName: string
  progress: number
  startedAt: Date
  completedAt?: Date
  error?: string
  outputs?: JobOutputs
}

export class JobManager {
  private jobs: Map<string, JobStatus>
  private cleanupInterval: NodeJS.Timeout | null

  constructor() {
    this.jobs = new Map()
    this.cleanupInterval = null

    // 每小时清理一次超过 1 小时的已完成任务
    this.startCleanup()
  }

  /**
   * 创建新任务
   */
  createJob(postId: string, batchId?: string): JobStatus {
    const job: JobStatus = {
      jobId: `job-${postId}-${Date.now()}`,
      postId,
      batchId,
      status: 'pending',
      currentStep: 0,
      totalSteps: 5,
      stepName: '准备中',
      progress: 0,
      startedAt: new Date()
    }

    this.jobs.set(job.jobId, job)
    console.log(`✅ Job created: ${job.jobId} for post: ${postId}`)
    return job
  }

  /**
   * 更新任务状态
   */
  updateJob(jobId: string, updates: Partial<JobStatus>): void {
    const job = this.jobs.get(jobId)
    if (!job) {
      console.warn(`⚠️ Job not found: ${jobId}`)
      return
    }

    Object.assign(job, updates)

    // 如果状态变为完成或失败，记录完成时间
    if ((updates.status === 'completed' || updates.status === 'failed') && !job.completedAt) {
      job.completedAt = new Date()
      console.log(`✅ Job ${jobId} ${job.status}`)
    }
  }

  /**
   * 获取任务状态
   */
  getJob(jobId: string): JobStatus | undefined {
    return this.jobs.get(jobId)
  }

  /**
   * 根据 postId 获取最新任务
   */
  getLatestJobByPostId(postId: string): JobStatus | undefined {
    const jobs = Array.from(this.jobs.values())
      .filter(job => job.postId === postId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())

    return jobs[0]
  }

  /**
   * 获取批量任务的所有任务
   */
  getJobsByBatch(batchId: string): JobStatus[] {
    return Array.from(this.jobs.values())
      .filter(job => job.batchId === batchId)
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())
  }

  /**
   * 获取所有活跃任务（非完成和非失败）
   */
  getActiveJobs(): JobStatus[] {
    return Array.from(this.jobs.values())
      .filter(job => job.status === 'pending' || job.status === 'running')
  }

  /**
   * 获取所有任务
   */
  getAllJobs(): JobStatus[] {
    return Array.from(this.jobs.values())
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
  }

  /**
   * 删除任务
   */
  deleteJob(jobId: string): boolean {
    return this.jobs.delete(jobId)
  }

  /**
   * 清理超过 1 小时的已完成任务
   */
  private cleanupOldJobs(): void {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000

    for (const [jobId, job] of this.jobs.entries()) {
      const isCompleted = job.status === 'completed' || job.status === 'failed'
      const isOld = job.completedAt && (now - job.completedAt.getTime()) > oneHour

      if (isCompleted && isOld) {
        this.jobs.delete(jobId)
        console.log(`🗑️ Cleaned up old job: ${jobId}`)
      }
    }
  }

  /**
   * 启动定期清理
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldJobs()
    }, 60 * 60 * 1000) // 每小时清理一次
  }

  /**
   * 停止清理（用于测试或关闭）
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * 获取统计信息
   */
  getStats(batchId?: string): {
    total: number
    pending: number
    running: number
    completed: number
    failed: number
  } {
    const jobs = batchId
      ? this.getJobsByBatch(batchId)
      : this.getAllJobs()

    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      running: jobs.filter(j => j.status === 'running').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length
    }
  }
}

// 导出单例
export const jobManager = new JobManager()
