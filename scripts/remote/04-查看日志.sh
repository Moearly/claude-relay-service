#!/bin/bash
# 远程日志查看脚本

SERVER_IP="156.229.163.86"
SERVER_USER="root"
SERVER_PASS="jR74pQyDMTRt*eti7@"
LINES=${1:-50}

echo "📜 查看最近 $LINES 行日志"
echo ""

if command -v sshpass &> /dev/null; then
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" \
        "tail -n $LINES /opt/claude-relay-service/logs/app.log"
else
    echo "手动执行:"
    echo "ssh $SERVER_USER@$SERVER_IP"
    echo "tail -n $LINES /opt/claude-relay-service/logs/app.log"
fi
