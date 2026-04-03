import { useEffect } from 'react'
import '../styles/Toast.css'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose?: () => void
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
    </div>
  )
}

// Toast 容器，用于管理多个 toast
export interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastProps['type'] }>
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  )
}

// 便捷函数：显示 toast
export function showToast(
  message: string,
  type: ToastProps['type'] = 'info',
  duration: number = 3000
): void {
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }

  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
  `

  document.body.appendChild(toast)

  setTimeout(() => {
    toast.classList.add('toast-hiding')
    setTimeout(() => toast.remove(), 300)
  }, duration)
}
