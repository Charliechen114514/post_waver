#!/usr/bin/env tsx
/**
 * API 服务器启动脚本
 */

import { createAPIServer } from '@content-hub/engine'

async function main() {
  const server = await createAPIServer({
    port: 3001
  })

  console.log('✅ API 服务器已启动')
  console.log('📍 地址: http://localhost:3001')
  console.log('📚 API 文档: http://localhost:3001/api/health')

  // 处理优雅关闭
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 正在关闭服务器...')
    await server.stop()
    process.exit(0)
  })
}

main().catch(console.error)
