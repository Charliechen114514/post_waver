import { readdir, stat, unlink } from 'fs/promises'
import { join } from 'path'
import { ConfigManager } from '@content-hub/config/dist/config-manager.js'

export class OutputCleanupManager {
  private config: ConfigManager

  constructor() {
    this.config = new ConfigManager()
  }

  /**
   * 清理旧输出
   */
  async cleanup(options: { days?: number; dryRun?: boolean } = {}) {
    const { days, dryRun = false } = options
    const cleanupConfig = this.config.get('cleanup')

    const retainDays = days || cleanupConfig.retainDays
    const outputDir = join(process.cwd(), 'output')

    console.log(`\n🧹 清理 ${retainDays} 天前的输出...`)

    if (dryRun) {
      console.log(`   ⏭️  预演模式（不实际删除）`)
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retainDays)

    let deletedCount = 0
    let totalSize = 0

    try {
      const entries = await readdir(outputDir, { withFileTypes: true })

      for (const entry of entries) {
        if (!entry.isDirectory()) continue

        const entryPath = join(outputDir, entry.name)
        const stats = await stat(entryPath)
        const createdAt = stats.birthtime

        if (createdAt < cutoffDate) {
          const size = await this.getDirectorySize(entryPath)

          if (dryRun) {
            console.log(`   📁 ${entry.name} (${this.formatSize(size)})`)
          } else {
            await this.removeDirectory(entryPath)
            console.log(`   🗑️  ${entry.name} (${this.formatSize(size)})`)
          }

          deletedCount++
          totalSize += size
        }
      }

      console.log(`\n${dryRun ? '预演结果' : '清理完成'}:`)
      console.log(`   删除目录: ${deletedCount}`)
      console.log(`   释放空间: ${this.formatSize(totalSize)}`)

    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log(`   ℹ️  输出目录不存在`)
      } else {
        throw error
      }
    }
  }

  /**
   * 递归计算目录大小
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0

    const entries = await readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const entryPath = join(dirPath, entry.name)
      const stats = await stat(entryPath)

      if (entry.isDirectory()) {
        totalSize += await this.getDirectorySize(entryPath)
      } else {
        totalSize += stats.size
      }
    }

    return totalSize
  }

  /**
   * 递归删除目录
   */
  private async removeDirectory(dirPath: string): Promise<void> {
    const { rm } = require('fs/promises')
    await rm(dirPath, { recursive: true, force: true })
  }

  /**
   * 格式化文件大小
   */
  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  }
}
