#!/bin/bash

echo "🛑 正在关闭 Content Hub 开发服务器..."

# 查找并关闭占用端口 3001 的进程
PORT_3001_PID=$(lsof -ti :3001)
if [ -n "$PORT_3001_PID" ]; then
  echo "📌 找到 API 服务器进程 (端口 3001): $PORT_3001_PID"
  kill -9 $PORT_3001_PID
  echo "✅ API 服务器已关闭"
else
  echo "ℹ️  端口 3001 没有运行的进程"
fi

# 查找并关闭占用端口 5173 的进程
PORT_5173_PID=$(lsof -ti :5173)
if [ -n "$PORT_5173_PID" ]; then
  echo "📌 找到 Web UI 服务器进程 (端口 5173): $PORT_5173_PID"
  kill -9 $PORT_5173_PID
  echo "✅ Web UI 服务器已关闭"
else
  echo "ℹ️  端口 5173 没有运行的进程"
fi

echo ""
echo "✨ 所有开发服务器已关闭"
