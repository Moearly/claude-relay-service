#!/bin/bash

# 新服务器完整部署脚本
# 服务器: 66.154.126.71

SERVER="root@66.154.126.71"
PASSWORD="mrp1xTuv1O"
APP_DIR="/opt/claude-relay-service"

echo "🚀 开始部署到新服务器 66.154.126.71"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 步骤1: 安装Node.js和必要工具
echo ""
echo "📦 步骤1: 安装环境..."
sshpass -p "$PASSWORD" ssh $SERVER << 'ENDSSH'
set -e

# 更新系统
apt-get update

# 安装Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 配置npm使用淘宝镜像
npm config set registry https://registry.npmmirror.com

# 安装PM2
npm install -g pm2

# 验证安装
echo "Node版本: $(node --version)"
echo "npm版本: $(npm --version)"
echo "PM2版本: $(pm2 --version)"

ENDSSH

if [ $? -ne 0 ]; then
    echo "❌ 环境安装失败"
    exit 1
fi

echo "✅ 环境安装完成"
sleep 2

# 步骤2: 创建应用目录
echo ""
echo "📁 步骤2: 创建应用目录..."
sshpass -p "$PASSWORD" ssh $SERVER "mkdir -p $APP_DIR"
echo "✅ 目录创建完成"
sleep 2

# 步骤3: 上传代码文件
echo ""
echo "📤 步骤3: 上传代码文件..."

cd "$(dirname "$0")/../.."

# 上传主要文件
sshpass -p "$PASSWORD" scp -r src $SERVER:$APP_DIR/
sshpass -p "$PASSWORD" scp package.json $SERVER:$APP_DIR/
sshpass -p "$PASSWORD" scp package-lock.json $SERVER:$APP_DIR/
sshpass -p "$PASSWORD" scp ecosystem.config.js $SERVER:$APP_DIR/

echo "✅ 文件上传完成"
sleep 2

# 步骤4: 创建.env文件
echo ""
echo "⚙️  步骤4: 配置环境变量..."
sshpass -p "$PASSWORD" ssh $SERVER << 'ENDSSH'
cat > /opt/claude-relay-service/.env << 'EOF'
# Server Configuration
PORT=3000
NODE_ENV=production

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/claude-relay

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin123456

# API Configuration
ANTHROPIC_API_KEY=your-anthropic-api-key

# CORS Configuration
CORS_ORIGIN=https://codewith.site

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session Configuration
SESSION_SECRET=your-session-secret-change-in-production
EOF

ENDSSH

echo "✅ 环境变量配置完成"
sleep 2

# 步骤5: 安装依赖
echo ""
echo "📦 步骤5: 安装依赖..."
sshpass -p "$PASSWORD" ssh $SERVER << 'ENDSSH'
cd /opt/claude-relay-service
npm config set registry https://registry.npmmirror.com
npm install --production
ENDSSH

echo "✅ 依赖安装完成"
sleep 2

# 步骤6: 安装和启动MongoDB
echo ""
echo "🗄️  步骤6: 安装MongoDB..."
sshpass -p "$PASSWORD" ssh $SERVER << 'ENDSSH'
set -e

# 安装MongoDB
apt-get install -y gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update
apt-get install -y mongodb-org

# 启动MongoDB
systemctl start mongod
systemctl enable mongod

# 验证
sleep 3
systemctl status mongod --no-pager

ENDSSH

echo "✅ MongoDB安装完成"
sleep 2

# 步骤7: 安装和启动Redis
echo ""
echo "💾 步骤7: 安装Redis..."
sshpass -p "$PASSWORD" ssh $SERVER << 'ENDSSH'
set -e

# 安装Redis
apt-get install -y redis-server

# 配置Redis
sed -i 's/^bind 127.0.0.1 ::1/bind 127.0.0.1/' /etc/redis/redis.conf

# 启动Redis
systemctl start redis-server
systemctl enable redis-server

# 验证
redis-cli ping

ENDSSH

echo "✅ Redis安装完成"
sleep 2

# 步骤8: 初始化数据库
echo ""
echo "🔧 步骤8: 初始化数据库..."
sshpass -p "$PASSWORD" ssh $SERVER << 'ENDSSH'
cd /opt/claude-relay-service

# 创建初始化脚本
cat > init-db.js << 'INITEOF'
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function init() {
  try {
    await mongoose.connect('mongodb://localhost:27017/claude-relay');
    console.log('✓ MongoDB连接成功');

    // 创建管理员用户
    const Admin = mongoose.model('Admin', new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, default: 'admin' },
      createdAt: { type: Date, default: Date.now }
    }));

    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin123456', 10);
      await Admin.create({
        username: 'admin',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('✓ 管理员账户创建成功');
    } else {
      console.log('✓ 管理员账户已存在');
    }

    await mongoose.disconnect();
    console.log('✓ 数据库初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  }
}

init();
INITEOF

node init-db.js

ENDSSH

echo "✅ 数据库初始化完成"
sleep 2

# 步骤9: 启动应用
echo ""
echo "🚀 步骤9: 启动应用..."
sshpass -p "$PASSWORD" ssh $SERVER << 'ENDSSH'
cd /opt/claude-relay-service

# 停止可能存在的进程
pm2 delete claude-relay-service 2>/dev/null || true

# 启动应用
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 等待启动
sleep 5

# 查看状态
pm2 status
pm2 logs claude-relay-service --lines 20 --nostream

ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 部署完成！"
echo ""
echo "📋 服务信息:"
echo "  - 服务器: 66.154.126.71"
echo "  - 端口: 3000"
echo "  - 管理员账号: admin"
echo "  - 管理员密码: Admin123456"
echo ""
echo "🔍 测试命令:"
echo "  curl http://66.154.126.71:3000/health"
echo ""
echo "📊 查看日志:"
echo "  sshpass -p '$PASSWORD' ssh $SERVER 'pm2 logs claude-relay-service'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

