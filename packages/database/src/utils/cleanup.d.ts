import { PrismaClient } from '@prisma/client';
/**
 * 获取全局Prisma客户端
 */
export declare function getGlobalPrisma(): PrismaClient;
/**
 * 断开数据库连接
 */
export declare function disconnectDatabase(): Promise<void>;
/**
 * 注册进程退出时的清理函数
 */
export declare function registerCleanup(cleanupFn: () => Promise<void> | void): void;
//# sourceMappingURL=cleanup.d.ts.map