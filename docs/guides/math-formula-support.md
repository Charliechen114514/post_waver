# PostWaver 数学公式支持指南

> **版本**: v1.0
> **更新日期**: 2026-04-03
> **渲染引擎**: KaTeX

---

## 🚀 快速开始

### 3分钟上手数学公式

**1. 基础语法**
```markdown
行内公式：$E = mc^2$

块级公式：
$$
\frac{n!}{k!(n-k)!} = \binom{n}{k}
$$
```

**2. 支持的平台**
- ✅ 掘金 (Juejin) - 完全支持
- ✅ CSDN - 完全支持
- ✅ 知乎 (Zhihu) - 完全支持
- ❌ 微信公众号 - 需要转换为图片

**3. PostWaver处理**
- 自动保留LaTeX语法
- 支持的平台上无需转换
- 不支持的平台提供提示

---

## 📖 完整指南

### 一、数学公式引擎

#### 1.1 KaTeX介绍

PostWaver使用 **KaTeX** 作为数学公式渲染引擎：

**特点**：
- ⚡ 快速渲染 - 无需延迟加载
- 📱 响应式设计 - 自适应屏幕尺寸
- 🎨 打印友好 - 高质量打印输出
- 🔒 安全可靠 - 无需执行JavaScript
- 🌐 广泛支持 - 主流平台兼容

**版本信息**：
- KaTeX版本: `0.16.9`
- 依赖包: `katex`, `remark-math`, `rehype-katex`

#### 1.2 支持的平台

| 平台 | 支持情况 | 说明 |
|------|----------|------|
| 掘金 | ✅ 完全支持 | 原生KaTeX渲染 |
| CSDN | ✅ 完全支持 | LaTeX语法支持 |
| 知乎 | ✅ 完全支持 | 数学公式渲染 |
| 微信公众号 | ⚠️ 部分支持 | 需要转换为图片 |
| HTML | ✅ 完全支持 | 带KaTeX样式 |

**平台差异**：
- 掘金/CSDN/知乎：直接使用LaTeX语法
- 微信公众号：建议转换为高清图片
- HTML：包含KaTeX CSS样式

---

### 二、基础语法

#### 2.1 行内公式

**语法**：
```markdown
$数学公式$
```

**示例**：
```markdown
质能方程是 $E = mc^2$，其中 $E$ 是能量，$m$ 是质量，$c$ 是光速。
```

**渲染效果**：
质能方程是 $E = mc^2$，其中 $E$ 是能量，$m$ 是质量，$c$ 是光速。

**注意事项**：
- 使用单个 `$` 符号包裹
- 公式前后建议加空格
- 避免在公式中使用空格（使用LaTeX空格命令）

#### 2.2 块级公式

**语法**：
```markdown
$$
数学公式
$$
```

**示例**：
```markdown
二次方程的求根公式：
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

**渲染效果**：
二次方程的求根公式：
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

**注意事项**：
- 使用双个 `$$` 符号包裹
- 公式独占一行
- 适合复杂公式展示

---

### 三、常用符号

#### 3.1 希腊字母

| 大写 | 语法 | 小写 | 语法 |
|------|------|------|------|
| Α | `\Alpha` | α | `\alpha` |
| Β | `\Beta` | β | `\beta` |
| Γ | `\Gamma` | γ | `\gamma` |
| Δ | `\Delta` | δ | `\delta` |
| Θ | `\Theta` | θ | `\theta` |
| Λ | `\Lambda` | λ | `\lambda` |
| Π | `\Pi` | π | `\pi` |
| Σ | `\Sigma` | σ | `\sigma` |
| Φ | `\Phi` | φ | `\phi` |
| Ψ | `\Psi` | ψ | `\psi` |
| Ω | `\Omega` | ω | `\omega` |

**示例**：
```markdown
圆周率 $\pi \approx 3.14159$
欧拉公式 $e^{i\pi} + 1 = 0$
```

#### 3.2 运算符

| 运算 | 语法 | 渲染 |
|------|------|------|
| 加减 | `\pm` | $\pm$ |
| 乘 | `\times` | $\times$ |
| 除 | `\div` | $\div$ |
| 分数 | `\frac{a}{b}` | $\frac{a}{b}$ |
| 根号 | `\sqrt{x}` | $\sqrt{x}$ |
| 上标 | `x^2` | $x^2$ |
| 下标 | `H_2O` | $H_2O$ |

**示例**：
```markdown
四则运算：$a \pm b$, $a \times b$, $a \div b$
分数：$\frac{1}{2}$
根号：$\sqrt{2} \approx 1.414$
```

#### 3.3 关系符号

| 符号 | 语法 | 渲染 |
|------|------|------|
| 等于 | `=` | $=$ |
| 不等于 | `\neq` | $\neq$ |
| 小于 | `<` | $<$ |
| 大于 | `>` | $>$ |
| 小于等于 | `\leq` | $\leq$ |
| 大于等于 | `\geq` | $\geq$ |
| 约等于 | `\approx` | $\approx$ |
| 恒等于 | `\equiv` | $\equiv$ |

#### 3.4 箭头符号

| 箭头 | 语法 | 渲染 |
|------|------|------|
| 右箭头 | `\rightarrow` | $\rightarrow$ |
| 左箭头 | `\leftarrow` | $\leftarrow$ |
| 双箭头 | `\leftrightarrow` | $\leftrightarrow$ |
| 上箭头 | `\uparrow` | $\uparrow$ |
| 下箭头 | `\downarrow` | $\downarrow$ |
| 右双箭头 | `\Rightarrow` | $\Rightarrow$ |
| 左双箭头 | `\Leftarrow` | $\Leftarrow$ |

#### 3.5 集合符号

| 符号 | 语法 | 渲染 |
|------|------|------|
| 属于 | `\in` | $\in$ |
| 不属于 | `\notin` | $\notin$ |
| 包含 | `\subset` | $\subset$ |
| 包含于 | `\subseteq` | $\subseteq$ |
| 并集 | `\cup` | $\cup$ |
| 交集 | `\cap` | $\cap$ |
| 空集 | `\emptyset` | $\emptyset$ |
| 无穷 | `\infty` | $\infty$ |

---

### 四、高级功能

#### 4.1 矩阵

**基本语法**：
```markdown
$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$
```

**渲染效果**：
$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$

**矩阵类型**：

| 类型 | 语法 | 括号样式 |
|------|------|----------|
| pmatrix | `\begin{pmatrix}` | `( )` |
| bmatrix | `\begin{bmatrix}` | `[ ]` |
| vmatrix | `\begin{vmatrix}` | `\| \|` |
| Vmatrix | `\begin{Vmatrix}` | `\|\| \|\|` |
| matrix | `\begin{matrix}` | 无括号 |

**示例**：
```markdown
单位矩阵：
$$
I = \begin{pmatrix}
1 & 0 & 0 \\
0 & 1 & 0 \\
0 & 0 & 1
\end{pmatrix}
$$
```

#### 4.2 方程组

**基本语法**：
```markdown
$$
\begin{cases}
3x + 2y = 7 \\
2x - y = 4
\end{cases}
$$
```

**渲染效果**：
$$
\begin{cases}
3x + 2y = 7 \\
2x - y = 4
\end{cases}
$$

**使用场景**：
- 线性方程组
- 约束条件
- 定义域分段

#### 4.3 多行公式对齐

**基本语法**：
```markdown
$$
\begin{aligned}
f(x) &= (x+a)(x+b) \\
     &= x^2 + (a+b)x + ab \\
     &= x^2 + 10x + 21
\end{aligned}
$$
```

**渲染效果**：
$$
\begin{aligned}
f(x) &= (x+a)(x+b) \\
     &= x^2 + (a+b)x + ab \\
     &= x^2 + 10x + 21
\end{aligned}
$$

**对齐说明**：
- 使用 `\begin{aligned}` 环境
- `&` 符号指定对齐位置
- `\\` 符号换行

#### 4.4 方程编号

**基本语法**：
```markdown
$$
\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2} \tag{1}
$$
```

**渲染效果**：
$$
\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2} \tag{1}
$$

**引用方式**：
```markdown
如公式\eqref{eq:1}所示，高斯积分值为...
```

#### 4.5 求和与积分

**求和**：
```markdown
$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$
```
$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

**积分**：
```markdown
$$
\int_{a}^{b} f(x) dx = F(b) - F(a)
$$
```
$$
\int_{a}^{b} f(x) dx = F(b) - F(a)
$$

**多重积分**：
```markdown
$$
\iint_{D} f(x,y) dxdy
$$
```
$$
\iint_{D} f(x,y) dxdy
$$

#### 4.6 极限

**基本语法**：
```markdown
$$
\lim_{x \to \infty} \frac{1}{x} = 0
$$
```

**渲染效果**：
$$
\lim_{x \to \infty} \frac{1}{x} = 0
$$

**常用极限**：
```markdown
$$
\lim_{x \to 0} \frac{\sin x}{x} = 1
$$

$$
\lim_{n \to \infty} (1 + \frac{1}{n})^n = e
$$
```

---

### 五、实际应用示例

#### 5.1 数学基础

**二次方程**：
```markdown
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

**勾股定理**：
```markdown
$$
a^2 + b^2 = c^2
$$
```

**对数公式**：
```markdown
$$
\log_a(b) = \frac{\ln(b)}{\ln(a)}
$$
```

#### 5.2 物理公式

**牛顿第二定律**：
```markdown
$$
F = ma
$$
```

**动能公式**：
```markdown
$$
E_k = \frac{1}{2}mv^2
$$
```

**万有引力**：
```markdown
$$
F = G\frac{m_1m_2}{r^2}
$$
```

**相对论**：
```markdown
$$
E = mc^2
$$

$$
\gamma = \frac{1}{\sqrt{1-\frac{v^2}{c^2}}}
$$
```

#### 5.3 统计学

**正态分布**：
```markdown
$$
f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}
$$
```

**期望值**：
```markdown
$$
E[X] = \sum_{i=1}^{n} x_i p_i
$$
```

**方差**：
```markdown
$$
Var(X) = E[X^2] - (E[X])^2
$$
```

#### 5.4 线性代数

**矩阵乘法**：
```markdown
$$
C_{ij} = \sum_{k=1}^{n} A_{ik}B_{kj}
$$
```

**特征值**：
```markdown
$$
A\mathbf{v} = \lambda\mathbf{v}
$$
```

**行列式**：
```markdown
$$
\det(A) = \sum_{\sigma \in S_n} \text{sgn}(\sigma) \prod_{i=1}^{n} a_{i,\sigma(i)}
$$
```

#### 5.5 微积分

**导数定义**：
```markdown
$$
f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}
$$
```

**泰勒展开**：
```markdown
$$
f(x) = \sum_{n=0}^{\infty} \frac{f^{(n)}(a)}{n!}(x-a)^n
$$
```

**傅里叶级数**：
```markdown
$$
f(x) = \frac{a_0}{2} + \sum_{n=1}^{\infty}[a_n\cos(nx) + b_n\sin(nx)]
$$
```

---

### 六、PostWaver集成

#### 6.1 自动处理

PostWaver自动处理数学公式：

**支持的文件格式**：
- Markdown源文件 (`.md`)
- 在所有平台上保留LaTeX语法

**转换规则**：
```javascript
// PostWaver转换流程
输入: Markdown + LaTeX公式
  ↓
解析: remark-math 解析数学语法
  ↓
转换: rehype-katex 转换为HTML
  ↓
输出: 带KaTeX渲染的HTML
```

#### 6.2 平台适配

**掘金/CSDN/知乎**：
- 直接保留LaTeX语法
- 平台自动渲染KaTeX
- 无需额外处理

**微信公众号**：
- PostWaver会标记需要转换的公式
- 建议使用工具转换为高清图片
- 或使用公众号编辑器的公式功能

**HTML输出**：
- 包含完整的KaTeX CSS
- 支持离线显示
- 响应式设计

#### 6.3 配置选项

**package.json依赖**：
```json
{
  "dependencies": {
    "katex": "^0.16.9",
    "remark-math": "^6.0.0",
    "rehype-katex": "^7.0.0"
  }
}
```

**Vite配置**：
```javascript
// vite.config.ts
export default {
  css: {
    preprocessorOptions: {
      less: {
        math: 'always'
      }
    }
  }
}
```

---

### 七、最佳实践

#### 7.1 写作建议

**公式编写原则**：
1. **清晰优先** - 选择最清晰的表达方式
2. **逐步推导** - 复杂公式分步骤展示
3. **符号说明** - 首次出现时说明符号含义
4. **统一命名** - 同一文档中符号命名一致

**示例**：
```markdown
设 $f(x)$ 为连续函数，其导数为 $f'(x)$。

根据导数定义：
$$
f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}
$$

其中：
- $h$ 为增量
- $f(x+h)$ 为 $x+h$ 处的函数值
```

#### 7.2 格式规范

**空格使用**：
```markdown
# ❌ 不推荐
公式$a=b$中，$a$等于$b$

# ✅ 推荐
公式 $a=b$ 中，$a$ 等于 $b$
```

**公式大小**：
```markdown
# 行内公式使用简单形式
质能方程 $E=mc^2$ 是物理学中最著名的公式之一。

# 复杂公式使用块级形式
$$
G_{\mu\nu} = \frac{8\pi G}{c^4} T_{\mu\nu}
$$
```

#### 7.3 跨平台考虑

**平台兼容性**：
- 优先使用标准LaTeX语法
- 避免使用特殊KaTeX扩展
- 在不同平台上测试显示效果

**微信平台处理**：
```markdown
对于微信公众号，建议：
1. 简单公式直接使用LaTeX
2. 复杂公式转换为图片
3. 在图片alt中保留LaTeX源码
```

---

### 八、故障排查

#### 8.1 常见问题

**Q: 公式不显示？**
- 检查 `$` 或 `$$` 是否成对
- 确认LaTeX语法正确
- 清除浏览器缓存

**Q: 公式显示错位？**
- 检查是否有HTML冲突
- 使用块级公式替代行内公式
- 调整公式复杂度

**Q: 特定符号不支持？**
- 查阅KaTeX支持的符号列表
- 考虑使用替代符号
- 使用图片表示特殊符号

#### 8.2 性能优化

**公式数量**：
- 单篇文章建议不超过50个公式
- 复杂公式考虑使用图片
- 合理使用行内和块级公式

**渲染优化**：
```javascript
// KaTeX配置选项
katex.render(string, element, {
  displayMode: false,  // 行内模式
  throwOnError: false, // 错误时不抛出异常
  errorColor: '#cc0000', // 错误颜色
  strict: 'ignore'      // 忽略警告
});
```

---

### 九、参考资源

#### 9.1 官方文档

- **KaTeX官网**: https://katex.org/
- **KaTeX支持的函数**: https://katex.org/docs/supported.html
- **在线编辑器**: https://katex.org/#demo

#### 9.2 学习资源

- **LaTeX数学公式**: https://en.wikibooks.org/wiki/LaTeX/Mathematics
- **数学符号表**: https://oeis.org/wiki/List_of_LaTeX_mathematical_symbols
- **KaTeX GitHub**: https://github.com/KaTeX/KaTeX

#### 9.3 工具推荐

- **在线LaTeX编辑器**: https://www.overleaf.com/
- **公式转换工具**: https://mathpix.com/
- **LaTeX速查表**: https://www.math.ubc.ca/~cautis/tools/latexsheet.pdf

---

### 十、测试检查清单

发布前检查：

- [ ] 所有 `$` 和 `$$` 符号成对
- [ ] LaTeX语法正确无误
- [ ] 在目标平台测试显示效果
- [ ] 公式中的空格使用正确
- [ ] 复杂公式考虑是否需要简化
- [ ] 符号命名统一规范
- [ ] 公式编号连续且正确
- [ ] 微信平台特殊处理（如需要）

---

**文档版本**: v1.0
**最后更新**: 2026-04-03
**维护者**: PostWaver项目
