# post_waver
PostWeaver is a Markdown-centric content distribution system that weaves a single piece of writing into a multi-platform publishing flow.

## 快速开始

### 克隆项目

由于本项目使用 Git Submodule 管理博客，克隆时需要使用 `--recursive` 参数：

```bash
git clone --recursive https://github.com/Charliechen114514/post_waver.git
```

如果已经克隆但忘记添加 `--recursive`，运行：

```bash
git submodule update --init --recursive
```

或使用 pnpm 快捷命令：

```bash
pnpm submodule:update
```

### 安装依赖

```bash
pnpm install
```

### Blog Submodule 管理

本项目的 `blog/` 目录是一个 Git Submodule，链接到独立的 [CharliesBlogs](https://github.com/Charliechen114514/CharliesBlogs) 仓库。

**查看 submodule 状态**：
```bash
pnpm submodule:status
# 或
git submodule status
```

**同步 blog 变更到远程仓库**：
```bash
pnpm sync:blog
```

**更新 blog 到最新版本**：
```bash
git submodule update --remote --merge
```
