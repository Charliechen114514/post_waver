export interface WechatTheme {
  name: string
  displayName: string
  description: string
}

// 从 meta.json 复制并简化
export const WECHAT_THEMES: WechatTheme[] = [
  { name: 'orangeheart', displayName: 'Orange Heart', description: '温暖橙心主题' },
  { name: 'rainbow', displayName: 'Rainbow', description: '彩虹渐变主题' },
  { name: 'lapis', displayName: 'Lapis', description: '青金石主题' },
  { name: 'pie', displayName: 'Pie', description: '优雅派主题' },
  { name: 'maize', displayName: 'Maize', description: '清新明亮主题' },
  { name: 'purple', displayName: 'Purple', description: '紫色主题' },
  { name: 'phycat', displayName: '物理猫-薄荷', description: '薄荷绿主题' },
  { name: 'simple', displayName: 'Simple', description: '简约主题' },
  { name: 'fresh', displayName: 'Fresh', description: '清新主题' },
  { name: 'business', displayName: 'Business', description: '商务主题' }
]

export function getThemeCSS(themeName: string): Promise<string> {
  // 检测开发环境 vs 生产环境
  const isDev = import.meta.env.DEV

  // 开发环境：直接路径（Vite自动处理public目录）
  // 生产环境：使用base路径
  const cssPath = isDev
    ? `/themes/wechat/${themeName}.css`
    : `/post_waver/themes/wechat/${themeName}.css`

  return fetch(cssPath)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Failed to load theme CSS: ${res.status} ${res.statusText}`)
      }
      return res.text()
    })
    .catch(err => {
      console.error('Failed to load theme:', err)
      return ''
    })
}
