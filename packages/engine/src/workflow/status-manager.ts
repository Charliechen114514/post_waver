import { PostDAL, WorkflowStatus } from '@content-hub/database'

/**
 * 工作流状态枚举
 */
export enum WorkflowStatusEnum {
  PENDING = 'pending',        // 在 content/posts/ 待处理
  PROCESSING = 'processing',  // 正在处理中
  DONE = 'done'               // 已处理，在 content/done/
}

/**
 * 工作流状态接口
 */
export interface WorkflowState {
  postId: string
  status: WorkflowStatus
  location: 'posts' | 'done'
  originalPath: string
  currentPath: string
  assetsMoved: boolean
  processedAt?: Date
  movedAt?: Date
}

/**
 * 工作流状态管理器
 */
export class WorkflowStatusManager {
  private postDAL: PostDAL

  constructor() {
    this.postDAL = new PostDAL()
  }

  /**
   * 获取文章工作流状态
   */
  async getStatus(postId: string): Promise<WorkflowState | null> {
    return await this.postDAL.getWorkflowStatus(postId)
  }

  /**
   * 更新工作流状态
   */
  async updateStatus(postId: string, status: WorkflowStatus): Promise<void> {
    await this.postDAL.updateWorkflowStatus(postId, status)
  }

  /**
   * 标记为处理中
   */
  async markAsProcessing(postId: string): Promise<void> {
    await this.postDAL.markAsProcessing(postId)
  }

  /**
   * 标记为完成
   */
  async markAsDone(postId: string, donePath: string, assetsMoved: boolean = false): Promise<void> {
    await this.postDAL.markAsDone(postId, donePath, assetsMoved)
  }

  /**
   * 获取所有待处理文章
   */
  async getPendingPosts(): Promise<WorkflowState[]> {
    return await this.postDAL.getPendingPosts()
  }

  /**
   * 获取处理历史
   */
  async getHistory(limit: number = 20): Promise<WorkflowState[]> {
    return await this.postDAL.getWorkflowHistory(limit)
  }

  /**
   * 初始化文章工作流状态（用于新文章）
   */
  async initializePost(postId: string): Promise<void> {
    const existing = await this.getStatus(postId)

    if (existing) {
      // 已存在，无需初始化
      return
    }

    // 从文件中读取标题
    const { readFileSync } = await import('fs')
    const { join } = await import('path')

    const postPath = join(process.cwd(), 'content/posts', `${postId}.md`)

    try {
      const content = readFileSync(postPath, 'utf-8')
      const titleMatch = content.match(/^title:\s*(.+)$/m)
      const title = titleMatch ? titleMatch[1] : postId

      // 确保文章记录存在
      await this.postDAL.findOrCreate(postId, title)

      // 设置工作流状态
      await this.updateStatus(postId, 'pending' as WorkflowStatus)

    } catch (error) {
      console.error(`  ⚠️  无法读取文章 ${postId}:`, error)
      throw error
    }
  }
}
