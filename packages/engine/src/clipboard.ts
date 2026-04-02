/**
 * 剪贴板集成模块
 * 提供 Node.js 环境的剪贴板读写功能
 */

/**
 * 复制内容到剪贴板
 *
 * @param content - 要复制的内容
 * @returns Promise<void>
 */
export async function copyToClipboard(content: string): Promise<void> {
  try {
    // 动态导入 clipboardy
    const clipboardy = await import('clipboardy')
    await clipboardy.default.write(content)
  } catch (error) {
    console.error('❌ 复制到剪贴板失败:', error)
    throw new Error(`复制失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 从剪贴板读取内容
 *
 * @returns Promise<string> 剪贴板内容
 */
export async function readFromClipboard(): Promise<string> {
  try {
    const clipboardy = await import('clipboardy')
    return await clipboardy.default.read()
  } catch (error) {
    console.error('❌ 从剪贴板读取失败:', error)
    throw new Error(`读取失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}
