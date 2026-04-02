# CLI 命令参考

> **版本**: v3.0  
> **更新日期**: 2026-04-02

---

## 📋 目录

- [开发工具](#开发工具)
- [内容管理](#内容管理)
- [发布流程](#发布流程)
- [平台转换](#平台转换)
- [图片管理](#图片管理)
- [Hexo 集成](#hexo-集成)
- [工作流管理](#工作流管理)
- [平台 ID 管理](#平台-id-管理)
- [数据库管理](#数据库管理)
- [测试工具](#测试工具)

---

## 开发工具

### 启动开发服务器

```bash
# 启动完整开发环境
pnpm dev

# 仅启动 Web UI
pnpm dev:web

# 仅启动 API 服务器
pnpm dev:api
```

### 构建项目

```bash
# 构建所有包
pnpm build

# 运行测试
pnpm test

# 运行带 UI 的测试
pnpm test:ui
```

### 代码检查

```bash
# 检查所有代码
pnpm lint

# 自动修复问题
pnpm lint:fix

# 类型检查
pnpm typecheck
```

---

## 内容管理

### 扫描内容

```bash
# 扫描内容目录
pnpm scan

# 表格格式输出
pnpm scan:table

# 包含草稿
pnpm scan:drafts

# 重建索引
pnpm index:rebuild
```

### 同步到博客

```bash
# 同步到 Hexo 博客
pnpm sync:hexo

# 同步并推送到 Git
pnpm sync:blog
```

---

## 发布流程

### 发布文章

```bash
# 交互式发布
pnpm post:publish

# 快速发布
pnpm post:publish:fast <postId>

# 仅预览
pnpm post:publish:preview-only <postId>

# 生成发布数据
pnpm post:publish:generate <postId>
```

### 发布管理

```bash
# 查看发布历史
pnpm post:publish:history

# 管理 URL
pnpm post:publish:url

# 设置 URL
pnpm post:publish:set-url

# 重新发布
pnpm post:publish:republish <postId>

# 清理发布记录
pnpm post:publish:cleanup
```

---

## 平台转换

### 转换内容

```bash
# 转换为 HTML
pnpm transform:html <postId>

# 转换为掘金格式
pnpm transform:juejin <postId>

# 转换为微信格式
pnpm transform:wechat <postId>
```

### 预览转换

```bash
# 预览微信格式
pnpm preview:wechat

# 预览掘金格式
pnpm preview:juejin

# 预览 HTML 格式
pnpm preview:html
```

---

## 图片管理

### 查看图片

```bash
# 列出文章图片
pnpm image:list <postId>
```

### 配置 API

```bash
# 配置平台 API
pnpm image:config set <platform> <credentials>

# 验证配置
pnpm image:config validate <platform>

# 查看配置
pnpm image:config show
```

### 上传图片

```bash
# 上传图片
pnpm image:upload-post <postId>

# 上传并替换链接（推荐）
pnpm image:upload:replace <postId> [options]
```

**选项**:
- `--dry-run` - 预览模式
- `--backup` - 创建备份
- `--output <path>` - 输出到文件

---

## Hexo 集成

### 配置和管理

```bash
# 配置 Hexo 博客
pnpm hexo:config

# 查看状态
pnpm hexo:status

# 同步内容
pnpm hexo:sync

# 预览博客
pnpm hexo:preview

# 部署博客
pnpm hexo:deploy
```

---

## 工作流管理

### 扫描和处理

```bash
# 扫描工作流
pnpm workflow:scan

# 处理单篇文章
pnpm workflow:process <postId>

# 快速处理
pnpm workflow:process <postId> --fast

# 批量处理
pnpm workflow:process-all
```

### 状态和历史

```bash
# 查看状态
pnpm workflow:status

# 查看历史
pnpm workflow:history
```

### 回滚

```bash
# 回滚特定文章
pnpm workflow:rollback <postId>

# 重置所有状态
pnpm workflow:reset-all
```

---

## 平台 ID 管理

### 管理 ID

```bash
# 列出平台 ID
pnpm platform:id:list <postId>

# 更新平台 ID
pnpm platform:id:update

# 删除平台 ID
pnpm platform:id:remove

# 查看状态
pnpm platform:id:status

# 导入配置
pnpm platform:id:import
```

---

## 数据库管理

### 初始化和迁移

```bash
# 初始化数据库
pnpm db:init

# 运行迁移
pnpm db:migrate

# 重置数据库
pnpm db:reset

# 打开管理界面
pnpm db:studio
```

### 文章状态

```bash
# 查看文章状态
pnpm post:status

# 更新文章状态
pnpm post:update-status
```

---

## 测试工具

### 集成测试

```bash
# 运行集成测试
pnpm test:integration

# 运行单元测试
pnpm test:units

# 运行完整测试
pnpm test:comprehensive

# 验证数据库
pnpm verify:db

# 验证相关链接
pnpm verify:related-links
```

### 图片测试

```bash
# 创建测试图片
pnpm test:image:create-sample

# 测试掘金图片
pnpm test:image:juejin

# 测试微信图片
pnpm test:image:wechat
```

---

## 💡 命令速查

### 最常用命令

```bash
# 日常工作流
pnpm workflow:scan              # 扫描
pnpm workflow:process <postId>  # 处理
pnpm hexo:sync                  # 同步博客

# 快速发布
pnpm post:publish:fast <postId>

# 查看状态
pnpm workflow:status
```

### 故障排查命令

```bash
# 检查数据库
pnpm verify:db

# 重新初始化
pnpm db:reset
pnpm scan

# 查看历史
pnpm workflow:history
```

---

**需要更多帮助？** 查看 [用户手册](USER_GUIDE.md) 或 [故障排查指南](TROUBLESHOOTING.md)
