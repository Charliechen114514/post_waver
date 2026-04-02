import { readFile, copyFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '../packages/database/dist/index.js'

const prisma = new PrismaClient()

/**
 * 迁移 JSON 配置文件到数据库
 *
 * 此脚本将所有 JSON 配置文件的数据导入到 SQLite 数据库中，
 * 实现统一数据存储。
 */
async function migrateJsonToDatabase() {
  console.log('🔄 开始迁移 JSON 配置到数据库...\n')

  const backupDir = join(process.cwd(), '.post-waver', 'backup')

  try {
    // 创建备份目录
    console.log('📁 创建备份目录...')
    await import('fs/promises').then(fs => fs.mkdir(backupDir, { recursive: true }))
    console.log('   ✅ 备份目录创建成功\n')

    // 1. 迁移 frontmatter-config.json
    await migrateFrontmatterConfig(backupDir)

    // 2. 迁移 .post-waver/config.json
    await migrateMainConfig(backupDir)

    // 3. 迁移 .post-waver/hexo-config.json
    await migrateHexoConfig(backupDir)

    // 4. 迁移 .post-waver/image-upload-config.json
    await migrateImageUploadConfig(backupDir)

    // 5. 迁移 .post-waver/theme-preferences.json
    await migrateThemeConfig(backupDir)

    // 6. 迁移 .post-waver/wechat-token.json
    await migrateWechatTokenConfig(backupDir)

    // 7. 迁移 frontmatter-tag-cache.json
    await migrateTagCache(backupDir)

    // 8. 迁移 content-index.json
    await migrateContentIndex(backupDir)

    // 9. 迁移 content/platform-ids.json
    await migratePlatformIds(backupDir)

    console.log('\n✅ 迁移完成！')
    console.log('\n📊 数据库信息：')
    console.log(`   - 所有配置和缓存已存储在数据库中`)
    console.log(`   - 数据库文件: packages/database/prisma/dev.db`)
    console.log(`   - 备份文件位置: ${backupDir}`)
    console.log('\n💡 下一步：')
    console.log('   1. 测试功能：pnpm scan')
    console.log('   2. 确认无误后，可删除备份目录中的 JSON 文件')
    console.log('   3. 迁移完成后，只需迁移 dev.db 一个文件即可\n')

  } catch (error) {
    console.error('\n❌ 迁移失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * 将配置对象导入数据库
 */
async function importConfigsToDatabase(category: string, config: Record<string, any>) {
  for (const [key, value] of Object.entries(config)) {
    const fullKey = `${category}.${key}`
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value)

    await prisma.config.upsert({
      where: { key: fullKey },
      update: { value: valueStr },
      create: {
        key: fullKey,
        value: valueStr,
        category
      }
    })
  }
}

/**
 * 迁移 frontmatter-config.json
 */
async function migrateFrontmatterConfig(backupDir: string) {
  console.log('📋 迁移 frontmatter-config.json...')

  const filePath = join(process.cwd(), 'frontmatter-config.json')
  if (!existsSync(filePath)) {
    console.log('   ⚠️  文件不存在，跳过\n')
    return
  }

  // 备份
  await copyFile(filePath, join(backupDir, 'frontmatter-config.json'))

  // 读取并导入
  const content = await readFile(filePath, 'utf-8')
  const data = JSON.parse(content)

  await importConfigsToDatabase('frontmatter', data)

  console.log('   ✅ frontmatter 配置已导入\n')
}

/**
 * 迁移 .post-waver/config.json
 */
async function migrateMainConfig(backupDir: string) {
  console.log('📋 迁移 .post-waver/config.json...')

  const filePath = join(process.cwd(), '.post-waver', 'config.json')
  if (!existsSync(filePath)) {
    console.log('   ⚠️  文件不存在，跳过\n')
    return
  }

  // 备份
  await copyFile(filePath, join(backupDir, 'config.json'))

  // 读取并导入
  const content = await readFile(filePath, 'utf-8')
  const data = JSON.parse(content)

  await importConfigsToDatabase('main', data)

  console.log('   ✅ 主配置已导入\n')
}

/**
 * 迁移 .post-waver/hexo-config.json
 */
async function migrateHexoConfig(backupDir: string) {
  console.log('📋 迁移 .post-waver/hexo-config.json...')

  const filePath = join(process.cwd(), '.post-waver', 'hexo-config.json')
  if (!existsSync(filePath)) {
    console.log('   ⚠️  文件不存在，跳过\n')
    return
  }

  // 备份
  await copyFile(filePath, join(backupDir, 'hexo-config.json'))

  // 读取并导入
  const content = await readFile(filePath, 'utf-8')
  const data = JSON.parse(content)

  await importConfigsToDatabase('hexo', data)

  console.log('   ✅ Hexo 配置已导入\n')
}

/**
 * 迁移 .post-waver/image-upload-config.json
 */
async function migrateImageUploadConfig(backupDir: string) {
  console.log('📋 迁移 .post-waver/image-upload-config.json...')

  const filePath = join(process.cwd(), '.post-waver', 'image-upload-config.json')
  if (!existsSync(filePath)) {
    console.log('   ⚠️  文件不存在，跳过\n')
    return
  }

  // 备份
  await copyFile(filePath, join(backupDir, 'image-upload-config.json'))

  // 读取并导入
  const content = await readFile(filePath, 'utf-8')
  const data = JSON.parse(content)

  await importConfigsToDatabase('imageUpload', data)

  console.log('   ✅ 图片上传配置已导入\n')
}

/**
 * 迁移 .post-waver/theme-preferences.json
 */
async function migrateThemeConfig(backupDir: string) {
  console.log('📋 迁移 .post-waver/theme-preferences.json...')

  const filePath = join(process.cwd(), '.post-waver', 'theme-preferences.json')
  if (!existsSync(filePath)) {
    console.log('   ⚠️  文件不存在，跳过\n')
    return
  }

  // 备份
  await copyFile(filePath, join(backupDir, 'theme-preferences.json'))

  // 读取并导入
  const content = await readFile(filePath, 'utf-8')
  const data = JSON.parse(content)

  await importConfigsToDatabase('theme', data)

  console.log('   ✅ 主题配置已导入\n')
}

/**
 * 迁移 .post-waver/wechat-token.json
 */
async function migrateWechatTokenConfig(backupDir: string) {
  console.log('📋 迁移 .post-waver/wechat-token.json...')

  const filePath = join(process.cwd(), '.post-waver', 'wechat-token.json')
  if (!existsSync(filePath)) {
    console.log('   ⚠️  文件不存在，跳过\n')
    return
  }

  // 备份
  await copyFile(filePath, join(backupDir, 'wechat-token.json'))

  // 读取并导入
  const content = await readFile(filePath, 'utf-8')
  const data = JSON.parse(content)

  await importConfigsToDatabase('wechatToken', data)

  console.log('   ✅ 微信令牌配置已导入\n')
}

/**
 * 迁移 frontmatter-tag-cache.json
 */
async function migrateTagCache(backupDir: string) {
  console.log('📋 迁移 frontmatter-tag-cache.json...')

  const filePath = join(process.cwd(), 'frontmatter-tag-cache.json')
  if (!existsSync(filePath)) {
    console.log('   ⚠️  文件不存在，跳过\n')
    return
  }

  // 备份
  await copyFile(filePath, join(backupDir, 'frontmatter-tag-cache.json'))

  // 读取并导入
  const content = await readFile(filePath, 'utf-8')
  const data: {
    version: number
    tags: Record<string, {
      tag: string
      count: number
      lastUsed: string
      relatedKeywords: string[]
      categories: string[]
    }>
  } = JSON.parse(content)

  for (const [_, entry] of Object.entries(data.tags)) {
    // 为每个标签查找一个分类（取第一个）
    const category = entry.categories[0] || 'general'

    await prisma.tagCache.upsert({
      where: { tag: entry.tag },
      update: {
        count: entry.count,
        lastUsed: new Date(entry.lastUsed),
        relatedKeywords: JSON.stringify(entry.relatedKeywords),
        categories: JSON.stringify(entry.categories)
      },
      create: {
        tag: entry.tag,
        count: entry.count,
        lastUsed: new Date(entry.lastUsed),
        relatedKeywords: JSON.stringify(entry.relatedKeywords),
        categories: JSON.stringify(entry.categories)
      }
    })
  }

  console.log('   ✅ 标签缓存已导入\n')
}

/**
 * 迁移 content-index.json
 */
async function migrateContentIndex(backupDir: string) {
  console.log('📋 迁移 content-index.json...')

  const filePath = join(process.cwd(), 'content-index.json')
  if (!existsSync(filePath)) {
    console.log('   ⚠️  文件不存在，跳过\n')
    return
  }

  // 备份
  await copyFile(filePath, join(backupDir, 'content-index.json'))

  // 读取并导入
  const content = await readFile(filePath, 'utf-8')
  const data: {
    version: number
    posts: Record<string, {
      id: string
      title: string
      date: string
      tags: string[]
      contentHash: string
      filepath: string
      draft: boolean
      prev?: string
      next?: string
      related?: Array<{ id: string; title: string; score: number }>
    }>
  } = JSON.parse(content)

  for (const [_, entry] of Object.entries(data.posts)) {
    await prisma.contentIndex.upsert({
      where: { id: entry.id },
      update: {
        title: entry.title,
        date: new Date(entry.date),
        tags: JSON.stringify(entry.tags),
        contentHash: entry.contentHash,
        filepath: entry.filepath,
        draft: entry.draft,
        prev: entry.prev,
        next: entry.next,
        related: entry.related ? JSON.stringify(entry.related) : null
      },
      create: {
        id: entry.id,
        title: entry.title,
        date: new Date(entry.date),
        tags: JSON.stringify(entry.tags),
        contentHash: entry.contentHash,
        filepath: entry.filepath,
        draft: entry.draft,
        prev: entry.prev,
        next: entry.next,
        related: entry.related ? JSON.stringify(entry.related) : null
      }
    })
  }

  console.log('   ✅ 内容索引已导入\n')
}

/**
 * 迁移 content/platform-ids.json
 */
async function migratePlatformIds(backupDir: string) {
  console.log('📋 迁移 content/platform-ids.json...')

  const filePath = join(process.cwd(), 'content', 'platform-ids.json')
  if (!existsSync(filePath)) {
    console.log('   ⚠️  文件不存在，跳过\n')
    return
  }

  // 备份
  await copyFile(filePath, join(backupDir, 'platform-ids.json'))

  // 读取并导入
  const content = await readFile(filePath, 'utf-8')
  const data: {
    version: number
    mappings: Record<string, Record<string, {
      postId: string
      url?: string
      publishedAt?: string
    }>>
  } = JSON.parse(content)

  for (const [postId, platforms] of Object.entries(data.mappings)) {
    for (const [platform, info] of Object.entries(platforms)) {
      await prisma.platformIdMapping.upsert({
        where: {
          postId_platform: {
            postId,
            platform
          }
        },
        update: {
          platformPostId: info.postId,
          url: info.url,
          publishedAt: info.publishedAt ? new Date(info.publishedAt) : null
        },
        create: {
          postId,
          platform,
          platformPostId: info.postId,
          url: info.url,
          publishedAt: info.publishedAt ? new Date(info.publishedAt) : null
        }
      })
    }
  }

  console.log('   ✅ 平台 ID 映射已导入\n')
}

// 运行迁移
migrateJsonToDatabase()
