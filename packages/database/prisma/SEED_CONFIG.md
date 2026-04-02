# 数据库种子配置说明

## 📁 文件说明

### `seed.template.ts`（公开模板）
- **用途**：默认配置模板
- **状态**：提交到 git
- **内容**：包含所有默认配置项，敏感信息为空
- **使用场景**：新用户克隆项目后的参考模板

### `seed.local.ts`（本地私有配置）
- **用途**：您的本地私有配置
- **状态**：已在 `.gitignore` 中，不会被提交
- **内容**：包含您的真实配置（如微信 token、appSecret 等）
- **使用场景**：您本地的实际配置

### `seed.ts`（种子脚本）
- **用途**：数据库初始化脚本
- **行为**：
  - 如果 `seed.local.ts` 存在，使用本地配置
  - 如果不存在，使用 `seed.template.ts` 的默认配置

## 🚀 使用指南

### 首次使用（本地开发）

1. **复制模板创建本地配置**：
   ```bash
   cp packages/database/prisma/seed.template.ts packages/database/prisma/seed.local.ts
   ```

2. **编辑 `seed.local.ts`**，填入您的真实配置：
   - 微信图片上传：`imageUpload.wechat.appId` 和 `appSecret`
   - 微信令牌：`wechatToken.token`
   - 其他配置项

3. **重置数据库（会自动运行 seed）**：
   ```bash
   npx prisma migrate reset --force
   # 或运行
   ./reset-env.sh
   ```

### 其他开发者克隆项目后

1. **数据库会使用默认配置初始化**（来自 `seed.template.ts`）

2. **如需使用完整功能**，创建本地配置：
   ```bash
   cp packages/database/prisma/seed.template.ts packages/database/prisma/seed.local.ts
   ```

3. **在 `seed.local.ts` 中填入您的配置**

4. **重置数据库以应用配置**：
   ```bash
   npx prisma migrate reset --force
   ```

## 🔒 安全说明

- ✅ `seed.local.ts` 和 `seed.local.js` 已在 `.gitignore` 中
- ✅ 敏感信息不会被提交到 git
- ✅ 每个开发者维护自己的本地配置
- ⚠️ 切勿将 `seed.local.ts` 重命名或添加到 git

## 📝 配置项说明

### imageUpload.wechat
- **appId**: 微信公众号 AppID
- **appSecret**: 微信公众号 AppSecret
- **获取方式**：微信公众平台 > 开发 > 基本配置

### wechatToken
- **token**: 微信公众号接口调用凭据
- **expiresAt**: 过期时间戳
- **updatedAt**: 更新时间戳
- **注意**：token 会定期过期，需要自动刷新或手动更新

### hexo
- **enabled**: 是否启用 Hexo 同步
- **blogPath**: Hexo 博客路径
- **git**: Git 自动提交配置
- **deploy**: Hexo 自动部署配置

## 🔄 配置更新

### 更新配置后重置数据库
```bash
npx prisma migrate reset --force
```

### 只运行 seed（不重置数据库）
```bash
npx prisma db seed
```

### 查看当前配置
```bash
sqlite3 packages/database/prisma/dev.db "SELECT key, value FROM Config"
```
