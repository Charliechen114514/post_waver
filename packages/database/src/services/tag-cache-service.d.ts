/**
 * 标签缓存条目
 */
export interface TagCacheEntry {
    tag: string;
    count: number;
    lastUsed: Date;
    relatedKeywords: string[];
    categories: string[];
}
/**
 * 标签缓存服务：从数据库管理标签缓存（替代 frontmatter-tag-cache.json）
 */
export declare class TagCacheService {
    /**
     * 添加或更新标签
     */
    static addTags(tags: string[], category: string, keywords?: string[]): Promise<void>;
    /**
     * 从内容中智能匹配标签
     */
    static matchTagsFromContent(content: string, category: string, limit?: number): Promise<string[]>;
    /**
     * 获取热门标签
     */
    static getPopularTags(limit?: number): Promise<TagCacheEntry[]>;
    /**
     * 获取特定分类的标签
     */
    static getTagsByCategory(category: string): Promise<string[]>;
    /**
     * 获取缓存统计
     */
    static getStats(): Promise<{
        totalTags: number;
        totalUsage: number;
        topTags: Array<{
            tag: string;
            count: number;
        }>;
    }>;
    /**
     * 清理低频标签
     */
    static cleanup(minCount?: number): Promise<{
        before: number;
        after: number;
    }>;
    /**
     * 导出为常用标签列表（用于 AI 参考）
     */
    static exportCommonTags(limit?: number): Promise<string[]>;
    /**
     * 将 Prisma 模型映射为 TagCacheEntry
     */
    private static mapToEntry;
}
export declare const addTags: (tags: string[], category: string, keywords?: string[]) => Promise<void>;
export declare const matchTagsFromContent: (content: string, category: string, limit?: number) => Promise<string[]>;
export declare const getPopularTags: (limit?: number) => Promise<TagCacheEntry[]>;
export declare const getTagsByCategory: (category: string) => Promise<string[]>;
//# sourceMappingURL=tag-cache-service.d.ts.map