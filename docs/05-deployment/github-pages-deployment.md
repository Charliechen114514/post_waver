# GitHub Pages 部署

> **版本**: v1.0
> **最后更新**: 2026-04-03
> **受众**: 开发者、DevOps 工程师
> **阅读时间**: 10 分钟

---

## 📋 概述

PostWaver 的 Web UI 和 Converter Web 通过 GitHub Actions 自动部署到 GitHub Pages。

---

## 🎯 部署架构

```
GitHub Repository
    ↓
GitHub Actions Workflow
    ↓
构建 (pnpm build)
    ↓
部署到 GitHub Pages
    ↓
https://yourusername.github.io/post_waver/
```

---

## 🚀 自动部署

### 工作流文件

位置：`.github/workflows/deploy-web-ui.yml`

```yaml
name: Deploy Web UI

on:
  push:
    branches: [ main ]
    paths:
      - 'packages/web-ui/**'
      - 'packages/converter-web/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - name: Build
        run: |
          pnpm install
          pnpm build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./packages/web-ui/dist
```

---

## 🔧 配置步骤

### 1. 启用 GitHub Pages

1. 进入仓库 **Settings**
2. 点击 **Pages**
3. Source 选择 **GitHub Actions**

### 2. 配置自定义域名（可选）

1. 在 **Pages** 设置中，点击 **Custom domain**
2. 输入你的域名（如：`postwaver.yourdomain.com`）
3. 配置 DNS 记录：

```
CNAME postwaver.yourdomain.com → yourusername.github.io
```

4. 启用 **Enforce HTTPS**

---

## 🔐 安全配置

### GitHub Secrets

无需额外配置，使用内置的 `GITHUB_TOKEN`。

### 权限

确保 workflow 有以下权限：

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

---

## 📊 部署流程

### 1. 推送代码

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

### 2. 自动触发

GitHub Actions 自动检测到推送并开始部署。

### 3. 查看进度

访问：`https://github.com/YOUR_USERNAME/post_waver/actions`

### 4. 访问网站

部署完成后，访问：

```
https://YOUR_USERNAME.github.io/post_waver/
```

---

## 🛠️ 故障排查

### 部署失败

**检查步骤**:

1. 查看 Actions 日志
2. 检查构建错误
3. 验证 `publish_dir` 路径

### 404 错误

**解决方案**:

1. 检查仓库名称是否正确
2. 确认 Pages 设置中的 Source
3. 清除浏览器缓存

### 自定义域名问题

**解决方案**:

1. 检查 DNS 配置
2. 等待 DNS 传播（最多 48 小时）
3. 验证 SSL 证书

---

## 📚 相关文档

- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [生产环境部署](production-setup.md)

---

**最后更新**: 2026-04-03
**维护者**: PostWaver Team
**反馈**: [GitHub Issues](https://github.com/Charliechen114514/post_waver/issues)
