# 测试文档

Content-Hub 项目的测试文档集合。

---

## 📚 文档导航

### 1. [测试快速参考](TEST_QUICK_REFERENCE.md)
**用途：** 快速查找测试命令和验收标准

**包含内容：**
- 一键测试命令
- 测试用例速查表
- 常用命令列表
- 快速修复指南

**适合场景：** 日常开发、快速验证

---

### 2. [测试规范文档](TEST_SPECIFICATION.md)
**用途：** 详细的测试用例和测试方法

**包含内容：**
- 测试环境准备
- 13 个详细测试用例（T001-T005, T101-T108）
- 集成测试（IT001-IT002）
- 故障排查指南
- 测试数据和示例

**适合场景：** 深入测试、问题排查、CI/CD

---

## 🚀 快速开始

### 第一次测试？

```bash
# 1. 查看快速参考
cat docs/test/TEST_QUICK_REFERENCE.md

# 2. 运行一键测试
pnpm scan:table

# 3. 验证结果
cat content-index.json | jq '.metadata'
```

### 需要详细测试？

```bash
# 查看测试规范
cat docs/test/TEST_SPECIFICATION.md
```

---

## 📊 测试覆盖

| 模块 | 覆盖率 | 状态 |
|------|--------|------|
| Frontmatter 解析 | 100% | ✅ |
| Markdown Lint | 100% | ✅ |
| 内容扫描 | 100% | ✅ |
| 索引生成 | 100% | ✅ |
| 更新检测 | 100% | ✅ |

---

## 🛠️ 测试命令

```bash
# 单元测试
pnpm test:units

# 集成测试
pnpm test:integration

# 扫描测试
pnpm scan
pnpm scan:table
pnpm scan:drafts
```

---

**维护者：** Content-Hub Team
**最后更新：** 2026-04-02
