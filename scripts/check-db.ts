import { PrismaClient } from '../packages/database/dist/prisma/client.js'

const prisma = new PrismaClient()

async function check() {
  const configCount = await prisma.config.count()
  const tagCacheCount = await prisma.tagCache.count()
  const contentIndexCount = await prisma.contentIndex.count()
  const platformMappingCount = await prisma.platformIdMapping.count()

  console.log('Database Statistics:')
  console.log(`  Config: ${configCount} records`)
  console.log(`  TagCache: ${tagCacheCount} records`)
  console.log(`  ContentIndex: ${contentIndexCount} records`)
  console.log(`  PlatformIdMapping: ${platformMappingCount} records`)
  console.log('')
  console.log('Database initialization: OK')
}

check()
  .then(() => prisma.$disconnect())
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
