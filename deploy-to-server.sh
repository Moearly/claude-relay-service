#!/bin/bash

# Claude Relay Service 服务器部署脚本
# 目标服务器: 156.229.163.86

set -e

SERVER="156.229.163.86"
DEPLOY_DIR="/opt/claude-relay-service"
SERVER_USER="root"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     🚀 部署 Claude Relay Service 到生产服务器          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "服务器: $SERVER"
echo "部署目录: $DEPLOY_DIR"
echo ""

# 1. 检查SSH连接
echo "1️⃣ 检查服务器连接..."
if ssh -o ConnectTimeout=5 $SERVER_USER@$SERVER "echo '✅ SSH连接成功'" 2>/dev/null; then
    echo "✅ 服务器连接正常"
else
    echo "❌ 无法连接到服务器，请检查:"
    echo "   1. 服务器IP是否正确"
    echo "   2. SSH密钥是否配置"
    echo "   3. 网络连接是否正常"
    exit 1
fi
echo ""

# 2. 停止服务
echo "2️⃣ 停止现有服务..."
ssh $SERVER_USER@$SERVER "cd $DEPLOY_DIR && npm run service:stop 2>/dev/null || true"
echo "✅ 服务已停止"
echo ""

# 3. 备份现有配置
echo "3️⃣ 备份现有配置..."
ssh $SERVER_USER@$SERVER "
    cd $DEPLOY_DIR
    mkdir -p /tmp/claude-relay-backup
    cp .env /tmp/claude-relay-backup/.env 2>/dev/null || true
    cp -r data /tmp/claude-relay-backup/data 2>/dev/null || true
    echo '✅ 配置已备份到 /tmp/claude-relay-backup'
"
echo ""

# 4. 打包本地代码
echo "4️⃣ 打包本地代码..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 排除不需要的文件
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='logs/*' \
    --exclude='data/*' \
    --exclude='.env' \
    --exclude='*.log' \
    --exclude='web/admin-spa/node_modules' \
    --exclude='web/admin-spa/dist' \
    -czf /tmp/claude-relay-deploy.tar.gz .

echo "✅ 代码已打包"
echo ""

# 5. 上传到服务器
echo "5️⃣ 上传代码到服务器..."
scp /tmp/claude-relay-deploy.tar.gz $SERVER_USER@$SERVER:/tmp/
echo "✅ 代码已上传"
echo ""

# 6. 解压并更新代码
echo "6️⃣ 更新服务器代码..."
ssh $SERVER_USER@$SERVER "
    cd $DEPLOY_DIR
    tar -xzf /tmp/claude-relay-deploy.tar.gz
    rm /tmp/claude-relay-deploy.tar.gz
    echo '✅ 代码已更新'
"
echo ""

# 7. 恢复配置
echo "7️⃣ 恢复配置文件..."
ssh $SERVER_USER@$SERVER "
    cd $DEPLOY_DIR
    cp /tmp/claude-relay-backup/.env . 2>/dev/null || echo '⚠️  .env 文件不存在，需要手动配置'
    cp -r /tmp/claude-relay-backup/data . 2>/dev/null || echo '⚠️  data 目录不存在'
    
    # 确保必要的环境变量存在
    if ! grep -q 'MONGODB_ENABLED' .env 2>/dev/null; then
        echo 'MONGODB_ENABLED=true' >> .env
        echo '✅ 已添加 MONGODB_ENABLED=true'
    fi
    
    echo '✅ 配置已恢复'
"
echo ""

# 8. 安装依赖
echo "8️⃣ 安装依赖..."
ssh $SERVER_USER@$SERVER "
    cd $DEPLOY_DIR
    npm install --production
    echo '✅ 依赖安装完成'
"
echo ""

# 9. 启动服务
echo "9️⃣ 启动服务..."
ssh $SERVER_USER@$SERVER "
    cd $DEPLOY_DIR
    npm run service:start:daemon
    sleep 5
    echo '✅ 服务已启动'
"
echo ""

# 10. 健康检查
echo "🔟 验证服务状态..."
sleep 3
HEALTH_CHECK=$(ssh $SERVER_USER@$SERVER "curl -s http://localhost:3000/health" || echo "failed")

if echo "$HEALTH_CHECK" | grep -q "healthy"; then
    echo "✅ 服务运行正常"
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║               🎉 部署成功！                             ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    echo "📍 访问地址:"
    echo "  - 健康检查: http://$SERVER:3000/health"
    echo "  - Admin界面: http://$SERVER:3000/admin-next/"
    echo "  - API端点: http://$SERVER:3000/api/v1/messages"
    echo ""
    echo "📊 查看日志:"
    echo "  ssh $SERVER_USER@$SERVER 'cd $DEPLOY_DIR && npm run service:logs'"
    echo ""
    echo "🔧 管理命令:"
    echo "  重启服务: ssh $SERVER_USER@$SERVER 'cd $DEPLOY_DIR && npm run service:restart:daemon'"
    echo "  停止服务: ssh $SERVER_USER@$SERVER 'cd $DEPLOY_DIR && npm run service:stop'"
    echo ""
else
    echo "❌ 服务健康检查失败"
    echo ""
    echo "请检查日志:"
    echo "  ssh $SERVER_USER@$SERVER 'cd $DEPLOY_DIR && cat logs/service-error.log'"
    exit 1
fi

# 清理
rm /tmp/claude-relay-deploy.tar.gz 2>/dev/null || true

echo "✅ 部署完成！"

