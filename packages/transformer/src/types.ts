/**
 * 转换结果
 */
export interface TransformResult {
  /** 目标平台 */
  platform: string
  /** 转换后的内容 */
  content: string
  /** 元数据 */
  metadata: {
    title: string
    summary?: string
    tags: string[]
  }
}

/**
 * 支持的平台类型
 */
export type Platform = 'html' | 'wechat' | 'juejin' | 'csdn' | 'zhihu'

/**
 * 转换器函数类型
 */
export type Transformer = (markdown: string) => Promise<string>
