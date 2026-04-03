# @content-hub/transformer

> PostWaver 的平台转换器 - 多平台内容格式转换

---

## 📋 概述

`@content-hub/transformer` 负责将 Markdown 内容转换为各平台兼容的格式。

**支持的平台**:
- ✅ 掘金 (Juejin)
- ✅ 微信公众号 (WeChat)
- ✅ CSDN
- ✅ 知乎 (Zhihu)
- ✅ HTML

---

## 🚀 安装

```bash
pnpm install @content-hub/transformer
```

---

## 📖 使用

### 转换到掘金

```typescript
import { transformToJuejin } from '@content-hub/transformer'

const markdown = '# Hello World\n\nContent here...'
const result = await transformToJuejin(markdown)

console.log(result.content) // Converted content
```

### 转换到微信

```typescript
import { transformToWeChat } from '@content-hub/transformer'

const markdown = '# Hello World\n\nContent here...'
const result = await transformToWeChat(markdown)

console.log(result.html) // HTML with inline styles
```

---

## 🏗️ 架构

### 转换器列表

- **to-juejin**: 掘金转换器
- **to-wechat**: 微信转换器（CSS 内联化）
- **to-csdn**: CSDN 转换器
- **to-zhihu**: 知乎转换器
- **to-html**: HTML 转换器

### 依赖关系

```
transformer (无依赖)
```

---

## 🔌 API

### 主要函数

| 函数 | 说明 | 返回值 |
|------|------|--------|
| `transformToJuejin()` | 转换到掘金格式 | `Promise<TransformResult>` |
| `transformToWeChat()` | 转换到微信格式 | `Promise<TransformResult>` |
| `transformToCSDN()` | 转换到 CSDN 格式 | `Promise<TransformResult>` |
| `transformToZhihu()` | 转换到知乎格式 | `Promise<TransformResult>` |
| `transformToHTML()` | 转换到 HTML | `Promise<TransformResult>` |

---

## 🧪 开发

```bash
# 进入包目录
cd packages/transformer

# 构建
pnpm build

# 测试
pnpm test
```

---

## 📚 相关文档

- [详细文档](../../docs/04-developer-guide/packages/transformer.md)
- [平台转换规范](../../docs/02-user-guides/platforms/platform-conversion-specs.md)

---

**版本**: 0.1.0
**许可证**: MIT
