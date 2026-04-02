#!/usr/bin/env tsx
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

async function main() {
  const content = `---
title: 图片兼容性测试文章
date: ${new Date().toISOString()}
tags: ['test']
categories: ['test']
---

# 图片兼容性测试

本文用于测试各平台的图片加载兼容性。

## 1. 本地绝对路径测试

![本地图片](/assets/images/test-image.png)

## 2. 本地相对路径测试

![相对路径图片](../assets/images/test-image.png)

## 3. 外部链接测试

![外部图片](https://via.placeholder.com/800x400)

## 4. 不同格式测试

### PNG 格式
![PNG](/assets/images/test.png)

### JPG 格式
![JPG](/assets/images/test.jpg)

### GIF 格式
![GIF](/assets/images/test.gif)

## 结论

请记录各平台对以上图片的显示情况。
`

  const postsDir = join(process.cwd(), 'content/posts')
  const outputPath = join(postsDir, 'image-compatibility-test.md')

  mkdirSync(postsDir, { recursive: true })
  writeFileSync(outputPath, content)

  console.log(`✅ 测试文章已创建: ${outputPath}`)
  console.log(`\n💡 下一步:`)
  console.log(`   1. 添加测试图片到 content/assets/images/`)
  console.log(`   2. 运行 pnpm test:image:juejin image-compatibility-test`)
  console.log(`   3. 运行 pnpm test:image:wechat image-compatibility-test`)
}

main().catch(console.error)
