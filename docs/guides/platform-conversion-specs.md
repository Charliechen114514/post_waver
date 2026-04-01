# 平台内容转换规范

> **版本**: v1.0
> **更新日期**: 2026-04-01
> **适用阶段**: Phase 2 - 平台发布

---

## 一、总体原则

### 1.1 统一转换流程

```
源文件 (Markdown + Frontmatter)
    ↓
解析器 (gray-matter + remark)
    ↓
AST (抽象语法树)
    ↓
平台转换器 (根据平台规范)
    ↓
目标格式 (Markdown/HTML/富文本)
    ↓
用户操作 (复制粘贴到平台编辑器)
```

### 1.2 转换器接口定义

```typescript
interface PlatformConverter {
  readonly platform: string
  readonly platformName: string
  readonly outputFormat: 'markdown' | 'html' | 'rich-text'

  /**
   * 转换Markdown内容为目标平台格式
   */
  convert(markdown: string, frontmatter: Frontmatter): Promise<ConvertedContent>

  /**
   * 验证内容是否符合平台规范
   */
  validate(content: string): ValidationResult

  /**
   * 转换图片路径
   */
  convertImagePath(sourcePath: string): ImagePathResult
}

interface Frontmatter {
  title: string
  date: string
  tags: string[]
  categories: string[]
  draft?: boolean
  [key: string]: any
}

type ConvertedContent =
  | { format: 'markdown'; content: string }
  | { format: 'html'; content: string; inlineStyles: boolean }
  | { format: 'rich-text'; content: string }

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

interface ImagePathResult {
  type: 'external' | 'local' | 'placeholder'
  url: string
  needsUpload: boolean
}
```

---

## 二、掘金（Juejin）转换规范

### 2.1 输出格式

- **格式**: Markdown
- **编码**: UTF-8
- **换行符**: `\n`

### 2.2 Markdown语法映射

| 源语法 | 目标语法 | 转换规则 | 备注 |
|--------|----------|----------|------|
| 标题H1-H6 | `#` 标题 | 直接保留 | 掘金支持1-6级标题 |
| 粗体 | `**text**` | 直接保留 | 也支持`__text__` |
| 斜体 | `*text*` | 直接保留 | 也支持`_text_` |
| 删除线 | `~~text~~` | 直接保留 | GFM语法 |
| 行内代码 | `` `code` `` | 直接保留 | - |
| 代码块 | <code>```lang</code> | 直接保留 | 需指定语言 |
| 表格 | `\| 表格 \|` | 直接保留 | GFM语法 |
| 任务列表 | `- [x]` | 直接保留 | GFM语法 |
| 数学公式 | `$E=mc^2$` | 直接保留 | KaTeX |
| 分割线 | `***` | 直接保留 | - |
| 引用 | `> text` | 直接保留 | - |

### 2.3 特殊元素处理

#### 数学公式

**源格式**：
```markdown
行内公式：$E = mc^2$

块级公式：
$$
\frac{n!}{k!(n-k)!} = \binom{n}{k}
$$
```

**掘金支持**：✅ 完全支持（KaTeX）
**转换动作**：直接保留，无需转换

#### Mermaid流程图

**源格式**：
````markdown
```mermaid
graph TD
    A --> B
```
````

**掘金支持**：✅ 支持
**转换动作**：直接保留

#### 脚注

**源格式**：
```markdown
这是脚注[^1]

[^1]: 脚注内容
```

**掘金支持**：⚠️ 需测试
**转换动作**：
- 如果支持：直接保留
- 如果不支持：转换为普通文本或删除

#### 图片路径

**源格式**：
```markdown
![图片描述](content/assets/images/image.png)
```

**转换规则**：
```typescript
function convertJuejinImagePath(sourcePath: string): ImagePathResult {
  // 1. 判断是否为外链
  if (sourcePath.startsWith('http://') || sourcePath.startsWith('https://')) {
    return {
      type: 'external',
      url: sourcePath,
      needsUpload: false
    }
  }

  // 2. 本地图片
  return {
    type: 'local',
    url: sourcePath,
    needsUpload: true, // 需要用户手动上传到掘金
    placeholder: `<!-- 需上传: ${sourcePath} -->`
  }
}
```

### 2.4 转换实现示例

```typescript
// packages/converters/src/juejin.ts
import { Node } from 'unist'

export class JuejinConverter implements PlatformConverter {
  readonly platform = 'juejin'
  readonly platformName = '掘金'
  readonly outputFormat = 'markdown' as const

  async convert(markdown: string, frontmatter: Frontmatter): Promise<ConvertedContent> {
    // 1. 解析Markdown为AST
    const ast = this.parseMarkdown(markdown)

    // 2. 验证语法兼容性
    const validation = this.validate(markdown)
    if (!validation.valid) {
      console.warn('掘金转换警告:', validation.warnings)
    }

    // 3. 处理特殊元素（如脚注）
    const processedAst = this.processSpecialElements(ast)

    // 4. 处理图片路径
    const finalMarkdown = this.processImages(ast)

    return {
      format: 'markdown',
      content: finalMarkdown
    }
  }

  validate(content: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查不支持的语法
    if (content.includes('==')) {
      warnings.push('高亮语法（==text==）可能在掘金中不支持')
    }

    // 检查代码块语言标识
    const codeBlockRegex = /```\s*$/gm
    if (codeBlockRegex.test(content)) {
      warnings.push('存在没有语言标识的代码块，建议添加语言标识')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  convertImagePath(sourcePath: string): ImagePathResult {
    if (sourcePath.startsWith('http')) {
      return { type: 'external', url: sourcePath, needsUpload: false }
    }
    return {
      type: 'local',
      url: sourcePath,
      needsUpload: true
    }
  }

  private processSpecialElements(ast: Node): Node {
    // 处理脚注、任务列表等特殊元素
    return ast
  }

  private processImages(ast: Node): string {
    // 处理图片路径
    return ''
  }
}
```

---

## 三、微信公众号转换规范

### 3.1 输出格式

- **格式**: HTML
- **样式**: 内联CSS（所有样式在`style`属性中）
- **编码**: UTF-8

### 3.2 HTML标签映射

| Markdown元素 | HTML标签 | 必需内联样式 |
|--------------|----------|--------------|
| 段落 | `<p>` | `font-size`, `color`, `line-height`, `margin` |
| 标题H1 | `<h1>` | `font-size: 22-24px`, `color`, `line-height`, `margin` |
| 标题H2 | `<h2>` | `font-size: 18-20px`, `color`, `line-height`, `margin` |
| 标题H3 | `<h3>` | `font-size: 16-18px`, `color`, `line-height`, `margin` |
| 粗体 | `<strong>` | `font-weight: bold` |
| 斜体 | `<em>` | `font-style: italic` |
| 行内代码 | `<code>` | `background`, `padding`, `border-radius`, `font-family` |
| 代码块 | `<pre><code>` | `background`, `color`, `padding`, `border-radius`, `font-family` |
| 引用 | `<blockquote>` | `border-left`, `padding-left`, `color`, `line-height` |
| 列表 | `<ul>`, `<ol>`, `<li>` | `margin`, `padding`, `line-height` |
| 表格 | `<table>`, `<tr>`, `<td>`, `<th>` | `border-collapse`, `border`, `padding`, `background` |
| 链接 | `<a>` | `color`, `text-decoration` |
| 图片 | `<img>` | `max-width`, `border-radius`, `box-shadow` |

### 3.3 CSS样式规范

#### 推荐样式值

**标题H1**：
```css
font-size: 22-24px;
color: #2c3e50;
line-height: 1.2-1.4;
text-align: center;
margin: 0.5em 0;
```

**正文段落**：
```css
font-size: 16px;
color: #333333;
line-height: 1.7-1.9;
margin: 0 0 1em 0;
```

**代码块（深色主题）**：
```css
background: #2c3e50;
color: #ecf0f1;
padding: 15px;
border-radius: 5px;
overflow-x: auto;
font-size: 14px;
line-height: 1.5;
```

**代码块（浅色主题）**：
```css
background: #f5f5f5;
color: #333333;
padding: 15px;
border-radius: 5px;
overflow-x: auto;
font-size: 14px;
line-height: 1.5;
border: 1px solid #ddd;
```

**引用块**：
```css
border-left: 4px solid #3498db;
padding-left: 15px;
margin: 1.5em 0;
color: #555555;
line-height: 1.8;
```

**表格**：
```css
/* table */
border-collapse: collapse;
width: 100%;
margin: 1em 0;

/* th */
background: #3498db;
color: white;
padding: 12px;
text-align: left;
border: 1px solid #2980b9;

/* td */
padding: 10px;
border: 1px solid #bdc3c7;
```

### 3.4 特殊元素处理

#### 代码块

**源格式**：
````markdown
```javascript
function hello() {
  console.log("Hello");
}
```
````

**转换方案**：
```html
<pre style="background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 14px; line-height: 1.5;"><code style="font-family: 'Monaco', 'Consolas', monospace;">function hello() {
  console.log(&quot;Hello&quot;);
}</code></pre>
```

**注意事项**：
- 必须转义HTML特殊字符：`<`, `>`, `&`, `"`, `'`
- 转换为`&lt;`, `&gt;`, `&amp;`, `&quot;`, `&#39;`

#### 表格

**源格式**：
```markdown
| 列1 | 列2 |
|-----|-----|
| A   | B   |
```

**转换方案**：
```html
<table style="width: 100%; border-collapse: collapse; margin: 1em 0;">
  <thead>
    <tr style="background: #3498db; color: white;">
      <th style="padding: 12px; text-align: left; border: 1px solid #2980b9;">列1</th>
      <th style="padding: 12px; text-align: left; border: 1px solid #2980b9;">列2</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background: #ecf0f1;">
      <td style="padding: 10px; border: 1px solid #bdc3c7;">A</td>
      <td style="padding: 10px; border: 1px solid #bdc3c7;">B</td>
    </tr>
  </tbody>
</table>
```

#### 图片

**源格式**：
```markdown
![图片描述](content/assets/images/image.png)
```

**转换方案**：
```html
<p style="text-align: center; margin: 1.5em 0;">
  <img src="PLACEHOLDER:image.png"
       alt="图片描述"
       style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
</p>
<!-- 需要用户上传图片到微信素材库并替换src -->
```

**图片处理流程**：
1. 标记本地图片为`PLACEHOLDER:image.png`
2. 提示用户上传到微信素材库
3. 用户替换为实际URL

### 3.5 转换实现示例

```typescript
// packages/converters/src/wechat.ts
import { visit } from 'unist-util-visit'
import { Node, Parent } from 'unist'

export class WeChatConverter implements PlatformConverter {
  readonly platform = 'wechat'
  readonly platformName = '微信公众号'
  readonly outputFormat = 'html' as const

  async convert(markdown: string, frontmatter: Frontmatter): Promise<ConvertedContent> {
    // 1. 解析Markdown为AST
    const ast = this.parseMarkdown(markdown)

    // 2. 转换为HTML并添加内联样式
    let html = this.astToHtmlWithStyles(ast)

    // 3. 处理图片
    html = this.processImages(html)

    return {
      format: 'html',
      content: html,
      inlineStyles: true
    }
  }

  private astToHtmlWithStyles(ast: Node): string {
    let html = ''

    visit(ast, (node: Node, index, parent) => {
      if (node.type === 'element') {
        const element = node as any
        html += this.convertElement(element)
      }
    })

    return html
  }

  private convertElement(element: any): string {
    const tag = element.tagName
    const style = this.getStyleForTag(tag, element)

    let children = ''
    if (element.children) {
      children = element.children.map((child: any) => this.convertElement(child)).join('')
    }

    return `<${tag}${style ? ` style="${style}"` : ''}>${children}</${tag}>`
  }

  private getStyleForTag(tag: string, element: any): string {
    const styles: string[] = []

    switch (tag) {
      case 'p':
        styles.push('font-size: 16px')
        styles.push('color: #333')
        styles.push('line-height: 1.8')
        styles.push('margin: 0 0 1em 0')
        break

      case 'h1':
        styles.push('font-size: 22px')
        styles.push('color: #2c3e50')
        styles.push('line-height: 1.3')
        styles.push('margin: 0.5em 0')
        break

      case 'h2':
        styles.push('font-size: 18px')
        styles.push('color: #2c3e50')
        styles.push('line-height: 1.4')
        styles.push('margin: 0.8em 0')
        break

      case 'pre':
        styles.push('background: #2c3e50')
        styles.push('color: #ecf0f1')
        styles.push('padding: 15px')
        styles.push('border-radius: 5px')
        styles.push('overflow-x: auto')
        styles.push('font-size: 14px')
        styles.push('line-height: 1.5')
        break

      // ... 其他标签
    }

    return styles.join('; ')
  }

  private processImages(html: string): string {
    // 将图片URL替换为占位符
    return html.replace(
      /<img src="([^"]+)"/g,
      (match, src) => {
        if (src.startsWith('http')) {
          return match // 外链保留
        }
        return `<img src="PLACEHOLDER:${src}"` // 本地图片标记
      }
    )
  }

  validate(content: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查是否包含不支持的标签
    if (content.includes('<script>')) {
      errors.push('包含<script>标签，会被微信过滤')
    }

    if (content.includes('<style>')) {
      errors.push('包含<style>标签，会被微信过滤')
    }

    // 检查是否使用position
    if (content.includes('position: absolute') || content.includes('position: fixed')) {
      errors.push('使用了position: absolute/fixed，会被微信过滤')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  convertImagePath(sourcePath: string): ImagePathResult {
    if (sourcePath.startsWith('http')) {
      return { type: 'external', url: sourcePath, needsUpload: false }
    }
    return {
      type: 'placeholder',
      url: `PLACEHOLDER:${sourcePath}`,
      needsUpload: true
    }
  }
}
```

---

## 四、CSDN转换规范

### 4.1 输出格式

- **格式**: Markdown（待确认）
- **特殊要求**：待调研

### 4.2 转换规则

**待补充** - 需要进一步调研CSDN编辑器支持

---

## 五、知乎转换规范

### 5.1 输出格式

- **格式**: Markdown（待确认）
- **特殊要求**：待调研

### 5.2 转换规则

**待补充** - 需要进一步调研知乎编辑器支持

---

## 六、通用转换规则

### 6.1 Frontmatter处理

所有平台都忽略以下字段：

| 字段 | 处理方式 |
|------|----------|
| `date` | 忽略 |
| `tags` | 忽略（需在平台手动添加标签） |
| `categories` | 忽略 |
| `draft` | 忽略 |

所有平台都保留：

| 字段 | 处理方式 |
|------|----------|
| `title` | 作为文章标题（可能需要在平台单独填写） |

### 6.2 图片路径统一处理

```typescript
function convertImagePath(sourcePath: string, platform: string): ImagePathResult {
  // 1. 判断是否为外链
  if (sourcePath.startsWith('http://') || sourcePath.startsWith('https://')) {
    return {
      type: 'external',
      url: sourcePath,
      needsUpload: false
    }
  }

  // 2. 本地图片处理
  switch (platform) {
    case 'hexo':
      // Hexo博客：复制到blog/source/images/
      return {
        type: 'local',
        url: `/images/${basename(sourcePath)}`,
        needsUpload: false
      }

    case 'juejin':
      // 掘金：需要手动上传
      return {
        type: 'local',
        url: sourcePath,
        needsUpload: true,
        placeholder: `<!-- 需上传到掘金: ${sourcePath} -->`
      }

    case 'wechat':
      // 微信：需要上传到素材库
      return {
        type: 'placeholder',
        url: `PLACEHOLDER:${sourcePath}`,
        needsUpload: true
      }

    default:
      return {
        type: 'local',
        url: sourcePath,
        needsUpload: true
      }
  }
}
```

### 6.3 代码高亮处理

所有平台的代码块都应该指定语言：

```typescript
function ensureLanguageHint(codeBlock: string, lang?: string): string {
  const language = lang || 'text'
  return `\`\`\`${language}\n${codeBlock}\n\`\`\``
}
```

### 6.4 HTML特殊字符转义

对于HTML输出（如微信公众号），必须转义：

```typescript
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  return text.replace(/[&<>"']/g, char => map[char])
}
```

---

## 七、转换器实现指南

### 7.1 项目结构

```
packages/converters/
├── src/
│   ├── types/
│   │   ├── converter.ts      # 接口定义
│   │   └── result.ts          # 结果类型
│   ├── base/
│   │   └── base-converter.ts  # 基础转换器类
│   ├── platforms/
│   │   ├── juejin.ts         # 掘金转换器
│   │   ├── wechat.ts         # 微信转换器
│   │   ├── csdn.ts           # CSDN转换器
│   │   └── zhihu.ts          # 知乎转换器
│   ├── utils/
│   │   ├── markdown.ts       # Markdown解析工具
│   │   ├── html.ts           # HTML处理工具
│   │   └── image.ts          # 图片处理工具
│   └── index.ts
├── package.json
└── tsconfig.json
```

### 7.2 核心依赖

```json
{
  "dependencies": {
    "gray-matter": "^4.0.3",
    "remark": "^15.0.0",
    "remark-parse": "^11.0.0",
    "remark-stringify": "^11.0.0",
    "remark-html": "^16.0.0",
    "unist-util-visit": "^5.0.0",
    "hast-util-to-html": "^9.0.0"
  }
}
```

### 7.3 测试策略

```typescript
// packages/converters/src/__tests__/juejin.test.ts
import { JuejinConverter } from '../platforms/juejin'

describe('JuejinConverter', () => {
  let converter: JuejinConverter

  beforeEach(() => {
    converter = new JuejinConverter()
  })

  test('应该正确转换标题', async () => {
    const markdown = '# 测试标题'
    const result = await converter.convert(markdown, {})

    expect(result.content).toContain('# 测试标题')
  })

  test('应该警告不支持的语法', async () => {
    const markdown = '==高亮文本=='
    const result = await converter.validate(markdown)

    expect(result.warnings).toContain('高亮语法可能在掘金中不支持')
  })
})
```

---

## 八、Phase 2 里程碑调整

### 8.1 M2.1 - 内容转换器

**原计划**：基于API实现转换器

**调整后**：基于semi-auto流程实现转换器

- ✅ 实现`PlatformConverter`接口
- ✅ 实现`JuejinConverter`（Markdown → Markdown）
- ✅ 实现`WeChatConverter`（Markdown → HTML + 内联样式）
- ✅ 实现`CsdnConverter`（待调研后实现）
- ✅ 实现`ZhihuConverter`（待调研后实现）

### 8.2 M2.2 - 掘金平台适配

**原计划**：实现掘金API发布

**调整后**：实现预览服务器

- ✅ 提供Markdown预览界面
- ✅ 提供"一键复制"功能
- ✅ 标记需要上传的本地图片

### 8.3 M2.3 - 半自动预览流程

**原计划**：如果某平台需要semi-auto

**调整后**：所有平台统一semi-auto

- ✅ 实现本地HTTP服务器（Hono）
- ✅ 提供各平台的预览界面
- ✅ 实现"复制到剪贴板"功能
- ✅ 显示图片上传提示

### 8.4 M2.4 - WebUI基础版

**保持原计划**，但功能调整为：

- ✅ 文章列表展示
- ✅ 选择平台
- ✅ 生成预览
- ✅ 复制到剪贴板
- ✅ 显示转换警告和提示

---

## 九、验收标准

### 9.1 转换器验收

- [ ] 所有转换器实现`PlatformConverter`接口
- [ ] 掘金转换器输出标准Markdown
- [ ] 微信转换器输出带内联样式的HTML
- [ ] 所有转换器通过单元测试
- [ ] 图片路径正确处理（外链/本地/占位符）
- [ ] 验证功能正常（warnings和errors）

### 9.2 文档验收

- [ ] 每个平台都有详细的转换规则
- [ ] 提供了接口定义和类型
- [ ] 提供了实现示例代码
- [ ] 提供了测试策略

---

**文档版本**: v1.0
**最后更新**: 2026-04-01
**维护者**: Content Hub项目
