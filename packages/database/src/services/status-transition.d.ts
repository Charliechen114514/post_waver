import { PostStatus } from '../dal/post.js';
/**
 * 断开数据库连接
 */
export declare function disconnectStatusTransition(): Promise<void>;
export declare class StatusTransitionService {
    private static transitions;
    /**
     * 验证状态转换是否合法
     */
    static canTransition(from: PostStatus, to: PostStatus): boolean;
    /**
     * 获取所有允许的状态转换
     */
    static getAllowedTransitions(from: PostStatus): PostStatus[];
    /**
     * 执行状态转换
     */
    static transition(postId: string, toStatus: PostStatus): Promise<{
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
}
//# sourceMappingURL=status-transition.d.ts.map