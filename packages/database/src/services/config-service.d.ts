/**
 * 配置服务：从数据库读写配置（替代 JSON 配置文件）
 */
export declare class ConfigService {
    /**
     * 获取单个配置值
     */
    static get(category: string, key: string): Promise<any>;
    /**
     * 设置单个配置值
     */
    static set(category: string, key: string, value: any): Promise<void>;
    /**
     * 获取整个分类的配置（JSON 对象）
     */
    static getCategory(category: string): Promise<Record<string, any>>;
    /**
     * 设置整个分类的配置
     */
    static setCategory(category: string, config: Record<string, any>): Promise<void>;
    /**
     * 删除配置
     */
    static delete(category: string, key: string): Promise<void>;
    /**
     * 删除整个分类
     */
    static deleteCategory(category: string): Promise<void>;
    /**
     * 获取所有分类
     */
    static getAllCategories(): Promise<string[]>;
}
export declare const getConfig: (category: string, key: string) => Promise<any>;
export declare const setConfig: (category: string, key: string, value: any) => Promise<void>;
export declare const getConfigCategory: (category: string) => Promise<Record<string, any>>;
export declare const setConfigCategory: (category: string, config: Record<string, any>) => Promise<void>;
//# sourceMappingURL=config-service.d.ts.map