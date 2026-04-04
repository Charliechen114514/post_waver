import { useState } from 'react'
import '../styles/CopyButton.css'

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
        await copyToClipboard(content)
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
 * 修复代码块中的空白字符：将代码块中的空格替换为不间断空格
 * 这样在复制到微信公众号时不会丢失缩进
 */
function preserveWhitespaceInCodeBlocks(container: HTMLElement): void {
  // 查找所有代码块
  const codeElements = container.querySelectorAll('pre code, code')
  codeElements.forEach(codeElement => {
    // 遍历所有子节点
    const walker = document.createTreeWalker(
      codeElement,
      NodeFilter.SHOW_TEXT,
      null
    )

    const textNodes: Text[] = []
    let node: Node | null
    while (node = walker.nextNode()) {
      textNodes.push(node as Text)
    }

    // 将每个文本节点中的空格替换为不间断空格
    textNodes.forEach(textNode => {
      const text = textNode.nodeValue
      if (text) {
        // 将所有空格替换为不间断空格（U+00A0）
        textNode.nodeValue = text.replace(/ /g, '\u00A0')
      }
    })
  })
}

/**
 * 复制富文本到剪贴板（用于微信公众号等平台）
 * 使用 Selection API 复制渲染后的 DOM 树，确保空白字符被正确保留
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
    // 修复代码块中的空白字符
    preserveWhitespaceInCodeBlocks(container)

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
