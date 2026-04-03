# 文件命名规范

> **版本**: v1.0
> **最后更新**: 2026-04-03
> **受众**: 开发者
> **阅读时间**: 5 分钟

---

## 📋 概述

本文档说明了 PostWaver 项目的文件命名规范。

---

## 📂 文件命名规则

### TypeScript 文件

**规则**: 使用 `kebab-case`（短横线命名）

**示例**:
```
✅ image-resolver.ts
✅ link-injector.ts
✅ frontmatter-generator.ts

❌ imageResolver.ts
❌ link_injector.ts
❌ FrontmatterGenerator.ts
```

**测试文件**:
```
✅ image-resolver.test.ts
✅ link-injector.spec.ts
```

---

### Markdown 文件

**规则**: 使用 `kebab-case`

**示例**:
```
✅ quick-start.md
✅ user-guide.md
✅ troubleshooting.md

❌ QuickStart.md
❌ user_guide.md
```

---

### 目录命名

**规则**: 使用 `kebab-case`

**示例**:
```
✅ packages/core/
✅ docs/04-developer-guide/
✅ content/posts/

❌ packages/Core/
❌ docs/04_developer_guide/
```

---

## 🎯 特殊命名

### 组件文件

**规则**: 使用 `PascalCase`（React 组件）

**示例**:
```
✅ PostList.tsx
✅ PublishWorkspace.tsx
✅ TemplateManager.tsx

❌ postList.tsx
❌ publish-workspace.tsx
```

**组件目录**:
```
PostList/
├── index.tsx
├── PostItem.tsx
└── PostList.module.css
```

---

### 配置文件

**规则**: 使用 `kebab-case` 或标准名称

**示例**:
```
✅ package.json
✅ tsconfig.json
✅ vite.config.ts
✅ .env.example
✅ ecosystem.config.js
```

---

### 测试文件

**规则**: 与源文件同名，添加 `.test.ts` 或 `.spec.ts`

**示例**:
```
src/
├── image-resolver.ts
├── image-resolver.test.ts
├── link-injector.ts
└── link-injector.test.ts
```

---

## 📏 命名原则

### 1. 可读性

- 使用有意义的名称
- 避免缩写（除非是通用缩写）
- 保持简洁但描述性

**好的示例**:
```
✅ image-resolver.ts
✅ publish-record.ts
✅ frontmatter-generator.ts
```

**不好的示例**:
```
❌ img-res.ts
❌ pub-rec.ts
❌ fm-gen.ts
```

---

### 2. 一致性

- 同类文件使用相同的命名模式
- 遵循项目现有的命名约定

---

### 3. 大小写敏感

**注意**: 某些文件系统（如 macOS）默认不区分大小写，但 Linux 区分。

**建议**:
- 避免仅靠大小写区分文件
- 使用明确的后缀（如 `.test.ts`）

---

## 🔍 文件查找

### 查找 TypeScript 文件

```bash
# 查找所有 .ts 文件
find packages -name "*.ts"

# 查找特定文件
find . -name "*resolver*.ts"
```

### 查找 Markdown 文件

```bash
# 查找所有 .md 文件
find docs -name "*.md"

# 查找特定文档
find docs -name "*guide*.md"
```

---

## 📚 相关文档

- [代码组织原则](code-organization.md)
- [目录结构](DIRECTORY_STRUCTURE.md)
- [贡献指南](../../CONTRIBUTING.md)

---

**最后更新**: 2026-04-03
**维护者**: PostWaver Team
