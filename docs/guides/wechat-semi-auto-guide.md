# 微信公众号Semi-auto发布指南

> **版本**: v1.0
> **更新日期**: 2026-04-01
> **平台**: 微信公众号 (WeChat Official Account)

---

## 一、平台概述

微信公众号文章编辑器对HTML标签和CSS样式有**严格的白名单限制**。所有样式必须通过**内联CSS**（直接写在元素的`style`属性中）实现，不支持外部CSS或`<style>`标签。

---

## 二、HTML标签白名单

### 2.1 完全支持的标签

#### 文本结构标签

| 标签 | 用途 | 示例 |
|------|------|------|
| `<p>` | 段落 | `<p style="...">段落内容</p>` |
| `<h1>` ~ `<h6>` | 标题 | `<h1 style="...">一级标题</h1>` |
| `<span>` | 行内容器 | `<span style="...">文字</span>` |
| `<div>` | 块级容器 | `<div style="...">内容</div>` |
| `<br>` | 换行 | `<br>` |

#### 文本修饰标签

| 标签 | 用途 | 示例 |
|------|------|------|
| `<strong>` 或 `<b>` | 粗体 | `<strong>粗体</strong>` |
| `<em>` 或 `<i>` | 斜体 | `<em>斜体</em>` |
| `<u>` | 下划线 | `<u>下划线</u>` |
| `<code>` | 行内代码 | `<code>代码</code>` |
| `<pre>` | 预格式化文本 | `<pre>代码块</pre>` |

#### 列表标签

| 标签 | 用途 | 示例 |
|------|------|------|
| `<ul>` | 无序列表 | `<ul><li>项目</li></ul>` |
| `<ol>` | 有序列表 | `<ol><li>项目</li></ol>` |
| `<li>` | 列表项 | `<li>列表项</li>` |

#### 链接和媒体

| 标签 | 用途 | 示例 |
|------|------|------|
| `<a>` | 超链接 | `<a href="...">链接文字</a>` |
| `<img>` | 图片 | `<img src="..." alt="...">` |

#### 其他标签

| 标签 | 用途 | 说明 |
|------|------|------|
| `<blockquote>` | 引用块 | 常用于引用或提示框 |
| `<table>` | 表格 | 完整支持（包括`<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`） |
| `<hr>` | 分割线 | 水平线 |
| `<section>` | 内容分区 | 语义化标签 |

---

### 2.2 微信特定标签

| 标签 | 用途 |
|------|------|
| `<mpvoice>` | 语音 |
| `<mpvideo>` | 视频 |

---

### 2.3 不支持的标签

以下标签会被**过滤或禁用**：

- ❌ `<script>` - 脚本标签（安全原因）
- ❌ `<iframe>` - 内联框架（安全原因）
- ❌ `<style>` - 样式标签（会被过滤）
- ❌ `<object>` - 嵌入对象
- ❌ `<embed>` - 嵌入内容
- ❌ `<form>` - 表单
- ❌ `<input>` - 输入框
- ❌ `<button>` - 按钮
- ❌ `<audio>` - 音频（使用`<mpvoice>`）
- ❌ `<video>` - 视频（使用`<mpvideo>`）

---

## 三、CSS样式规范

### 3.1 核心原则

**所有样式必须内联到元素的`style`属性中**

✅ **正确**：
```html
<p style="font-size: 16px; color: #333;">段落内容</p>
```

❌ **错误**（会被过滤）：
```html
<style>
  p { font-size: 16px; color: #333; }
</style>
<p>段落内容</p>
```

---

### 3.2 支持的CSS属性

#### 文本样式

| 属性 | 说明 | 示例值 |
|------|------|--------|
| `font-size` | 字号 | `16px`, `1.2em` |
| `color` | 文字颜色 | `#333333`, `rgb(51,51,51)` |
| `font-weight` | 字重 | `bold`, `normal`, `400`, `700` |
| `font-style` | 字体样式 | `italic`, `normal` |
| `line-height` | 行高 | `1.75`, `1.8em`, `180%` |
| `letter-spacing` | 字间距 | `0.5px`, `0.1em` |
| `text-decoration` | 文本装饰 | `underline`, `none` |
| `text-align` | 对齐方式 | `left`, `center`, `right` |

#### 间距和布局

| 属性 | 说明 | 示例值 |
|------|------|--------|
| `margin` | 外边距 | `10px`, `1em 0` |
| `padding` | 内边距 | `15px`, `10px 20px` |
| `display` | 显示方式 | `block`, `inline-block` |
| `vertical-align` | 垂直对齐 | `middle`, `top`, `bottom` |

#### 颜色和背景

| 属性 | 说明 | 示例值 |
|------|------|--------|
| `background-color` | 背景色 | `#f5f5f5`, `rgb(245,245,245)` |
| `background` | 背景（简写） | `linear-gradient(...)`, `#fff` |
| `color` | 前景色 | `#333333` |

#### 边框和效果

| 属性 | 说明 | 示例值 |
|------|------|--------|
| `border` | 边框（简写） | `1px solid #ddd` |
| `border-radius` | 圆角 | `8px`, `50%` |
| `box-shadow` | 阴影 | `0 4px 6px rgba(0,0,0,0.1)` |
| `text-shadow` | 文字阴影 | `2px 2px 4px rgba(0,0,0,0.3)` |
| `opacity` | 透明度 | `0.8`, `0.5` |

#### 其他属性

| 属性 | 说明 | 示例值 |
|------|------|--------|
| `max-width` | 最大宽度 | `100%`, `677px` |
| `width` | 宽度 | `100%`, `300px` |
| `height` | 高度 | `auto`, `200px` |

---

### 3.3 不支持的CSS属性

以下属性会被**过滤或无效**：

- ❌ `position: absolute` - 绝对定位
- ❌ `position: fixed` - 固定定位
- ❌ `position: relative` - 相对定位（会被过滤）
- ❌ `z-index` - 层级（无定位时无效）
- ❌ `float` - 浮动（慎用，可能导致布局问题）
- ❌ CSS动画（`@keyframes`）
- ❌ 媒体查询（`@media`）
- ❌ CSS变量（`var(--name)`）
- ❌ `transform` - 变换（部分简单变换可能生效，但兼容性不佳）

**注意**：
- `id`属性会被**删除**
- `class`属性会被保留，但由于无法使用CSS选择器，基本无实际作用

---

## 四、图片处理

### 4.1 图片来源

#### 外链图片

⚠️ **支持有限**

- 普通外链可能被过滤或显示异常
- **强烈推荐**：使用微信素材库的图片链接

#### 微信素材库（推荐）

✅ **最佳实践**

1. 登录微信公众平台
2. 上传图片到素材库
3. 获取图片链接
4. 在HTML中使用该链接

### 4.2 图片样式

#### 基本图片

```html
<img src="微信素材库图片URL" alt="图片描述" style="max-width: 100%; display: block;">
```

#### 圆角图片

```html
<img src="..." alt="..." style="max-width: 100%; border-radius: 8px;">
```

#### 带阴影图片

```html
<img src="..." alt="..." style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.15);">
```

#### 居中图片

```html
<p style="text-align: center; margin: 1.5em 0;">
  <img src="..." alt="..." style="max-width: 100%; border-radius: 8px;">
</p>
```

### 4.3 图片限制

| 限制项 | 说明 |
|--------|------|
| 文件大小 | 最大5MB（需确认） |
| 支持格式 | JPG, PNG, GIF |
| 显示宽度 | 自动限制为屏幕宽度 |
| SVG | 必须使用素材库链接 |

---

## 五、代码块处理

### 5.1 推荐的HTML结构

```html
<pre style="background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 14px; line-height: 1.5;"><code style="font-family: 'Monaco', 'Consolas', 'Monaco', monospace;">function hello() {
  console.log("Hello World");
}</code></pre>
```

### 5.2 不同代码主题

#### 深色主题

```html
<pre style="background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 5px; overflow-x: auto;"><code style="font-family: monospace;">代码内容</code></pre>
```

#### 浅色主题

```html
<pre style="background: #f5f5f5; color: #333; padding: 15px; border-radius: 5px; overflow-x: auto; border: 1px solid #ddd;"><code style="font-family: monospace;">代码内容</code></pre>
```

#### 蓝色主题

```html
<pre style="background: #3498db; color: white; padding: 15px; border-radius: 5px; overflow-x: auto;"><code style="font-family: monospace;">代码内容</code></pre>
```

### 5.3 语法高亮

微信公众号**不直接支持**代码语法高亮。需要手动为不同语法元素添加颜色：

```html
<code>
  <span style="color: #c0392b;">function</span>
  <span style="color: #2980b9;">hello</span>
  <span style="color: #7f8c8d;">()</span> {
  <span style="color: #27ae60;">return</span> <span style="color: #e74c3c;">"Hello"</span>;
  }
</code>
```

**建议**：使用第三方工具（如highlight.js）生成带颜色的HTML，然后复制到微信。

---

## 六、链接处理

### 6.1 基本链接

```html
<a href="https://example.com" style="color: #3498db; text-decoration: underline;">链接文字</a>
```

### 6.2 外部链接

⚠️ **注意**：外部链接会触发微信的安全提示页面

```html
<a href="https://external-site.com" style="color: #3498db;">外部链接</a>
```

### 6.3 公众号文章链接

✅ **推荐**：链接到其他公众号文章不会有安全提示

```html
<a href="https://mp.weixin.qq.com/s/..." style="color: #3498db;">相关文章</a>
```

### 6.4 阅读原文链接

使用公众号的"阅读原文"功能：

```html
<a href="YOUR_URL" style="color: #3498db; text-decoration: underline;">阅读原文</a>
```

---

## 七、主题模板

### 7.1 简约主题

```html
<!-- 标题 -->
<h1 style="font-size: 22px; color: #2c3e50; line-height: 1.3; text-align: center; margin: 0.5em 0;">
  文章标题
</h1>

<!-- 副标题 -->
<p style="font-size: 14px; color: #7f8c8d; text-align: center; margin: 0 0 2em 0;">
  副标题或日期
</p>

<!-- 正文段落 -->
<p style="font-size: 16px; color: #333; line-height: 1.8; margin: 0 0 1em 0;">
  这是正文内容。使用适中的行高（1.8）和字号（16px）提升可读性。
</p>

<!-- 引用块 -->
<blockquote style="border-left: 4px solid #3498db; padding-left: 15px; margin: 1.5em 0; color: #555; line-height: 1.8;">
  这是引用内容
</blockquote>

<!-- 小标题 -->
<h2 style="font-size: 18px; color: #2c3e50; margin: 2em 0 0.8em;">
  小标题
</h2>
```

---

### 7.2 现代主题（带渐变）

```html
<!-- 标题区域 -->
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px; margin-bottom: 2em;">
  <h1 style="font-size: 24px; color: white; margin: 0; line-height: 1.3;">
    文章标题
  </h1>
  <p style="font-size: 14px; color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">
    副标题
  </p>
</div>

<!-- 正文 -->
<p style="font-size: 16px; color: #333; line-height: 1.8; margin: 0 0 1em 0;">
  正文内容...
</p>

<!-- 提示框 -->
<div style="background: #f8f9fa; border-left: 4px solid #e74c3c; padding: 15px; margin: 1.5em 0; border-radius: 4px;">
  <strong style="color: #c0392b;">注意：</strong>
  <span style="color: #555;">这是提示内容</span>
</div>
```

---

### 7.3 技术主题（深色代码块）

```html
<!-- 标题 -->
<h1 style="font-size: 22px; color: #2c3e50; font-weight: bold; margin-bottom: 0.5em;">
  文章标题
</h1>

<!-- 元信息 -->
<p style="font-size: 13px; color: #95a5a6; margin: 0 0 1.5em 0;">
  发布于 2026-04-01
</p>

<!-- 正文 -->
<p style="font-size: 16px; color: #333; line-height: 1.75; margin: 0 0 1em 0;">
  这是正文内容...
</p>

<!-- 代码块 -->
<pre style="background: #282c34; color: #abb2bf; padding: 15px; border-radius: 6px; overflow-x: auto; font-size: 14px; line-height: 1.5; margin: 1.5em 0;"><code style="font-family: 'Monaco', 'Consolas', monospace;">function greet(name) {
  return `Hello, ${name}!`;
}</code></pre>

<!-- 链接 -->
<p style="margin: 1.5em 0;">
  <a href="https://example.com" style="color: #3498db; text-decoration: none; border-bottom: 2px solid #3498db;">
    相关链接 →
  </a>
</p>
```

---

## 八、最佳实践

### 8.1 移动端优化

#### 推荐字号

| 元素 | 字号 |
|------|------|
| 标题H1 | 20-24px |
| 标题H2 | 18-20px |
| 标题H3 | 16-18px |
| 正文 | 15-16px |
| 注释/辅助文字 | 13-14px |

#### 推荐行高

| 内容 | 行高 |
|------|------|
| 标题 | 1.2-1.4 |
| 正文 | 1.7-1.9 |
| 代码 | 1.5-1.6 |

#### 推荐颜色

| 元素 | 颜色 |
|------|------|
| 标题 | `#2c3e50` |
| 正文 | `#333333` |
| 辅助文字 | `#7f8c8d` |
| 链接 | `#3498db` |
| 强调色 | `#e74c3c` |

### 8.2 图片处理建议

1. **使用微信素材库**：避免外链图片被过滤
2. **控制文件大小**：单张图片不超过500KB
3. **响应式宽度**：使用`max-width: 100%`
4. **圆角和阴影**：适当使用增强视觉效果

### 8.3 内容结构建议

```
标题区域（标题 + 副标题 + 元信息）
    ↓
正文区域（段落 + 列表 + 引用）
    ↓
代码块（如需要）
    ↓
图片（居中显示）
    ↓
结语/总结
    ↓
签名/版权信息
```

---

## 九、常见问题

### Q1: 为什么粘贴后样式丢失？

**A**: 检查以下几点：
1. 样式是否都写在`style`属性中（而非`<style>`标签）
2. 是否使用了不支持的CSS属性（如`position: absolute`）
3. 是否在微信编辑器的"源码编辑"模式下粘贴

### Q2: 代码块没有语法高亮怎么办？

**A**:
1. 使用第三方工具（如highlight.js）生成带颜色的HTML
2. 手动为关键字、字符串等添加颜色
3. 接受纯文本代码块，使用深色背景增强可读性

### Q3: 图片不显示或被过滤？

**A**:
1. 确保图片链接来自微信素材库
2. 检查图片格式（推荐JPG/PNG）
3. 确保图片文件大小不超过限制
4. SVG必须使用素材库链接

### Q4: 表格样式不正常？

**A**:
1. 使用`border-collapse: collapse`
2. 为每个单元格单独设置边框样式
3. 避免使用复杂的表格布局
4. 测试手机端显示效果

### Q5: 渐变背景不生效？

**A**:
1. 确保使用内联样式（`style="background: linear-gradient(...)"`）
2. 部分旧版微信客户端可能不支持
3. 考虑使用纯色背景作为备选方案

---

## 十、Content Hub转换策略

### 10.1 Markdown → HTML 转换流程

```typescript
// WeChatConverter 转换流程
1. 解析Markdown源文件
2. 转换为HTML结构
3. 为每个元素添加内联样式：
   - 标题：font-size, color, line-height, margin
   - 段落：font-size, color, line-height, margin
   - 代码块：background, padding, border-radius
   - 链接：color, text-decoration
   - 表格：border-collapse, padding, border
4. 处理图片：
   - 标记需要上传的本地图片
   - 提示用户上传到微信素材库
   - 生成带图片URL的HTML
5. 转义HTML特殊字符（在代码块中）
6. 输出：完整的内联样式HTML
```

### 10.2 需要特殊处理的元素

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
<pre style="background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 14px; line-height: 1.5;">
  <code style="font-family: 'Monaco', 'Consolas', monospace;">function hello() {
  console.log("Hello");
}</code>
</pre>
```

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
  <img src="待上传:content/assets/images/image.png"
       alt="图片描述"
       style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
</p>
<!-- 需要用户手动上传图片并替换src -->
```

### 10.3 注意事项

1. **所有样式必须内联**：不使用`<style>`标签
2. **避免使用id属性**：会被微信删除
3. **class属性保留但无实际作用**：可用于编辑器识别
4. **图片必须使用素材库链接**：或提示用户上传
5. **代码块需转义HTML特殊字符**：`<`, `>`, `&`等
6. **测试多端显示**：iOS和Android可能有差异

---

## 十一、参考资源

### 官方文档

- [微信公众平台](https://mp.weixin.qq.com)
- [草稿箱API](https://developers.weixin.qq.com/doc/offiaccount/Draft_Box/Add_draft.html)
- [素材管理API](https://developers.weixin.qq.com/doc/offiaccount/Asset_Management/New_material_management.html)

### 相关文章

- [微信公众号HTML/CSS支持概览](https://www.axtonliu.ai/newsletters/ai-2/posts/wechat-article-html-css-support)
- [公众号图文编辑器开发必备技能](https://cloud.tencent.com/developer/article/2436347)
- [微信公众号HTML文章模板](https://comate.baidu.com/zh/page/rj1pm9fwsn2)

### 工具

- [壹伴助手](https://yiban.io) - 微信公众号编辑器增强工具
- [Markdown转HTML工具](https://markdown-it.github.io/)
- [代码语法高亮](https://highlightjs.org/)

---

## 十二、测试检查清单

发布到微信公众号前应检查：

- [ ] 所有样式都内联在`style`属性中
- [ ] 没有`<style>`标签
- [ ] 没有`position: absolute/fixed`
- [ ] 图片URL使用微信素材库链接
- [ ] 代码块使用`<pre><code>`结构
- [ ] 表格使用`border-collapse: collapse`
- [ ] 链接颜色和样式正确
- [ ] 字号适合移动端（15-16px）
- [ ] 行高适中（1.7-1.9）
- [ ] 在手机端预览效果
- [ ] 检查深色模式显示

---

**文档版本**: v1.0
**最后更新**: 2026-04-01
**维护者**: Content Hub项目
