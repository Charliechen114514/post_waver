#!/bin/bash

# 安全开发启动脚本
# 自动处理端口占用并启动所有服务

echo "🚀 Post Waver 安全启动脚本"
echo "=============================="

# 清理端口 3001
PORT=3001
PID=$(lsof -ti :$PORT 2>/dev/null)

if [ ! -z "$PID" ]; then
  echo "🧹 清理端口 $PORT (进程 $PID)..."
  kill -9 $PID 2>/dev/null
  sleep 1
  echo "✅ 端口 $PORT 已清理"
else
  echo "✅ 端口 $PORT 无冲突"
fi

# 启动所有服务
echo ""
echo "🎯 启动开发环境..."
pnpm dev
