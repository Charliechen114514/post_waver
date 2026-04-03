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
      // 如果有 HTML 内容且是微信公众号平台，使用富文本复制
      if (htmlContent && (_platform === 'wechat' || _platform === 'html')) {
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
 * 复制富文本内容到剪贴板（用于微信公众号等平台）
 */
async function copyRichTextToClipboard(html: string, fallbackText: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.write) {
    // 使用 Clipboard API 复制富文本
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([fallbackText], { type: 'text/plain' })
    })
    await navigator.clipboard.write([clipboardItem])
  } else {
    // 降级方案：只复制纯文本
    await copyToClipboard(fallbackText)
  }
}
