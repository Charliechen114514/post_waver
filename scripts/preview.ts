#!/usr/bin/env tsx
import { Command } from 'commander'
import { startPreview, getPreviewURL } from '@content-hub/engine'

const program = new Command()

program
  .name('preview')
  .description('预览 Markdown 文章在目标平台的渲染效果')
  .argument('<platform>', '目标平台: wechat, juejin, html')
  .argument('<file>', 'Markdown 文件路径')
  .action(async (platform: string, file: string) => {
    try {
      console.log(`\n🎯 平台: ${platform}`)
      console.log(`📄 文件: ${file}\n`)

      // 启动预览服务器
      const server = await startPreview(file, platform)

      // 生成预览 URL（对文件路径进行 URL 编码）
      const url = `http://localhost:${server.port}/preview/${platform}/${encodeURIComponent(file)}`

      console.log(`\n✅ 预览服务器已启动!`)
      console.log(`📖 预览地址: ${url}`)
      console.log(`\n💡 提示:`)
      console.log(`   - 点击页面上的"复制到剪贴板"按钮复制内容`)
      console.log(`   - 按 Ctrl+C 停止服务器\n`)

      // 在浏览器中打开预览页面
      // 注意: 需要安装 open 包
      try {
        const { default: open } = await import('open')
        await open(url)
        console.log(`🌐 已在浏览器中打开预览页面\n`)
      } catch (error) {
        console.log(`\n⚠️  无法自动打开浏览器，请手动访问: ${url}\n`)
      }

      // 保持服务器运行直到 Ctrl+C
      process.on('SIGINT', async () => {
        console.log('\n\n👋 正在关闭预览服务器...\n')
        await server.stop()
        process.exit(0)
      })

      // 防止进程退出
      await new Promise(() => {})
    } catch (error) {
      console.error('\n❌ 预览失败!\n')
      console.error(error instanceof Error ? error.message : '未知错误')
      console.error('\n💡 可能的原因:')
      console.error('   - 文件路径不正确')
      console.error('   - 平台名称不支持 (支持: wechat, juejin, html)')
      console.error('   - Markdown 格式错误\n')
      process.exit(1)
    }
  })

program.parse()
