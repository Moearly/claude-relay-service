#!/bin/bash

# 启动 Claude Relay 服务

echo "🚀 启动 Claude Relay 服务..."
echo ""

# 检查 MongoDB
if ! pgrep -x mongod > /dev/null && ! nc -z localhost 27017 > /dev/null 2>&1; then
    echo "❌ MongoDB 未运行"
    echo ""
    echo "   请先启动 MongoDB:"
    echo "   sudo systemctl start mongod"
    echo ""
    echo "   如果未安装:"
    echo "   Ubuntu/Debian: sudo apt install mongodb"
    echo "   CentOS/RHEL:   sudo yum install mongodb-server"
    echo "   macOS:         brew install mongodb-community"
    echo ""
    exit 1
fi

# 检查 Redis
if ! pgrep -x redis-server > /dev/null && ! nc -z localhost 6379 > /dev/null 2>&1; then
    echo "❌ Redis 未运行"
    echo ""
    echo "   请先启动 Redis:"
    echo "   sudo systemctl start redis"
    echo ""
    echo "   如果未安装:"
    echo "   Ubuntu/Debian: sudo apt install redis"
    echo "   CentOS/RHEL:   sudo yum install redis"
    echo "   macOS:         brew install redis"
    echo ""
    exit 1
fi

echo "✅ MongoDB 运行正常"
echo "✅ Redis 运行正常"
echo ""

# 检查并清理端口
if lsof -i:18080 > /dev/null 2>&1; then
    echo "⚠️  端口 18080 已被占用，正在清理..."
    lsof -ti:18080 | xargs kill -9 2>/dev/null
    sleep 2
    echo "✅ 端口已清理"
    echo ""
fi

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    echo ""
fi

# 启动服务
echo "🚀 启动后端服务 (端口 18080)..."
echo ""
node src/app.js

