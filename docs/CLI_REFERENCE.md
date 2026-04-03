# CLI 命令参考

> **版本**: v3.1
> **更新日期**: 2026-04-03

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
- [标题注入管理](#标题注入管理)
- [标签缓存管理](#标签缓存管理)
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

**开发环境启动流程**：

1. 📚 **扫描文章** - 扫描 `content/posts` 目录
2. 💾 **自动注入 Frontmatter** - 智能补充缺失的字段（title, date, tags 等）
3. 🔗 **注入相关链接** - 添加相关文章链接
4. 🚀 **启动服务器** - API (3001) + Web UI (5173)

**特性**：
- ✅ 自动维护文章元数据完整性
- ✅ 只补充缺失字段，不覆盖已有内容
- ✅ 实时反馈处理进度
- ✅ 适合开发环境使用

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
# 扫描内容目录（默认只输出摘要）
pnpm scan

# 扫描并以表格格式输出
pnpm scan --output table

# 扫描并以 JSON 格式输出
pnpm scan --output json

# 扫描并注入缺失的 frontmatter 字段
pnpm scan --inject

# 扫描指定目录
pnpm scan --dir content/posts

# 包含草稿文章
pnpm scan --include-drafts

# 排除草稿文章
pnpm scan --exclude-drafts

# 重建索引（不更新数据库）
pnpm scan --no-update-index

# 重建完整索引
pnpm index:rebuild
```

**扫描选项说明**：

| 选项 | 说明 |
|------|------|
| `--dir <directory>` | 指定扫描目录（默认：content/posts） |
| `--recursive` | 递归扫描子目录（默认：true） |
| `--inject` | **智能注入缺失的 frontmatter 字段到文件** |
| `--include-drafts` | 包含草稿文章 |
| `--exclude-drafts` | 排除草稿文章 |
| `--update-index` | 更新数据库索引（默认：true） |
| `--no-update-index` | 不更新数据库索引 |
| `--output <format>` | 输出格式：table/json/summary |

**`--inject` 模式特性**：
- ✅ 只补充缺失的字段（title, date, tags, categories, description）
- ✅ 不覆盖已有的 frontmatter 字段
- ✅ 智能检测并最小化文件写入
- ✅ 支持 AI 智能生成和规则生成两种方案

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

# 转换为 CSDN 格式
pnpm transform:csdn <postId>

# 转换为知乎格式
pnpm transform:zhihu <postId>

# 转换为微信格式
pnpm transform:wechat <postId>
```

**转换选项**:
- `--remove-local-images` - 移除本地图片，添加上传占位符
- `--include-related-links` - 包含相关文章链接
- `--output <path>` - 输出到文件

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

### 清理已发布文章

```bash
# 清理文章文件（保留数据库记录）
pnpm post:clean <postId>

# 预演模式（不实际删除）
pnpm post:clean <postId> --dry-run

# 预演模式（简写）
pnpm post:clean <postId> -n
```

**清理功能说明**：

- ✅ 删除本地 Markdown 文件和资源文件
- ✅ 保留数据库记录和发布历史
- ✅ 保留平台链接和标签信息
- ✅ 更新文章状态为 `archived`
- ⚠️ 只能清理已发布（`published`）状态的文章
- ⚠️ 清理后无法恢复文件

**清理前确认**：
```bash
# 查看文章状态
pnpm post:status

# 检查平台链接是否已保存
pnpm platform:id:status <postId>
```

---

## 平台 ID 管理

### 管理 ID

```bash
# 更新平台 ID
pnpm platform:id:update <postId> --platform <platform> --id <platformId> [--url <url>]

# 删除平台 ID
pnpm platform:id:remove <postId> --platform <platform>

# 查看平台 ID 状态
pnpm platform:id:status <postId>

# 列出所有平台 ID
pnpm platform:id:list

# 批量导入平台 ID
pnpm platform:id:import <jsonFile>
```

**支持的平台**:
- `juejin` - 掘金
- `csdn` - CSDN
- `zhihu` - 知乎
- `wechat` - 微信公众号
- `html` - HTML

**使用示例**:
```bash
# 更新掘金文章 ID
pnpm platform:id:update post-123 --platform juejin --id 7123456789

# 删除知乎文章 ID
pnpm platform:id:remove post-123 --platform zhihu

# 查看文章的平台 ID 状态
pnpm platform:id:status post-123

# 批量导入
pnpm platform:id:import platform-ids.json
```

---

## 标题注入管理

### 注入模板

```bash
# 为单篇文章注入标题
pnpm title:injector:article <articleId> --template <templateId>

# 批量注入标题
pnpm title:injector:batch --template <templateId>

# 预览注入效果
pnpm title:injector:preview <articleId> --template <templateId>
```

**使用示例**:
```bash
# 使用指定模板为文章注入标题
pnpm title:injector:article post-123 --template welcome-template

# 批量为所有文章注入标题
pnpm title:injector:batch --template default-signature

# 预览注入效果
pnpm title:injector:preview post-123 --template tech-sharing
```

---

## 标签缓存管理

### 缓存操作

```bash
# 查看标签统计
pnpm tag:stats

# 清理未使用的标签
pnpm tag:cleanup [--unused-days=<days>]

# 重置标签缓存
pnpm tag:reset

# 重建标签缓存
pnpm tag:rebuild

# 标签规范化
pnpm tag:normalize [--case=<lower|upper>]

# 合并相似标签
pnpm tag:merge --source=<oldTag> --target=<newTag>
```

**使用示例**:
```bash
# 查看标签使用统计
pnpm tag:stats

# 清理 30 天未使用的标签
pnpm tag:cleanup --unused-days=30

# 合并标签
pnpm tag:merge --source=js --target=javascript

# 标签名转为小写
pnpm tag:normalize --case=lower
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
