# Image Resolver API 参考

图片路径解析器的完整 API 文档。

---

## 模块导出

```typescript
import {
  isExternalLink,
  isBase64Image,
  normalizePath,
  imageExists,
  generateUniqueFilename
} from '@content-hub/core'
```

---

## 函数

### `isExternalLink()`

检查给定的图片源是否为外链（HTTP/HTTPS）。

#### 签名

```typescript
function isExternalLink(src: string): boolean
```

#### 参数

- `src` (string) - 图片源路径

#### 返回值

- `boolean` - 如果是外链返回 `true`，否则返回 `false`

#### 示例

```typescript
import { isExternalLink } from '@content-hub/core'

isExternalLink('https://example.com/image.jpg')  // true
isExternalLink('http://example.com/image.jpg')   // true
isExternalLink('./image.jpg')                    // false
isExternalLink('/path/to/image.jpg')             // false
isExternalLink('')                               // false
```

#### 实现

```typescript
export function isExternalLink(src: string): boolean {
  return /^https?:\/\//i.test(src)
}
```

---

### `isBase64Image()`

检查给定的图片源是否为 Base64 编码的图片。

#### 签名

```typescript
function isBase64Image(src: string): boolean
```

#### 参数

- `src` (string) - 图片源路径

#### 返回值

- `boolean` - 如果是 Base64 图片返回 `true`，否则返回 `false`

#### 示例

```typescript
import { isBase64Image } from '@content-hub/core'

isBase64Image('data:image/png;base64,iVBOR...')  // true
isBase64Image('data:image/jpeg;base64,/9j/4AAQ...') // true
isBase64Image('./image.jpg')                      // false
isBase64Image('https://example.com/image.jpg')     // false
```

#### 实现

```typescript
export function isBase64Image(src: string): boolean {
  return /^data:image\/[a-z]+;base64/i.test(src)
}
```

---

### `normalizePath()`

规范化本地图片路径到 `/assets/images/` 目录。

#### 签名

```typescript
function normalizePath(
  src: string,
  baseDir: string,
  options?: {
    onMissing?: (path: string) => void
  }
): string
```

#### 参数

- `src` (string) - 图片源路径
- `baseDir` (string) - 基础目录（用于解析相对路径）
- `options` (object, 可选)
  - `onMissing` (function) - 文件不存在时的回调函数

#### 返回值

- `string` - 规范化后的路径

#### 行为

| 输入类型 | 行为 |
|---------|------|
| 外链 | 返回原路径 |
| Base64 | 返回原路径 |
| 存在的本地图片 | 返回 `/assets/images/{filename}` |
| 不存在的本地图片 | 返回原路径，调用 `onMissing` 回调 |

#### 示例

```typescript
import { normalizePath } from '@content-hub/core'

// 外链 - 保持不变
normalizePath('https://example.com/image.jpg', '/path/to/dir')
// 'https://example.com/image.jpg'

// Base64 - 保持不变
normalizePath('data:image/png;base64,iVBOR...', '/path/to/dir')
// 'data:image/png;base64,iVBOR...'

// 本地图片 - 规范化
normalizePath('./images/pic.png', '/path/to/dir', {
  onMissing: (path) => console.warn(`Missing: ${path}`)
})
// '/assets/images/pic.png'

// 不存在的本地图片
normalizePath('./missing.png', '/path/to/dir', {
  onMissing: (path) => console.warn(`Missing: ${path}`)
})
// './missing.png' (并输出警告)
```

#### 实现

```typescript
export function normalizePath(
  src: string,
  baseDir: string,
  options: {
    onMissing?: (path: string) => void
  } = {}
): string {
  const { onMissing } = options

  // 外链：保持不变
  if (isExternalLink(src)) {
    return src
  }

  // base64：保持不变
  if (isBase64Image(src)) {
    return src
  }

  // 解析绝对路径
  const absolutePath = resolve(baseDir, src)

  // 检查文件是否存在
  if (!existsSync(absolutePath)) {
    onMissing?.(src)
    return src
  }

  // 计算相对 assets 目录的路径
  const filename = basename(absolutePath)
  return `/assets/images/${filename}`
}
```

---

### `imageExists()`

检查图片文件是否存在。

#### 签名

```typescript
function imageExists(src: string, baseDir: string): boolean
```

#### 参数

- `src` (string) - 图片源路径
- `baseDir` (string) - 基础目录

#### 返回值

- `boolean` - 文件存在返回 `true`，否则返回 `false`

#### 行为

| 输入类型 | 返回值 |
|---------|--------|
| 外链 | `true` (不检查) |
| Base64 | `true` (不检查) |
| 存在的本地图片 | `true` |
| 不存在的本地图片 | `false` |

#### 示例

```typescript
import { imageExists } from '@content-hub/core'

// 外链 - 总是返回 true
imageExists('https://example.com/image.jpg', '/path/to/dir')
// true

// Base64 - 总是返回 true
imageExists('data:image/png;base64,iVBOR...', '/path/to/dir')
// true

// 本地图片 - 实际检查
imageExists('./images/pic.png', '/path/to/dir')
// true 或 false，取决于文件是否存在
```

#### 实现

```typescript
export function imageExists(src: string, baseDir: string): boolean {
  if (isExternalLink(src) || isBase64Image(src)) {
    return true
  }

  const absolutePath = resolve(baseDir, src)
  return existsSync(absolutePath)
}
```

---

### `generateUniqueFilename()`

生成唯一的文件名，处理文件名冲突。

#### 签名

```typescript
function generateUniqueFilename(
  filename: string,
  existingFilenames: Set<string>
): string
```

#### 参数

- `filename` (string) - 原始文件名
- `existingFilenames` (Set<string>) - 已存在的文件名集合

#### 返回值

- `string` - 唯一的文件名

#### 行为

1. 如果文件名不存在，返回原文件名
2. 如果文件名存在，添加数字后缀（`-1`, `-2`, ...）
3. 返回第一个不冲突的文件名

#### 示例

```typescript
import { generateUniqueFilename } from '@content-hub/core'

const existing = new Set(['file2.jpg'])

// 文件名不存在
generateUniqueFilename('file1.jpg', existing)
// 'file1.jpg'

// 文件名存在
const existing2 = new Set(['file.jpg'])
generateUniqueFilename('file.jpg', existing2)
// 'file-1.jpg'

// 多次冲突
const existing3 = new Set(['file.jpg', 'file-1.jpg', 'file-2.jpg'])
generateUniqueFilename('file.jpg', existing3)
// 'file-3.jpg'

// 无扩展名
generateUniqueFilename('file', new Set(['file']))
// 'file-1'

// 多个点号
generateUniqueFilename('file.name.txt', new Set(['file.name.txt']))
// 'file.name-1.txt'
```

#### 实现

```typescript
export function generateUniqueFilename(
  filename: string,
  existingFilenames: Set<string>
): string {
  if (!existingFilenames.has(filename)) {
    return filename
  }

  // 分离文件名和扩展名
  const lastDotIndex = filename.lastIndexOf('.')
  const name = lastDotIndex !== -1 ? filename.slice(0, lastDotIndex) : filename
  const ext = lastDotIndex !== -1 ? filename.slice(lastDotIndex) : ''

  // 生成唯一名称
  let counter = 1
  let uniqueFilename: string
  do {
    uniqueFilename = `${name}-${counter}${ext}`
    counter++
  } while (existingFilenames.has(uniqueFilename))

  return uniqueFilename
}
```

---

## 类型定义

### `ImageType`

图片类型的枚举。

```typescript
type ImageType =
  | 'external'   // 外链图片
  | 'base64'     // Base64 编码
  | 'local'      // 本地图片
  | 'missing'    // 缺失的本地图片
```

### `NormalizePathOptions`

`normalizePath()` 函数的选项。

```typescript
interface NormalizePathOptions {
  onMissing?: (path: string) => void
}
```

---

## 使用示例

### 基本使用

```typescript
import {
  isExternalLink,
  isBase64Image,
  normalizePath,
  imageExists,
  generateUniqueFilename
} from '@content-hub/core'

// 检查图片类型
const imageUrl = 'https://example.com/image.jpg'
if (isExternalLink(imageUrl)) {
  console.log('这是外链图片')
}

// 规范化路径
const normalized = normalizePath('./images/pic.png', '/path/to/dir', {
  onMissing: (path) => console.warn(`图片不存在: ${path}`)
})
console.log(normalized) // '/assets/images/pic.png'

// 处理文件名冲突
const existing = new Set(['logo.png'])
const uniqueName = generateUniqueFilename('logo.png', existing)
console.log(uniqueName) // 'logo-1.png'
```

### 集成到迁移脚本

```typescript
import { readFile, writeFile, copyFileSync } from 'fs'
import { normalizePath, isExternalLink, isBase64Image } from '@content-hub/core'

async function migrateImages(filepath: string) {
  const content = readFile(filepath, 'utf-8')

  // 替换 Markdown 图片引用
  const newContent = content.replace(
    /!\[(.*?)\]\((.+?)\)/g,
    (match, alt, src) => {
      // 跳过外链和 Base64
      if (isExternalLink(src) || isBase64Image(src)) {
        return match
      }

      // 规范化本地图片路径
      const normalized = normalizePath(src, dirname(filepath), {
        onMissing: (path) => console.warn(`缺失图片: ${path}`)
      })

      return `![${alt}](${normalized})`
    }
  )

  writeFile(filepath, newContent, 'utf-8')
}
```

---

## 正则表达式参考

### 外链检测

```typescript
const EXTERNAL_LINK_REGEX = /^https?:\/\//i
```

匹配：
- `https://example.com/image.jpg`
- `HTTP://EXAMPLE.COM/IMAGE.JPG`
- `http://localhost:8080/image.png`

### Base64 检测

```typescript
const BASE64_IMAGE_REGEX = /^data:image\/[a-z]+;base64/i
```

匹配：
- `data:image/png;base64,iVBOR...`
- `data:image/jpeg;base64,/9j/4AAQ...`
- `data:image/webp;base64,...`

### Markdown 图片引用

```typescript
const MARKDOWN_IMAGE_REGEX = /!\[(.*?)\]\((.+?)\)/g
```

匹配：
- `![alt](path/to/image.jpg)`
- `![](./images/pic.png)`
- `![描述](../images/photo.jpg)`

### HTML img 标签

```typescript
const HTML_IMAGE_REGEX = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
```

匹配：
- `<img src="path/to/image.jpg" />`
- `<img src='./images/pic.png' alt="图片">`
- `<IMG SRC="photo.jpg" CLASS="image">`

---

## 性能考虑

### 文件系统操作

- `existsSync()` 是同步操作，在处理大量文件时可能阻塞
- 对于批量操作，考虑使用异步版本 `fs.promises.exists()`

### 正则表达式

- 预编译正则表达式以提高性能
- 使用非贪婪匹配 `(.+?)` 而非 `(.+)`

### Set 操作

- `generateUniqueFilename()` 使用 `Set.has()` 检查，时间复杂度 O(1)
- 预填充 `Set` 以避免重复计算

---

## 错误处理

### 文件不存在

```typescript
const normalized = normalizePath('./missing.png', '/path/to/dir', {
  onMissing: (path) => {
    console.warn(`文件不存在: ${path}`)
    // 可以记录到日志或发送通知
  }
})
// normalized === './missing.png'
```

### 无效路径

```typescript
// 空字符串
isExternalLink('')  // false
isBase64Image('')    // false

// 相对路径解析失败
normalizePath('../../etc/passwd', '/path/to/dir')
// 可能解析到系统文件，需要谨慎
```

---

## 相关资源

- [使用指南](../guides/m1.1-image-normalization.md)
- [M1.1 完成报告](../milestones/done/M1.1-完成报告.md)
- [测试覆盖](../test/test-coverage.md#m11)

---

**最后更新**：2026-04-02
**版本**：1.0.0
