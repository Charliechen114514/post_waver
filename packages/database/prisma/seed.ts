import { PrismaClient } from '../dist/index.js'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()

// ESM 模式下获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 数据库初始化种子数据
 *
 * 在 `npx prisma migrate reset` 时自动运行
 * 优先加载 seed.local.ts（本地私有配置），如果不存在则使用 seed.template.ts（默认配置）
 */
async function main() {
  console.log('🌱 开始初始化数据库配置...\n')

  // 检查是否存在本地配置
  const localConfigPath = join(__dirname, 'seed.local.ts')
  const hasLocalConfig = existsSync(localConfigPath)

  try {
    let seedConfig

    if (hasLocalConfig) {
      console.log('📁 检测到本地配置文件 seed.local.ts\n')
      // 动态导入本地配置
      const localModule = await import('./seed.local.ts')
      seedConfig = localModule.localSeedConfig
    } else {
      console.log('📁 未检测到本地配置，使用默认配置\n')
      console.log('💡 提示：创建 seed.local.ts 可以使用自定义配置\n')
      // 使用默认配置
      const templateModule = await import('./seed.template.ts')
      seedConfig = templateModule.defaultSeedConfig
    }

    // 导入配置到数据库
    await importSeedConfig(seedConfig)

    console.log('\n✅ 数据库配置初始化完成！')

    if (!hasLocalConfig) {
      console.log('\n💡 提示：部分功能需要配置才能使用')
      console.log('   - 复制 seed.template.ts 为 seed.local.ts')
      console.log('   - 在 seed.local.ts 中填入您的真实配置')
      console.log('   - seed.local.ts 已在 .gitignore 中，不会被提交')
    }

  } catch (error) {
    console.error('\n❌ 配置初始化失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * 将种子配置导入数据库
 */
async function importSeedConfig(config: any) {
  // 1. 导入主配置
  await importConfigCategory('main', config.main)

  // 2. 导入Hexo配置
  await importConfigCategory('hexo', config.hexo)

  // 3. 导入图片上传配置
  await importConfigCategory('imageUpload', config.imageUpload)

  // 4. 导入主题配置
  await importConfigCategory('theme', config.theme)

  // 5. 导入微信令牌
  await importConfigCategory('wechatToken', config.wechatToken)
}

/**
 * 导入单个配置分类
 */
async function importConfigCategory(category: string, data: any) {
  console.log(`📋 导入 ${category} 配置...`)

  for (const [key, value] of Object.entries(data)) {
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

  console.log(`   ✅ ${category} 配置已导入\n`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
