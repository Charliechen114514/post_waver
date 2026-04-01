# Busuanzi 访问统计配置

## 配置说明

本博客使用 busuanzi（不蒜子）进行访问统计，数据存储在 busuanzi.ibruce.info 服务器上。

## 关键配置

### 1. 引入脚本

```html
<script async src="//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"></script>
```

### 2. 访客数（UV）显示

```html
<span id="busuanzi_value_site_uv"><i class="fa-solid fa-spinner fa-spin"></i></span>
```

### 3. 访问量（PV）显示

```html
<span id="busuanzi_value_site_pv"><i class="fa-solid fa-spinner fa-spin"></i></span>
```

## 重要说明

1. **数据无需迁移**：busuanzi 数据基于域名统计，与具体部署位置无关
2. **自动保留**：只要使用相同的域名（charliechen114514.github.io），访问数据会自动保留
3. **实时更新**：访客访问时，busuanzi 服务器会自动更新统计数据

## Butterfly 主题集成

本博客使用 Butterfly 主题，该主题已内置 busuanzi 支持。

在主题的 `_config.yml` 中配置：

```yaml
# 访问统计
busuanzi:
  enable: true
```

主题会自动在页面中添加访客数和访问量显示。

## 验证方法

部署后，访问博客页面，查看页面底部的"网站资讯"卡片，应该能看到：
- 本站访客数
- 本站总访问量

如果显示 `<i class="fa-solid fa-spinner fa-spin"></i>`，说明：
1. 脚本加载失败
2. 或网络连接问题

## 原始配置文件

详见：`busuanzi.html`
