import { PrismaClient } from '@prisma/client'

let globalPrisma: PrismaClient | null = null

/**
 * 获取全局Prisma客户端
 */
export function getGlobalPrisma(): PrismaClient {
  if (!globalPrisma) {
    globalPrisma = new PrismaClient()
  }
  return globalPrisma
}

/**
 * 断开数据库连接
 */
export async function disconnectDatabase() {
  if (globalPrisma) {
    await globalPrisma.$disconnect()
    globalPrisma = null
  }
}

/**
 * 注册进程退出时的清理函数
 */
export function registerCleanup(cleanupFn: () => Promise<void> | void) {
  const cleanup = async () => {
    await cleanupFn()
    await disconnectDatabase()
  }

  process.on('beforeexit', cleanup)
  process.on('SIGINT', async () => {
    await cleanup()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    await cleanup()
    process.exit(0)
  })
}
