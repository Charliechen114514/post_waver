# 测试目录

Content-Hub 项目的所有测试材料。

---

## 📁 目录结构

```
test/
├── README.md                    # 本文件 - 测试目录说明
├── fixtures/                    # 测试夹具（测试数据）
│   ├── posts/                   # 测试文章
│   │   ├── valid/              # 有效 Frontmatter 示例
│   │   └── invalid/            # 无效 Frontmatter 示例
│   └── ...                     # 其他测试数据
│
└── scripts/                     # 测试脚本
    ├── test-units.sh           # 单元测试脚本
    └── test-integration.sh     # 集成测试脚本
```

---

## 🧪 测试夹具 (fixtures/)

### 有效 Frontmatter 示例

`fixtures/posts/valid/complete-frontmatter.md`
- 包含所有字段的完整示例
- 用于验证解析器正确处理完整数据

### 无效 Frontmatter 示例

`fixtures/posts/invalid/` 目录包含各种无效情况：

- `missing-title.md` - 缺少必填字段 title
- `invalid-date.md` - 日期格式不符合 ISO8601
- `empty-tags.md` - 标签数组为空
- `no-h1.md` - Markdown 缺少一级标题
- `code-block-no-lang.md` - 代码块未指定语言

---

## 📜 测试脚本 (scripts/)

### test-units.sh

**用途：** 单元测试 - 测试各个独立模块

**测试内容：**
- Frontmatter 解析
- 内容哈希计算
- 目录扫描
- 索引构建

**运行方式：**
```bash
# 从项目根目录
bash test/scripts/test-units.sh

# 或使用 npm script
pnpm test:units
```

### test-integration.sh

**用途：** 集成测试 - 测试完整工作流

**测试内容：**
- Markdown 解析
- 内容扫描
- 索引生成
- 草稿过滤
- 更新检测

**运行方式：**
```bash
# 从项目根目录
bash test/scripts/test-integration.sh

# 或使用 npm script
pnpm test:integration
```

---

## 🚀 快速开始

### 运行所有测试

```bash
# 单元测试
pnpm test:units

# 集成测试
pnpm test:integration

# 所有测试
pnpm test:units && pnpm test:integration
```

### 使用测试夹具

```bash
# 测试有效文件
npx remark test/fixtures/posts/valid/complete-frontmatter.md

# 测试无效文件（应报告错误）
npx remark test/fixtures/posts/invalid/missing-title.md

# Lint 测试
npx markdownlint-cli2 test/fixtures/posts/invalid/code-block-no-lang.md
```

---

## 📝 添加新测试

### 1. 添加测试夹具

```bash
# 在相应目录创建测试文件
touch test/fixtures/posts/valid/new-test-case.md
touch test/fixtures/posts/invalid/new-invalid-case.md
```

### 2. 添加测试脚本

```bash
# 创建新的测试脚本
touch test/scripts/test-new-feature.sh
chmod +x test/scripts/test-new-feature.sh
```

### 3. 更新 package.json

```json
{
  "scripts": {
    "test:new": "bash test/scripts/test-new-feature.sh"
  }
}
```

---

## 🔍 测试覆盖

### 当前测试范围

| 模块 | 单元测试 | 集成测试 | 状态 |
|------|---------|---------|------|
| Frontmatter 解析 | ✅ | ✅ | 完成 |
| Markdown Lint | ✅ | ✅ | 完成 |
| 内容扫描 | ✅ | ✅ | 完成 |
| 索引生成 | ✅ | ✅ | 完成 |
| 更新检测 | ✅ | ✅ | 完成 |

### 待测试功能

- [ ] 错误处理
- [ ] 边界情况
- [ ] 性能测试
- [ ] 并发处理

---

## 📚 相关文档

- [测试快速参考](../docs/TEST_QUICK_REFERENCE.md)
- [测试规范文档](../docs/TEST_SPECIFICATION.md)
- [测试指南](../docs/TESTING.md)

---

## 💡 最佳实践

### 编写测试夹具

1. **命名清晰** - 文件名应清楚说明测试内容
2. **独立完整** - 每个夹具文件应独立完整
3. **添加注释** - 说明测试目的和预期结果

### 编写测试脚本

1. **使用 shebang** - `#!/bin/bash`
2. **设置严格模式** - `set -e`
3. **提供清晰输出** - 使用颜色和符号
4. **清理临时文件** - 测试后清理

---

## 🐛 故障排查

### 测试失败

1. 查看错误信息
2. 检查测试夹具是否正确
3. 验证路径引用
4. 查看 [测试规范文档](../docs/TEST_SPECIFICATION.md#故障排查)

### 路径问题

测试脚本应从项目根目录运行，所有路径都相对于根目录：

```bash
# ✅ 正确 - 相对于项目根目录
npx remark test/fixtures/posts/valid/complete-frontmatter.md

# ❌ 错误 - 绝对路径
npx remark /home/user/project/test/fixtures/...
```

---

**维护者：** Content-Hub Team
**最后更新：** 2026-04-02
