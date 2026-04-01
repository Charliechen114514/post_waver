# Busuanzi 访问统计完整配置指南

**目标**：确保 busuanzi 访问统计数据在博客迁移后完全保留

**关键原理**：busuanzi 数据基于**域名**统计，与具体部署位置、服务器、文件无关。只要域名不变，数据自动保留。

---

## ✅ 当前状态验证

### 1. 原始配置已提取

从你现有的博客（https://charliechen114514.github.io/）中提取的配置：

**脚本地址**：
```html
<script async src="//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"></script>
```

**显示元素**：
```html
<span id="busuanzi_value_site_uv"></span>  <!-- 访客数 -->
<span id="busuanzi_value_site_pv"></span>  <!-- 访问量 -->
```

### 2. 服务可用性验证

✅ busuanzi 服务正常运行，脚本可访问：`https://busuanzi.ibruce.info`

### 3. 数据保留机制

**重要**：busuanzi 数据存储在 `busuanzi.ibruce.info` 服务器上，**基于域名统计**：
- 域名：`charliechen114514.github.io`
- 数据密钥：自动从域名生成
- **结论**：只要域名不变，数据永久保留

---

## 🔧 新博客配置（Butterfly 主题）

### 步骤 1：安装 Butterfly 主题

```bash
cd /home/Charliechen/post_waver/blog

# 克隆 Butterfly 主题
git clone -b master https://github.com/jerryc127/hexo-theme-butterfly.git themes/butterfly

# 安装依赖
pnpm install
```

### 步骤 2：配置主题启用 busuanzi

创建/编辑 `blog/themes/butterfly/_config.yml`：

```yaml
# Busuanzi 访问统计
busuanzi:
  enable: true  # 关键：必须设置为 true
```

### 步骤 3：验证配置

主题会自动在页面中添加：
```html
<script async src="//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"></script>
```

以及显示元素：
```html
<span id="busuanzi_value_site_uv"></span>
<span id="busuanzi_value_site_pv"></span>
```

---

## 🧪 测试与验证

### 验证 1：本地预览测试

```bash
cd /home/Charliechen/post_waver/blog

# 启动本地服务器
hexo server

# 访问 http://localhost:4000
```

**检查项**：
- ✅ 页面底部"网站资讯"卡片存在
- ✅ 显示"本站访客数"和"本站总访问量"
- ⚠️ 注意：本地预览可能显示 `<i class="fa-solid fa-spinner fa-spin"></i>`（这是正常的，因为本地 localhost 不是你的域名）

### 验证 2：部署后测试（关键！）

```bash
# 生成静态文件
hexo generate

# 部署到 GitHub.io
hexo deploy
```

**访问**：https://charliechen114514.github.io/

**检查项**：
1. ✅ 页面底部显示"本站访客数"和"本站总访问量"
2. ✅ 显示的是**数字**，不是 spinner
3. ✅ 数字**与迁移前一致**（这是最重要的！）

### 验证 3：数据一致性验证

**方法 1：直接对比**
- 迁移前，访问你的博客，记录当前的访客数和访问量
- 迁移后，再次访问，对比数字是否一致

**方法 2：查看 busuanzi 后台**
- 访问：http://busuanzi.ibruce.info/
- 查询你的域名：`charliechen114514.github.io`

---

## ⚠️ 常见问题排查

### 问题 1：部署后显示 spinner，不显示数字

**原因**：
1. 脚本未加载（网络问题）
2. 域名未注册到 busuanzi
3. 配置错误

**解决**：
```bash
# 检查脚本是否加载
curl -I https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js

# 应该返回 200 OK
```

### 问题 2：数字显示为 0

**原因**：这是**第一次访问**，busuanzi 需要注册新域名

**解决**：
1. 刷新页面多次
2. 等待 5-10 分钟
3. 检查是否使用了正确的域名（`charliechen114514.github.io`）

### 问题 3：数字与迁移前不一致

**原因**：域名配置错误

**解决**：
1. 检查 `blog/_config.yml` 中的 `url` 配置：
   ```yaml
   url: https://charliechen114514.github.io
   ```
2. 确保 `root` 配置正确：
   ```yaml
   root: /
   ```

---

## 📊 预期结果

### 成功的标志

部署后，访问 https://charliechen114514.github.io/，页面底部应该显示：

```
网站资讯
─────────────────────
文章数目 : 22
本站总字数 : 261.4k
本站访客数 : 1234    ← 应该是数字（与迁移前一致）
本站总访问量 : 5678   ← 应该是数字（与迁移前一致）
最后更新时间 : 2025-04-01
```

### 数据保留验证

**关键验证点**：
- ✅ 访客数**不是** 0
- ✅ 访问量**不是** 0
- ✅ 数字与迁移前**一致或增长**（不会重置）

---

## 🎯 核心要点总结

### 数据不会丢失的原因

1. **busuanzi 基于域名统计**
   - 数据密钥 = 你的域名（`charliechen114514.github.io`）
   - 与文件位置、服务器、部署方式无关

2. **无需迁移操作**
   - 不需要导出数据
   - 不需要导入数据
   - 不需要配置 API key
   - 只需要域名不变

3. **自动关联**
   - 部署到 `charliechen114514.github.io`
   - busuanzi 自动识别域名
   - 自动加载历史数据

### 你需要做的

**唯一的要求**：
- ✅ 确保 `blog/_config.yml` 中 `url` 配置为 `https://charliechen114514.github.io`
- ✅ 在 Butterfly 主题配置中启用 `busuanzi: enable: true`
- ✅ 部署到 `charliechen114514.github.io` 仓库的 `main` 分支

**不需要做的**：
- ❌ 不需要备份访问数据
- ❌ 不需要迁移数据库
- ❌ 不需要重新注册
- ❌ 不需要配置 API

---

## 🔍 完整验证清单

部署后，依次检查：

- [ ] 访问 https://charliechen114514.github.io/
- [ ] 页面正常加载，无 JavaScript 错误
- [ ] 页面底部显示"网站资讯"卡片
- [ ] "本站访客数"显示数字（不是 spinner）
- [ ] "本站总访问量"显示数字（不是 spinner）
- [ ] 数字与迁移前一致
- [ ] 刷新页面，数字会增长（说明统计正常工作）

---

## 📞 如果数据真的丢失了

**极其罕见的情况**：如果数据真的显示为 0 或不一致：

1. **确认域名**：
   ```bash
   # 检查博客配置
   grep "url:" blog/_config.yml
   # 应该是：url: https://charliechen114514.github.io
   ```

2. **联系 busuanzi 官方**：
   - 访问：http://busuanzi.ibruce.info/
   - 查询是否有域名变更记录

3. **最后手段**：重新开始统计
   - 数据无法恢复（但这种情况极少见）
   - 从 0 开始重新累积

---

**总结**：只要确保域名不变，busuanzi 数据 100% 保留，无需任何特殊操作！

**最后更新**：2026-04-01
**维护者**：Charlie Chen
