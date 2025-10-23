#!/bin/bash
# CORS 配置脚本
# 用于配置生产服务器的跨域设置

SERVER_IP="156.229.163.86"
SERVER_USER="root"
SERVER_PASS="jR74pQyDMTRt*eti7@"

echo "🔧 配置服务器 CORS..."
echo ""

# 方法1: 使用 sshpass
if command -v sshpass &> /dev/null; then
    echo "使用 sshpass 连接..."
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" bash << 'ENDSSH'
cd /opt/claude-relay-service
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
sed -i '/^CORS_ORIGIN=/d' .env
echo "CORS_ORIGIN=https://codewith.site,https://www.codewith.site" >> .env
npm run service:restart
ENDSSH
else
    # 方法2: 手动SSH
    echo "请手动SSH到服务器执行以下命令:"
    echo ""
    echo "ssh $SERVER_USER@$SERVER_IP"
    echo "cd /opt/claude-relay-service"
    echo "sed -i '/^CORS_ORIGIN=/d' .env"
    echo "echo 'CORS_ORIGIN=https://codewith.site,https://www.codewith.site' >> .env"
    echo "npm run service:restart"
fi

echo ""
echo "✅ 配置完成！"
