import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'fs'
import { join, resolve, dirname, basename } from 'path'
import { execSync } from 'child_process'

export interface SyncResult {
  success: boolean
  postId: string
  hexoPostPath: string
  assetsCopied: number
  committed: boolean
  pushed: boolean
  deployed: boolean
  blogUrl?: string
  error?: string
}

export interface HexoConfig {
  blogPath: string
  enabled: boolean
  git: {
    autoCommit: boolean
    autoPush: boolean
    commitMessage: string
    commitAuthor: {
      name: string
      email: string
    }
  }
  deploy: {
    enabled: boolean
    command: string
    timeout: number
  }
  paths: {
    posts: string
    images: string
    assets: string
  }
}

export class HexoSyncEngine {
  private config: HexoConfig

  constructor(config: HexoConfig) {
    this.config = config
  }

  /**
   * 同步文章到 Hexo 博客
   */
  async syncPost(postId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      postId,
      hexoPostPath: '',
      assetsCopied: 0,
      committed: false,
      pushed: false,
      deployed: false
    }

    try {
      console.log(`\n🔄 开始同步到 Hexo: ${postId}`)

      // 1. 验证配置
      const validation = await this.validateConfig()
      if (!validation.valid) {
        throw new Error(`Hexo 配置无效: ${validation.errors.join(', ')}`)
      }

      // 2. 读取源文件
      const sourcePath = this.findPostPath(postId)
      if (!sourcePath) {
        throw new Error(`找不到文章文件: ${postId}`)
      }

      const content = readFileSync(sourcePath, 'utf-8')

      // 3. 转换 Frontmatter（如果需要）
      const hexoContent = await this.convertFrontmatter(content)

      // 4. 复制到 Hexo _posts 目录
      const blogPath = resolve(process.cwd(), this.config.blogPath)
      const postsDir = join(blogPath, this.config.paths.posts)
      const hexoPostPath = join(postsDir, `${postId}.md`)

      // 确保目录存在
      if (!existsSync(postsDir)) {
        mkdirSync(postsDir, { recursive: true })
      }

      // 写入文件
      writeFileSync(hexoPostPath, hexoContent, 'utf-8')
      result.hexoPostPath = hexoPostPath
      console.log(`  ✅ 文件已复制: ${hexoPostPath}`)

      // 5. 复制资源文件
      result.assetsCopied = await this.copyAssets(postId, sourcePath, blogPath)

      // 6. Git commit
      if (this.config.git.autoCommit) {
        await this.gitCommit(blogPath, postId)
        result.committed = true
        console.log(`  ✅ Git commit 完成`)
      }

      // 7. Git push
      if (this.config.git.autoPush) {
        await this.gitPush(blogPath)
        result.pushed = true
        console.log(`  ✅ Git push 完成`)
      }

      // 8. 部署
      if (this.config.deploy.enabled) {
        const deployResult = await this.deploy(blogPath)
        result.deployed = deployResult.success
        result.blogUrl = deployResult.url
        if (deployResult.success) {
          console.log(`  ✅ Hexo 部署完成: ${deployResult.url}`)
        }
      }

      result.success = true
      console.log(`\n✅ Hexo 同步完成: ${postId}\n`)

    } catch (error: any) {
      result.error = error.message
      console.error(`\n❌ Hexo 同步失败: ${error}\n`)
    }

    return result
  }

  /**
   * 验证配置
   */
  private async validateConfig(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    // 检查博客路径
    const blogFullPath = resolve(process.cwd(), this.config.blogPath)
    if (!existsSync(blogFullPath)) {
      errors.push(`Hexo 博客路径不存在: ${blogFullPath}`)
    }

    // 检查 _posts 目录
    const postsPath = join(blogFullPath, this.config.paths.posts)
    if (!existsSync(postsPath)) {
      // 如果目录不存在，尝试创建
      try {
        mkdirSync(postsPath, { recursive: true })
      } catch (error) {
        errors.push(`无法创建 Hexo _posts 目录: ${postsPath}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 查找文章路径
   */
  private findPostPath(postId: string): string | null {
    const possiblePaths = [
      join(process.cwd(), 'content/posts', `${postId}.md`),
      join(process.cwd(), 'content/done', `${postId}.md`)
    ]

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        return path
      }
    }

    return null
  }

  /**
   * 转换 Frontmatter 格式
   */
  private async convertFrontmatter(content: string): Promise<string> {
    // Poster Wave 使用 YAML Frontmatter
    // Hexo 也支持 YAML Frontmatter，但字段可能不同

    const lines = content.split('\n')
    const frontmatterEnd = lines.indexOf('---', 1)

    if (frontmatterEnd === -1) {
      return content  // 没有 Frontmatter，直接返回
    }

    const frontmatterLines = lines.slice(1, frontmatterEnd)
    const bodyLines = lines.slice(frontmatterEnd + 1)

    // 解析现有 Frontmatter
    const frontmatter: Record<string, any> = {}
    for (const line of frontmatterLines) {
      const match = line.match(/^(\w+):\s*(.+)$/)
      if (match) {
        frontmatter[match[1]] = match[2]
      }
    }

    // Hexo 已经支持大部分字段，直接保留
    // 如果需要特殊转换，可以在这里添加

    return content  // 保持原样，Hexo 兼容 YAML Frontmatter
  }

  /**
   * 复制资源文件
   */
  private async copyAssets(postId: string, postPath: string, blogPath: string): Promise<number> {
    let copied = 0

    // 读取文章内容，提取资源引用
    const content = readFileSync(postPath, 'utf-8')

    const assetRegex = /!\[.*?\]\((.+?)\)/g
    const matches = [...content.matchAll(assetRegex)]

    for (const match of matches) {
      const assetPath = match[1]

      // 跳过外部链接
      if (assetPath.startsWith('http') || assetPath.startsWith('data:')) {
        continue
      }

      // 处理本地资源
      const sourceAssetPath = resolve(process.cwd(), 'content', assetPath)
      if (!existsSync(sourceAssetPath)) {
        console.warn(`  ⚠️  资源不存在: ${assetPath}`)
        continue
      }

      // 目标路径
      const targetAssetPath = resolve(blogPath, 'source', assetPath)

      // 创建目录
      const targetDir = dirname(targetAssetPath)
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true })
      }

      // 复制文件
      copyFileSync(sourceAssetPath, targetAssetPath)
      copied++
      console.log(`  ✅ 资源已复制: ${assetPath}`)
    }

    return copied
  }

  /**
   * Git commit
   */
  private async gitCommit(blogPath: string, postId: string): Promise<void> {
    try {
      // 检查是否有变更
      const status = execSync('git status --porcelain', {
        cwd: blogPath,
        encoding: 'utf-8'
      })

      if (!status.trim()) {
        console.log(`  ℹ️  没有变更，跳过 commit`)
        return
      }

      // 添加所有变更
      execSync('git add .', { cwd: blogPath })

      // Commit
      const commitMessage = `${this.config.git.commitMessage} - ${postId}`
      execSync(`git commit -m "${commitMessage}"`, { cwd: blogPath })

    } catch (error: any) {
      throw new Error(`Git commit 失败: ${error.message}`)
    }
  }

  /**
   * Git push
   */
  private async gitPush(blogPath: string): Promise<void> {
    try {
      execSync('git push', { cwd: blogPath, stdio: 'inherit' })
    } catch (error: any) {
      throw new Error(`Git push 失败: ${error.message}`)
    }
  }

  /**
   * 部署 Hexo
   */
  private async deploy(blogPath: string): Promise<{ success: boolean; url?: string }> {
    try {
      console.log(`  🚀 开始部署...`)

      // 执行 hexo generate
      execSync('hexo generate', {
        cwd: blogPath,
        stdio: 'inherit',
        timeout: this.config.deploy.timeout
      })

      // 执行 hexo deploy
      execSync(this.config.deploy.command, {
        cwd: blogPath,
        stdio: 'inherit',
        timeout: this.config.deploy.timeout
      })

      // 尝试从 _config.yml 读取 URL
      const hexoConfig = readFileSync(join(blogPath, '_config.yml'), 'utf-8')
      const urlMatch = hexoConfig.match(/^url:\s*(.+)$/m)
      const url = urlMatch ? urlMatch[1].trim() : undefined

      return { success: true, url }

    } catch (error: any) {
      throw new Error(`Hexo 部署失败: ${error.message}`)
    }
  }

  /**
   * 检查同步状态
   */
  async checkSyncStatus(postId: string): Promise<{
    inHexo: boolean
    committed: boolean
    pushed: boolean
    deployed: boolean
    url?: string
  }> {
    const blogPath = resolve(process.cwd(), this.config.blogPath)
    const hexoPostPath = join(
      blogPath,
      this.config.paths.posts,
      `${postId}.md`
    )

    const inHexo = existsSync(hexoPostPath)

    // 检查 Git 状态
    let committed = false
    let pushed = false

    if (inHexo) {
      try {
        const gitStatus = execSync('git status --porcelain', {
          cwd: blogPath,
          encoding: 'utf-8'
        })

        const isInGit = !!execSync(`git ls-files ${basename(hexoPostPath)}`, {
          cwd: blogPath,
          encoding: 'utf-8'
        }).trim()

        committed = isInGit && !gitStatus.includes(basename(hexoPostPath))

        if (committed) {
          try {
            const isPushed = execSync('git log origin/main..HEAD', {
              cwd: blogPath,
              encoding: 'utf-8'
            })

            pushed = !isPushed.includes(postId)
          } catch {
            // 可能没有 origin/main，忽略
          }
        }
      } catch (error) {
        // Git 检查失败，忽略
      }
    }

    return {
      inHexo,
      committed,
      pushed,
      deployed: false  // 需要额外检查
    }
  }
}