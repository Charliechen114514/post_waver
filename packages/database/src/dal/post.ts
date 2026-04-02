import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export type PostStatus = 'draft' | 'previewing' | 'publishing' | 'published' | 'archived'
export type WorkflowStatus = 'pending' | 'processing' | 'done'

export interface PostStatusUpdate {
  postId: string
  status: PostStatus
}

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

export class PostDAL {
  /**
   * 根据 postId 查找或创建文章记录
   */
  async findOrCreate(postId: string, title: string) {
    return await prisma.post.upsert({
      where: { postId },
      update: {},
      create: { postId, title }
    })
  }

  /**
   * 更新文章状态
   */
  async updateStatus(postId: string, status: PostStatus) {
    return await prisma.post.update({
      where: { postId },
      data: { status }
    })
  }

  /**
   * 查询所有文章及其状态
   */
  async findAll(options?: { status?: PostStatus }) {
    return await prisma.post.findMany({
      where: options?.status ? { status: options.status } : undefined,
      orderBy: { updatedAt: 'desc' }
    })
  }

  /**
   * 查看文章详情
   */
  async findById(id: string) {
    return await prisma.post.findUnique({
      where: { id },
      include: { publishRecords: true }
    })
  }

  /**
   * 根据 postId 查询
   */
  async findByPostId(postId: string) {
    return await prisma.post.findUnique({
      where: { postId },
      include: { publishRecords: true }
    })
  }

  /**
   * 获取文章工作流状态
   */
  async getWorkflowStatus(postId: string): Promise<WorkflowState | null> {
    const post = await prisma.post.findUnique({
      where: { postId }
    })

    if (!post || !post.workflowStatus) {
      return null
    }

    return {
      postId: post.postId,
      status: post.workflowStatus as WorkflowStatus,
      location: (post.workflowLocation as 'posts' | 'done') || 'posts',
      originalPath: post.originalPath || '',
      currentPath: post.currentPath || '',
      assetsMoved: post.assetsMoved,
      processedAt: post.processedAt || undefined,
      movedAt: post.movedAt || undefined
    }
  }

  /**
   * 更新工作流状态
   */
  async updateWorkflowStatus(postId: string, status: WorkflowStatus): Promise<void> {
    await prisma.post.update({
      where: { postId },
      data: {
        workflowStatus: status,
        // 当状态变为pending时，重置位置为posts
        ...(status === 'pending' ? { workflowLocation: 'posts' } : {}),
        ...(status === 'processing' ? {} : {}),
        ...(status === 'done' ? { processedAt: new Date() } : {})
      }
    })
  }

  /**
   * 标记为处理中
   */
  async markAsProcessing(postId: string): Promise<void> {
    await this.updateWorkflowStatus(postId, 'processing')
  }

  /**
   * 标记为完成
   */
  async markAsDone(postId: string, donePath: string): Promise<void> {
    await prisma.post.update({
      where: { postId },
      data: {
        workflowStatus: 'done',
        workflowLocation: 'done',
        currentPath: donePath,
        processedAt: new Date(),
        movedAt: new Date()
      }
    })
  }

  /**
   * 获取所有待处理文章
   */
  async getPendingPosts(): Promise<WorkflowState[]> {
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { workflowStatus: 'pending' },
          { workflowStatus: null }
        ]
      },
      orderBy: { createdAt: 'asc' }
    })

    return posts.map(post => ({
      postId: post.postId,
      status: (post.workflowStatus || 'pending') as WorkflowStatus,
      location: (post.workflowLocation as 'posts' | 'done') || 'posts',
      originalPath: post.originalPath || '',
      currentPath: post.currentPath || '',
      assetsMoved: post.assetsMoved,
      processedAt: post.processedAt || undefined,
      movedAt: post.movedAt || undefined
    }))
  }

  /**
   * 获取处理历史
   */
  async getWorkflowHistory(limit: number = 20): Promise<WorkflowState[]> {
    const posts = await prisma.post.findMany({
      where: {
        workflowStatus: { not: null }
      },
      orderBy: { processedAt: 'desc' },
      take: limit
    })

    return posts.map(post => ({
      postId: post.postId,
      status: (post.workflowStatus || 'pending') as WorkflowStatus,
      location: (post.workflowLocation as 'posts' | 'done') || 'posts',
      originalPath: post.originalPath || '',
      currentPath: post.currentPath || '',
      assetsMoved: post.assetsMoved,
      processedAt: post.processedAt || undefined,
      movedAt: post.movedAt || undefined
    }))
  }
}
