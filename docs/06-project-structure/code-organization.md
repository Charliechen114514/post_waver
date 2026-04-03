# 代码组织原则

> **版本**: v1.0
> **最后更新**: 2026-04-03
> **受众**: 开发者
> **阅读时间**: 10 分钟

---

## 📋 概述

本文档说明了 PostWaver 项目的代码组织原则和最佳实践。

---

## 🏗️ 模块结构

### 包结构

每个包遵循标准结构：

```
packages/<package-name>/
├── src/                # 源代码
│   ├── index.ts       # 导出入口
│   ├── modules/       # 功能模块
│   └── utils/         # 工具函数
├── dist/              # 编译输出
├── tests/             # 测试文件
├── package.json       # 包配置
├── tsconfig.json      # TypeScript 配置
└── README.md          # 包文档
```

---

### 文件组织

#### 1. 按功能组织

**推荐**:

```
packages/core/src/
├── parser.ts          # 解析器
├── scanner.ts         # 扫描器
├── frontmatter-generator.ts
└── index.ts
```

**不推荐**:

```
packages/core/src/
├── utils/
│   ├── parser.ts
│   └── scanner.ts
└── index.ts
```

---

#### 2. 单一职责

每个文件/模块应该只有一个职责。

**好的示例**:

```typescript
// image-resolver.ts
export function resolveImages(content: string): string[] {
  // 只负责解析图片
}
```

**不好的示例**:

```typescript
// content-processor.ts
export function resolveImages(content: string): string[] { }
export function parseFrontmatter(content: string): any { }
export function scanFiles(dir: string): string[] { }
// 做了太多事情
```

---

## 📦 导出和导入

### 导出原则

#### 1. 统一导出入口

每个包应该有一个 `index.ts` 作为导出入口：

```typescript
// packages/core/src/index.ts
export { parseMarkdown } from './parser'
export { scanContent } from './scanner'
export { generateFrontmatter } from './frontmatter-generator'
```

#### 2. 命名导出优先

**推荐**:

```typescript
export function parseMarkdown() { }
export class Scanner { }
```

**不推荐**:

```typescript
export default function parseMarkdown() { }
```

---

### 导入原则

#### 1. 按来源分组

```typescript
// 1. Node.js 内置模块
import { promises as fs } from 'fs'
import path from 'path'

// 2. 第三方库
import { parse } from 'gray-matter'

// 3. 内部包
import { PostDAL } from '@content-hub/database'

// 4. 相对路径
import { logger } from './utils/logger'
```

#### 2. 使用路径别名

**推荐**:

```typescript
import { PostDAL } from '@content-hub/database'
```

**不推荐**:

```typescript
import { PostDAL } from '../../../database/src/dal/post'
```

---

## 🎯 代码分层

### 分层架构

```
应用层 (web-ui, converter-web)
    ↓
引擎层 (engine)
    ↓
业务层 (core, linker, transformer)
    ↓
数据层 (database, config)
```

### 依赖原则

1. **高层可以依赖低层**
   - ✅ engine → core
   - ✅ web-ui → engine

2. **低层不能依赖高层**
   - ❌ core → engine
   - ❌ database → linker

3. **同层之间尽量不依赖**
   - ✅ linker → database
   - ❌ transformer → adapter

---

## 🔧 工具函数

### 位置

工具函数应该放在 `utils/` 目录：

```
packages/core/src/
├── utils/
│   ├── logger.ts
│   ├── validator.ts
│   └── formatter.ts
├── parser.ts
└── scanner.ts
```

### 命名

工具函数应该有清晰的前缀或命名空间：

```typescript
// utils/logger.ts
export function logInfo(message: string) { }
export function logError(error: Error) { }

// utils/validator.ts
export function isValidSlug(slug: string): boolean { }
```

---

## 🧪 测试组织

### 测试文件位置

**选项 1**: 与源文件同目录

```
packages/core/src/
├── parser.ts
├── parser.test.ts
├── scanner.ts
└── scanner.test.ts
```

**选项 2**: 独立测试目录

```
packages/core/
├── src/
│   ├── parser.ts
│   └── scanner.ts
└── tests/
    ├── parser.test.ts
    └── scanner.test.ts
```

### 测试组织

```typescript
// parser.test.ts
import { describe, it, expect } from 'vitest'
import { parseMarkdown } from './parser'

describe('parseMarkdown', () => {
  describe('基本解析', () => {
    it('应该解析标题', () => {
      const result = parseMarkdown('# Hello')
      expect(result.title).toBe('Hello')
    })
  })

  describe('复杂场景', () => {
    // ...
  })
})
```

---

## 📝 注释和文档

### JSDoc 注释

```typescript
/**
 * 解析 Markdown 内容
 *
 * @param content - Markdown 内容
 * @returns 解析后的内容对象
 * @throws {Error} 当内容无效时抛出错误
 *
 * @example
 * ```typescript
 * const result = await parseMarkdown("# Hello World")
 * console.log(result.title) // "Hello World"
 * ```
 */
export async function parseMarkdown(content: string): Promise<ParsedContent> {
  // ...
}
```

### 文件注释

```typescript
/**
 * @fileoverview Markdown 解析器
 *
 * 提供 Markdown 内容的解析功能，包括：
 * - 标题提取
 * - 内容解析
 * - 图片提取
 *
 * @module core/parser
 */
```

---

## 🎨 样式指南

### 代码格式化

```typescript
// 使用 Prettier
.prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### ESLint 规则

```typescript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn'
  }
}
```

---

## 📚 相关文档

- [文件命名规范](file-naming-conventions.md)
- [目录结构](DIRECTORY_STRUCTURE.md)
- [贡献指南](../../CONTRIBUTING.md)

---

**最后更新**: 2026-04-03
**维护者**: PostWaver Team
