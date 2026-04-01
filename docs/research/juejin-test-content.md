# 掘金平台格式测试内容

> 此文件用于测试掘金编辑器对各种Markdown语法的支持情况

---

## 一、标题测试

# 这是一级标题 H1
## 这是二级标题 H2
### 这是三级标题 H3
#### 这是四级标题 H4
##### 这是五级标题 H5
###### 这是六级标题 H6

---

## 二、文本格式测试

这是**粗体文本**的使用示例
这是*斜体文本*的使用示例
这是***粗斜体文本***的使用示例
这是~~删除线文本~~的使用示例

普通文本和`行内代码`混合使用的情况

---

## 三、列表测试

### 无序列表

- 第一项
- 第二项
  - 嵌套项1
  - 嵌套项2
- 第三项

### 有序列表

1. 第一项
2. 第二项
   1. 嵌套有序项1
   2. 嵌套有序项2
3. 第三项

### 任务列表

- [ ] 未完成任务1
- [x] 已完成任务2
- [ ] 未完成任务3

---

## 四、引用测试

> 这是一段普通的引用文本
> 可以有多行

> **引用中可以使用粗体**
> *引用中可以使用斜体*
> `引用中可以使用行内代码`

---

## 五、代码块测试

### 无语言标识

```
这是没有语言标识的代码块
function example() {
  console.log("Hello");
}
```

### JavaScript代码

```javascript
// JavaScript代码示例
function greet(name) {
  return `Hello, ${name}!`;
}

const result = greet("World");
console.log(result);
```

### Python代码

```python
# Python代码示例
def greet(name):
    return f"Hello, {name}!"

result = greet("World")
print(result)
```

### Bash代码

```bash
# Bash命令示例
echo "Hello, World!"
ls -la
git status
```

### CSS代码

```css
/* CSS样式示例 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.button {
  background: #007bff;
  color: white;
  border: none;
}
```

---

## 六、表格测试

### 简单表格

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| A   | B   | C   |
| D   | E   | F   |

### 带对齐的表格

| 左对齐 | 居中 | 右对齐 |
|:-------|:----:|-------:|
| A      |  B   |      C |
| D      |  E   |      F |

### 复杂表格

| 姓名 | 年龄 | 职业 | 备注 |
|------|------|------|------|
| 张三 | 25   | 工程师 | 北京 |
| 李四 | 30   | 设计师 | 上海 |
| 王五 | 28   | 产品经理 | 广州 |

---

## 七、链接测试

### 外部链接

- 普通链接：[掘金官网](https://juejin.cn)
- 带标题的链接：[GitHub](https://github.com "GitHub官网")

### 自动链接

https://github.com
https://juejin.cn

---

## 八、图片测试

### 外链图片

![示例图片](https://picsum.photos/800/400)

### 带标题的图片

![这是图片标题](https://picsum.photos/600/300 "这是图片的alt文本")

---

## 九、分割线测试

***

---

___

---

## 十、转义字符测试

\*不是斜体\*
\[不是链接\]
\`不是代码\`

---

## 十一、HTML混用测试

<div style="color: red;">这是HTML的div标签</div>

<span style="background: yellow;">这是HTML的span标签</span>

---

## 十二、数学公式测试（LaTeX）

行内公式：$E = mc^2$

块级公式：

$$
\frac{n!}{k!(n-k)!} = \binom{n}{k}
$$

---

## 十三、特殊符号测试

© 版权符号
® 注册商标符号
™ 商标符号
§ 分节符号
¶ 段落符号

---

## 十四、脚注测试

这是一个脚注引用[^1]

这是另一个脚注引用[^2]

[^1]: 这是第一个脚注的内容
[^2]: 这是第二个脚注的内容，可以包含更长的说明文字

---

## 十五、表情符号测试

:smile: :heart: :thumbsup:

😀 😂 🤔 👍 💻

---

## 十六、嵌套测试

> ### 引用中的标题
>
> 1. 引用中的列表
> 2. 第二项
>
> ```javascript
> function foo() {
>   return "bar";
> }
> ```

---

## 测试说明

**测试目标**：
1. 将上述内容复制到掘金编辑器
2. 观察哪些语法被正确渲染
3. 记录哪些语法不支持或渲染异常
4. 测试从不同来源（Typora、VSCode等）复制的粘贴效果

**预期记录**：
- ✅ 完全支持：[列出]
- ⚠️ 部分支持：[列出]
- ❌ 不支持：[列出]
