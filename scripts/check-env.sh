#!/bin/bash

###############################################################################
# 环境配置检查工具
# 功能：验证服务器环境配置是否完整
###############################################################################

# 配置
SERVER_USER="root"
SERVER_HOST="156.229.163.86"
SERVER_PASSWORD="jR74pQyDMTRt*eti7@"
SERVER_PATH="/opt/claude-relay-service"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 执行远程命令
remote_exec() {
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no \
        "$SERVER_USER@$SERVER_HOST" "$1"
}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔍 环境配置检查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# 必需的环境变量
REQUIRED_VARS=(
    "MONGODB_URI"
    "CORS_ORIGIN"
    "JWT_SECRET"
    "ADMIN_JWT_SECRET"
)

# 可选的环境变量
OPTIONAL_VARS=(
    "REDIS_HOST"
    "REDIS_PORT"
    "REDIS_PASSWORD"
    "PORT"
    "NODE_ENV"
)

echo -e "${GREEN}必需的环境变量:${NC}\n"

for var in "${REQUIRED_VARS[@]}"; do
    value=$(remote_exec "cd $SERVER_PATH && grep '^$var=' .env 2>/dev/null | cut -d'=' -f2-")
    
    if [[ -n "$value" ]]; then
        # 隐藏敏感信息
        if [[ "$var" == *"SECRET"* ]] || [[ "$var" == *"PASSWORD"* ]]; then
            echo -e "  ${GREEN}✓${NC} $var = ${YELLOW}[已设置]${NC}"
        else
            echo -e "  ${GREEN}✓${NC} $var = ${BLUE}$value${NC}"
        fi
    else
        echo -e "  ${RED}✗${NC} $var = ${RED}[未设置]${NC}"
    fi
done

echo -e "\n${GREEN}可选的环境变量:${NC}\n"

for var in "${OPTIONAL_VARS[@]}"; do
    value=$(remote_exec "cd $SERVER_PATH && grep '^$var=' .env 2>/dev/null | cut -d'=' -f2-")
    
    if [[ -n "$value" ]]; then
        if [[ "$var" == *"PASSWORD"* ]]; then
            echo -e "  ${GREEN}✓${NC} $var = ${YELLOW}[已设置]${NC}"
        else
            echo -e "  ${GREEN}✓${NC} $var = ${BLUE}$value${NC}"
        fi
    else
        echo -e "  ${YELLOW}○${NC} $var = ${YELLOW}[未设置]${NC}"
    fi
done

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔌 服务状态检查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# 检查 MongoDB
echo -e "${GREEN}MongoDB:${NC}"
if remote_exec "pgrep mongod > /dev/null"; then
    echo -e "  ${GREEN}✓${NC} MongoDB 服务运行中"
    remote_exec "mongosh --quiet --eval 'db.adminCommand({ping: 1})' 2>/dev/null && echo '  ✓ 连接测试成功' || echo '  ✗ 连接测试失败'"
else
    echo -e "  ${RED}✗${NC} MongoDB 服务未运行"
fi

# 检查 Redis
echo -e "\n${GREEN}Redis:${NC}"
if remote_exec "pgrep redis-server > /dev/null"; then
    echo -e "  ${GREEN}✓${NC} Redis 服务运行中"
    remote_exec "redis-cli ping 2>/dev/null | grep -q PONG && echo '  ✓ 连接测试成功' || echo '  ✗ 连接测试失败'"
else
    echo -e "  ${YELLOW}○${NC} Redis 服务未运行（可选）"
fi

# 检查 Node.js 服务
echo -e "\n${GREEN}Node.js 服务:${NC}"
node_pid=$(remote_exec "ps aux | grep 'node.*server.js' | grep -v grep | awk '{print \$2}' | head -1")
if [[ -n "$node_pid" ]]; then
    echo -e "  ${GREEN}✓${NC} 服务运行中 (PID: $node_pid)"
    
    # 检查端口
    port=$(remote_exec "netstat -tlnp 2>/dev/null | grep ':3000' | awk '{print \$4}' | cut -d':' -f2")
    if [[ -n "$port" ]]; then
        echo -e "  ${GREEN}✓${NC} 端口 3000 监听中"
    else
        echo -e "  ${RED}✗${NC} 端口 3000 未监听"
    fi
else
    echo -e "  ${RED}✗${NC} 服务未运行"
fi

echo ""

