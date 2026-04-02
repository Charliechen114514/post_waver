import { WorkflowStatusManager } from '../packages/engine/src/workflow/status-manager.js'

async function main() {
  const limitArg = process.argv[2]
  const limit = limitArg ? parseInt(limitArg, 10) : 20

  const statusManager = new WorkflowStatusManager()

  try {
    const history = await statusManager.getHistory(limit)

    if (history.length === 0) {
      console.log('📋 暂无处理记录')
      return
    }

    console.log(`\n📋 处理历史 (最近 ${history.length} 条)\n`)

    console.table(history.map(h => ({
      ID: h.postId,
      状态: h.status,
      位置: h.location,
      资源已移动: h.assetsMoved ? '是' : '否',
      处理时间: h.processedAt?.toLocaleString('zh-CN') || '-',
      移动时间: h.movedAt?.toLocaleString('zh-CN') || '-'
    })))

  } catch (error) {
    console.error('查询历史失败:', error)
    process.exit(1)
  }
}

main()
