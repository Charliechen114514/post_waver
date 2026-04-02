---
title: 测试文章 - 包含图片
date: 2026-04-02T00:00:00Z
tags: ['test', 'images']
---

# 图片测试

## 本地图片引用

这是一个相对路径的本地图片：

![本地 PNG 图片](../fixtures/images/test.png)

## HTML 标签图片

使用 HTML img 标签：

<img src="../fixtures/images/photo.jpg" alt="照片" />

## 外链图片

来自外部网站的图片：

![外链图片](https://example.com/external-image.png)

## Base64 图片

内嵌的 base64 图片：

![Base64 图片](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==)

## 多种图片格式混合

文章中包含多种图片引用方式：

1. Markdown 本地图片
2. HTML 本地图片
3. 外链图片
4. Base64 图片

## 缺失图片（应该保持不变）

这个图片文件不存在：

![缺失图片](../fixtures/images/missing.png)
