#!/bin/bash
# 远程服务管理脚本

SERVER_IP="156.229.163.86"
SERVER_USER="root"
SERVER_PASS="jR74pQyDMTRt*eti7@"
ACTION=${1:-status}

echo "🔧 服务管理 - 操作: $ACTION"
echo ""

COMMANDS="
cd /opt/claude-relay-service
case '$ACTION' in
    start) npm run service:start:daemon ;;
    stop) npm run service:stop ;;
    restart) npm run service:restart ;;
    status) npm run service:status ;;
    logs) npm run service:logs ;;
    *) echo '用法: $0 {start|stop|restart|status|logs}'; exit 1 ;;
esac
"

if command -v sshpass &> /dev/null; then
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$COMMANDS"
else
    echo "手动执行命令:"
    echo "ssh $SERVER_USER@$SERVER_IP"
    echo "$COMMANDS"
fi
