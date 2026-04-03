# @content-hub/config

> PostWaver 的配置管理 - 统一配置系统

---

## 📋 概述

`@content-hub/config` 提供统一的配置管理，包括主题配置、图片上传配置、Hexo 同步配置等。

**主要功能**:
- ✅ 主题配置管理
- ✅ 图片上传配置
- ✅ Hexo 同步配置
- ✅ 平台 ID 管理

---

## 🚀 安装

```bash
pnpm install @content-hub/config
```

---

## 📖 使用

### 读取配置

```typescript
import { ConfigManager } from '@content-hub/config'

const manager = new ConfigManager()
const config = await manager.getConfig()

console.log(config.theme)
console.log(config.imageUpload)
```

### 更新配置

```typescript
await manager.updateConfig({
  theme: {
    primaryColor: '#1890ff'
  }
})
```

---

## 🏗️ 架构

### 主要模块

- **Config Manager**: 配置管理器
- **Hexo Config**: Hexo 配置
- **Image Upload Config**: 图片上传配置
- **Theme Config**: 主题配置
- **Platform ID Config**: 平台 ID 配置

### 依赖关系

```
config
└── database (配置存储)
```

---

## 🔌 API

### ConfigManager

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `getConfig()` | 获取配置 | `Promise<Config>` |
| `updateConfig()` | 更新配置 | `Promise<void>` |
| `resetConfig()` | 重置配置 | `Promise<void>` |

---

## 🧪 开发

```bash
# 进入包目录
cd packages/config

# 构建
pnpm build

# 测试
pnpm test
```

---

## 📚 相关文档

- [详细文档](../../docs/04-developer-guide/packages/config.md)

---

**版本**: 0.1.0
**许可证**: MIT
