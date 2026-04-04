import { useState } from 'react'
import './CopyButton.css'

interface CopyButtonProps {
  /** 要复制的内容 */
  content: string
  /** HTML 内容（用于富文本复制） */
  htmlContent?: string | null
  /** 平台名称 */
  platform: string
  /** 复制成功回调 */
  onSuccess?: () => void
  /** 复制失败回调 */
  onError?: (error: Error) => void
  /** 按钮样式类名 */
  className?: string
}

/**
 * 移除 HTML details 标签，展开折叠内容
 * 将 <details><summary>标题</summary>内容</details> 转换为：
 * ### 标题
 * 内容
 */
function removeDetailsTags(markdown: string): string {
  return markdown.replace(
    /<details>\s*<summary>([^<]+)<\/summary>\s*/gi,
    (_match, summary) => {
      // 将 summary 转换为三级标题
      return `\n### ${summary.trim()}\n\n`
    }
  ).replace(
    /<\/details>\s*/gi,
    () => {
      // 移除结束标签，添加一个空行
      return '\n'
    }
  )
}

/**
 * 格式化代码块，确保代码块格式正确
 * 1. 移除 HTML details 标签
 * 2. 确保 ```语言 后面有换行
 * 3. 确保 ``` 结尾前后都有换行
 */
function formatCodeBlocks(markdown: string): string {
  let result = removeDetailsTags(markdown)

  result = result.replace(
    /```(\w*)\s*([^\n])/g,
    (_match, lang, firstChar) => {
      // 如果 ``` 后面没有换行，添加换行
      return `\`\`\`${lang}\n${firstChar}`
    }
  ).replace(
    /([^\n])```(\n|$)/gm,
    (_match, lastChar, newline) => {
      // 确保 ``` 前后有换行
      return `${lastChar}\n\`\`\`${newline || '\n'}`
    }
  )

  // 确保文档以换行符结尾（如果文档包含代码块）
  if (result.includes('```') && !result.endsWith('\n')) {
    result += '\n'
  }

  return result
}

/**
 * 一键复制按钮组件
 */
export function CopyButton({
  content,
  htmlContent,
  platform: _platform,
  onSuccess,
  onError,
  className = ''
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const [copying, setCopying] = useState(false)

  const handleCopy = async () => {
    setCopying(true)
    try {
      // 微信公众号：复制带主题样式的完整 HTML（与预览窗口一致）
      if (_platform === 'wechat' && htmlContent) {
        // 包裹在 markdown-body 中，确保主题样式生效
        const wrappedHTML = `<div class="markdown-body">${htmlContent}</div>`
        await copyRichTextToClipboard(wrappedHTML, content)
      } else if (htmlContent && _platform === 'html') {
        await copyRichTextToClipboard(htmlContent, content)
      } else {
        // 对于纯文本平台（掘金、CSDN、知乎），在复制前格式化代码块
        const formattedContent = formatCodeBlocks(content)
        await copyToClipboard(formattedContent)
      }
      setCopied(true)
      onSuccess?.()

      // 2秒后重置状态
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      onError?.(error as Error)
    } finally {
      setCopying(false)
    }
  }

  return (
    <button
      onClick={handleCopy}
      disabled={copying || !content}
      className={`copy-button ${copied ? 'copied' : ''} ${copying || !content ? 'disabled' : ''} ${className}`}
    >
      {copying ? '复制中...' : copied ? '✓ 已复制' : '📋 复制内容'}
    </button>
  )
}

/**
 * 复制内容到剪贴板
 */
async function copyToClipboard(content: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    // 使用现代 Clipboard API
    await navigator.clipboard.writeText(content)
  } else {
    // 降级方案：使用 textarea + execCommand
    const textarea = document.createElement('textarea')
    textarea.value = content
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()

    try {
      document.execCommand('copy')
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

/**
 * 复制渲染后的 DOM 树到剪贴板（用于微信公众号等平台）
 * 这会保留所有样式效果，而不是复制 HTML 源码
 */
async function copyRichTextToClipboard(html: string, _fallbackText: string): Promise<void> {
  // 创建一个隐藏的容器来渲染 HTML，设置白色背景避免继承页面背景
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.backgroundColor = '#ffffff' // 明确设置白色背景
  container.style.padding = '0'
  container.style.margin = '0'
  container.innerHTML = html
  document.body.appendChild(container)

  try {
    // 使用 Selection API 复制渲染后的 DOM
    const range = document.createRange()
    range.selectNodeContents(container)

    const selection = window.getSelection()
    if (!selection) throw new Error('无法获取选区')

    selection.removeAllRanges()
    selection.addRange(range)

    // 执行复制命令
    const successful = document.execCommand('copy')
    if (!successful) {
      throw new Error('复制命令执行失败')
    }

    // 清除选区
    selection.removeAllRanges()
  } finally {
    // 移除临时容器
    document.body.removeChild(container)
  }
}
