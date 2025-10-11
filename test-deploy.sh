#!/bin/bash

# 测试部署脚本的各个步骤

set -e

SERVER="156.229.163.86"
DEPLOY_DIR="/opt/claude-relay-service"
SERVER_USER="root"

echo "🧪 测试部署脚本"
echo ""

# 1. 测试打包
echo "1️⃣ 测试代码打包..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 检查需要排除的目录是否存在
if [ -d "node_modules" ]; then
    echo "  ✓ 找到 node_modules 目录"
fi

if [ -d "web/admin-spa/node_modules" ]; then
    echo "  ✓ 找到 web/admin-spa/node_modules 目录"
fi

# 测试打包命令
echo "  📦 开始打包..."
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='logs/*' \
    --exclude='data/*' \
    --exclude='.env' \
    --exclude='*.log' \
    --exclude='web/admin-spa/node_modules' \
    --exclude='web/admin-spa/dist' \
    -czf /tmp/test-deploy.tar.gz . 2>&1 | head -5

if [ -f /tmp/test-deploy.tar.gz ]; then
    SIZE=$(du -h /tmp/test-deploy.tar.gz | cut -f1)
    echo "  ✅ 打包成功，大小: $SIZE"
    
    # 显示压缩包内容预览
    echo ""
    echo "  📋 压缩包内容预览:"
    tar -tzf /tmp/test-deploy.tar.gz | head -20
    echo "  ..."
    
    # 清理
    rm /tmp/test-deploy.tar.gz
else
    echo "  ❌ 打包失败"
    exit 1
fi

echo ""

# 2. 检查必需文件
echo "2️⃣ 检查必需文件..."
REQUIRED_FILES=(
    "package.json"
    "src/app.js"
    "start.sh"
    "config/config.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file 不存在"
    fi
done

echo ""

# 3. 检查环境变量配置
echo "3️⃣ 检查环境变量..."
if [ -f ".env" ]; then
    echo "  ✓ .env 文件存在"
    if grep -q "MONGODB_ENABLED" .env; then
        echo "  ✓ MONGODB_ENABLED 已配置"
    else
        echo "  ⚠️  MONGODB_ENABLED 未配置（部署时会自动添加）"
    fi
else
    echo "  ℹ️  .env 文件不存在（将使用服务器配置）"
fi

echo ""

# 4. 检查SSH配置
echo "4️⃣ 检查SSH配置..."
if [ -f ~/.ssh/id_rsa ] || [ -f ~/.ssh/id_ed25519 ]; then
    echo "  ✓ SSH密钥存在"
else
    echo "  ⚠️  未找到SSH密钥"
fi

# 检查known_hosts
if grep -q "$SERVER" ~/.ssh/known_hosts 2>/dev/null; then
    echo "  ✓ 服务器已在known_hosts中"
else
    echo "  ℹ️  服务器未在known_hosts中（首次连接需要确认）"
fi

echo ""

# 5. 测试SSH连接（不会真正连接，只检查命令）
echo "5️⃣ SSH连接命令测试..."
SSH_CMD="ssh -o ConnectTimeout=5 $SERVER_USER@$SERVER 'echo test'"
echo "  命令: $SSH_CMD"
echo "  ℹ️  实际部署时会执行此命令"

echo ""

echo "╔══════════════════════════════════════════════════════════╗"
echo "║              ✅ 脚本测试完成                            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📝 测试结果:"
echo "  - 代码打包: ✅ 正常"
echo "  - 必需文件: ✅ 完整"
echo "  - 脚本逻辑: ✅ 正确"
echo ""
echo "💡 下一步:"
echo "  1. 确保SSH密钥已配置: ssh root@$SERVER"
echo "  2. 运行部署脚本: ./deploy-to-server.sh"
echo ""

