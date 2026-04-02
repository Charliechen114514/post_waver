#!/usr/bin/env tsx
/**
 * 测试迁移脚本
 * 验证数据是否正确写入数据库
 */

import { PrismaClient } from '../packages/database/dist/index.js'

const prisma = new PrismaClient()

async function testMigration() {
  console.log('🔍 测试数据库迁移结果...\n')

  try {
    // 1. 测试 Config 表
    console.log('📋 Config 表:')
    const configCount = await prisma.config.count()
    console.log(`   总记录数: ${configCount}`)

    const configsByCategory = await prisma.config.groupBy({
      by: ['category'],
      _count: true
    })
    console.log('   按分类统计:')
    configsByCategory.forEach(({ category, _count }) => {
      console.log(`   - ${category}: ${_count} 条`)
    })

    // 显示几个示例配置
    const sampleConfigs = await prisma.config.findMany({ take: 3 })
    console.log('\n   示例配置:')
    sampleConfigs.forEach(config => {
      const preview = config.value.length > 50
        ? config.value.substring(0, 50) + '...'
        : config.value
      console.log(`   - ${config.key}: ${preview}`)
    })

    // 2. 测试 TagCache 表
    console.log('\n📋 TagCache 表:')
    const tagCount = await prisma.tagCache.count()
    console.log(`   总标签数: ${tagCount}`)

    if (tagCount > 0) {
      const topTags = await prisma.tagCache.findMany({
        orderBy: { count: 'desc' },
        take: 5
      })
      console.log('   热门标签:')
      topTags.forEach(tag => {
        console.log(`   - ${tag.tag}: 使用 ${tag.count} 次`)
      })
    }

    // 3. 测试 ContentIndex 表
    console.log('\n📋 ContentIndex 表:')
    const contentCount = await prisma.contentIndex.count()
    console.log(`   总文章数: ${contentCount}`)

    if (contentCount > 0) {
      const draftCount = await prisma.contentIndex.count({
        where: { draft: true }
      })
      console.log(`   - 草稿: ${draftCount}`)
      console.log(`   - 已发布: ${contentCount - draftCount}`)

      const latestPost = await prisma.contentIndex.findFirst({
        orderBy: { date: 'desc' }
      })
      if (latestPost) {
        console.log(`   - 最新文章: ${latestPost.title}`)
      }
    }

    // 4. 测试 PlatformIdMapping 表
    console.log('\n📋 PlatformIdMapping 表:')
    const platformMappingCount = await prisma.platformIdMapping.count()
    console.log(`   总映射数: ${platformMappingCount}`)

    if (platformMappingCount > 0) {
      const mappingsByPlatform = await prisma.platformIdMapping.groupBy({
        by: ['platform'],
        _count: true
      })
      console.log('   按平台统计:')
      mappingsByPlatform.forEach(({ platform, _count }) => {
        console.log(`   - ${platform}: ${_count} 条`)
      })
    }

    console.log('\n✅ 测试完成！')

    // 总结
    console.log('\n📊 迁移总结:')
    console.log(`   - 配置项: ${configCount} 条`)
    console.log(`   - 标签缓存: ${tagCount} 条`)
    console.log(`   - 文章索引: ${contentCount} 条`)
    console.log(`   - 平台映射: ${platformMappingCount} 条`)
    console.log(`   总计: ${configCount + tagCount + contentCount + platformMappingCount} 条记录`)

  } catch (error) {
    console.error('\n❌ 测试失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testMigration()
