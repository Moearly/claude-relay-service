#!/bin/bash

###############################################################################
# ApiRelay 后端部署脚本
# 功能：自动化部署、环境检查、服务重启、健康验证
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
SERVER_USER="root"
SERVER_HOST="156.229.163.86"
SERVER_PASSWORD="jR74pQyDMTRt*eti7@"
SERVER_PATH="/opt/claude-relay-service"
HEALTH_CHECK_URL="https://api.codewith.site/health"
MAX_RETRIES=5
RETRY_DELAY=3

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 步骤标题
step() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📦 $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# 执行远程命令
remote_exec() {
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no \
        "$SERVER_USER@$SERVER_HOST" "$1"
}

# 上传文件
upload_file() {
    local local_path=$1
    local remote_path=$2
    sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no \
        "$local_path" "$SERVER_USER@$SERVER_HOST:$remote_path"
}

# 检查本地环境
check_local_env() {
    step "检查本地环境"
    
    # 检查必要的命令
    for cmd in sshpass ssh scp git node npm; do
        if ! command -v $cmd &> /dev/null; then
            log_error "缺少必要命令: $cmd"
            exit 1
        fi
        log_success "✓ $cmd"
    done
    
    # 检查 Git 状态
    if [[ -n $(git status -s) ]]; then
        log_warning "有未提交的更改"
        git status -s
        read -p "是否继续部署? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_success "Git 工作区干净"
    fi
}

# 检查服务器环境
check_server_env() {
    step "检查服务器环境"
    
    log_info "检查服务器连接..."
    if ! remote_exec "echo 'connected'" &> /dev/null; then
        log_error "无法连接到服务器"
        exit 1
    fi
    log_success "服务器连接正常"
    
    log_info "检查服务器目录..."
    if ! remote_exec "test -d $SERVER_PATH"; then
        log_error "服务器目录不存在: $SERVER_PATH"
        exit 1
    fi
    log_success "服务器目录存在"
    
    log_info "检查环境配置..."
    remote_exec "cd $SERVER_PATH && cat .env | grep -E '(MONGODB_URI|CORS_ORIGIN|JWT_SECRET)' || echo '警告: 环境变量可能不完整'"
}

# 备份当前版本
backup_current() {
    step "备份当前版本"
    
    local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
    log_info "创建备份: $backup_name"
    
    remote_exec "cd $SERVER_PATH && mkdir -p backups && tar -czf backups/$backup_name.tar.gz src/ package.json || true"
    log_success "备份完成"
}

# 上传代码
upload_code() {
    step "上传代码文件"
    
    # 需要上传的文件列表
    local files=(
        "src/routes/admin.js"
        "src/routes/subscriptionRoutes.js"
        "src/middleware/auth.js"
        "src/server.js"
        "package.json"
    )
    
    for file in "${files[@]}"; do
        if [[ -f "$file" ]]; then
            log_info "上传: $file"
            upload_file "$file" "$SERVER_PATH/$file"
            log_success "✓ $file"
        else
            log_warning "文件不存在，跳过: $file"
        fi
    done
}

# 安装依赖
install_dependencies() {
    step "安装依赖"
    
    log_info "检查 package.json 变化..."
    local needs_install=$(remote_exec "cd $SERVER_PATH && git diff package.json | wc -l")
    
    if [[ $needs_install -gt 0 ]] || [[ "$1" == "--force" ]]; then
        log_info "安装 npm 依赖..."
        remote_exec "cd $SERVER_PATH && npm install --production"
        log_success "依赖安装完成"
    else
        log_info "依赖无变化，跳过安装"
    fi
}

# 停止旧服务
stop_service() {
    step "停止旧服务"
    
    log_info "查找占用端口的进程..."
    local pids=$(remote_exec "netstat -tlnp 2>/dev/null | grep ':3000' | awk '{print \$7}' | cut -d'/' -f1 | grep -v '-' || true")
    
    if [[ -n "$pids" ]]; then
        log_warning "发现运行中的进程: $pids"
        remote_exec "kill -9 $pids 2>/dev/null || true"
        sleep 2
        log_success "旧服务已停止"
    else
        log_info "没有运行中的服务"
    fi
}

# 启动服务
start_service() {
    step "启动服务"
    
    log_info "启动后端服务..."
    remote_exec "cd $SERVER_PATH && npm run service:start:daemon"
    
    log_info "等待服务启动..."
    sleep 5
    
    # 检查进程
    local pid=$(remote_exec "ps aux | grep 'node.*server.js' | grep -v grep | awk '{print \$2}' | head -1")
    if [[ -n "$pid" ]]; then
        log_success "服务已启动 (PID: $pid)"
    else
        log_error "服务启动失败"
        exit 1
    fi
}

# 健康检查
health_check() {
    step "健康检查"
    
    local retry=0
    while [[ $retry -lt $MAX_RETRIES ]]; do
        log_info "尝试 $((retry + 1))/$MAX_RETRIES: 检查健康状态..."
        
        if curl -f -s -o /dev/null "$HEALTH_CHECK_URL"; then
            log_success "✓ 健康检查通过"
            
            # 显示服务信息
            local response=$(curl -s "$HEALTH_CHECK_URL")
            echo "$response" | jq '.' 2>/dev/null || echo "$response"
            return 0
        fi
        
        retry=$((retry + 1))
        if [[ $retry -lt $MAX_RETRIES ]]; then
            log_warning "健康检查失败，${RETRY_DELAY}秒后重试..."
            sleep $RETRY_DELAY
        fi
    done
    
    log_error "健康检查失败"
    return 1
}

# 检查日志
check_logs() {
    step "检查服务日志"
    
    log_info "最近的错误日志:"
    remote_exec "cd $SERVER_PATH && tail -50 logs/service.log 2>/dev/null | grep -iE '(error|warning)' | tail -10 || echo '暂无错误日志'"
}

# 运行 API 测试
run_api_tests() {
    step "运行 API 测试"
    
    if [[ -f "scripts/test-api.js" ]]; then
        log_info "执行接口测试..."
        node scripts/test-api.js || log_warning "部分测试失败，请检查"
    else
        log_warning "测试脚本不存在，跳过"
    fi
}

# 主函数
main() {
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════╗"
    echo "║     ApiRelay 后端自动化部署脚本          ║"
    echo "╚═══════════════════════════════════════════╝"
    echo -e "${NC}\n"
    
    # 执行部署流程
    check_local_env
    check_server_env
    backup_current
    upload_code
    install_dependencies "$@"
    stop_service
    start_service
    
    # 验证部署
    if health_check; then
        check_logs
        run_api_tests
        
        echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}🎉 部署成功！${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    else
        log_error "部署失败，请检查日志"
        check_logs
        exit 1
    fi
}

# 执行主函数
main "$@"

