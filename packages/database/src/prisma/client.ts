import { PrismaClient } from '@prisma/client'

// 单例模式导出 PrismaClient
export const prisma = new PrismaClient()

// 同时导出类本身以便需要时创建新实例
export { PrismaClient } from '@prisma/client'
