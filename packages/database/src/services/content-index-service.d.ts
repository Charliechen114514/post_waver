/**
 * 内容索引服务：从数据库管理内容索引（替代 content-index.json）
 */
export declare class ContentIndexService {
    /**
     * 获取单个文章索引
     */
    static get(postId: string): Promise<{
        draft: boolean;
        id: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string;
        date: Date;
        contentHash: string;
        filepath: string;
        prev: string | null;
        next: string | null;
        related: string | null;
    } | null>;
    /**
     * 批量获取文章索引
     */
    static getMany(postIds: string[]): Promise<{
        draft: boolean;
        id: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string;
        date: Date;
        contentHash: string;
        filepath: string;
        prev: string | null;
        next: string | null;
        related: string | null;
    }[]>;
    /**
     * 获取所有索引
     */
    static getAll(): Promise<{
        draft: boolean;
        id: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string;
        date: Date;
        contentHash: string;
        filepath: string;
        prev: string | null;
        next: string | null;
        related: string | null;
    }[]>;
    /**
     * 更新或创建索引
     */
    static upsert(data: {
        id: string;
        title: string;
        date: Date;
        tags: string[];
        contentHash: string;
        filepath: string;
        draft?: boolean;
        prev?: string;
        next?: string;
        related?: Array<{
            id: string;
            title: string;
            score: number;
        }>;
    }): Promise<void>;
    /**
     * 批量更新索引
     */
    static upsertMany(posts: Array<{
        id: string;
        title: string;
        date: Date;
        tags: string[];
        contentHash: string;
        filepath: string;
        draft?: boolean;
        prev?: string;
        next?: string;
        related?: Array<{
            id: string;
            title: string;
            score: number;
        }>;
    }>): Promise<void>;
    /**
     * 删除索引
     */
    static delete(postId: string): Promise<void>;
    /**
     * 获取草稿文章
     */
    static getDrafts(): Promise<{
        draft: boolean;
        id: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string;
        date: Date;
        contentHash: string;
        filepath: string;
        prev: string | null;
        next: string | null;
        related: string | null;
    }[]>;
    /**
     * 获取已发布文章
     */
    static getPublished(): Promise<{
        draft: boolean;
        id: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string;
        date: Date;
        contentHash: string;
        filepath: string;
        prev: string | null;
        next: string | null;
        related: string | null;
    }[]>;
    /**
     * 按标签搜索
     */
    static searchByTag(tag: string): Promise<{
        draft: boolean;
        id: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string;
        date: Date;
        contentHash: string;
        filepath: string;
        prev: string | null;
        next: string | null;
        related: string | null;
    }[]>;
    /**
     * 按分类搜索（通过标签推断）
     */
    static searchByCategory(category: string): Promise<{
        draft: boolean;
        id: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string;
        date: Date;
        contentHash: string;
        filepath: string;
        prev: string | null;
        next: string | null;
        related: string | null;
    }[]>;
    /**
     * 获取统计信息
     */
    static getStats(): Promise<{
        totalPosts: number;
        draftCount: number;
        allTags: string[];
    }>;
}
export declare const getContentIndex: (postId: string) => Promise<{
    draft: boolean;
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    tags: string;
    date: Date;
    contentHash: string;
    filepath: string;
    prev: string | null;
    next: string | null;
    related: string | null;
} | null>;
export declare const upsertContentIndex: (data: Parameters<typeof ContentIndexService.upsert>[0]) => Promise<void>;
export declare const upsertContentIndexMany: (posts: Parameters<typeof ContentIndexService.upsertMany>[0]) => Promise<void>;
export declare const deleteContentIndex: (postId: string) => Promise<void>;
//# sourceMappingURL=content-index-service.d.ts.map