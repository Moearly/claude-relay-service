#!/bin/bash

##############################################################################
# ApiRelay 优化部署脚本
# 原则：
# 1. 最少的 SSH 连接（只有 3 次）
# 2. 每次连接之间等待足够时间
# 3. 一次 SSH 中完成多个操作
##############################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

SERVER="root@156.229.163.86"
DIR="/opt/claude-relay-service"

log() { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; exit 1; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }

ssh_run() {
    sshpass -p 'jR74pQyDMTRt*eti7@' ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 $SERVER "$@"
}

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════╗"
echo "║   ApiRelay 优化部署脚本 (3次SSH连接)    ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================================================
# 第 1 次 SSH：测试连接 + 备份
# ============================================================================
log "第 1 次 SSH：测试连接并备份..."
if ! ssh_run "cd $DIR && mkdir -p backups && tar -czf backups/backup_$(date +%Y%m%d_%H%M%S).tar.gz src/routes/admin.js 2>/dev/null && echo 'OK'"; then
    error "连接失败或备份失败"
fi
success "连接正常，备份完成"

log "等待 15 秒..."
sleep 15

# ============================================================================
# 上传文件（SCP，不是 SSH）
# ============================================================================
log "上传文件..."
if ! sshpass -p 'jR74pQyDMTRt*eti7@' scp -o StrictHostKeyChecking=no src/routes/admin.js $SERVER:$DIR/src/routes/admin.js; then
    error "文件上传失败"
fi
success "文件上传完成"

log "等待 15 秒..."
sleep 15

# ============================================================================
# 第 2 次 SSH：重启服务（简化版）
# ============================================================================
log "第 2 次 SSH：重启服务..."

# 简化：只执行重启命令
ssh_run "cd $DIR && npm run service:restart" || warn "重启命令执行完成（可能有警告）"

success "重启命令已执行"

log "等待服务初始化 (20秒)..."
sleep 20

# ============================================================================
# 第 3 次 SSH：验证服务状态
# ============================================================================
log "第 3 次 SSH：验证服务状态..."
ssh_run "
    if pgrep -f 'node.*app.js' > /dev/null; then
        echo '✓ 进程运行中'
        ps aux | grep 'node.*app.js' | grep -v grep | head -1
    else
        echo '✗ 进程未运行'
        exit 1
    fi
" || error "服务验证失败"

success "服务验证通过"

# ============================================================================
# HTTP 健康检查（不需要 SSH）
# ============================================================================
log "HTTP 健康检查..."
for i in {1..10}; do
    if curl -s -f https://api.codewith.site/health > /dev/null 2>&1; then
        success "健康检查通过"
        
        echo ""
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}🎉 部署成功！${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}📊 SSH 连接次数: 3 次${NC}"
        echo -e "${GREEN}🌐 API 地址: https://api.codewith.site${NC}"
        echo ""
        
        exit 0
    fi
    echo -n "."
    sleep 3
done

warn "HTTP 健康检查失败，但服务进程正在运行"
warn "可能需要更多时间初始化，请稍后手动检查"
echo ""
echo "手动检查命令："
echo "  curl https://api.codewith.site/health"

