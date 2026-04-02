import { createAPIServer } from '@content-hub/engine'
import { spawn } from 'child_process'

async function main() {
  console.log('🚀 Starting Content Hub development servers...\n')

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
