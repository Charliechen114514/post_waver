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
 * 复制富文本到剪贴板（用于微信公众号等平台）
 * 使用 text/html 格式，确保样式被正确保留
 */
async function copyRichTextToClipboard(html: string, fallbackText: string): Promise<void> {
  // 创建一个隐藏的 input 元素用于触发复制事件
  let input = document.getElementById('copy-placeholder') as HTMLInputElement | null

  if (!input) {
    input = document.createElement('input')
    input.id = 'copy-placeholder'
    input.style.position = 'absolute'
    input.style.left = '-1000px'
    input.style.zIndex = '-1000'
    document.body.appendChild(input)
  }

  // 让 input 选中一个字符，无所谓那个字符
  input.value = 'copy-placeholder'
  input.setSelectionRange(0, 1)
  input.focus()

  return new Promise<void>((resolve, reject) => {
    // 复制触发
    const copyHandler = (e: ClipboardEvent) => {
      e.preventDefault()

      const clipboardData = e.clipboardData
      if (!clipboardData) {
        reject(new Error('无法访问剪贴板数据'))
        return
      }

      // 设置 HTML 格式（富文本）
      clipboardData.setData('text/html', html)
      // 设置纯文本格式（兼容性）
      clipboardData.setData('text/plain', fallbackText)

      document.removeEventListener('copy', copyHandler)
      resolve()
    }

    document.addEventListener('copy', copyHandler)

    // 执行复制命令
    const successful = document.execCommand('copy')
    if (!successful) {
      document.removeEventListener('copy', copyHandler)
      reject(new Error('复制命令执行失败'))
    }
  })
}
