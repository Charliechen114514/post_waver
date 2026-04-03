#!/usr/bin/env tsx
import { ContentIndexService } from '@content-hub/database'

async function main() {
  try {
    await ContentIndexService.clearAll()
    console.log('✅ 数据库已清理')
  } catch (error) {
    console.error('❌ 清理失败:', error)
    process.exit(1)
  }
}

main()
