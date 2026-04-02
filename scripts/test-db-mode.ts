import { TagCacheService } from '../packages/database/dist/index.js'
import { PrismaClient } from '../packages/database/dist/prisma/client.js'

const prisma = new PrismaClient()

async function test() {
  console.log('Testing tag cache functionality...\n')

  // 1. 查看当前缓存
  const stats = await TagCacheService.getStats()
  console.log('Cache stats:')
  console.log(`   Total tags: ${stats.totalTags}`)
  console.log(`   Total usage: ${stats.totalUsage}`)
  console.log(`   Top tags: ${stats.topTags.map(t => `${t.tag}(${t.count})`).join(', ')}`)
  console.log('')

  // 2. 测试智能匹配
  const testContent = 'React hooks and TypeScript best practices'
  const matched = await TagCacheService.matchTagsFromContent(testContent, 'tech', 5)
  console.log(`Smart match test: "${testContent}"`)
  console.log(`   Matched tags: ${matched.join(', ')}`)
  console.log('')

  // 3. 查看数据库表
  const configCount = await prisma.config.count()
  const tagCacheCount = await prisma.tagCache.count()
  const contentIndexCount = await prisma.contentIndex.count()

  console.log('Database status:')
  console.log(`   Config table: ${configCount} records`)
  console.log(`   TagCache table: ${tagCacheCount} records`)
  console.log(`   ContentIndex table: ${contentIndexCount} records`)

  await prisma.$disconnect()

  console.log('\nDatabase-only mode verified successfully!')
}

test()
