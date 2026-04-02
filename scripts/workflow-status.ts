import { WorkflowStatusManager } from '../packages/engine/src/workflow/status-manager.js'

async function main() {
  const statusManager = new WorkflowStatusManager()

  try {
    const history = await statusManager.getHistory(50)

    if (history.length === 0) {
      console.log('📋 暂无处理记录')
      return
    }

    console.log('\n📋 工作流状态\n')

    console.table(history.map(h => ({
      ID: h.postId,
      状态: h.status,
      位置: h.location,
      资源已移动: h.assetsMoved ? '是' : '否',
      处理时间: h.processedAt?.toLocaleString('zh-CN') || '-'
    })))

  } catch (error) {
    console.error('查询状态失败:', error)
    process.exit(1)
  }
}

main()
