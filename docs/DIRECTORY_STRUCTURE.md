# 项目目录结构

Content-Hub 项目的完整目录结构说明。

---

## 📁 根目录结构

```
post_waver/
├── content/                    # 用户内容目录
│   ├── .gitignore             # 忽略用户文章
│   ├── README.md              # 使用说明
│   └── posts/                 # 博客文章
│       ├── example-post.md    # 示例文章
│       ├── tech/              # 技术文章（用户创建）
│       ├── life/              # 生活文章（用户创建）
│       └── notes/             # 笔记（用户创建）
│
├── packages/                   # Monorepo 包
│   ├── core/                  # 核心功能包
│   │   ├── src/              # 源代码
│   │   │   ├── types.ts      # 类型定义
│   │   │   ├── parser.ts     # Markdown 解析器
│   │   │   ├── scanner.ts    # 目录扫描器
│   │   │   └── index.ts      # 导出
│   │   ├── dist/             # 编译产物
│   │   └── schemas/          # JSON Schema
│   │
│   ├── linker/               # 内容关联包
│   ├── transformer/          # 内容转换包
│   ├── adapter/             # 平台适配器包
│   └── engine/              # 引擎包
│
├── scripts/                   # 功能脚本
│   ├── scan.ts              # 内容扫描脚本
│   ├── update-blog.sh       # Blog 同步脚本
│   └── remark-lint-custom.js # 自定义 remark 校验
│
├── test/                     # 测试目录 ⭐ NEW
│   ├── README.md             # 测试目录说明
│   ├── fixtures/             # 测试夹具（测试数据）
│   │   └── posts/           # 测试文章
│   │       ├── valid/      # 有效 Frontmatter 示例
│   │       └── invalid/    # 无效 Frontmatter 示例
│   └── scripts/             # 测试脚本
│       ├── test-units.sh    # 单元测试
│       └── test-integration.sh # 集成测试
│
├── docs/                     # 文档目录
│   ├── README.md            # 文档导航
│   ├── TESTING.md           # 测试指南
│   ├── TEST_SPECIFICATION.md # 测试规范
│   ├── TEST_QUICK_REFERENCE.md # 测试快速参考
│   └── research/            # 研究资料
│
├── milestones/               # 里程碑文档
│   ├── README.md            # 里程碑总览
│   ├── M0.2-*.md            # M0.2 文档
│   └── M0.3-*.md            # M0.3 文档
│
├── .vscode/                  # VS Code 配置
│   ├── settings.json        # 编辑器设置
│   └── tasks.json           # 任务配置
│
├── content-index.json        # 内容索引文件（生成）
├── package.json             # 项目配置
├── tsconfig.json            # TypeScript 配置
├── .markdownlint.jsonc      # Markdown Lint 配置
└── .remarkrc.mjs            # Remark 配置
```

---

## 📂 核心目录说明

### `content/` - 用户内容（私有）

**用途：** 存放用户的博客文章和其他内容

**⚠️ 重要：**
- `content/` 目录已在 `.gitignore` 中
- 用户需要自己创建此目录
- 参考 `content-example/` 了解结构

**创建方法：**
```bash
# 方式 1: 复制示例
cp -r content-example content

# 方式 2: 手动创建
mkdir -p content/posts/{tech,life,notes}
```

**结构示例：**
```
content/
└── posts/
    ├── tech/          # 技术文章
    ├── life/          # 生活文章
    └── notes/         # 笔记
```

**规范：**
- 每个文件必须包含 Frontmatter
- 文件名作为文章 ID
- 支持 `.md` 格式

---

### `packages/` - Monorepo 包

**用途：** 存放各个功能模块的源代码

#### `packages/core/` - 核心包

**职责：**
- Frontmatter 解析
- Markdown 转 AST
- 内容扫描
- 索引生成

**主要模块：**
- `types.ts` - 类型定义
- `parser.ts` - 解析器
- `scanner.ts` - 扫描器

#### 其他包

- `linker` - 内容关联（待开发）
- `transformer` - 内容转换（待开发）
- `adapter` - 平台适配器（待开发）
- `engine` - 执行引擎（待开发）

---

### `scripts/` - 功能脚本

**用途：** 存放功能性脚本（非测试）

**脚本说明：**

| 脚本 | 用途 | 命令 |
|------|------|------|
| `scan.ts` | 内容扫描 | `pnpm scan` |
| `update-blog.sh` | Blog 同步 | `pnpm sync:blog` |
| `remark-lint-custom.js` | remark 校验 | 自动调用 |

---

### `test/` - 测试目录 ⭐ NEW

**用途：** 集中管理所有测试相关材料

**详细说明：** 参见 [test/README.md](../test/README.md)

**结构：**
```
test/
├── fixtures/              # 测试数据
│   └── posts/
│       ├── valid/        # 有效示例
│       └── invalid/      # 无效示例
└── scripts/              # 测试脚本
    ├── test-units.sh     # 单元测试
    └── test-integration.sh # 集成测试
```

**使用方式：**
```bash
# 运行单元测试
pnpm test:units

# 运行集成测试
pnpm test:integration

# 使用测试夹具
npx remark test/fixtures/posts/valid/complete-frontmatter.md
```

---

### `docs/` - 文档目录

**用途：** 项目文档和指南

**主要文档：**

| 文档 | 用途 |
|------|------|
| `README.md` | 文档导航 |
| `TESTING.md` | 测试指南 |
| `TEST_SPECIFICATION.md` | 测试规范 |
| `TEST_QUICK_REFERENCE.md` | 测试快速参考 |

---

### `milestones/` - 里程碑文档

**用途：** 记录各个里程碑的详细规范

**里程碑：**
- `M0.2` - Frontmatter 规范与 Lint
- `M0.3` - 内容扫描器与解析器
- `M1.x` - Phase 1 功能

---

## 🔍 文件查找指南

### 我想找...

#### 测试相关
```bash
# 测试脚本
ls test/scripts/

# 测试数据
ls test/fixtures/

# 测试文档
ls docs/TEST*.md
```

#### 功能代码
```bash
# 类型定义
cat packages/core/src/types.ts

# 解析器
cat packages/core/src/parser.ts

# 扫描器
cat packages/core/src/scanner.ts
```

#### 配置文件
```bash
# Markdown Lint
cat .markdownlint.jsonc

# Remark
cat .remarkrc.mjs

# TypeScript
cat tsconfig.json

# VS Code
cat .vscode/settings.json
```

#### 文档
```bash
# 项目文档
ls docs/

# 里程碑文档
ls milestones/

# 测试文档
ls docs/TEST*.md
```

---

## 📊 目录大小分布

```bash
# 查看各目录大小
du -sh */ 2>/dev/null | sort -h
```

**典型大小：**
```
test/fixtures/    ~ 20 KB   # 测试数据
packages/core/    ~ 50 KB   # 核心代码
docs/             ~ 100 KB  # 文档
content/posts/    ~ 10 KB   # 用户内容
```

---

## 🎯 最佳实践

### 添加新功能

1. **功能代码** → `packages/相应包/src/`
2. **类型定义** → `packages/core/src/types.ts`
3. **功能脚本** → `scripts/`
4. **测试脚本** → `test/scripts/`
5. **测试数据** → `test/fixtures/`
6. **文档** → `docs/`

### 添加新测试

1. **测试夹具** → `test/fixtures/`
2. **测试脚本** → `test/scripts/`
3. **更新文档** → `docs/TEST*.md`

---

## 🔄 目录变更历史

### v1.1.0 (2026-04-02)
- ✅ 新增 `test/` 目录
- ✅ 移动 `fixtures/` → `test/fixtures/`
- ✅ 移动 `scripts/test-*.sh` → `test/scripts/`
- ✅ 更新所有测试相关路径

### v1.0.0 (2026-04-01)
- 初始目录结构
- M0.2 和 M0.3 完成

---

## 💡 快速导航

### 我想要...

**运行测试** → `pnpm test:units` 或 `pnpm test:integration`
**添加功能** → `packages/` 目录
**查看文档** → `docs/` 目录
**添加测试** → `test/` 目录
**写文章** → `content/posts/` 目录

---

## 📝 注意事项

### 目录命名约定

- **单数形式** - `package/` 不是 `packages/`（子目录）
- **小写字母** - `content/` 不是 `Content/`
- **连字符分隔** - `test-integration.sh` 不是 `test_integration.sh`

### 路径引用规则

- **绝对路径** - 避免使用
- **相对根目录** - 优先使用
- **测试路径** - 使用 `test/fixtures/` 前缀

---

**维护者：** Content-Hub Team
**最后更新：** 2026-04-02
**版本：** 1.1.0
