# 贡献指南

> **欢迎贡献！** 感谢您对 PostWaver 项目的关注。

---

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)

---

## 🤝 行为准则

- 尊重所有贡献者
- 使用友好和包容的语言
- 接受建设性批评
- 关注对社区最有利的事情

---

## 🚀 如何贡献

### 报告 Bug

1. 检查 [Issues](https://github.com/Charliechen114514/post_waver/issues) 确认问题未被报告
2. 创建新 Issue，包含：
   - 清晰的标题
   - 详细的问题描述
   - 复现步骤
   - 预期行为 vs 实际行为
   - 环境信息（操作系统、Node.js 版本等）
   - 相关日志或截图

### 提出新功能

1. 先在 [Issues](https://github.com/Charliechen114514/post_waver/issues) 讨论
2. 说明：
   - 功能的用例
   - 为什么这个功能很重要
   - 可能的实现方式
   - 是否愿意贡献代码

### 贡献代码

#### 小改动

- 修复错别字
- 修复小 bug
- 改进文档
- 添加注释

直接提交 Pull Request 即可。

#### 大改动

1. 先在 Issues 中讨论
2. 等待维护者确认
3. 开发前确认需求和实现方案
4. 遵循开发流程

---

## 🔧 开发流程

### 环境搭建

```bash
# 1. Fork 仓库
# 点击 GitHub 页面的 "Fork" 按钮

# 2. Clone 你的 fork
git clone https://github.com/YOUR_USERNAME/post_waver.git
cd post_waver

# 3. 安装依赖
pnpm install

# 4. 构建项目
pnpm build

# 5. 启动开发服务器
pnpm start
```

### 分支策略

- `main` - 主分支，保持稳定
- `feature/*` - 新功能开发
- `fix/*` - Bug 修复
- `docs/*` - 文档更新
- `refactor/*` - 代码重构

### 开发步骤

```bash
# 1. 更新主分支
git checkout main
git pull upstream main

# 2. 创建新分支
git checkout -b feature/your-feature-name

# 3. 进行开发
# ... 编写代码 ...

# 4. 运行测试
pnpm test
pnpm typecheck
pnpm lint

# 5. 提交代码
git add .
git commit -m "feat: add your feature description"

# 6. 推送到你的 fork
git push origin feature/your-feature-name

# 7. 创建 Pull Request
# 在 GitHub 上打开 Pull Request
```

---

## 📐 代码规范

### TypeScript

- 使用 TypeScript 进行类型检查
- 避免使用 `any` 类型
- 导出的函数必须有类型签名
- 使用接口定义数据结构

### 命名规范

- **文件名**: 使用 kebab-case（如：`image-resolver.ts`）
- **变量名**: 使用 camelCase（如：`userName`）
- **常量名**: 使用 UPPER_SNAKE_CASE（如：`MAX_COUNT`）
- **类名**: 使用 PascalCase（如：`UserService`）
- **接口名**: 使用 PascalCase，无前缀（如：`User`）

### 代码风格

```typescript
// ✅ 好的实践
export async function parseMarkdown(content: string): Promise<ParsedContent> {
  try {
    const result = await processor.process(content);
    return result;
  } catch (error) {
    throw new Error(`Failed to parse markdown: ${error.message}`);
  }
}

// ❌ 不好的实践
export async function parse(c: any) {
  return await processor.process(c);
}
```

### 注释规范

```typescript
/**
 * 解析 Markdown 内容
 *
 * @param content - Markdown 内容
 * @returns 解析后的内容对象
 * @throws {Error} 当解析失败时抛出错误
 *
 * @example
 * ```typescript
 * const result = await parseMarkdown("# Hello");
 * console.log(result.title); // "Hello"
 * ```
 */
export async function parseMarkdown(content: string): Promise<ParsedContent> {
  // ...
}
```

---

## 📝 提交规范

### 提交消息格式

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

### 示例

```bash
# 新功能
git commit -m "feat(core): add image compression support"

# Bug 修复
git commit -m "fix(transformer): handle empty frontmatter gracefully"

# 文档更新
git commit -m "docs: update installation guide for Windows"

# 重大变更
git commit -m "feat(engine)!: redesign publish workflow

BREAKING CHANGE: The publish workflow API has changed. Users need to update their scripts."
```

---

## 🔀 Pull Request 流程

### PR 标题

使用与提交消息相同的格式：

```
feat(core): add image compression support
fix(transformer): handle empty frontmatter gracefully
docs: update installation guide for Windows
```

### PR 描述模板

```markdown
## 📝 变更说明
简要描述这个 PR 的目的和内容

## 🔗 相关 Issue
Closes #123

## ✅ 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 破坏性变更
- [ ] 文档更新

## 🧪 测试
描述你如何测试这些变更：
- [ ] 单元测试通过
- [ ] 手动测试通过
- [ ] 添加了新的测试

## 📸 截图（如果适用）
添加截图或录屏

## ✅ 检查清单
- [ ] 代码遵循项目规范
- [ ] 已进行自我审查
- [ ] 添加了必要的注释
- [ ] 更新了相关文档
- [ ] 没有引入新的警告
- [ ] 添加了测试（如适用）
- [ ] 通过了所有测试
```

### PR 审查流程

1. **自动检查**
   - CI 构建必须通过
   - 代码风格检查必须通过
   - 测试必须通过

2. **代码审查**
   - 至少一位维护者审查
   - 解决所有审查意见
   - 确保所有讨论达成一致

3. **合并**
   - 维护者批准后合并
   - 使用 Squash and Merge 保持历史清洁
   - 删除已合并的分支

---

## 🧪 测试指南

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行单元测试
pnpm test:units

# 运行集成测试
pnpm test:integration

# 运行测试 UI
pnpm test:ui
```

### 编写测试

```typescript
import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '../parser';

describe('parseMarkdown', () => {
  it('should parse markdown content', () => {
    const content = '# Hello World';
    const result = parseMarkdown(content);
    expect(result.title).toBe('Hello World');
  });

  it('should handle empty content', () => {
    const content = '';
    expect(() => parseMarkdown(content)).not.toThrow();
  });
});
```

---

## 📚 文档贡献

### 更新文档

- 代码变更必须更新相关文档
- 使用清晰的标题层级
- 添加代码示例
- 更新相关链接

### 文档位置

- 用户文档：`docs/01-getting-started/`, `docs/02-user-guides/`, `docs/03-troubleshooting/`
- 开发者文档：`docs/04-developer-guide/`
- 部署文档：`docs/05-deployment/`
- 包文档：`packages/*/README.md`

---

## ❓ 常见问题

### Q: 我的新功能被接受了，接下来怎么办？

A: 太好了！请：
1. 在 Issues 中确认实现细节
2. 按照"开发流程"进行开发
3. 提交 PR 时引用相关 Issue

### Q: 我的 PR 没有得到响应怎么办？

A: 请：
1. 耐心等待，维护者都是志愿者
2. 在 PR 中评论提醒
3. 在 Discord/Slack 群中询问

### Q: 我不懂 TypeScript，可以贡献吗？

A: 当然可以！你可以：
- 改进文档
- 报告 Bug
- 提出新功能想法
- 帮助其他用户

---

## 📧 联系方式

- **GitHub Issues**: [提交问题](https://github.com/Charliechen114514/post_waver/issues)
- **GitHub Discussions**: [参与讨论](https://github.com/Charliechen114514/post_waver/discussions)

---

## 🙏 致谢

感谢所有贡献者！你们的贡献让 PostWaver 变得更好。

---

**最后更新**: 2026-04-03
**维护者**: PostWaver Team
**反馈**: [GitHub Issues](https://github.com/Charliechen114514/post_waver/issues)
