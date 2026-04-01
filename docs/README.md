# 文档

Content-Hub 项目的完整文档集合。

---

## 📚 文档导航

### 📖 [项目目录结构](DIRECTORY_STRUCTURE.md)
**用途：** 完整的目录结构说明

**包含内容：**
- 根目录结构
- 核心目录说明
- 文件查找指南
- 命名约定

**适合场景：** 了解项目结构、查找文件

---

### 🧪 [测试文档](test/)

#### 测试快速参考
[test/TEST_QUICK_REFERENCE.md](test/TEST_QUICK_REFERENCE.md)
- 一键测试命令
- 测试用例速查表
- 常用命令列表
- 快速修复指南

#### 测试规范文档
[test/TEST_SPECIFICATION.md](test/TEST_SPECIFICATION.md)
- 13 个详细测试用例
- 集成测试
- 故障排查指南
- 测试数据和示例

**适合场景：** 测试验证、问题排查

---

### 📖 [平台指南](guides/)

#### 掘金半自动发布指南
[guides/juejin-semi-auto-guide.md](guides/juejin-semi-auto-guide.md)
- Markdown 语法支持
- 编辑器使用
- 最佳实践

#### 微信公众号半自动发布指南
[guides/wechat-semi-auto-guide.md](guides/wechat-semi-auto-guide.md)
- 公众号 Markdown 支持
- 排版注意事项
- 发布流程

#### 平台转换规范
[guides/platform-conversion-specs.md](guides/platform-conversion-specs.md)
- 转换规则
- 兼容性处理
- 最佳实践

**适合场景：** 发布文章、平台适配

---

### 🔬 [研究资料](research/)

**用途：** 平台测试内容和技术调研

- [掘金测试内容](research/juejin-test-content.md) - 掘金 Markdown 支持测试
- [Blog HTML 转换报告](research/blog-html-to-markdown-转换报告.md) - HTML 到 Markdown 转换

**适合场景：** 深入了解平台特性、技术调研

---

### 📦 [归档文档](archive/)

**用途：** 历史文档和项目记录

- [PV 阶段总结](archive/pv-phase-summary.md) - 预备阶段完成总结
- [Blog 架构说明](archive/blog-architecture.md) - 旧的三仓库架构
- [Blog 修复报告](archive/blog-fix/) - 格式修复记录

**适合场景：** 了解项目历史、问题排查

---

## 🎯 按场景查找

### 我想...

#### 快速验证功能
→ [测试快速参考](test/TEST_QUICK_REFERENCE.md) - 一键测试章节

#### 了解项目结构
→ [项目目录结构](DIRECTORY_STRUCTURE.md)

#### 发布文章到平台
→ [平台指南](guides/) - 选择对应平台

#### 深入了解平台特性
→ [研究资料](research/) - 查看测试内容

#### 了解项目历史
→ [归档文档](archive/) - 查看历史记录

#### 排查测试问题
→ [测试规范](test/TEST_SPECIFICATION.md) - 故障排查章节

---

## 📊 文档分类

### 按类型

| 类型 | 文档 | 用途 |
|------|------|------|
| **结构** | DIRECTORY_STRUCTURE.md | 项目结构 |
| **测试** | test/*.md | 测试相关 |
| **指南** | guides/*.md | 平台发布 |
| **研究** | research/*.md | 技术调研 |
| **归档** | archive/* | 历史记录 |

### 按重要性

| 重要性 | 文档 |
|--------|------|
| 🔴 **必读** | README.md, DIRECTORY_STRUCTURE.md |
| 🟡 **常用** | test/TEST_QUICK_REFERENCE.md, guides/*.md |
| 🟢 **参考** | test/TEST_SPECIFICATION.md, research/*.md |
| ⚪ **归档** | archive/* |

---

## 🔄 更新日志

### v2.1.0 (2026-04-02)
- ✅ 整合测试文档到 docs/test/
- ✅ 删除冗余的 TESTING.md
- ✅ 文档结构进一步优化

### v2.0.0 (2026-04-02)
- ✅ 激进清理文档
- ✅ 归档历史文档
- ✅ 整合平台指南
- ✅ 删除无关配置

### v1.0.0 (2026-04-02)
- 初始版本
- M0.2 和 M0.3 测试文档

---

## 💡 文档维护

### 添加新文档

1. **测试文档** → 添加到 `docs/test/`
2. **平台指南** → 添加到 `docs/guides/`
3. **研究资料** → 添加到 `docs/research/`
4. **历史记录** → 添加到 `docs/archive/`

### 文档规范

- 使用清晰的文件命名
- 提供使用场景说明
- 包含代码示例
- 保持更新

---

## 🐛 文档反馈

- 文档不准确？→ 提交 issue
- 需要更多示例？→ 提交 issue
- 发现错误？→ 提交 PR

---

**维护者：** Content-Hub Team
**最后更新：** 2026-04-02
**版本：** 2.1.0
