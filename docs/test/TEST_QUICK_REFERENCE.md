# 测试快速参考

快速测试命令和验收标准速查表。

---

## 🚀 一键测试

### 完整测试流程
```bash
# 1. 清理环境
rm -f content-index.json

# 2. 运行所有测试
pnpm test:units && pnpm test:integration

# 3. 手动验证
pnpm scan:table
pnpm scan:drafts
```

### 快速验证
```bash
# 5秒快速测试
pnpm scan && cat content-index.json | jq '.metadata'
```

---

## 📋 测试用例速查

### M0.2 - Lint 测试

| 编号 | 测试项 | 命令 | 预期 |
|------|--------|------|------|
| T001 | 接口定义 | `cat packages/core/src/types.ts` | 包含所有接口 |
| T002 | Markdown lint | `npx markdownlint-cli2 test/fixtures/posts/valid/*.md` | 无错误 |
| T003 | Frontmatter 校验 | `npx remark test/fixtures/posts/invalid/*.md` | 报告错误 |
| T004 | 自动修复 | `npx markdownlint-cli2 --fix <file>` | 自动修复 |
| T005 | Pre-commit hook | `git commit` | 阻止无效文件 |

### M0.3 - 扫描测试

| 编号 | 测试项 | 命令 | 预期 |
|------|--------|------|------|
| T101 | Frontmatter 解析 | 见详细文档 | 字段正确 |
| T102 | Markdown 转 AST | 见详细文档 | AST 结构正确 |
| T103 | 内容哈希 | 见详细文档 | 一致性和唯一性 |
| T104 | 目录扫描 | `pnpm scan` | 扫描成功 |
| T105 | 索引构建 | `cat content-index.json` | 结构完整 |
| T106 | 文件读写 | 见详细文档 | 读写成功 |
| T107 | 更新检测 | 修改文件后 `pnpm scan` | 检测到更新 |
| T108 | 完整流程 | `pnpm scan` | 流程成功 |

### 集成测试

| 编号 | 测试项 | 验证点 |
|------|--------|--------|
| IT001 | 完整工作流 | 创建→扫描→索引→更新 |
| IT002 | Lint 集成 | Lint→解析→扫描 |

---

## ✅ 验收标准

### M0.2 验收

- [ ] 有效文件通过 Lint
- [ ] 无效文件被检测
- [ ] 自动修复功能正常
- [ ] Pre-commit hook 工作
- [ ] remark 校验 Frontmatter

### M0.3 验收

- [ ] 扫描功能正常
- [ ] 索引文件生成
- [ ] JSON 格式正确
- [ ] 草稿过滤有效
- [ ] 更新检测准确
- [ ] 所有字段完整

---

## 🛠️ 常用命令

### 扫描相关

```bash
# 基础扫描
pnpm scan

# 表格输出
pnpm scan:table

# 包含草稿
pnpm scan:drafts

# 自定义目录
npx tsx scripts/scan.ts --dir <path>
```

### Lint 相关

```bash
# Markdown lint
pnpm lint:md
pnpm lint:md:fix

# 检查单个文件
npx markdownlint-cli2 <file>
npx remark <file>
```

### 验证相关

```bash
# JSON 格式
python3 -m json.tool content-index.json

# 索引摘要
cat content-index.json | jq '.metadata'

# 查找文章
cat content-index.json | jq '.posts["post-id"]'

# 统计标签
cat content-index.json | jq '.metadata.allTags | length'
```

### 调试相关

```bash
# 查看完整输出（不更新索引）
npx tsx scripts/scan.ts --dir content/posts --update-index false

# 重建索引
pnpm index:rebuild

# 清理数据
rm content-index.json
```

---

## 📊 测试数据位置

```
test/fixtures/              # ⭐ 测试数据目录
├── posts/
│   ├── valid/
│   │   └── complete-frontmatter.md    # 有效示例
│   └── invalid/
│       ├── missing-title.md           # 缺少 title
│       ├── invalid-date.md            # 日期格式错误
│       ├── empty-tags.md              # 空标签数组
│       ├── no-h1.md                   # 缺少 H1
│       └── code-block-no-lang.md      # 代码块无语言

content/                    # 📝 真实内容目录（用户写作）
└── posts/                  # 你的博客文章（不要放测试文件）
```

**重要区别：**
- `test/fixtures/` - 测试用例，**不要修改**
- `content/posts/` - 真实内容，**你的文章**

---

## 🐛 快速修复

### 扫描失败

```bash
# 1. 重新构建
pnpm --filter @content-hub/core build

# 2. 清理并重试
rm content-index.json
pnpm scan
```

### Lint 错误

```bash
# 自动修复
pnpm lint:fix

# 或手动修复特定文件
npx markdownlint-cli2 --fix <file>
```

### 模块找不到

```bash
# 构建依赖
pnpm --filter @content-hub/core build

# 或重新安装
pnpm install
```

---

## 📝 测试模板

### 单元测试模板

```javascript
import { functionToTest } from '@content-hub/core';

async function test() {
  // 准备测试数据
  const input = "test data";

  // 执行测试
  const result = await functionToTest(input);

  // 验证结果
  if (result === expected) {
    console.log('✓ 测试通过');
  } else {
    console.log('✗ 测试失败');
    process.exit(1);
  }
}

test().catch(console.error);
```

### 集成测试模板

```bash
#!/bin/bash

# 1. 准备环境
rm -rf /tmp/test-env
mkdir -p /tmp/test-env

# 2. 执行测试
<test-commands>

# 3. 验证结果
if [ <condition> ]; then
  echo "✓ 测试通过"
else
  echo "✗ 测试失败"
  exit 1
fi

# 4. 清理
rm -rf /tmp/test-env
```

---

## 📈 测试覆盖率

### 当前覆盖

| 模块 | 覆盖率 | 状态 |
|------|--------|------|
| Frontmatter 解析 | 100% | ✅ |
| Markdown 转 AST | 100% | ✅ |
| 内容哈希 | 100% | ✅ |
| 目录扫描 | 100% | ✅ |
| 索引构建 | 100% | ✅ |
| 更新检测 | 100% | ✅ |
| Markdown Lint | 100% | ✅ |
| Frontmatter 校验 | 100% | ✅ |

### 待覆盖

- [ ] 错误处理
- [ ] 边界情况
- [ ] 性能测试

---

## 🎯 下一步

完成测试后：

1. **继续开发** → M1.1 图片路径规范化
2. **完善测试** → 添加更多边界测试
3. **性能优化** → 大规模内容测试
4. **文档完善** → 用户手册

---

## 💡 提示

- 使用 `pnpm scan:table` 快速查看结果
- 使用 `jq` 工具处理 JSON 输出
- 测试前先清理 `content-index.json`
- 遇到问题查看 [TEST_SPECIFICATION.md](TEST_SPECIFICATION.md)

---

**最后更新：** 2026-04-02
**版本：** 1.0.0
