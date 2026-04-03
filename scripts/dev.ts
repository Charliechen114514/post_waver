import { createAPIServer } from '@content-hub/engine'
import { spawn } from 'child_process'
import { exec } from 'child_process'

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

async function main() {
  console.log('🚀 Starting Content Hub development servers...\n')

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
