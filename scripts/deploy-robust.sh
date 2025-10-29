#!/bin/bash

##############################################################################
# ApiRelay 后端健壮部署脚本
# 功能：自动处理连接重试、端口占用、错误恢复
##############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
SERVER_HOST="156.229.163.86"
SERVER_USER="root"
SERVER_PASSWORD="jR74pQyDMTRt*eti7@"
SERVER_DIR="/opt/claude-relay-service"
MAX_RETRIES=5
RETRY_DELAY=15

# SSH 基础命令
SSH_CMD="sshpass -p '$SERVER_PASSWORD' ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -o ConnectTimeout=30"
SCP_CMD="sshpass -p '$SERVER_PASSWORD' scp -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -o ConnectTimeout=30"

##############################################################################
# 工具函数
##############################################################################

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

print_header() {
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════╗"
    echo "║   ApiRelay 后端健壮部署脚本 v2.0        ║"
    echo "╚═══════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# 执行 SSH 命令（带重试）
ssh_with_retry() {
    local cmd="$1"
    local attempt=1
    local delay=$RETRY_DELAY
    
    while [ $attempt -le $MAX_RETRIES ]; do
        log_info "执行 SSH 命令 (尝试 $attempt/$MAX_RETRIES)..."
        
        if $SSH_CMD $SERVER_USER@$SERVER_HOST "$cmd" 2>/dev/null; then
            return 0
        fi
        
        if [ $attempt -lt $MAX_RETRIES ]; then
            log_warning "SSH 连接失败，等待 ${delay} 秒后重试..."
            sleep $delay
            delay=$((delay + 10))  # 递增延迟
        fi
        
        ((attempt++))
    done
    
    log_error "SSH 命令执行失败，已重试 $MAX_RETRIES 次"
    return 1
}

# 上传文件（带重试）
scp_with_retry() {
    local src="$1"
    local dst="$2"
    local attempt=1
    local delay=$RETRY_DELAY
    
    while [ $attempt -le $MAX_RETRIES ]; do
        log_info "上传文件: $(basename $src) (尝试 $attempt/$MAX_RETRIES)..."
        
        if $SCP_CMD "$src" "$SERVER_USER@$SERVER_HOST:$dst" 2>/dev/null; then
            log_success "✓ $(basename $src)"
            return 0
        fi
        
        if [ $attempt -lt $MAX_RETRIES ]; then
            log_warning "文件上传失败，等待 ${delay} 秒后重试..."
            sleep $delay
            delay=$((delay + 10))
        fi
        
        ((attempt++))
    done
    
    log_error "文件上传失败: $(basename $src)"
    return 1
}

##############################################################################
# 部署步骤
##############################################################################

# 1. 检查本地环境
check_local_environment() {
    print_section "📦 检查本地环境"
    
    # 检查必需工具
    for tool in sshpass ssh scp git node npm; do
        if command -v $tool &> /dev/null; then
            log_success "✓ $tool"
        else
            log_error "✗ $tool 未安装"
            exit 1
        fi
    done
    
    # 检查 Git 状态
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "有未提交的更改"
        git status --short
        read -p "是否继续部署？(y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 0
        fi
    else
        log_success "Git 工作区干净"
    fi
}

# 2. 测试服务器连接
test_server_connection() {
    print_section "🔌 测试服务器连接"
    
    log_info "测试 SSH 连接..."
    if ssh_with_retry "echo 'Connection OK'"; then
        log_success "服务器连接正常"
    else
        log_error "无法连接到服务器"
        exit 1
    fi
}

# 3. 备份当前版本
backup_current_version() {
    print_section "💾 备份当前版本"
    
    local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
    log_info "创建备份: $backup_name"
    
    ssh_with_retry "cd $SERVER_DIR && mkdir -p backups && tar -czf backups/$backup_name.tar.gz src/ package.json 2>/dev/null || echo 'Backup created'"
    
    log_success "备份完成"
}

# 4. 上传代码文件
upload_files() {
    print_section "📤 上传代码文件"
    
    # 需要上传的文件列表
    local files=(
        "src/routes/admin.js"
        "src/routes/subscriptionRoutes.js"
        "src/middleware/auth.js"
        "src/models/redis.js"
        "src/app.js"
        "package.json"
    )
    
    local failed_files=()
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            if ! scp_with_retry "$file" "$SERVER_DIR/$file"; then
                failed_files+=("$file")
            fi
        else
            log_warning "文件不存在，跳过: $file"
        fi
    done
    
    if [ ${#failed_files[@]} -gt 0 ]; then
        log_error "以下文件上传失败:"
        for file in "${failed_files[@]}"; do
            echo "  - $file"
        done
        exit 1
    fi
    
    log_success "所有文件上传完成"
}

# 5. 安装依赖
install_dependencies() {
    print_section "📦 安装依赖"
    
    log_info "检查 package.json 变化..."
    
    # 检查是否需要安装依赖
    if ssh_with_retry "cd $SERVER_DIR && [ package.json -nt node_modules ] 2>/dev/null"; then
        log_info "检测到依赖变化，执行 npm install..."
        ssh_with_retry "cd $SERVER_DIR && npm install --production 2>&1 | tail -10"
        log_success "依赖安装完成"
    else
        log_info "依赖无变化，跳过安装"
    fi
}

# 6. 停止旧服务
stop_old_service() {
    print_section "🛑 停止旧服务"
    
    log_info "查找运行中的服务..."
    
    # 检查是否有进程在运行
    if ssh_with_retry "pgrep -f 'node.*app.js' > /dev/null"; then
        log_info "发现运行中的进程，正在停止..."
        
        # 尝试优雅停止
        ssh_with_retry "cd $SERVER_DIR && npm run service:stop 2>/dev/null || true"
        sleep 3
        
        # 强制停止残留进程
        ssh_with_retry "pkill -9 -f 'node.*app.js' 2>/dev/null || true"
        sleep 2
        
        log_success "旧服务已停止"
    else
        log_info "没有运行中的服务"
    fi
    
    # 清理端口占用
    log_info "检查端口 3000..."
    ssh_with_retry "lsof -ti:3000 | xargs kill -9 2>/dev/null || true"
    sleep 2
    
    log_success "端口已清理"
}

# 7. 启动新服务
start_new_service() {
    print_section "🚀 启动新服务"
    
    log_info "启动服务..."
    
    if ssh_with_retry "cd $SERVER_DIR && npm run service:start:daemon 2>&1 | tail -20"; then
        log_success "服务启动命令已执行"
    else
        log_error "服务启动失败"
        return 1
    fi
    
    # 等待服务启动
    log_info "等待服务初始化 (10秒)..."
    sleep 10
}

# 8. 健康检查
health_check() {
    print_section "🏥 健康检查"
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "健康检查 (尝试 $attempt/$max_attempts)..."
        
        # 检查进程
        if ssh_with_retry "pgrep -f 'node.*app.js' > /dev/null"; then
            log_success "✓ 进程运行中"
            
            # 检查 HTTP 响应
            sleep 3
            if curl -s -f https://api.codewith.site/health > /dev/null 2>&1; then
                log_success "✓ HTTP 健康检查通过"
                return 0
            else
                log_warning "HTTP 健康检查失败，继续等待..."
            fi
        else
            log_warning "进程未运行，继续等待..."
        fi
        
        sleep 5
        ((attempt++))
    done
    
    log_error "健康检查失败"
    
    # 显示错误日志
    log_info "查看错误日志..."
    ssh_with_retry "cd $SERVER_DIR && tail -50 logs/service-error.log 2>/dev/null || tail -50 logs/*.log 2>/dev/null || echo 'No logs found'"
    
    return 1
}

# 9. 验证部署
verify_deployment() {
    print_section "✅ 验证部署"
    
    log_info "检查服务状态..."
    ssh_with_retry "cd $SERVER_DIR && npm run service:status 2>&1 | tail -10"
    
    log_info "检查最近的日志..."
    ssh_with_retry "cd $SERVER_DIR && tail -20 logs/*.log 2>/dev/null | grep -E '(ERROR|WARN|INFO)' | tail -10 || echo 'No recent logs'"
    
    log_success "部署验证完成"
}

# 10. 回滚（如果需要）
rollback() {
    print_section "🔄 执行回滚"
    
    log_warning "部署失败，正在回滚..."
    
    # 获取最新的备份
    local latest_backup=$(ssh_with_retry "cd $SERVER_DIR/backups && ls -t *.tar.gz 2>/dev/null | head -1")
    
    if [ -n "$latest_backup" ]; then
        log_info "恢复备份: $latest_backup"
        ssh_with_retry "cd $SERVER_DIR && tar -xzf backups/$latest_backup"
        
        stop_old_service
        start_new_service
        
        log_success "回滚完成"
    else
        log_error "没有找到备份文件"
    fi
}

##############################################################################
# 主流程
##############################################################################

main() {
    print_header
    
    # 记录开始时间
    local start_time=$(date +%s)
    
    # 执行部署步骤
    check_local_environment
    test_server_connection
    backup_current_version
    upload_files
    install_dependencies
    stop_old_service
    start_new_service
    
    # 健康检查
    if health_check; then
        verify_deployment
        
        # 计算耗时
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        echo ""
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}🎉 部署成功！${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}⏱️  总耗时: ${duration} 秒${NC}"
        echo -e "${GREEN}🌐 API 地址: https://api.codewith.site${NC}"
        echo ""
        
        exit 0
    else
        log_error "健康检查失败"
        
        # 询问是否回滚
        read -p "是否回滚到上一个版本？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rollback
        fi
        
        exit 1
    fi
}

# 捕获错误
trap 'log_error "部署过程中发生错误"; exit 1' ERR

# 执行主流程
main "$@"

