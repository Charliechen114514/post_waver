# 文档

PostWaver 项目的完整文档集合。

---

## 📚 文档导航

### 🚀 快速开始（01-getting-started）

**[快速开始](01-getting-started/QUICK_START.md)** - 5 分钟上手 PostWaver

**适合场景**：第一次使用 PostWaver

**包含内容**：
- 安装与配置
- 创建第一篇文章
- 发布到平台
- 常用命令速查

**预计阅读时间**：5 分钟

**[用户手册](01-getting-started/USER_GUIDE.md)** - 详细的功能使用指南

**适合场景**：深入了解所有功能

**包含内容**：
- 安装与配置
- 创建文章
- Frontmatter 规范
- 图片管理
- 发布流程
- 高级功能

**预计阅读时间**：20 分钟

---

### 📖 用户指南（02-user-guides）

#### 平台指南

- **[掘金半自动指南](02-user-guides/platforms/juejin-semi-auto-guide.md)** - Markdown 语法支持、编辑器使用
- **[CSDN半自动指南](02-user-guides/platforms/csdn-semi-auto-guide.md)** - CSDN 平台发布、Markdown 支持
- **[知乎半自动指南](02-user-guides/platforms/zhihu-semi-auto-guide.md)** - 知乎平台发布、编辑器兼容性
- **[微信公众号半自动指南](02-user-guides/platforms/wechat-semi-auto-guide.md)** - 公众号 Markdown 支持、发布流程
- **[平台转换规范](02-user-guides/platforms/platform-conversion-specs.md)** - 转换规则、兼容性处理

#### 功能指南

- **[Web UI用户指南](02-user-guides/features/web-ui-guide.md)** - Web 界面使用、发布工作台
- **[Hexo 同步指南](02-user-guides/features/hexo-sync-guide.md)** - 博客同步、部署
- **[内容关联](02-user-guides/features/content-relationships.md)** - 相关文章、链接管理
- **[数学公式支持](02-user-guides/features/math-formula-support.md)** - LaTeX 语法、KaTeX 渲染
- **[平台链接指南](02-user-guides/features/platform-linking-guide.md)** - 跨平台链接、ID 管理
- **[文章清理功能](02-user-guides/features/post-cleanup-guide.md)** - 清理已发布文章、保留数据记录 ⭐ NEW
- **[Frontmatter 注入方式对比](02-user-guides/features/frontmatter-injection-modes.md)** - 注入模式对比与选择 ⭐ NEW

#### 参考文档

- **[CLI 命令参考](02-user-guides/reference/CLI_REFERENCE.md)** - 所有命令说明
- **[Frontmatter 自动生成](02-user-guides/reference/FRONTMATTER_AUTO_GENERATION.md)** - Frontmatter 自动生成
- **[标签缓存指南](02-user-guides/reference/TAG_CACHE_GUIDE.md)** - 标签缓存系统
- **[数据库存储](02-user-guides/reference/DATABASE_STORAGE.md)** - 数据库架构和存储

---

### 🛠️ 故障排查（03-troubleshooting）

**[故障排查指南](03-troubleshooting/TROUBLESHOOTING.md)** - 常见问题解决方案

**适合场景**：遇到问题时查找答案

**包含内容**：
- 常见错误
- 数据库问题
- 发布失败
- 图片问题
- 配置问题

---

### 👨‍💻 开发者指南（04-developer-guide）

🆕 **开发者文档区域**

#### 入门

- **[开发者入门](04-developer-guide/getting-started.md)** - 开发环境搭建

#### 架构

- **[系统架构总览](04-developer-guide/architecture/overview.md)** - 系统架构、设计原则
- **[数据流](04-developer-guide/architecture/data-flow.md)** - 内容处理流程
- **[包依赖关系](04-developer-guide/architecture/package-dependencies.md)** - 包之间的关系
- **[数据库设计](04-developer-guide/architecture/database-schema.md)** - 数据库架构

#### 包文档

- **[Core 包](04-developer-guide/packages/core.md)** - 内容解析和处理
- **[Linker 包](04-developer-guide/packages/linker.md)** - 内容关系生成
- **[Transformer 包](04-developer-guide/packages/transformer.md)** - 平台转换
- **[Adapter 包](04-developer-guide/packages/adapter.md)** - 平台 API 适配
- **[Database 包](04-developer-guide/packages/database.md)** - 数据库层
- **[Config 包](04-developer-guide/packages/config.md)** - 配置管理
- **[Engine 包](04-developer-guide/packages/engine.md)** - 发布引擎
- **[Web UI 包](04-developer-guide/packages/web-ui.md)** - React 界面
- **[Converter Web 包](04-developer-guide/packages/converter-web.md)** - 独立转换工具

#### API 参考

- **[图片路径解析器](04-developer-guide/api-reference/image-resolver.md)** - 解析器 API
- **[链接注入器](04-developer-guide/api-reference/link-injector.md)** - 注入器 API
- **[Core API](04-developer-guide/api-reference/core-api.md)** - Core 包 API
- **[Engine API](04-developer-guide/api-reference/engine-api.md)** - Engine API
- **[Database API](04-developer-guide/api-reference/database-api.md)** - Database API

#### 开发工作流

- **[开发工作流](04-developer-guide/development-workflow.md)** - Git 工作流、代码审查
- **[测试指南](04-developer-guide/testing-guide.md)** - 单元测试、集成测试
- **[发布流程](04-developer-guide/release-process.md)** - 如何创建发布

---

### 🚀 部署文档（05-deployment）

🆕 **部署文档区域**

- **[部署概览](05-deployment/README.md)** - 部署选项
- **[开发环境搭建](05-deployment/development-setup.md)** - 本地开发环境
- **[生产环境部署](05-deployment/production-setup.md)** - 生产部署指南
- **[GitHub Pages 部署](05-deployment/github-pages-deployment.md)** - 自动部署配置
- **[环境变量参考](05-deployment/environment-variables.md)** - 配置参考
- **[监控与维护](05-deployment/monitoring-maintenance.md)** - 运维指南

---

### 📁 项目结构（06-project-structure）

- **[目录结构说明](06-project-structure/DIRECTORY_STRUCTURE.md)** - 完整的项目结构说明
- **[文件命名规范](06-project-structure/file-naming-conventions.md)** - 命名规则
- **[代码组织](06-project-structure/code-organization.md)** - 代码组织原则

---

## 🎯 按场景查找

### 我想...

#### 快速上手
→ [快速开始](01-getting-started/QUICK_START.md) - 5 分钟上手教程

#### 了解完整功能
→ [用户手册](01-getting-started/USER_GUIDE.md) - 详细功能说明

#### 查看命令
→ [CLI 参考](02-user-guides/reference/CLI_REFERENCE.md) - 完整命令列表

#### 发布到掘金
→ [掘金半自动指南](02-user-guides/platforms/juejin-semi-auto-guide.md)

#### 发布到 CSDN
→ [CSDN半自动指南](02-user-guides/platforms/csdn-semi-auto-guide.md)

#### 发布到知乎
→ [知乎半自动指南](02-user-guides/platforms/zhihu-semi-auto-guide.md)

#### 发布到微信公众号
→ [微信公众号半自动指南](02-user-guides/platforms/wechat-semi-auto-guide.md)

#### 使用 Web UI
→ [Web UI用户指南](02-user-guides/features/web-ui-guide.md)

#### 同步到 Hexo 博客
→ [Hexo 同步指南](02-user-guides/features/hexo-sync-guide.md)

#### 了解平台转换规则
→ [平台转换规范](02-user-guides/platforms/platform-conversion-specs.md)

#### 自动补全 Frontmatter
→ [Frontmatter 自动生成](02-user-guides/reference/FRONTMATTER_AUTO_GENERATION.md)

#### 清理已发布文章
→ [文章清理功能指南](02-user-guides/features/post-cleanup-guide.md) ⭐ NEW

#### 遇到问题
→ [故障排查指南](03-troubleshooting/TROUBLESHOOTING.md)

#### 参与开发
→ [开发者指南](04-developer-guide/) - 开发文档
→ [贡献指南](../CONTRIBUTING.md) - 如何贡献

#### 部署到生产
→ [部署文档](05-deployment/) - 部署指南

---

## 📂 文档分类

### 按类型

| 类型 | 文档 | 用途 |
|------|------|------|
| **入门** | 01-getting-started/ | 快速上手 |
| **指南** | 02-user-guides/ | 完整功能说明 |
| **排查** | 03-troubleshooting/ | 问题解决 |
| **开发** | 04-developer-guide/ | 开发文档 🆕 |
| **部署** | 05-deployment/ | 部署指南 🆕 |
| **结构** | 06-project-structure/ | 项目结构 |

### 按重要性

| 重要性 | 文档 |
|--------|------|
| 🔴 **必读** | [快速开始](01-getting-started/QUICK_START.md) |
| 🟡 **常用** | [用户手册](01-getting-started/USER_GUIDE.md), [CLI 参考](02-user-guides/reference/CLI_REFERENCE.md) |
| 🟢 **参考** | [故障排查](03-troubleshooting/TROUBLESHOOTING.md), [目录结构](06-project-structure/DIRECTORY_STRUCTURE.md) |
| 🔵 **开发** | [开发者指南](04-developer-guide/), [贡献指南](../CONTRIBUTING.md) 🆕 |
| ⭐ **更新** | [CHANGELOG-v3.2.0](CHANGELOG-v3.2.0.md) - 最新功能 |

---

## 🎖️ 平台指南

### 发布指南

- **[掘金半自动指南](02-user-guides/platforms/juejin-semi-auto-guide.md)** - Markdown 语法支持、编辑器使用
- **[CSDN半自动指南](02-user-guides/platforms/csdn-semi-auto-guide.md)** - CSDN 平台发布、Markdown 支持
- **[知乎半自动指南](02-user-guides/platforms/zhihu-semi-auto-guide.md)** - 知乎平台发布、编辑器兼容性
- **[微信公众号半自动指南](02-user-guides/platforms/wechat-semi-auto-guide.md)** - 公众号 Markdown 支持、发布流程
- **[平台转换规范](02-user-guides/platforms/platform-conversion-specs.md)** - 转换规则、兼容性处理

### 功能指南

- **[Web UI用户指南](02-user-guides/features/web-ui-guide.md)** - Web 界面使用、发布工作台
- **[Hexo 同步指南](02-user-guides/features/hexo-sync-guide.md)** - 博客同步、部署
- **[内容关联](02-user-guides/features/content-relationships.md)** - 相关文章、链接管理
- **[数学公式支持](02-user-guides/features/math-formula-support.md)** - LaTeX 语法、KaTeX 渲染
- **[平台链接指南](02-user-guides/features/platform-linking-guide.md)** - 跨平台链接、ID 管理
- **[文章清理功能](02-user-guides/features/post-cleanup-guide.md)** - 清理已发布文章、保留数据记录 ⭐ NEW
- **[Frontmatter 注入方式对比](02-user-guides/features/frontmatter-injection-modes.md)** - 注入模式对比与选择 ⭐ NEW

---

## 🔌 API 文档

- **[图片路径解析器](04-developer-guide/api-reference/image-resolver.md)** - 解析器 API、路径规则
- **[链接注入器](04-developer-guide/api-reference/link-injector.md)** - 注入器 API、配置选项

---

## ✨ 功能特性

- **[AutoTag 自动标签系统](features/auto-tag-system.md)** - AI 智能标签生成、缓存管理
- **[仓库引用注入](features/repo-injector.md)** - 自动注入仓库链接
- **[微信图片上传](features/wechat-image-upload.md)** - 自动上传、错误处理

---

## 🧪 测试文档

- **[测试手册](test/COMPREHENSIVE_TEST_MANUAL.md)** - 完整测试流程

---

## 🔄 更新日志

### v3.2.0 (2026-04-03) ⭐ NEW

- ✅ **新增功能**：Frontmatter 智能注入（`pnpm scan --inject`）
- ✅ **新增功能**：文章清理功能（`pnpm post:clean`）
- ✅ **功能增强**：智能检测并只补充缺失的 frontmatter 字段
- ✅ **数据库迁移**：添加 `tags` 和 `cleanedAt` 字段
- ✅ **新增文档**：文章清理功能完整指南
- ✅ **文档更新**：CLI 参考、Frontmatter 自动生成、README

**主要改进**：
- `pnpm scan --inject`：智能注入缺失的 frontmatter，不覆盖已有字段
- `pnpm post:clean`：安全清理已发布文章，保留数据库记录
- 清理功能支持预演模式（`--dry-run`）
- 自动提取并保存标签到数据库

### v3.1.0 (2026-04-03)

- ✅ **新增平台指南**：CSDN、知乎半自动发布指南
- ✅ **新增 Web UI 指南**：完整的 Web 界面使用文档
- ✅ **新增功能指南**：数学公式支持、AutoTag 系统、平台链接
- ✅ **更新 CLI 参考**：新增平台转换、标题注入、标签缓存命令
- ✅ **优化导航**：新增 5 个平台指南，3 个功能指南

### v3.0.0 (2026-04-02)

- ✅ **重大重构**：删除 milestone 相关内容
- ✅ **文档拆分**：QUICK_START.md 从 33,806 行精简到 189 行
- ✅ **新增文档**：USER_GUIDE.md、CLI_REFERENCE.md、TROUBLESHOOTING.md
- ✅ **风格统一**：所有文档遵循统一的写作规范
- ✅ **优化导航**：清晰的文档分类和阅读路径

### v2.0.0 (2026-04-02)

- ✅ 删除过时文档（archive/, research/）
- ✅ 精简测试文档
- ✅ 修复 CLI 命令引用

### v1.0.0 (2026-04-02)

- 初始版本
- 基础文档结构

---

## 💡 文档维护

### 文档规范

- **标题规范**：使用清晰的标题层级
- **语气统一**：使用专业、客观的语气
- **示例完整**：提供完整的使用示例
- **保持更新**：与代码变更同步更新

### 添加新文档

1. **平台指南** → 添加到 `docs/guides/`
2. **功能文档** → 添加到 `docs/features/`
3. **API 文档** → 添加到 `docs/api/`

---

## 🐛 文档反馈

- 文档不准确？→ [提交 Issue](https://github.com/Charliechen114514/post_waver/issues)
- 需要更多示例？→ [提交 Issue](https://github.com/Charliechen114514/post_waver/issues)
- 发现错误？→ [提交 PR](https://github.com/Charliechen114514/post_waver/pulls)

---

**维护者**：PostWaver Team
**最后更新**：2026-04-03
**版本**：4.0.0（文档重构）
