# 包依赖关系

> **版本**: v1.0
> **最后更新**: 2026-04-03
> **受众**: 开发者
> **阅读时间**: 10 分钟

---

## 📋 概述

PostWaver 采用 Monorepo 架构，包含 9 个包。本文档详细说明了各包之间的依赖关系和耦合度。

---

## 📊 依赖图

```
                    ┌─────────────┐
                    │   web-ui    │
                    │ converter-web│
                    └──────┬──────┘
                           │ depends on
                    ┌──────▼──────┐
                    │   engine    │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │ depends on       │ depends on       │ depends on
┌───────▼────────┐ ┌───────▼────────┐ ┌──────▼─────┐
│     core       │ │    linker      │ │transformer │
└───────┬────────┘ └───────┬────────┘ └────────────┘
        │ depends on       │ depends on
        │                  │
        └──────────────────┼──────────────────┐
                           │ depends on       │
                    ┌──────▼──────┐           │
                    │   config    │           │
                    └──────┬──────┘           │
                           │ depends on       │
                    ┌──────▼──────┐           │
                    │  database   │◄──────────┘
                    └─────────────┘
```

---

## 📦 包详情

### 应用层包

#### @content-hub/web-ui

**用途**: React Web 界面

**依赖**:
- `@content-hub/engine` - API 调用

**被依赖**: 无

**耦合度**: 低（仅通过 API 与 engine 通信）

---

#### @content-hub/converter-web

**用途**: 独立的转换工具

**依赖**:
- `@content-hub/transformer` - 内容转换

**被依赖**: 无

**耦合度**: 低（仅使用 transformer 的转换功能）

---

### 引擎层包

#### @content-hub/engine

**用途**: API 服务器和工作流编排

**依赖**:
- `@content-hub/core` - 内容解析
- `@content-hub/linker` - 关系生成
- `@content-hub/transformer` - 平台转换
- `@content-hub/adapter` - 平台 API
- `@content-hub/database` - 数据持久化
- `@content-hub/config` - 配置管理

**被依赖**:
- `@content-hub/web-ui`
- `@content-hub/converter-web`

**耦合度**: 中（协调多个包，但通过接口通信）

---

### 业务层包

#### @content-hub/core

**用途**: 内容解析和处理

**依赖**:
- `@content-hub/database` - 元数据存储
- `@content-hub/linker` - 关系生成

**被依赖**:
- `@content-hub/engine`

**耦合度**: 低（核心业务逻辑，独立性强）

**主要模块**:
- `parser` - Markdown 解析
- `scanner` - 内容扫描
- `frontmatter-generator` - Frontmatter 生成
- `image-resolver` - 图片路径解析
- `link-injector` - 链接注入
- `title-injector` - 标题注入
- `repo-injector` - 仓库链接注入
- `tag-cache` - 标签缓存

---

#### @content-hub/linker

**用途**: 内容关系生成

**依赖**:
- `@content-hub/database` - 数据查询

**被依赖**:
- `@content-hub/core`

**耦合度**: 低（独立的功能包）

**主要模块**:
- `tag-matcher` - 标签匹配
- `prev-next-calculator` - 前后篇计算
- `python-bridge` - Python 语义分析桥接

---

#### @content-hub/transformer

**用途**: 平台格式转换

**依赖**: 无

**被依赖**:
- `@content-hub/engine`
- `@content-hub/converter-web`

**耦合度**: 零（完全独立）

**主要模块**:
- `to-juejin` - 掘金转换器
- `to-wechat` - 微信转换器
- `to-csdn` - CSDN 转换器
- `to-zhihu` - 知乎转换器
- `to-html` - HTML 转换器

---

#### @content-hub/adapter

**用途**: 平台 API 适配器

**依赖**: 无

**被依赖**:
- `@content-hub/engine`

**耦合度**: 零（完全独立）

**主要模块**:
- 平台 API 接口定义
- 各平台适配器实现（最小实现）

---

### 数据层包

#### @content-hub/database

**用途**: 数据持久化

**依赖**: 无

**被依赖**:
- `@content-hub/core`
- `@content-hub/linker`
- `@content-hub/engine`
- `@content-hub/config`

**耦合度**: 零（基础服务包）

**主要模块**:
- Prisma ORM
- DAL（数据访问层）
- 数据模型
- 迁移脚本

---

#### @content-hub/config

**用途**: 配置管理

**依赖**:
- `@content-hub/database` - 配置存储

**被依赖**:
- `@content-hub/engine`

**耦合度**: 低（独立的服务包）

**主要模块**:
- `config-manager` - 配置管理器
- `hexo-config` - Hexo 配置
- `image-upload-config` - 图片上传配置
- `theme-config` - 主题配置
- `platform-id-config` - 平台 ID 管理

---

## 🔍 耦合度分析

### 耦合度定义

- **零耦合**: 无依赖
- **低耦合**: 依赖少且接口清晰
- **中耦合**: 依赖多个包但有明确接口
- **高耦合**: 依赖复杂且相互调用

### 耦合度矩阵

| 包 | 依赖数 | 被依赖数 | 耦合度 |
|---|-------|---------|-------|
| database | 0 | 5 | 零 |
| transformer | 0 | 2 | 零 |
| adapter | 0 | 1 | 零 |
| config | 1 | 1 | 低 |
| linker | 1 | 1 | 低 |
| core | 2 | 1 | 低 |
| engine | 5 | 2 | 中 |
| web-ui | 1 | 0 | 低 |
| converter-web | 1 | 0 | 低 |

### 耦合度分析

**优秀设计**:
- ✅ database、transformer、adapter 零耦合
- ✅ 大部分包为低耦合
- ✅ engine 作为协调者，适度耦合合理

**改进空间**:
- ⚠️ engine 依赖较多，但通过接口降低耦合
- 💡 考虑将 engine 的部分功能拆分

---

## 🔄 依赖层次

### 第0层：基础层

**包**: database, transformer, adapter

**特点**:
- 无依赖
- 提供基础服务
- 高度稳定

### 第1层：服务层

**包**: config, linker

**特点**:
- 依赖基础层
- 提供特定服务
- 相对独立

### 第2层：业务层

**包**: core

**特点**:
- 依赖服务层
- 核心业务逻辑
- 中等复杂度

### 第3层：引擎层

**包**: engine

**特点**:
- 依赖所有下层
- 工作流编排
- 系统核心

### 第4层：应用层

**包**: web-ui, converter-web

**特点**:
- 依赖引擎层
- 用户界面
- 直接面对用户

---

## 💡 扩展性分析

### 易于扩展

1. **添加新平台**
   - 在 `transformer` 中添加新转换器
   - 在 `adapter` 中实现 API（可选）
   - 无需修改其他包

2. **添加新注入器**
   - 在 `core` 中添加新注入器
   - 通过接口集成
   - 不影响现有功能

3. **添加新数据模型**
   - 在 `database` 中定义模型
   - 创建对应的 DAL 方法
   - 其他包透明使用

### 需要注意

1. **修改 engine**
   - engine 是协调中心
   - 修改时需考虑所有依赖包
   - 保持向后兼容

2. **修改 database**
   - database 是基础服务
   - 修改时需运行迁移
   - 确保所有使用方同步更新

---

## 📚 相关文档

- [系统架构总览](overview.md)
- [数据流](data-flow.md)
- [数据库设计](database-schema.md)
- [包文档](../packages/)

---

**最后更新**: 2026-04-03
**维护者**: PostWaver Team
**反馈**: [GitHub Issues](https://github.com/Charliechen114514/post_waver/issues)
