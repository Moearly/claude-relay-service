# ApiRelay 运维工具集

这个目录包含了一套完整的自动化运维工具，用于简化部署、测试和日志管理。

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装 sshpass (用于自动化 SSH)
# Ubuntu/Debian
sudo apt-get install sshpass

# macOS
brew install hudochenkov/sshpass/sshpass

# 安装 Node.js 依赖
cd /home/leiyi/codeSpace/ApiRelay/claude-relay-service
npm install
```

### 2. 赋予脚本执行权限

```bash
chmod +x scripts/*.sh
```

### 3. 配置环境变量（可选）

```bash
# 用于 API 测试
export ADMIN_TOKEN="your-admin-token-here"
export API_BASE_URL="https://api.codewith.site"
```

---

## 📦 工具列表

### 1. deploy.sh - 自动化部署脚本

**功能**: 一键完成代码部署、服务重启、健康检查的完整流程。

**使用方法**:

```bash
# 标准部署
./scripts/deploy.sh

# 强制重新安装依赖
./scripts/deploy.sh --force
```

**执行流程**:
1. ✅ 检查本地环境（git, node, npm, sshpass）
2. ✅ 检查服务器环境（连接、目录、配置）
3. ✅ 备份当前版本
4. ✅ 上传代码文件
5. ✅ 安装依赖（如需要）
6. ✅ 停止旧服务
7. ✅ 启动新服务
8. ✅ 健康检查（重试 5 次）
9. ✅ 运行 API 测试

**输出示例**:

```
╔═══════════════════════════════════════════╗
║     ApiRelay 后端自动化部署脚本          ║
╚═══════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 检查本地环境
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[SUCCESS] ✓ sshpass
[SUCCESS] ✓ ssh
[SUCCESS] ✓ git
[SUCCESS] Git 工作区干净

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 部署成功！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 2. test-api.js - API 接口测试脚本

**功能**: 自动测试所有管理员接口，验证服务是否正常工作。

**使用方法**:

```bash
# 基础测试（不需要认证的接口）
node scripts/test-api.js

# 完整测试（需要设置 ADMIN_TOKEN）
export ADMIN_TOKEN="your-admin-token"
node scripts/test-api.js

# 指定测试服务器
export API_BASE_URL="https://api.codewith.site"
node scripts/test-api.js
```

**测试覆盖**:
- ✅ 健康检查 (`/health`)
- ✅ 用户列表 (`/admin/users`)
- ✅ 订单列表 (`/admin/orders`)
- ✅ 公告列表 (`/admin/announcements`)
- ✅ 套餐列表 (`/admin/subscription-plans`)
- ✅ 系统统计 (`/admin/stats`)
- ✅ 导出数据 (`/admin/users/export`)
- ✅ CORS 配置

**输出示例**:

```
🧪 API 接口健康检查

目标服务器: https://api.codewith.site
认证状态: 已配置

✓ 健康检查
✓ 获取用户列表
✓ 获取订单列表
✓ 获取公告列表
✗ 获取套餐列表
  错误: 状态码不匹配: 期望 200, 实际 500

📊 测试结果统计

总计: 8
通过: 7
失败: 1
跳过: 0

成功率: 87.50%
```

---

### 3. view-logs.sh - 日志查看工具

**功能**: 远程查看服务器日志，支持实时跟踪、错误过滤、关键词搜索。

**使用方法**:

```bash
# 查看最后 50 行日志（默认）
./scripts/view-logs.sh

# 实时跟踪日志
./scripts/view-logs.sh -f

# 只显示错误日志
./scripts/view-logs.sh -e

# 显示最后 100 行
./scripts/view-logs.sh -n 100

# 搜索包含 "MongoDB" 的日志
./scripts/view-logs.sh -s "MongoDB"

# 组合使用：查看最后 50 行错误日志
./scripts/view-logs.sh -e -n 50

# 实时跟踪错误日志
./scripts/view-logs.sh -f -e
```

**选项说明**:
- `-f, --follow`: 实时跟踪日志（类似 `tail -f`）
- `-e, --error`: 只显示错误和警告
- `-n, --lines NUM`: 显示最后 NUM 行
- `-s, --search TEXT`: 搜索包含 TEXT 的日志
- `-h, --help`: 显示帮助信息

**输出示例**:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ApiRelay 服务日志
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

服务状态:
root     1234567  0.5  2.1 1234567 123456 ?  Ssl  10:00   0:05 node src/server.js

日志内容:
执行命令: cd /opt/claude-relay-service && tail -n 50 logs/service.log

[2025-01-27 10:00:00] INFO: Server started on port 3000
[2025-01-27 10:00:01] INFO: MongoDB connected
[2025-01-27 10:00:02] INFO: Redis connected
```

---

### 4. check-env.sh - 环境配置检查工具

**功能**: 验证服务器环境配置是否完整，检查必需的环境变量和服务状态。

**使用方法**:

```bash
./scripts/check-env.sh
```

**检查内容**:
- ✅ 必需的环境变量（MONGODB_URI, CORS_ORIGIN, JWT_SECRET 等）
- ✅ 可选的环境变量（REDIS_HOST, PORT, NODE_ENV 等）
- ✅ MongoDB 服务状态和连接
- ✅ Redis 服务状态和连接
- ✅ Node.js 服务状态和端口监听

**输出示例**:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 环境配置检查
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

必需的环境变量:

  ✓ MONGODB_URI = mongodb://localhost:27017/claude-relay
  ✓ CORS_ORIGIN = https://codewith.site,https://www.codewith.site
  ✓ JWT_SECRET = [已设置]
  ✓ ADMIN_JWT_SECRET = [已设置]

可选的环境变量:

  ✓ REDIS_HOST = localhost
  ✓ REDIS_PORT = 6379
  ○ REDIS_PASSWORD = [未设置]
  ✓ PORT = 3000
  ✓ NODE_ENV = production

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔌 服务状态检查
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MongoDB:
  ✓ MongoDB 服务运行中
  ✓ 连接测试成功

Redis:
  ✓ Redis 服务运行中
  ✓ 连接测试成功

Node.js 服务:
  ✓ 服务运行中 (PID: 1234567)
  ✓ 端口 3000 监听中
```

---

## 🔄 典型工作流程

### 日常开发部署

```bash
# 1. 本地开发和测试
npm run dev

# 2. 提交代码
git add .
git commit -m "feat: 添加新功能"
git push

# 3. 部署到服务器
./scripts/deploy.sh

# 4. 验证部署（自动执行）
# - 健康检查
# - API 测试
# - 日志检查
```

### 问题排查流程

```bash
# 1. 检查环境配置
./scripts/check-env.sh

# 2. 查看错误日志
./scripts/view-logs.sh -e -n 100

# 3. 搜索特定错误
./scripts/view-logs.sh -s "MongoDB timeout"

# 4. 实时跟踪问题
./scripts/view-logs.sh -f -e

# 5. 运行 API 测试定位问题
node scripts/test-api.js
```

### 紧急回滚流程

```bash
# 1. 登录服务器
ssh root@156.229.163.86

# 2. 查看备份
ls -lh /opt/claude-relay-service/backups/

# 3. 回滚到上一个版本
cd /opt/claude-relay-service
tar -xzf backups/backup_20250127_120000.tar.gz

# 4. 重启服务
npm run service:restart

# 5. 验证
curl https://api.codewith.site/health
```

---

## 🛠️ 高级用法

### 自定义部署脚本

如果需要修改部署流程，编辑 `deploy.sh`:

```bash
# 添加自定义步骤
custom_step() {
    step "执行自定义操作"
    
    log_info "执行自定义命令..."
    remote_exec "cd $SERVER_PATH && your-custom-command"
    log_success "自定义操作完成"
}

# 在 main() 函数中调用
main() {
    # ... 现有步骤 ...
    custom_step
    # ... 其他步骤 ...
}
```

### 添加新的 API 测试

编辑 `test-api.js`，在 `testCases` 数组中添加：

```javascript
{
  name: '测试新接口',
  method: 'GET',
  url: '/admin/new-endpoint',
  auth: true,
  expect: { status: 200, hasData: true }
}
```

### 配置日志过滤规则

编辑 `view-logs.sh`，修改 `ERROR_ONLY` 的 grep 模式：

```bash
if [[ "$ERROR_ONLY" == true ]]; then
    cmd+=" | grep -iE '(error|warning|fail|timeout|crash)'"
fi
```

---

## 📚 相关文档

- [完整部署指南](../DEPLOYMENT.md)
- [项目 README](../README.md)
- [API 文档](../docs/API.md)

---

## ⚠️ 注意事项

1. **安全性**: 脚本中包含服务器密码，请确保：
   - 不要将脚本提交到公开仓库
   - 使用环境变量存储敏感信息
   - 考虑使用 SSH 密钥认证替代密码

2. **权限**: 确保脚本有执行权限：
   ```bash
   chmod +x scripts/*.sh
   ```

3. **备份**: 部署脚本会自动备份，但建议定期手动备份重要数据。

4. **测试**: 在生产环境部署前，先在测试环境验证。

---

**最后更新**: 2025-01-27

