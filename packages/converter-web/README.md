# @content-hub/converter-web

> PostWaver 的独立转换工具 - 在线内容转换

---

## 📋 概述

`@content-hub/converter-web` 是一个独立的在线转换工具，提供 Markdown 到各平台的格式转换功能。

**主要功能**:
- ✅ 在线 Markdown 转换
- ✅ 多平台支持
- ✅ 实时预览
- ✅ 一键复制

---

## 🚀 安装

```bash
pnpm install @content-hub/converter-web
```

---

## 📖 使用

### 启动开发服务器

```bash
cd packages/converter-web
pnpm dev
```

### 构建

```bash
pnpm build
```

---

## 🏗️ 架构

### 技术栈

- **React 18**: UI 框架
- **Vite**: 构建工具
- **TypeScript**: 类型系统

### 主要功能

- **输入框**: Markdown 输入
- **平台选择**: 选择目标平台
- **预览**: 转换结果预览
- **复制**: 一键复制结果

### 依赖关系

```
converter-web
└── transformer (内容转换)
```

---

## 🔌 API

### 转换接口

```typescript
import { transform } from '@content-hub/transformer'

const result = await transform(markdown, {
  platform: 'juejin'
})
```

---

## 🧪 开发

```bash
# 进入包目录
cd packages/converter-web

# 启动开发服务器
pnpm dev

# 构建
pnpm build
```

---

## 📚 相关文档

- [详细文档](../../docs/04-developer-guide/packages/converter-web.md)

---

**版本**: 0.1.0
**许可证**: MIT
