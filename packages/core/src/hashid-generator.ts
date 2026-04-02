import { randomBytes } from 'crypto'

export interface HashIDOptions {
  timestamp?: boolean
  length?: number
  prefix?: string
}

/**
 * 生成 HashID
 * 格式: {timestamp}-{random}
 * 示例: 20260402143022-a3f5b8c9
 */
export function generateHashID(options: HashIDOptions = {}): string {
  const {
    timestamp = true,
    length = 8,
    prefix = ''
  } = options

  const parts: string[] = []

  // 添加前缀
  if (prefix) {
    parts.push(prefix)
  }

  // 添加时间戳
  if (timestamp) {
    const now = new Date()
    const timestampStr = now
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 14) // YYYYMMDDHHmmss
    parts.push(timestampStr)
  }

  // 添加随机字符串
  const randomBytesBuffer = randomBytes(Math.ceil(length / 2))
  const randomStr = randomBytesBuffer.toString('hex').slice(0, length)
  parts.push(randomStr)

  return parts.join('-')
}

/**
 * 解析 HashID
 */
export function parseHashID(hashId: string): {
  timestamp?: string
  random: string
  prefix?: string
} {
  const parts = hashId.split('-')

  if (parts.length === 3) {
    return {
      prefix: parts[0],
      timestamp: parts[1],
      random: parts[2]
    }
  } else if (parts.length === 2) {
    // 检查哪部分是时间戳
    const firstIsTimestamp = parts[0].length === 14 && /^\d+$/.test(parts[0])

    if (firstIsTimestamp) {
      return {
        timestamp: parts[0],
        random: parts[1]
      }
    } else {
      return {
        prefix: parts[0],
        random: parts[1]
      }
    }
  } else {
    return {
      random: parts[0]
    }
  }
}

/**
 * 验证 HashID 格式
 */
export function isValidHashID(hashId: string): boolean {
  const parts = hashId.split('-')
  return parts.length >= 2 && parts.length <= 3
}
