# 文档

PostWaver 项目的完整文档集合。

---

## 📚 文档导航

### 🚀 快速开始

**[快速开始](QUICK_START.md)** - 5 分钟上手 PostWaver

**适合场景**：第一次使用 PostWaver

**包含内容**：
- 安装与配置
- 创建第一篇文章
- 发布到平台
- 常用命令速查

**预计阅读时间**：5 分钟

---

### 📖 完整指南

**[用户手册](USER_GUIDE.md)** - 详细的功能使用指南

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

### 🔧 命令参考

**[CLI 命令参考](CLI_REFERENCE.md)** - 所有命令说明

**适合场景**：查阅命令用法

**包含内容**：
- 开发工具
- 内容管理
- 发布流程
- 平台转换
- 图片管理
- Hexo 集成
- 工作流管理

---

### 🛠️ 故障排查

**[故障排查指南](TROUBLESHOOTING.md)** - 常见问题解决方案

**适合场景**：遇到问题时查找答案

**包含内容**：
- 常见错误
- 数据库问题
- 发布失败
- 图片问题
- 配置问题

---

### 📂 项目结构

**[目录结构说明](DIRECTORY_STRUCTURE.md)** - 完整的项目结构说明

**包含内容**：
- 根目录结构
- 核心目录说明
- 文件查找指南
- 命名约定

---

## 🎯 按场景查找

### 我想...

#### 快速上手
→ [快速开始](QUICK_START.md) - 5 分钟上手教程

#### 了解完整功能
→ [用户手册](USER_GUIDE.md) - 详细功能说明

#### 查看命令
→ [CLI 参考](CLI_REFERENCE.md) - 完整命令列表

#### 发布到掘金
→ [掘金半自动指南](guides/juejin-semi-auto-guide.md)

#### 发布到微信公众号
→ [微信公众号半自动指南](guides/wechat-semi-auto-guide.md)

#### 同步到 Hexo 博客
→ [Hexo 同步指南](guides/hexo-sync-guide.md)

#### 了解平台转换规则
→ [平台转换规范](guides/platform-conversion-specs.md)

#### 遇到问题
→ [故障排查指南](TROUBLESHOOTING.md)

---

## 📂 文档分类

### 按类型

| 类型 | 文档 | 用途 |
|------|------|------|
| **入门** | QUICK_START.md | 5 分钟上手 |
| **指南** | USER_GUIDE.md | 完整功能说明 |
| **参考** | CLI_REFERENCE.md | 命令速查 |
| **排查** | TROUBLESHOOTING.md | 问题解决 |
| **结构** | DIRECTORY_STRUCTURE.md | 项目结构 |

### 按重要性

| 重要性 | 文档 |
|--------|------|
| 🔴 **必读** | QUICK_START.md |
| 🟡 **常用** | USER_GUIDE.md, CLI_REFERENCE.md |
| 🟢 **参考** | TROUBLESHOOTING.md, DIRECTORY_STRUCTURE.md |

---

## 📖 平台指南

### 发布指南

- **[掘金半自动指南](guides/juejin-semi-auto-guide.md)** - Markdown 语法支持、编辑器使用
- **[微信公众号半自动指南](guides/wechat-semi-auto-guide.md)** - 公众号 Markdown 支持、发布流程
- **[平台转换规范](guides/platform-conversion-specs.md)** - 转换规则、兼容性处理

### 功能指南

- **[Hexo 同步指南](guides/hexo-sync-guide.md)** - 博客同步、部署
- **[内容关联](guides/content-relationships.md)** - 相关文章、链接管理
- **[图片标准化](guides/m1.1-image-normalization.md)** - 图片处理、路径规范

---

## 🔌 API 文档

- **[图片路径解析器](api/image-resolver.md)** - 解析器 API、路径规则
- **[链接注入器](api/link-injector.md)** - 注入器 API、配置选项

---

## ✨ 功能特性

- **[仓库引用注入](features/repo-injector.md)** - 自动注入仓库链接
- **[微信图片上传](features/wechat-image-upload.md)** - 自动上传、错误处理

---

## 🧪 测试文档

- **[测试手册](test/COMPREHENSIVE_TEST_MANUAL.md)** - 完整测试流程

---

## 🔄 更新日志

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
**最后更新**：2026-04-02  
**版本**：3.0.0
