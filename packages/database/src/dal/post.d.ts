export type PostStatus = 'draft' | 'previewing' | 'publishing' | 'published' | 'archived';
export type WorkflowStatus = 'pending' | 'processing' | 'done';
export interface PostStatusUpdate {
    postId: string;
    status: PostStatus;
}
export interface WorkflowState {
    postId: string;
    status: WorkflowStatus;
    location: 'posts' | 'done';
    originalPath: string;
    currentPath: string;
    assetsMoved: boolean;
    processedAt?: Date;
    movedAt?: Date;
}
export declare class PostDAL {
    /**
     * 根据 postId 查找或创建文章记录
     */
    findOrCreate(postId: string, title: string): Promise<{
        id: string;
        postId: string;
        title: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        publishedAt: Date | null;
        tags: string | null;
        cleanedAt: Date | null;
        workflowStatus: string | null;
        workflowLocation: string | null;
        originalPath: string | null;
        currentPath: string | null;
        assetsMoved: boolean;
        processedAt: Date | null;
        movedAt: Date | null;
    }>;
    /**
     * 更新文章状态
     */
    updateStatus(postId: string, status: PostStatus): Promise<{
        id: string;
        postId: string;
        title: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        publishedAt: Date | null;
        tags: string | null;
        cleanedAt: Date | null;
        workflowStatus: string | null;
        workflowLocation: string | null;
        originalPath: string | null;
        currentPath: string | null;
        assetsMoved: boolean;
        processedAt: Date | null;
        movedAt: Date | null;
    }>;
    /**
     * 查询所有文章及其状态
     */
    findAll(options?: {
        status?: PostStatus;
    }): Promise<{
        id: string;
        postId: string;
        title: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        publishedAt: Date | null;
        tags: string | null;
        cleanedAt: Date | null;
        workflowStatus: string | null;
        workflowLocation: string | null;
        originalPath: string | null;
        currentPath: string | null;
        assetsMoved: boolean;
        processedAt: Date | null;
        movedAt: Date | null;
    }[]>;
    /**
     * 查看文章详情
     */
    findById(id: string): Promise<({
        publishRecords: {
            id: string;
            postId: string;
            createdAt: Date;
            platform: string;
            url: string | null;
            hashId: string | null;
        }[];
    } & {
        id: string;
        postId: string;
        title: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        publishedAt: Date | null;
        tags: string | null;
        cleanedAt: Date | null;
        workflowStatus: string | null;
        workflowLocation: string | null;
        originalPath: string | null;
        currentPath: string | null;
        assetsMoved: boolean;
        processedAt: Date | null;
        movedAt: Date | null;
    }) | null>;
    /**
     * 根据 postId 查询
     */
    findByPostId(postId: string): Promise<({
        publishRecords: {
            id: string;
            postId: string;
            createdAt: Date;
            platform: string;
            url: string | null;
            hashId: string | null;
        }[];
    } & {
        id: string;
        postId: string;
        title: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        publishedAt: Date | null;
        tags: string | null;
        cleanedAt: Date | null;
        workflowStatus: string | null;
        workflowLocation: string | null;
        originalPath: string | null;
        currentPath: string | null;
        assetsMoved: boolean;
        processedAt: Date | null;
        movedAt: Date | null;
    }) | null>;
    /**
     * 获取文章工作流状态
     */
    getWorkflowStatus(postId: string): Promise<WorkflowState | null>;
    /**
     * 更新工作流状态
     */
    updateWorkflowStatus(postId: string, status: WorkflowStatus): Promise<void>;
    /**
     * 标记为处理中
     */
    markAsProcessing(postId: string): Promise<void>;
    /**
     * 标记为完成
     */
    markAsDone(postId: string, donePath: string, assetsMoved?: boolean): Promise<void>;
    /**
     * 更新当前路径
     */
    updateCurrentPath(postId: string, currentPath: string, resetAssets?: boolean): Promise<void>;
    /**
     * 获取所有待处理文章
     */
    getPendingPosts(): Promise<WorkflowState[]>;
    /**
     * 获取处理历史
     */
    getWorkflowHistory(limit?: number): Promise<WorkflowState[]>;
    /**
     * 清理文章（保留数据库记录，删除文件）
     */
    cleanPost(postId: string, tags: string[]): Promise<void>;
    /**
     * 获取已清理的文章列表
     */
    getCleanedPosts(): Promise<({
        publishRecords: {
            id: string;
            postId: string;
            createdAt: Date;
            platform: string;
            url: string | null;
            hashId: string | null;
        }[];
    } & {
        id: string;
        postId: string;
        title: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        publishedAt: Date | null;
        tags: string | null;
        cleanedAt: Date | null;
        workflowStatus: string | null;
        workflowLocation: string | null;
        originalPath: string | null;
        currentPath: string | null;
        assetsMoved: boolean;
        processedAt: Date | null;
        movedAt: Date | null;
    })[]>;
    /**
     * 检查文章是否已清理
     */
    isCleaned(postId: string): Promise<boolean>;
}
//# sourceMappingURL=post.d.ts.map