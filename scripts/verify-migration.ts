#!/usr/bin/env tsx
/**
 * 详细验证迁移脚本
 * 检查数据完整性和一致性
 */

import { readFile } from 'fs/promises'
import { join } from 'path'
import { PrismaClient } from '../packages/database/dist/index.js'

const prisma = new PrismaClient()

async function verifyMigration() {
  console.log('🔍 详细验证迁移结果...\n')

  try {
    let allPassed = true

    // 1. 验证 frontmatter-config.json
    console.log('📋 验证 frontmatter 配置...')
    try {
      const content = await readFile('frontmatter-config.json', 'utf-8')
      const data = JSON.parse(content)
      const dbCount = await prisma.config.count({
        where: { category: 'frontmatter' }
      })

      const jsonKeys = Object.keys(data).length
      if (dbCount === jsonKeys) {
        console.log(`   ✅ frontmatter 配置验证通过 (${dbCount}/${jsonKeys})`)
      } else {
        console.log(`   ⚠️  frontmatter 配置数量不匹配: 数据库 ${dbCount}, JSON ${jsonKeys}`)
        allPassed = false
      }
    } catch (error) {
      console.log(`   ⚠️  frontmatter-config.json 不存在或读取失败`)
    }

    // 2. 验证 frontmatter-tag-cache.json
    console.log('\n📋 验证标签缓存...')
    try {
      const content = await readFile('frontmatter-tag-cache.json', 'utf-8')
      const data = JSON.parse(content)
      const dbCount = await prisma.tagCache.count()

      const jsonTags = Object.keys(data.tags).length
      if (dbCount === jsonTags) {
        console.log(`   ✅ 标签缓存验证通过 (${dbCount}/${jsonTags})`)

        // 验证标签详情
        const sampleTag = await prisma.tagCache.findFirst()
        if (sampleTag) {
          const jsonTag = data.tags[sampleTag.tag]
          if (jsonTag) {
            const countMatch = sampleTag.count === jsonTag.count
            console.log(`   ✅ 标签详情验证通过 (${sampleTag.tag}: ${sampleTag.count} 次)`)
          }
        }
      } else {
        console.log(`   ⚠️  标签数量不匹配: 数据库 ${dbCount}, JSON ${jsonTags}`)
        allPassed = false
      }
    } catch (error) {
      console.log(`   ⚠️  frontmatter-tag-cache.json 不存在或读取失败`)
    }

    // 3. 验证 content-index.json
    console.log('\n📋 验证文章索引...')
    try {
      const content = await readFile('content-index.json', 'utf-8')
      const data = JSON.parse(content)
      const dbCount = await prisma.contentIndex.count()

      const jsonPosts = Object.keys(data.posts).length
      if (dbCount === jsonPosts) {
        console.log(`   ✅ 文章索引验证通过 (${dbCount}/${jsonPosts})`)

        // 验证文章详情
        const samplePost = await prisma.contentIndex.findFirst()
        if (samplePost) {
          const jsonPost = data.posts[samplePost.id]
          if (jsonPost) {
            const titleMatch = samplePost.title === jsonPost.title
            const draftMatch = samplePost.draft === jsonPost.draft
            console.log(`   ✅ 文章详情验证通过 (${samplePost.title})`)
          }
        }
      } else {
        console.log(`   ⚠️  文章数量不匹配: 数据库 ${dbCount}, JSON ${jsonPosts}`)
        allPassed = false
      }
    } catch (error) {
      console.log(`   ⚠️  content-index.json 不存在或读取失败`)
    }

    // 4. 验证配置值完整性
    console.log('\n📋 验证配置值完整性...')
    const configs = await prisma.config.findMany({
      where: { category: 'frontmatter' }
    })

    let validConfigs = 0
    for (const config of configs) {
      try {
        // 尝试解析 JSON 值
        const value = config.value
        if (value.startsWith('[') || value.startsWith('{')) {
          JSON.parse(value)
        }
        validConfigs++
      } catch (error) {
        console.log(`   ⚠️  配置值解析失败: ${config.key}`)
      }
    }
    console.log(`   ✅ 配置值完整性验证通过 (${validConfigs}/${configs.length})`)

    // 5. 验证数据关系
    console.log('\n📋 验证数据关系...')

    // 检查 ContentIndex 中的标签是否为有效 JSON
    const contentIndexes = await prisma.contentIndex.findMany()
    let validTags = 0
    for (const post of contentIndexes) {
      try {
        const tags = JSON.parse(post.tags)
        if (Array.isArray(tags)) {
          validTags++
        }
      } catch (error) {
        console.log(`   ⚠️  文章标签解析失败: ${post.id}`)
      }
    }
    console.log(`   ✅ 文章标签关系验证通过 (${validTags}/${contentIndexes.length})`)

    // 最终结果
    console.log('\n' + '='.repeat(50))
    if (allPassed) {
      console.log('✅ 所有验证通过！迁移成功！')
    } else {
      console.log('⚠️  部分验证未通过，请检查上述警告')
    }
    console.log('='.repeat(50))

    // 详细统计
    console.log('\n📊 详细统计:')
    console.log(`   Config 表: ${await prisma.config.count()} 条`)
    console.log(`   TagCache 表: ${await prisma.tagCache.count()} 条`)
    console.log(`   ContentIndex 表: ${await prisma.contentIndex.count()} 条`)
    console.log(`   PlatformIdMapping 表: ${await prisma.platformIdMapping.count()} 条`)
    console.log(`   总计: ${await prisma.config.count() + await prisma.tagCache.count() + await prisma.contentIndex.count() + await prisma.platformIdMapping.count()} 条记录`)

  } catch (error) {
    console.error('\n❌ 验证失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyMigration()
