import { promises as fs, existsSync } from 'fs'
import { join, dirname, basename } from 'path'

/**
 * 文件移动选项
 */
export interface MoveOptions {
  updateReferences?: boolean  // 更新文件内的相对路径引用
  moveAssets?: boolean        // 同时移动资源文件
  createBackup?: boolean      // 创建备份
}

/**
 * 文件移动服务
 */
export class FileMover {
  /**
   * 移动 Markdown 文件到 done 目录
   */
  async moveToDone(
    postId: string,
    options: MoveOptions = {}
  ): Promise<string> {
    const {
      updateReferences = true,
      moveAssets = true,
      createBackup = false
    } = options

    // 1. 确定源文件和目标路径
    const sourcePath = join(process.cwd(), 'content/posts', `${postId}.md`)
    const targetDir = join(process.cwd(), 'content/done')
    const targetPath = join(targetDir, `${postId}.md`)

    // 2. 检查源文件是否存在
    if (!existsSync(sourcePath)) {
      throw new Error(`源文件不存在: ${sourcePath}`)
    }

    // 3. 创建目标目录
    await fs.mkdir(targetDir, { recursive: true })

    // 4. 可选：创建备份
    if (createBackup && existsSync(targetPath)) {
      const backupPath = join(targetDir, `${postId}.md.backup`)
      await fs.copyFile(targetPath, backupPath)
      console.log(`  📦 已创建备份: ${backupPath}`)
    }

    // 5. 移动资源文件
    let assetMapping: Record<string, string> = {}
    let hasAssets = false
    if (moveAssets) {
      assetMapping = await this.moveAssets(postId, sourcePath)
      hasAssets = Object.keys(assetMapping).length > 0
    }

    // 6. 更新文件内的相对路径引用
    if (updateReferences && Object.keys(assetMapping).length > 0) {
      await this.updateAssetReferences(sourcePath, assetMapping)
    }

    // 7. 移动主文件
    await fs.rename(sourcePath, targetPath)

    console.log(`✅ 文件已移动: ${sourcePath} → ${targetPath}`)

    // 8. 更新数据库中的路径信息
    try {
      const { PostDAL } = await import('@content-hub/database')
      const dal = new PostDAL()
      await dal.markAsDone(postId, targetPath, hasAssets)
      console.log(`✅ 数据库已更新: ${postId} -> ${targetPath} (assets: ${hasAssets})`)
    } catch (error) {
      console.warn(`⚠️  更新数据库失败:`, error)
      // 不抛出错误，文件已经成功移动
    }

    return targetPath
  }

  /**
   * 移动资源文件
   */
  private async moveAssets(
    postId: string,
    markdownPath: string
  ): Promise<Record<string, string>> {
    const assetMapping: Record<string, string> = {}

    try {
      // 1. 解析 Markdown 中的资源引用
      const content = await fs.readFile(markdownPath, 'utf-8')
      const assetRegex = /!\[.*?\]\((.+?)\)/g
      const matches = [...content.matchAll(assetRegex)]

      if (matches.length === 0) {
        console.log(`  ℹ️  未找到资源引用`)
        return assetMapping
      }

      console.log(`  📎 找到 ${matches.length} 个资源引用`)

      // 2. 移动每个资源文件
      for (const match of matches) {
        const assetPath = match[1]

        // 跳过外部链接和 Base64
        if (assetPath.startsWith('http') || assetPath.startsWith('data:')) {
          continue
        }

        // 处理本地资源
        // 资源路径应该相对于markdown文件所在目录解析
        const markdownDir = dirname(markdownPath)
        const sourceAssetPath = join(markdownDir, assetPath)

        if (!existsSync(sourceAssetPath)) {
          console.warn(`  ⚠️  资源文件不存在: ${sourceAssetPath}`)
          continue
        }

        // 构建目标路径
        const targetAssetPath = join(
          process.cwd(),
          'content/done',
          assetPath
        )

        // 创建目标目录
        await fs.mkdir(dirname(targetAssetPath), { recursive: true })

        // 移动文件
        await fs.rename(sourceAssetPath, targetAssetPath)

        // 记录映射关系
        assetMapping[assetPath] = assetPath

        console.log(`  ✅ 资源已移动: ${assetPath}`)
      }

    } catch (error) {
      console.error(`  ❌ 移动资源时出错:`, error)
    }

    return assetMapping
  }

  /**
   * 更新 Markdown 中的资源引用路径
   */
  private async updateAssetReferences(
    markdownPath: string,
    assetMapping: Record<string, string>
  ): Promise<void> {
    try {
      let content = await fs.readFile(markdownPath, 'utf-8')

      // 更新所有资源引用
      for (const [oldPath, newPath] of Object.entries(assetMapping)) {
        const regex = new RegExp(
          `!\\[.*?\\]\\(${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`,
          'g'
        )
        content = content.replace(regex, (match) => {
          return match.replace(oldPath, newPath)
        })
      }

      // 写回文件
      await fs.writeFile(markdownPath, content, 'utf-8')

      console.log(`  ✅ 已更新资源引用`)

    } catch (error) {
      console.error(`  ❌ 更新资源引用时出错:`, error)
    }
  }

  /**
   * 回滚：从 done 移回 posts
   */
  async rollbackToPosts(postId: string): Promise<string> {
    const sourcePath = join(process.cwd(), 'content/done', `${postId}.md`)
    const targetPath = join(process.cwd(), 'content/posts', `${postId}.md`)

    if (!existsSync(sourcePath)) {
      throw new Error(`Done 文件不存在: ${sourcePath}`)
    }

    // 1. 先读取源文件内容（用于资源回滚）
    let assetPaths: string[] = []
    try {
      const content = await fs.readFile(sourcePath, 'utf-8')
      const assetRegex = /!\[.*?\]\((.+?)\)/g
      const matches = [...content.matchAll(assetRegex)]
      assetPaths = matches
        .map(m => m[1])
        .filter(p => !p.startsWith('http') && !p.startsWith('data:'))
    } catch (error) {
      console.warn(`  ⚠️  无法读取源文件内容:`, error)
    }

    // 2. 回滚资源文件（使用预提取的路径）
    // 如果资源回滚失败，抛出错误，阻止主文件移动
    try {
      await this.rollbackAssets(assetPaths)
    } catch (error) {
      console.error(`❌ 资源回滚失败，取消主文件移动以保持状态一致`)
      throw new Error(`资源回滚失败: ${error}`)
    }

    // 3. 移动主文件
    await fs.rename(sourcePath, targetPath)

    console.log(`✅ 文件已回滚: ${sourcePath} → ${targetPath}`)

    // 更新数据库中的路径信息
    try {
      const { PostDAL } = await import('@content-hub/database')
      const dal = new PostDAL()
      await dal.updateCurrentPath(postId, targetPath, true) // reset assets moved flag
      await dal.updateWorkflowStatus(postId, 'pending')
      console.log(`✅ 数据库已更新: ${postId} -> ${targetPath}`)
    } catch (error) {
      console.warn(`⚠️  更新数据库失败:`, error)
      // 不抛出错误，文件已经成功移动
    }

    return targetPath
  }

  /**
   * 回滚资源文件
   */
  private async rollbackAssets(assetPaths: string[]): Promise<void> {
    try {
      if (assetPaths.length === 0) {
        console.log(`  ℹ️  无需回滚资源`)
        return
      }

      console.log(`  📎 开始回滚 ${assetPaths.length} 个资源`)

      for (const assetPath of assetPaths) {
        // 🔧 修复：资源从 content/done 回滚到 content/posts
        const sourceAssetPath = join(process.cwd(), 'content/done', assetPath)
        const targetAssetPath = join(process.cwd(), 'content/posts', assetPath)

        if (!existsSync(sourceAssetPath)) {
          console.warn(`  ⚠️  资源不存在: ${sourceAssetPath}`)
          continue
        }

        // 创建目标目录
        await fs.mkdir(dirname(targetAssetPath), { recursive: true })

        // 移回文件
        await fs.rename(sourceAssetPath, targetAssetPath)

        console.log(`  ✅ 资源已回滚: ${assetPath}`)
      }

      console.log(`  ✅ 资源回滚完成`)

    } catch (error) {
      console.error(`  ❌ 回滚资源时出错:`, error)
      throw error  // 抛出错误，让调用者知道回滚失败
    }
  }
}
