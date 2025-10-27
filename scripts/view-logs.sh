#!/bin/bash

###############################################################################
# 日志查看工具
# 功能：远程查看服务器日志，支持实时跟踪、错误过滤等
###############################################################################

# 配置
SERVER_USER="root"
SERVER_HOST="156.229.163.86"
SERVER_PASSWORD="jR74pQyDMTRt*eti7@"
SERVER_PATH="/opt/claude-relay-service"
LOG_FILE="logs/service.log"

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

# 显示帮助
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -f, --follow       实时跟踪日志"
    echo "  -e, --error        只显示错误日志"
    echo "  -n, --lines NUM    显示最后 NUM 行 (默认: 50)"
    echo "  -s, --search TEXT  搜索包含 TEXT 的日志"
    echo "  -h, --help         显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                 # 显示最后 50 行日志"
    echo "  $0 -f              # 实时跟踪日志"
    echo "  $0 -e              # 只显示错误"
    echo "  $0 -n 100          # 显示最后 100 行"
    echo "  $0 -s 'MongoDB'    # 搜索包含 MongoDB 的日志"
}

# 解析参数
FOLLOW=false
ERROR_ONLY=false
LINES=50
SEARCH=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -e|--error)
            ERROR_ONLY=true
            shift
            ;;
        -n|--lines)
            LINES="$2"
            shift 2
            ;;
        -s|--search)
            SEARCH="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 构建日志命令
build_log_command() {
    local cmd="cd $SERVER_PATH && "
    
    if [[ "$FOLLOW" == true ]]; then
        cmd+="tail -f $LOG_FILE"
    else
        cmd+="tail -n $LINES $LOG_FILE"
    fi
    
    if [[ "$ERROR_ONLY" == true ]]; then
        cmd+=" | grep -iE '(error|warning|fail)'"
    fi
    
    if [[ -n "$SEARCH" ]]; then
        cmd+=" | grep -i '$SEARCH'"
    fi
    
    echo "$cmd"
}

# 主函数
main() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📋 ApiRelay 服务日志${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    
    # 显示服务状态
    echo -e "${GREEN}服务状态:${NC}"
    remote_exec "ps aux | grep 'node.*server.js' | grep -v grep || echo '服务未运行'"
    echo ""
    
    # 显示日志
    local log_cmd=$(build_log_command)
    echo -e "${GREEN}日志内容:${NC}"
    echo -e "${YELLOW}执行命令: $log_cmd${NC}\n"
    
    remote_exec "$log_cmd"
}

# 执行
main

