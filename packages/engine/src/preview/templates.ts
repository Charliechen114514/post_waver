import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * 预览上下文接口
 */
export interface PreviewContext {
  title: string
  platform: string
  content: string
  id: string
  timestamp: string
}

/**
 * 模板渲染器类
 */
export class TemplateRenderer {
  private templatesDir: string

  constructor(templatesDir: string) {
    this.templatesDir = templatesDir
  }

  /**
   * 渲染预览模板
   */
  render(templateName: string, context: PreviewContext): string {
    const templatePath = join(this.templatesDir, templateName)

    try {
      let template = readFileSync(templatePath, 'utf-8')

      // 简单的模板变量替换
      template = template.replace(/\{\{title\}\}/g, this.escapeHtml(context.title))
      template = template.replace(/\{\{platform\}\}/g, this.escapeHtml(context.platform))
      template = template.replace(/\{\{id\}\}/g, this.escapeHtml(context.id))
      template = template.replace(/\{\{timestamp\}\}/g, this.escapeHtml(context.timestamp))

      // 内容不需要转义（包含 HTML）
      template = template.replace(/\{\{\{content\}\}\}/g, context.content)

      return template
    } catch (error) {
      console.error(`模板加载失败: ${templatePath}`, error)
      throw new Error(`模板 ${templateName} 加载失败`)
    }
  }

  /**
   * HTML 转义函数
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, (m) => map[m])
  }
}

/**
 * 创建默认模板渲染器
 */
export function createRenderer(): TemplateRenderer {
  // 使用内联模板（在 server.ts 中已实现）
  // 这个函数保留用于未来的文件模板支持
  return new TemplateRenderer(join(process.cwd(), 'packages/engine/templates'))
}
