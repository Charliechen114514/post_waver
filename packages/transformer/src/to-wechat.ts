import { markdownToHTML } from './to-html'

/**
 * 将 Markdown 转换为微信公众号格式的 HTML（带内联样式）
 */
export async function transformForWechat(markdown: string): Promise<string> {
  const html = await markdownToHTML(markdown)

  // 为微信公众号添加内联样式
  const styled = html
    // 标题样式
    .replace(/<h1>/g, '<h1 style="font-size: 24px; font-weight: bold; margin: 30px 0 20px; color: #333;">')
    .replace(/<h2>/g, '<h2 style="font-size: 20px; font-weight: bold; margin: 25px 0 15px; color: #333;">')
    .replace(/<h3>/g, '<h3 style="font-size: 18px; font-weight: bold; margin: 20px 0 10px; color: #333;">')
    .replace(/<h4>/g, '<h4 style="font-size: 16px; font-weight: bold; margin: 15px 0 8px; color: #333;">')
    .replace(/<h5>/g, '<h5 style="font-size: 14px; font-weight: bold; margin: 12px 0 6px; color: #333;">')
    .replace(/<h6>/g, '<h6 style="font-size: 13px; font-weight: bold; margin: 10px 0 5px; color: #333;">')
    // 段落样式
    .replace(/<p>/g, '<p style="font-size: 15px; line-height: 1.8; margin: 15px 0; color: #333; text-align: justify;">')
    // 列表样式
    .replace(/<ul>/g, '<ul style="margin: 15px 0; padding-left: 20px;">')
    .replace(/<ol>/g, '<ol style="margin: 15px 0; padding-left: 20px;">')
    .replace(/<li>/g, '<li style="margin: 8px 0; color: #333;">')
    // 代码块样式
    .replace(/<pre>/g, '<pre style="background: #f4f4f4; padding: 16px; border-radius: 4px; overflow-x: auto; margin: 15px 0; font-size: 14px; line-height: 1.6;">')
    .replace(/<code>/g, '<code style="font-family: Consolas, Monaco, "Andale Mono", monospace; color: #d63384;">')
    // 行内代码样式（需要区分代码块中的code）
    .replace(/<p><code/g, '<p><code style="background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: Consolas, Monaco, "Andale Mono", monospace; color: #d63384; font-size: 14px;"')
    // 引用样式
    .replace(/<blockquote>/g, '<blockquote style="border-left: 4px solid #ddd; padding: 10px 20px; margin: 20px 0; color: #666; background: #f9f9f9;">')
    // 表格样式
    .replace(/<table>/g, '<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">')
    .replace(/<th>/g, '<th style="border: 1px solid #ddd; padding: 12px; background: #f4f4f4; font-weight: bold; text-align: left;">')
    .replace(/<td>/g, '<td style="border: 1px solid #ddd; padding: 12px;">')
    // 链接样式
    .replace(/<a /g, '<a style="color: #007bff; text-decoration: underline;" ')
    // 图片样式
    .replace(/<img /g, '<img style="max-width: 100%; height: auto; display: block; margin: 20px auto;" ')
    // 分隔线样式
    .replace(/<hr>/g, '<hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">')

  return styled
}
