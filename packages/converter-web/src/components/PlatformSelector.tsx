import { Platform } from '../utils/transformer'

interface PlatformSelectorProps {
  value: Platform
  onChange: (platform: Platform) => void
}

const PLATFORMS = [
  { value: 'html' as Platform, label: '📄 HTML' },
  { value: 'wechat' as Platform, label: '💬 微信公众号' },
  { value: 'juejin' as Platform, label: '💎 掘金' },
  { value: 'csdn' as Platform, label: '📚 CSDN' },
  { value: 'zhihu' as Platform, label: '🧠 知乎' }
]

export function PlatformSelector({ value, onChange }: PlatformSelectorProps) {
  return (
    <div className="platform-selector">
      <label>🎯 目标平台:</label>
      <select value={value} onChange={(e) => onChange(e.target.value as Platform)}>
        {PLATFORMS.map(p => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
    </div>
  )
}
