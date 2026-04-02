/**
 * 将 Markdown 转换为掘金格式（Markdown）
 * 掘金原生支持 Markdown，所以主要是格式标准化和元数据提取
 */
export async function transformForJuejin(markdown: string): Promise<string> {
  // 掘金直接使用 Markdown 格式，保持原样
  // 如需特殊处理可在此添加（如添加特定标签、格式调整等）
  return markdown
}
