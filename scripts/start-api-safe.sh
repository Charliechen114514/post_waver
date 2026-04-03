#!/bin/bash

# API 服务器安全启动脚本
# 自动处理端口占用问题

PORT=3001
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "🔍 检查端口 $PORT..."

# 查找占用端口的进程
PID=$(lsof -ti :$PORT 2>/dev/null)

if [ ! -z "$PID" ]; then
  echo "⚠️  端口 $PORT 被进程 $PID 占用"
  echo "🔄 正在停止旧进程..."
  kill -9 $PID 2>/dev/null
  sleep 1
  echo "✅ 旧进程已停止"
else
  echo "✅ 端口 $PORT 可用"
fi

echo "🚀 启动 API 服务器..."
# 运行完整的开发环境（包括 API 服务器和 Web UI）
exec pnpm exec tsx scripts/dev.ts
