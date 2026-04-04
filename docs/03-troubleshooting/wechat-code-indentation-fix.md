# 微信公众号代码块缩进丢失问题修复文档

## 📋 问题描述

### 症状
- 在 post_waver 系统中复制包含代码块的内容到微信公众号编辑器时
- **预览显示正常**，但粘贴到微信后：
  - ❌ 代码缩进丢失或对齐错乱
  - ❌ `void` 关键字和函数名粘连：`voida_method()` 而非 `void a_method()`
  - ❌ 空格被随机折叠或丢失

### 影响范围
- 所有包含代码块的微信公众号内容复制
- 特别影响 C++、JavaScript 等需要精确缩进的语言

## 🔍 问题分析过程

### 1. 初步排查：HTML 生成是否正确？

**检查**：查看预览页面和生成的 HTML

**结论**：
- ✅ 预览显示正常 → HTML 生成正确
- ✅ CSS 样式完整 → 主题渲染正确
- ❌ 复制后格式丢失 → **问题在复制过程**

### 2. 根本原因定位

#### 问题 1：Selection API 的 DOM 序列化

**错误理解**：使用 Selection API 复制渲染后的 DOM，能保留样式，但浏览器在复制时会重新序列化 DOM。

**实际问题**：
```
HTML: <span>void</span> <span>a_method()</span>
      ↓ 浏览器解析为 DOM
DOM:  [TextNode: "void"] [TextNode: " "] [TextNode: "a_method()"]
      ↓ Selection API 复制（浏览器重新序列化）
Clipboard: "voida_method()"  ← 空格被规范化规则折叠
```

#### 问题 2：HTML 层面的 `&nbsp;` 转换无效

**尝试方案**：在 HTML 生成时将空格转换为 `&nbsp;`

**失败原因**：
```html
<!-- HTML 源码 -->
<span>&nbsp;&nbsp;&nbsp;void</span>

<!-- 浏览器解析为 DOM 后 -->
<!-- &nbsp; 被解析为普通空格字符 U+0020 -->
DOM: [TextNode: "   void"]

<!-- Selection API 复制时，再次被规范化 -->
Result: "void"  ← 前导空格丢失
```

**结论**：在 HTML 字符串层面使用 `&nbsp;` 无效，因为浏览器解析 HTML 时会将其转换为普通空格。

### 3. 搜索验证

参考资源：
- [GitHub Issue - neurapress#21](https://github.com/tianyaxiang/neurapress/issues/21) - 完全相同的问题
- [腾讯云：公众号图文编辑器开发必备技能](https://cloud.tencent.com/developer/article/2436347)

**发现**：这是一个行业共性问题，很多 Markdown 转微信公众号的工具都遇到。

## ✅ 最终解决方案

### 核心思路

**在 DOM 层面修复空白字符**，而不是在 HTML 字符串层面：

```
HTML → DOM 渲染 → 修改 DOM 文本节点 → Selection API 复制
                    ↑
                 关键步骤！
```

### 技术实现

#### 1. 不使用 `clipboardData.setData` 直接设置 HTML

**失败尝试**：
```typescript
// ❌ 会导致样式丢失
clipboardData.setData('text/html', htmlString)
```

**原因**：微信公众号编辑器需要渲染后的 DOM 结构，直接设置 HTML 字符串会导致样式和主题丢失。

#### 2. 保留 Selection API，但在复制前处理 DOM

**成功方案**：
```typescript
/**
 * 修复代码块中的空白字符：将代码块中的空格替换为不间断空格
 * 这样在复制到微信公众号时不会丢失缩进
 */
function preserveWhitespaceInCodeBlocks(container: HTMLElement): void {
  // 查找所有代码块
  const codeElements = container.querySelectorAll('pre code, code')

  codeElements.forEach(codeElement => {
    // 遍历所有文本节点
    const walker = document.createTreeWalker(
      codeElement,
      NodeFilter.SHOW_TEXT,
      null
    )

    const textNodes: Text[] = []
    let node: Node | null
    while (node = walker.nextNode()) {
      textNodes.push(node as Text)
    }

    // 将每个文本节点中的空格替换为不间断空格
    textNodes.forEach(textNode => {
      const text = textNode.nodeValue
      if (text) {
        // 关键：使用不间断空格字符 U+00A0
        textNode.nodeValue = text.replace(/ /g, '\u00A0')
      }
    })
  })
}

async function copyRichTextToClipboard(html: string): Promise<void> {
  // 1. 创建临时容器渲染 HTML
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.innerHTML = html
  document.body.appendChild(container)

  try {
    // 2. 修复代码块中的空白字符（关键步骤）
    preserveWhitespaceInCodeBlocks(container)

    // 3. 使用 Selection API 复制
    const range = document.createRange()
    range.selectNodeContents(container)

    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)

    document.execCommand('copy')

    selection.removeAllRanges()
  } finally {
    document.body.removeChild(container)
  }
}
```

### 为什么这个方案有效？

1. **不间断空格 U+00A0 的特性**：
   - 不会被 CSS `white-space` 规则折叠
   - 不会被浏览器的空白规范化处理
   - 在复制粘贴过程中保持不变

2. **直接修改 DOM 文本节点**：
   - 绕过浏览器的 HTML 解析器
   - 避免字符实体 `&nbsp;` 被转换为普通空格
   - Selection API 复制时使用修改后的 DOM

3. **保留 Selection API**：
   - 确保样式和主题完整保留
   - 兼容微信公众号编辑器的富文本粘贴机制

## 📝 修改的文件

### 1. [packages/transformer/src/to-wechat.ts](../../packages/transformer/src/to-wechat.ts)

**修改内容**：添加 `white-space: pre-wrap` 样式

```typescript
/* 代码块样式 - 白色背景 */
.markdown-body pre {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #ffffff !important;
  border-radius: 6px;
  margin-bottom: 16px;
  border: 1px solid #e1e4e8;
  white-space: pre-wrap; /* 新增：保留空白字符 */
  word-break: break-word; /* 新增：防止长行溢出 */
}

.markdown-body pre code {
  padding: 0;
  margin: 0;
  font-size: 100%;
  background: transparent !important;
  white-space: pre-wrap; /* 新增：保留代码缩进和换行 */
  font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
}

.markdown-body code {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: #ffffff !important;
  border-radius: 6px;
  font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
  white-space: pre-wrap; /* 新增：保留行内代码的空白字符 */
}
```

### 2. [packages/transformer/src/to-html.ts](../../packages/transformer/src/to-html.ts)

**修改内容**：将代码块中的空格转换为 `&nbsp;`（作为辅助方案）

虽然 HTML 层面的 `&nbsp;` 在 Selection API 复制时会被转换，但这个步骤对预览显示有帮助，作为额外的保险措施。

### 3. [packages/web-ui/src/components/CopyButton.tsx](../../packages/web-ui/src/components/CopyButton.tsx)

**修改内容**：添加 `preserveWhitespaceInCodeBlocks` 函数

**关键代码**：
```typescript
function preserveWhitespaceInCodeBlocks(container: HTMLElement): void {
  const codeElements = container.querySelectorAll('pre code, code')

  codeElements.forEach(codeElement => {
    const walker = document.createTreeWalker(
      codeElement,
      NodeFilter.SHOW_TEXT,
      null
    )

    const textNodes: Text[] = []
    let node: Node | null
    while (node = walker.nextNode()) {
      textNodes.push(node as Text)
    }

    textNodes.forEach(textNode => {
      const text = textNode.nodeValue
      if (text) {
        textNode.nodeValue = text.replace(/ /g, '\u00A0')
      }
    })
  })
}
```

### 4. [packages/converter-web/src/components/CopyButton.tsx](../../packages/converter-web/src/components/CopyButton.tsx)

**修改内容**：同上，添加相同的 DOM 处理逻辑

## 🎯 验证方法

### 测试步骤

1. **准备测试内容**
   ```markdown
   ```cpp
   template<typename Derived>
   class Base {
   public:
       void initialize() {
           static_cast<Derived*>(this)->init();
       }
   };
   ```
   ```

2. **在 post_waver 中操作**
   - 打开包含上述代码的文章
   - 切换到微信公众号预览
   - 点击"复制内容"按钮

3. **粘贴到微信公众号**
   - 打开微信公众号后台编辑器
   - 粘贴复制的内容
   - 检查代码格式

### 预期结果

✅ **格式正确**：
```cpp
template<typename Derived>
class Base {
public:
    void initialize() {
        static_cast<Derived*>(this)->init();
    }
};
```

❌ **修复前（错误）**：
```cpp
template<typename Derived>
class Base{
public:
void initialize(){
static_cast<Derived*>(this)->init();
}
};
```

## 📚 技术要点总结

### 1. 字符编码知识

| 字符 | Unicode | HTML 实体 | 行为 |
|------|---------|-----------|------|
| 空格 | U+0020 | ` ` | 会被折叠 |
| 不间断空格 | U+00A0 | `&nbsp;` | 不会被折叠 |
| 零宽空格 | U+200B | `&#8203;` | 不可见，不占位 |

**关键发现**：
- HTML 实体 `&nbsp;` 在浏览器解析后变成 U+00A0
- 但在 Selection API 复制时，U+00A0 可能被重新规范化
- **直接在 DOM 文本节点使用 U+00A0 最可靠**

### 2. Selection API 的工作原理

```
DOM Tree → Range Selection → Clipboard Data
                              ↓
                         序列化过程
                         (可能丢失格式)
```

**关键点**：
- Selection API 会重新序列化 DOM
- 浏览器的空白规范化规则会在此过程应用
- 必须在序列化**之前**修改 DOM

### 3. TreeWalker API 的使用

```typescript
const walker = document.createTreeWalker(
  root,           // 遍历的根节点
  NodeFilter.SHOW_TEXT,  // 只遍历文本节点
  null            // 过滤器
)
```

**优势**：
- 精确控制要修改的节点
- 不影响 HTML 标签结构
- 性能高效

## 🔧 调试技巧

### 1. 检查复制的 HTML 内容

```javascript
// 在粘贴后，在控制台执行
document.execCommand('paste')
const clipboardText = await navigator.clipboard.readText()
console.log(clipboardText)
```

### 2. 查看文本节点的 Unicode 编码

```javascript
// 检查是否包含不间断空格
textNode.nodeValue.split('').map(char =>
  char + ' = U+' + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')
)
```

### 3. 对比预览和复制结果

```javascript
// 在预览容器中
console.log('Preview:', container.innerHTML)

// 在复制前（处理后）
console.log('Before copy:', container.innerHTML)
```

## 🚀 未来优化方向

### 1. 性能优化
- 对于大文档，可以只处理可见区域的代码块
- 使用 Web Worker 在后台处理

### 2. 可配置性
- 添加选项让用户选择是否启用空格保护
- 支持不同平台的特定处理规则

### 3. 兼容性增强
- 检测浏览器是否支持现代 Clipboard API
- 提供降级方案

## 📖 参考资料

1. [MDN - TreeWalker API](https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker)
2. [MDN - Selection API](https://developer.mozilla.org/en-US/docs/Web/API/Selection)
3. [MDN - Unicode 空白字符](https://developer.mozilla.org/en-US/docs/Web/CSS/white-space)
4. [GitHub Issue - neurapress#21](https://github.com/tianyaxiang/neurapress/issues/21)
5. [腾讯云 - 公众号图文编辑器开发](https://cloud.tencent.com/developer/article/2436347)

## 👨‍💻 维护者笔记

### 问题排查时间线
1. **发现问题** (2026-04-04 14:00)
2. **初步分析** (2026-04-04 14:30) - 检查 HTML 生成
3. **搜索验证** (2026-04-04 15:00) - 查找行业案例
4. **方案尝试** (2026-04-04 15:30) - HTML 层面转换（失败）
5. **深入研究** (2026-04-04 16:00) - Selection API 机制
6. **最终解决** (2026-04-04 16:30) - DOM 层面修复

### 经验教训

1. **不要轻信表面方案**：`&nbsp;` 转换看起来合理，但在浏览器解析后会失效
2. **理解底层机制**：必须理解 Selection API 的序列化过程
3. **实际测试验证**：每一步都要在真实环境中测试
4. **保留原有优势**：Selection API 能保留样式，不应轻易放弃

---

**文档创建时间**：2026-04-04
**问题状态**：✅ 已解决
**影响版本**：所有使用 CopyButton 复制微信内容的版本
**修复版本**：v1.0.1+
