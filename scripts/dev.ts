import { createAPIServer } from '@content-hub/engine'
import { spawn } from 'child_process'
import { exec } from 'child_process'
import { readIndex } from '@content-hub/core'
import { injectRelatedLinks } from '@content-hub/core'
import { readFile, writeFile } from 'fs/promises'

async function clearPort(port: number): Promise<void> {
  return new Promise((resolve) => {
    exec(`lsof -ti :${port}`, (error, stdout) => {
      if (stdout.trim()) {
        const pid = stdout.trim()
        console.log(`⚠️  端口 ${port} 被进程 ${pid} 占用`)
        console.log(`🔄 正在清理端口 ${port}...`)
        exec(`kill -9 ${pid}`, () => {
          console.log(`✅ 端口 ${port} 已清理\n`)
          resolve()
        })
      } else {
        resolve()
      }
    })
  })
}

async function runScan() {
  console.log('📚 开始扫描内容...\n')

  try {
    // 动态导入扫描模块
    const { scan } = await import('@content-hub/core')

    const result = await scan('content/posts', {
      recursive: true,
      includeDrafts: true,
      updateIndex: true,
      inject: true  // ✅ 开发环境自动注入缺失的 frontmatter
    })

    console.log(`\n✅ 扫描完成: 找到 ${result.posts.length} 篇文章`)
    console.log(`   - 新文章: ${result.newPosts.length}`)
    console.log(`   - 已更新: ${result.updatedPosts.length}`)
    console.log(`   - 耗时: ${result.duration}ms`)
    if (result.newPosts.length > 0) {
      console.log(`   - 💾 已自动注入 Frontmatter 到新文章`)
    }

    return result.posts
  } catch (error) {
    console.error('❌ 扫描失败:', error)
    throw error
  }
}

async function injectLinks() {
  console.log('\n🔗 开始注入相关链接...\n')

  try {
    const indexMap = await readIndex()

    if (!indexMap || indexMap.size === 0) {
      console.log('⚠️  没有找到索引，跳过链接注入')
      return
    }

    let successCount = 0
    let skipCount = 0

    for (const [postId, post] of indexMap.entries()) {
      try {
        const filepath = `content/posts/${postId}.md`
        const content = await readFile(filepath, 'utf-8')
        const enhanced = injectRelatedLinks(content, post, indexMap)

        if (enhanced === content) {
          skipCount++
        } else {
          await writeFile(filepath, enhanced, 'utf-8')
          successCount++
        }
      } catch (error) {
        console.error(`❌ 注入失败: ${postId}`, error)
      }
    }

    console.log(`\n✅ 链接注入完成: 成功 ${successCount} 篇, 跳过 ${skipCount} 篇`)
  } catch (error) {
    console.error('❌ 注入链接失败:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 Starting Content Hub development servers...\n')

  console.log('📋 启动流程:')
  console.log('   1️⃣  扫描文章并自动注入 Frontmatter')
  console.log('   2️⃣  注入相关文章链接')
  console.log('   3️⃣  启动 API 服务器 (端口 3001)')
  console.log('   4️⃣  启动 Web UI (端口 5173)\n')

  // 1. 扫描内容（自动注入 frontmatter）
  await runScan()

  // 2. 注入相关链接
  await injectLinks()

  console.log('\n📡 准备启动服务器...\n')

  // 清理端口 3001
  await clearPort(3001)

  // 清理端口 5173
  await clearPort(5173)

  // Start API server
  const apiServer = await createAPIServer({
    port: 3001
  })

  // Start Vite dev server
  const vite = spawn('pnpm', ['--filter', 'web-ui', 'dev'], {
    stdio: 'inherit',
    shell: true
  })

  // Handle shutdown
  const shutdown = async () => {
    console.log('\n\n👋 Shutting down servers...')
    vite.kill('SIGTERM')
    await apiServer.stop()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  vite.on('exit', (code) => {
    console.log(`Vite exited with code ${code}`)
    shutdown()
  })
}

main().catch(console.error)
