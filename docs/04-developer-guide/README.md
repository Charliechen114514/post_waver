# 开发者文档

> **版本**: v1.0
> **最后更新**: 2026-04-03
> **受众**: 开发者、贡献者
> **阅读时间**: 5 分钟

---

欢迎来到 PostWaver 开发者文档！这里提供了开发、扩展和贡献 PostWaver 所需的一切信息。

---

## 📋 快速导航

### 🚀 快速开始

**新开发者？从这里开始：**

1. **[开发环境搭建](getting-started.md)** - 15分钟搭建开发环境
2. **[系统架构总览](architecture/overview.md)** - 了解系统设计
3. **[贡献指南](../../CONTRIBUTING.md)** - 如何贡献代码

### 🏗️ 架构文档

了解系统的设计和架构：

- **[系统架构总览](architecture/overview.md)** - 分层架构、设计原则
- **[数据流](architecture/data-flow.md)** - 内容处理流程
- **[包依赖关系](architecture/package-dependencies.md)** - 包之间的关系
- **[数据库设计](architecture/database-schema.md)** - 数据库架构

### 📦 包文档

深入了解各个包：

- **[@content-hub/core](packages/core.md)** - 内容解析和处理
- **[@content-hub/linker](packages/linker.md)** - 内容关系生成
- **[@content-hub/transformer](packages/transformer.md)** - 平台格式转换
- **[@content-hub/adapter](packages/adapter.md)** - 平台 API 适配器
- **[@content-hub/database](packages/database.md)** - 数据库层
- **[@content-hub/config](packages/config.md)** - 配置管理
- **[@content-hub/engine](packages/engine.md)** - 发布引擎
- **[@content-hub/web-ui](packages/web-ui.md)** - React Web 界面
- **[@content-hub/converter-web](packages/converter-web.md)** - 独立转换工具

### 🔌 API 参考

详细的 API 文档：

- **[图片路径解析器](api-reference/image-resolver.md)** - 图片路径解析
- **[链接注入器](api-reference/link-injector.md)** - 链接注入
- **[Core API](api-reference/core-api.md)** - Core 包 API
- **[Engine API](api-reference/engine-api.md)** - Engine API
- **[Database API](api-reference/database-api.md)** - Database API

### 🛠️ 开发工作流

开发相关的工作流程：

- **[开发工作流](development-workflow.md)** - Git 工作流、代码审查
- **[测试指南](testing-guide.md)** - 单元测试、集成测试
- **[发布流程](release-process.md)** - 如何创建发布

---

## 🎯 按任务查找

### 我想...

#### 搭建开发环境
→ [开发环境搭建](getting-started.md)

#### 理解系统架构
→ [系统架构总览](architecture/overview.md)

#### 添加新平台支持
→ [Transformer 包文档](packages/transformer.md)

#### 使用 Core 包 API
→ [Core API 参考](api-reference/core-api.md)

#### 了解数据库设计
→ [数据库设计文档](architecture/database-schema.md)

#### 编写测试
→ [测试指南](testing-guide.md)

#### 贡献代码
→ [贡献指南](../../CONTRIBUTING.md)

---

## 📊 包概览

### 包分类

#### 内容层
- **core**: 内容解析、扫描、注入
- **linker**: 内容关系生成

#### 转换层
- **transformer**: 平台格式转换
- **adapter**: 平台 API 适配

#### 数据层
- **database**: 数据持久化
- **config**: 配置管理

#### 应用层
- **engine**: 工作流编排、API 服务
- **web-ui**: React Web 界面
- **converter-web**: 独立转换工具

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18, Vite, TypeScript |
| 后端 | Hono.js, Node.js |
| 数据库 | Prisma, SQLite |
| 内容处理 | unified, remark, gray-matter |

---

## 🚀 快速开始

### 1. 搭建开发环境

```bash
# Clone 仓库
git clone https://github.com/Charliechen114514/post_waver.git
cd post_waver

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 启动开发服务器
pnpm dev
```

详细步骤请参考：[开发环境搭建](getting-started.md)

### 2. 了解架构

阅读 [系统架构总览](architecture/overview.md) 了解：
- 分层架构设计
- 各包的职责
- 数据流转过程

### 3. 深入学习

根据你的兴趣选择：
- 想了解内容解析？→ [Core 包文档](packages/core.md)
- 想添加新平台？→ [Transformer 包文档](packages/transformer.md)
- 想开发 Web 功能？→ [Web UI 包文档](packages/web-ui.md)

---

## 💡 开发提示

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循项目的命名规范
- 编写单元测试
- 添加 JSDoc 注释

### 提交规范

使用 Conventional Commits 格式：

```bash
feat: add new feature
fix: fix bug
docs: update documentation
```

### 测试

```bash
# 运行所有测试
pnpm test

# 运行单元测试
pnpm test:units

# 运行测试 UI
pnpm test:ui
```

---

## 🤝 贡献

我们欢迎各种形式的贡献！

- 报告 Bug
- 提出新功能
- 改进文档
- 提交代码

详情请参考：[贡献指南](../../CONTRIBUTING.md)

---

## 📚 相关文档

### 用户文档
- [快速开始](../01-getting-started/QUICK_START.md)
- [用户指南](../01-getting-started/USER_GUIDE.md)

### 根级文档
- [系统架构](../../ARCHITECTURE.md)
- [贡献指南](../../CONTRIBUTING.md)
- [根 README](../../README.md)

---

## 📞 获取帮助

- **GitHub Issues**: [提交问题](https://github.com/Charliechen114514/post_waver/issues)
- **GitHub Discussions**: [参与讨论](https://github.com/Charliechen114514/post_waver/discussions)

---

**最后更新**: 2026-04-03
**维护者**: PostWaver Team
**反馈**: [GitHub Issues](https://github.com/Charliechen114514/post_waver/issues)
