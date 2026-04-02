# 微信公众号图片上传和链接替换功能

## 功能概述

post_waver 已实现微信公众号图片的自动上传和链接替换功能：

✅ **已实现**：
- 自动上传图片到微信素材库
- 获取微信图片 URL
- 失败时降级到手动模式（生成图片列表）
- API 限流处理
- Access Token 自动管理
- 图片链接替换功能

## 使用流程

### 1. 配置微信 API

首先需要配置微信公众号的 API 凭证：

```bash
# 设置微信配置
pnpm image:config set wechat <appId> <appSecret>

# 验证配置
pnpm image:config validate wechat
```

配置会保存在 `.post-waver/image-upload-config.json`：

```json
{
  "wechat": {
    "appId": "your_app_id",
    "appSecret": "your_app_secret"
  }
}
```

### 2. 上传图片并替换链接

使用新的完整流程命令：

```bash
# 上传图片并自动替换文章中的链接
pnpm image:upload:replace my-article

# 预览替换结果（不修改文件）
pnpm image:upload:replace my-article --dry-run

# 创建备份后再替换
pnpm image:upload:replace my-article --backup

# 指定输出文件
pnpm image:upload:replace my-article --output content/posts/my-article-new.md
```

### 3. 工作流程

```
1. 读取文章内容 (content/posts/my-article.md)
   ↓
2. 上传图片到微信
   ├─ 成功 → 获得 media_id 和 URL
   └─ 失败 → 记录错误
   ↓
3. 替换文章中的图片链接
   ├─ ![](/assets/image.png) → ![](https://mmbiz.qpic.cn/...)
   └─ <img src="/assets/image.png"> → <img src="https://mmbiz.qpic.cn/...">
   ↓
4. 保存替换后的文章（可选创建备份）
   ↓
5. 对于失败的图片，生成手动上传列表
```

## 命令详解

### image:upload:replace

完整流程命令，推荐使用：

```bash
pnpm image:upload:replace <postId> [options]
```

**选项**：
- `--dry-run`: 仅显示替换结果，不修改文件
- `--backup`: 在修改前创建备份（.backup 文件）
- `--output <path>`: 指定输出文件路径

**示例**：

```bash
# 基本用法
pnpm image:upload:replace my-article

# 安全模式：先预览再决定
pnpm image:upload:replace my-article --dry-run
# 如果满意，再执行实际替换
pnpm image:upload:replace my-article --backup

# 输出到新文件（不修改原文件）
pnpm image:upload:replace my-article --output content/posts/my-article-wechat.md
```

### image:upload-post

仅上传图片，不替换链接：

```bash
pnpm image:upload-post my-article
```

### image:list

查看文章中的图片列表：

```bash
pnpm image:list my-article
```

## 输出示例

### 成功场景

```bash
$ pnpm image:upload:replace my-article

📷 处理文章图片: my-article
────────────────────────────────────────────────────────────
📤 上传图片: /home/user/post_waver/content/assets/images/screenshot.png
✅ 上传成功: CsXqS6hJfexample
   URL: https://mmbiz.qpic.cn/mmbiz_png/xxx/0?wx_fmt=png

────────────────────────────────────────────────────────────
📊 上传结果:

  ✅ 成功: 3
  ❌ 失败: 0
  ⏭️  跳过: 2

📝 详细结果:
  ✅ content/assets/images/screenshot.png
     → https://mmbiz.qpic.cn/mmbiz_png/xxx/0?wx_fmt=png
  ✅ content/assets/images/diagram.png
     → https://mmbiz.qpic.cn/mmbiz_png/yyy/0?wx_fmt=png
  ✅ content/assets/images/photo.jpg
     → https://mmbiz.qpic.cn/mmbiz_jpg/zzz/0?wx_fmt=jpeg

────────────────────────────────────────────────────────────
🔄 替换图片链接...

📋 替换示例:
  旧: content/assets/images/screenshot.png
  新: https://mmbiz.qpic.cn/mmbiz_png/xxx/0?wx_fmt=png

  旧: content/assets/images/diagram.png
  新: https://mmbiz.qpic.cn/mmbiz_png/yyy/0?wx_fmt=png

💾 备份已创建: content/posts/my-article.md.backup
✅ 文件已更新: content/posts/my-article.md
   替换了 3 张图片

────────────────────────────────────────────────────────────
✅ 处理完成
```

### 失败场景

```bash
$ pnpm image:upload:replace my-article

📷 处理文章图片: my-article
────────────────────────────────────────────────────────────
📤 上传图片: /home/user/post_waver/content/assets/images/screenshot.png
❌ 上传失败: [45009] filetype not support

────────────────────────────────────────────────────────────
📊 上传结果:

  ✅ 成功: 2
  ❌ 失败: 1
  ⏭️  跳过: 0

📝 详细结果:
  ✅ content/assets/images/diagram.png
     → https://mmbiz.qpic.cn/mmbiz_png/yyy/0?wx_fmt=png
  ❌ content/assets/images/screenshot.png
     错误: [45009] filetype not support

────────────────────────────────────────────────────────────
🔄 替换图片链接...
💾 备份已创建: content/posts/my-article.md.backup
✅ 文件已更新: content/posts/my-article.md
   替换了 2 张图片

────────────────────────────────────────────────────────────
⚠️  1 张图片上传失败
📄 请查看图片列表文件: output/temp/my-article-wechat_imagelist.txt
   手动上传这些图片后，需要再次替换链接

────────────────────────────────────────────────────────────
✅ 处理完成
```

## 错误处理

### API 限流

系统会自动处理 API 限流：

- 每 10 张图片后等待 1 秒
- 失败时自动重试（最多 2 次）
- 限流时显示友好提示

### 常见错误

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 45009 | 文件类型不支持 | 转换为支持的格式（PNG/JPG） |
| 45010 | 媒体文件大小超限 | 压缩图片，限制在 2MB 以内 |
| 40001 | AppSecret 错误 | 检查配置是否正确 |
| 42001 | Access Token 超时 | 系统会自动刷新 |
| 429 | API 调用频率限制 | 等待后重试，系统已处理 |

## 降级策略

当自动上传失败时，系统会降级到手动模式：

1. **生成图片列表文件**：`output/{postId}-wechat_imagelist.txt`
2. **包含信息**：
   - 本地文件路径
   - 文件大小
   - 错误原因
3. **手动上传流程**：
   ```bash
   # 查看需要手动上传的图片列表
   cat output/temp/my-article-wechat_imagelist.txt

   # 手动上传到微信公众号后台
   # 然后使用手动替换功能
   pnpm image:replace:manual my-article --mapping manual-mapping.json
   ```

## 最佳实践

### 1. 准备图片

```bash
# 确保图片符合微信要求：
# - 格式：PNG, JPG, JPEG
# - 大小：不超过 2MB
# - 尺寸：建议 800x600 以上

# 检查文章中的图片
pnpm image:list my-article
```

### 2. 测试上传

```bash
# 先用 dry-run 模式测试
pnpm image:upload:replace my-article --dry-run

# 查看预览结果
# 确认无误后再执行实际替换
pnpm image:upload:replace my-article --backup
```

### 3. 验证结果

```bash
# 检查替换后的文章
grep "mmbiz.qpic.cn" content/posts/my-article.md

# 或使用对比工具
diff content/posts/my-article.md.backup content/posts/my-article.md
```

### 4. 发布到微信

```bash
# 图片链接已替换，可以正常发布
pnpm post:publish my-article

# 选择 wechat 平台
# 复制转换后的内容
# 粘贴到微信公众号编辑器
# 图片会自动显示（已使用微信 CDN）
```

## 技术细节

### API 限流处理

```typescript
// 每 10 张图片后等待 1 秒
if (i > 0 && i % 10 === 0) {
  console.log(`⏳ 等待 1 秒避免 API 限流...`)
  await new Promise(resolve => setTimeout(resolve, 1000))
}
```

### Access Token 管理

- Token 保存在 `.post-waver/wechat-token.json`
- 自动过期处理（提前 5 分钟刷新）
- 无需手动管理

### 重试机制

```typescript
// 最多重试 2 次
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    const result = await this.wechatClient.uploadImage(img.absolutePath)
    if (result.success) {
      // 成功，跳出循环
      break
    }
  } catch (error) {
    // 失败，等待 2 秒后重试
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}
```

## 故障排查

### 问题：上传全部失败

**检查**：
```bash
# 验证配置
pnpm image:config validate wechat

# 查看详细错误
pnpm image:upload:replace my-article --dry-run
```

**可能原因**：
- AppId/AppSecret 配置错误
- 网络连接问题
- API 权限不足

### 问题：部分图片失败

**解决方案**：
```bash
# 查看失败图片列表
cat output/temp/my-article-wechat_imagelist.txt

# 手动上传失败的图片
# 或调整图片格式/大小后重试
```

### 问题：链接未替换

**检查**：
```bash
# 确认上传成功
pnpm image:upload-post my-article

# 查看上传结果中的 URL
# 如果有 URL 但链接未替换，检查原文章中的图片路径格式
```

## 总结

✅ **完整支持**：
- 自动上传图片到微信
- 成功后自动替换链接
- 失败时降级到手动模式
- 完善的错误处理

🎯 **推荐工作流**：
```bash
# 1. 配置微信 API
pnpm image:config set wechat <appId> <appSecret>

# 2. 上传并替换
pnpm image:upload:replace my-article --backup

# 3. 发布到平台
pnpm post:publish my-article
```

---

**文档版本**: 1.0.0
**最后更新**: 2026-04-02
**相关文档**:
- [QUICK_START.md](../../QUICK_START.md)
- [API 参考](../api/image-upload.md)
