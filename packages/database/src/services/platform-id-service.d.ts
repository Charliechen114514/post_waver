/**
 * 平台发布信息
 */
export interface PlatformPublishInfo {
    postId: string;
    url?: string;
    publishedAt?: Date;
}
/**
 * 平台 ID 映射服务：从数据库管理平台 ID（替代 platform-ids.json）
 */
export declare class PlatformIdService {
    /**
     * 获取文章在特定平台的 ID
     */
    static get(postId: string, platform: string): Promise<PlatformPublishInfo | null>;
    /**
     * 获取文章在所有平台的 ID
     */
    static getAllForPost(postId: string): Promise<Record<string, PlatformPublishInfo>>;
    /**
     * 设置文章的平台 ID
     */
    static set(postId: string, platform: string, platformPostId: string, url?: string): Promise<void>;
    /**
     * 批量设置平台 ID
     */
    static setMany(mappings: Array<{
        postId: string;
        platform: string;
        platformPostId: string;
        url?: string;
    }>): Promise<void>;
    /**
     * 删除文章的平台 ID
     */
    static delete(postId: string, platform: string): Promise<void>;
    /**
     * 删除文章的所有平台 ID
     */
    static deleteAllForPost(postId: string): Promise<void>;
    /**
     * 获取特定平台的所有映射
     */
    static getAllForPlatform(platform: string): Promise<Array<{
        postId: string;
        platformPostId: string;
        url?: string;
        publishedAt?: Date;
    }>>;
    /**
     * 获取所有映射
     */
    static getAll(): Promise<Record<string, Record<string, PlatformPublishInfo>>>;
    /**
     * 获取统计信息
     */
    static getStats(): Promise<{
        totalMappings: number;
        byPlatform: Record<string, number>;
    }>;
}
export declare const getPlatformId: (postId: string, platform: string) => Promise<PlatformPublishInfo | null>;
export declare const setPlatformId: (postId: string, platform: string, platformPostId: string, url?: string) => Promise<void>;
export declare const getAllPlatformIds: (postId: string) => Promise<Record<string, PlatformPublishInfo>>;
//# sourceMappingURL=platform-id-service.d.ts.map