# PostWaver 测试指南

本目录包含 PostWaver 项目的完整测试文档和脚本。

## 📚 文档列表

### 1. [全面测试手册](COMPREHENSIVE_TEST_MANUAL.md)
**用途**: 完整的系统测试流程

**内容包括**:
- 🔧 环境准备和清理
- 🧪 分阶段测试（基础→工作流→发布→Hexo）
- 📊 详细的验证清单
- 🐛 常见问题排查
- 🎯 快速测试命令

**适用场景**:
- 全新安装后的系统验证
- 重大更新后的回归测试
- 清空环境后的完整测试

### 2. [测试规范](TEST_SPECIFICATION.md)
**用途**: 单元测试和集成测试规范

**内容包括**:
- M0.2 Frontmatter 规范测试
- M0.3 内容扫描器测试
- 13 个详细测试用例
- 测试工具使用说明

**适用场景**:
- 开发过程中的单元测试
- CI/CD 自动化测试
- 功能模块验证

### 3. [快速参考](TEST_QUICK_REFERENCE.md)
**用途**: 快速查找测试命令

**内容包括**:
- 常用测试命令速查
- 测试覆盖率列表
- 快速故障排查

## 🚀 快速开始

### 一键基础测试

```bash
# 运行自动化测试脚本
pnpm test:comprehensive
```

这将检查：
- ✅ Node.js 和 pnpm 版本
- ✅ 依赖安装状态
- ✅ 数据库连接
- ✅ 内容扫描功能
- ✅ 工作流状态

### 完整功能测试

```bash
# 1. 清空环境（可选，但推荐）
# 见全面测试手册的"环境准备"章节

# 2. 启动服务
pnpm dev:web      # 终端 1
pnpm dev:api      # 终端 2

# 3. 运行完整测试流程
# 见全面测试手册的"分阶段测试"章节
```

## 📋 测试清单模板

使用以下模板记录测试结果：

```markdown
## 测试执行记录

**测试日期**: YYYY-MM-DD
**测试人员**: Your Name
**环境**: Local/Production

### 测试结果

| 阶段 | 状态 | 备注 |
|------|------|------|
| 环境准备 | ✅/❌ | |
| 基础功能 | ✅/❌ | |
| 工作流 | ✅/❌ | |
| 发布功能 | ✅/❌ | |
| Hexo 集成 | ✅/❌/⏭️ | |

### 发现的问题

1. 问题描述
   - 严重程度: High/Medium/Low
   - 复现步骤:
   - 预期行为:
   - 实际行为:
```

## 🔧 测试脚本

### 自动化脚本

| 脚本 | 命令 | 说明 |
|------|------|------|
| **全面测试** | `pnpm test:comprehensive` | 自动检查基础功能 |
| **单元测试** | `pnpm test:units` | 运行单元测试 |
| **集成测试** | `pnpm test:integration` | 运行集成测试 |
| **Vitest 测试** | `pnpm test` | 运行 Vitest 测试 |

### 手动测试命令

```bash
# 内容扫描
pnpm scan
pnpm scan:table
pnpm scan:drafts

# 工作流
pnpm workflow:scan
pnpm workflow:status
pnpm workflow:process <post-id>

# 发布
pnpm workflow:process <post-id> [--fast]
pnpm post:publish:history

# Hexo
pnpm hexo:config
pnpm hexo:sync
```

## 🐛 故障排查

### 常见问题

1. **模块找不到**
   ```bash
   pnpm build
   ```

2. **数据库锁定**
   ```bash
   pnpm db:reset
   ```

3. **端口占用**
   ```bash
   lsof -ti:5173 | xargs kill -9
   ```

更多问题排查请参考 [全面测试手册](COMPREHENSIVE_TEST_MANUAL.md) 的故障排查章节。

## 📊 测试覆盖率

当前测试覆盖：

- ✅ Frontmatter 解析: 100%
- ✅ Markdown 转 AST: 100%
- ✅ 内容哈希: 100%
- ✅ 目录扫描: 100%
- ✅ 索引构建: 100%
- ✅ 更新检测: 100%
- ✅ Markdown Lint: 100%
- ✅ Frontmatter 校验: 100%

## 📖 相关文档

- [项目 README](../../README.md)
- [目录结构](../DIRECTORY_STRUCTURE.md)
- [平台指南](../guides/)
- [API 文档](../api/)

## 🤝 贡献

发现测试问题或有改进建议？欢迎提交 Issue 或 Pull Request！

---

**最后更新**: 2026-04-02
