import { promises as fs, existsSync } from 'fs'
import { join, dirname } from 'path'
import { PostDAL } from '@content-hub/database'

export interface CleanResult {
  success: boolean
  deletedFiles: string[]
  savedTags: string[]
  error?: string
}

export class PostCleaner {
  private dal: PostDAL

  constructor() {
    this.dal = new PostDAL()
  }

  /**
   * 清理文章文件
   */
  async clean(
    postId: string,
    options: { dryRun?: boolean } = {}
  ): Promise<CleanResult> {
    const { dryRun = false } = options

    try {
      // 1. 查询文章
      const post = await this.dal.findByPostId(postId)
      if (!post) {
        throw new Error(`文章不存在: ${postId}`)
      }

      // 2. 验证状态
      if (post.status !== 'published') {
        throw new Error(`只能清理已发布的文章，当前状态: ${post.status}`)
      }

      // 3. 确定文件路径
      const filePath = post.currentPath || join(process.cwd(), 'content/done', `${postId}.md`)

      // 检查文件是否存在
      if (!existsSync(filePath)) {
        throw new Error(`文件不存在: ${filePath}`)
      }

      // 4. 读取文件提取元数据
      const { tags, assets } = await this.extractMetadata(filePath)

      // 5. 计算要删除的文件
      const filesToDelete = [
        filePath,
        ...assets.map(asset => join(dirname(filePath), asset))
      ]

      // 6. 删除文件（非预演模式）
      if (!dryRun) {
        // 删除主文件和资源文件
        for (const file of filesToDelete) {
          try {
            await fs.unlink(file)
            console.log(`  🗑️  已删除: ${file}`)
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
              console.warn(`  ⚠️  删除失败: ${file} - ${(error as Error).message}`)
            }
          }
        }

        // 7. 更新数据库
        await this.dal.cleanPost(postId, tags)

        console.log(`  ✅ 文章已清理: ${postId}`)
        console.log(`  📝 保留标签: ${tags.join(', ')}`)
        console.log(`  📦 状态: archived`)
      } else {
        console.log(`  ⏭️  预演模式，未实际删除文件`)
        console.log(`  📋 将删除 ${filesToDelete.length} 个文件:`)
        filesToDelete.forEach(f => console.log(`     - ${f}`))
        console.log(`  📝 将保留标签: ${tags.join(', ')}`)
      }

      return {
        success: true,
        deletedFiles: filesToDelete,
        savedTags: tags
      }

    } catch (error) {
      return {
        success: false,
        deletedFiles: [],
        savedTags: [],
        error: (error as Error).message
      }
    }
  }

  /**
   * 从 Markdown 文件提取元数据
   */
  private async extractMetadata(
    filePath: string
  ): Promise<{ tags: string[]; assets: string[] }> {
    const content = await fs.readFile(filePath, 'utf-8')

    // 提取 frontmatter 中的 tags
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    let tags: string[] = []

    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1]

      // 尝试匹配数组格式: tags: [tag1, tag2, tag3]
      let tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/)
      if (tagsMatch) {
        tags = tagsMatch[1]
          .split(',')
          .map(t => t.trim().replace(/['"]/g, ''))
          .filter(t => t.length > 0)
      } else {
        // 尝试匹配多行格式:
        // tags:
        //   - tag1
        //   - tag2
        const multilineTags = frontmatter.match(/tags:\s*\n((?:\s*-\s*.+\n?)+)/)
        if (multilineTags) {
          tags = multilineTags[1]
            .split('\n')
            .map(line => line.replace(/^\s*-\s*/, '').trim())
            .filter(t => t.length > 0)
        }
      }
    }

    // 如果没有找到 tags，默认为空数组
    if (tags.length === 0) {
      console.warn(`  ⚠️  未找到标签，将使用空数组`)
    }

    // 提取资源引用
    const assetRegex = /!\[.*?\]\((.+?)\)/g
    const assets: string[] = []
    let match
    while ((match = assetRegex.exec(content)) !== null) {
      const assetPath = match[1]
      // 只处理本地资源（排除 HTTP 和 Data URL）
      if (!assetPath.startsWith('http') && !assetPath.startsWith('data:')) {
        assets.push(assetPath)
      }
    }

    return { tags, assets }
  }
}
