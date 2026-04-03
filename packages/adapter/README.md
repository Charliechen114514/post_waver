# @content-hub/adapter

> PostWaver 的平台 API 适配器 - 各平台 API 接口

---

## 📋 概述

`@content-hub/adapter` 提供各平台的 API 适配器接口和实现。

**注意**: 当前版本为最小实现，主要提供接口定义。

---

## 🚀 安装

```bash
pnpm install @content-hub/adapter
```

---

## 📖 使用

### 适配器接口

```typescript
import { PlatformAdapter } from '@content-hub/adapter'

interface PlatformAdapter {
  publish(content: string, options: PublishOptions): Promise<PublishResult>
  update(id: string, content: string): Promise<void>
  delete(id: string): Promise<void>
}
```

---

## 🏗️ 架构

### 适配器列表

- **掘金适配器**: Juejin API（最小实现）
- **微信适配器**: WeChat API（最小实现）
- **CSDN 适配器**: CSDN API（最小实现）
- **知乎适配器**: Zhihu API（最小实现）

### 依赖关系

```
adapter (无依赖)
```

---

## 🔌 API

### 适配器方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `publish()` | 发布内容 | `Promise<PublishResult>` |
| `update()` | 更新内容 | `Promise<void>` |
| `delete()` | 删除内容 | `Promise<void>` |

---

## 🧪 开发

```bash
# 进入包目录
cd packages/adapter

# 构建
pnpm build

# 测试
pnpm test
```

---

## 📚 相关文档

- [详细文档](../../docs/04-developer-guide/packages/adapter.md)

---

**版本**: 0.1.0
**许可证**: MIT
