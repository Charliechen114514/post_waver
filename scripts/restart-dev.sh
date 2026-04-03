#!/bin/bash

echo "🔄 正在重启 Content Hub 开发服务器..."

# 关闭现有服务器
echo "1️⃣ 关闭现有服务器..."
bash scripts/stop-dev.sh

# 等待端口释放
sleep 2

# 重新构建
echo "2️⃣ 重新构建项目..."
pnpm build

# 启动服务器
echo "3️⃣ 启动开发服务器..."
pnpm dev

echo "✅ 服务器已重启！"
