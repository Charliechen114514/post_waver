import { useState } from 'react'

interface DeploymentBannerProps {
  mode?: 'local' | 'github-pages'
}

export default function DeploymentBanner({ mode }: DeploymentBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  // 自动检测环境
  const detectMode = (): 'local' | 'github-pages' => {
    if (mode) return mode

    // 检测是否在GitHub Pages环境
    const hostname = window.location.hostname
    if (hostname === 'charliechen114514.github.io' ||
        hostname.includes('github.io')) {
      return 'github-pages'
    }
    return 'local'
  }

  const currentMode = detectMode()

  if (currentMode !== 'github-pages' || !isVisible) {
    return null
  }

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '12px 20px',
      textAlign: 'center',
      fontSize: '14px',
      fontWeight: 500,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <span style={{ fontSize: '18px' }}>🌐</span>
        <span>
          <strong>GitHub Pages 演示模式</strong> - 完整功能请使用
          <a
            href="https://github.com/Charliechen114514/post_waver"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#ffd700',
              textDecoration: 'underline',
              marginLeft: '4px',
              marginRight: '4px',
              fontWeight: 600
            }}
          >
            本地版本
          </a>
        </span>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            marginLeft: '8px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
