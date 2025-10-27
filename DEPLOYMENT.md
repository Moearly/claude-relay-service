# ApiRelay 部署和运维指南

## 📋 目录

1. [部署前准备](#部署前准备)
2. [自动化部署](#自动化部署)
3. [手动部署](#手动部署)
4. [环境配置](#环境配置)
5. [健康检查](#健康检查)
6. [日志管理](#日志管理)
7. [故障排查](#故障排查)
8. [回滚流程](#回滚流程)

---

## 部署前准备

### 1. 本地环境要求

```bash
# 必需工具
- Node.js >= 16.x
- npm >= 8.x
- git
- sshpass (用于自动化部署)
- curl (用于健康检查)

# 安装 sshpass (Ubuntu/Debian)
sudo apt-get install sshpass

# 安装 sshpass (macOS)
brew install hudochenkov/sshpass/sshpass
```

### 2. 服务器环境要求

```bash
# 必需服务
- Node.js >= 16.x
- MongoDB >= 4.4
- Redis >= 6.x (可选)
- PM2 或类似的进程管理器

# 必需端口
- 3000 (API 服务)
- 27017 (MongoDB)
- 6379 (Redis)
```

### 3. 权限配置

```bash
# 确保有服务器 SSH 访问权限
ssh root@156.229.163.86

# 确保服务目录权限正确
sudo chown -R $USER:$USER /opt/claude-relay-service
```

---

## 自动化部署

### 快速部署（推荐）

使用自动化部署脚本，一键完成所有步骤：

```bash
cd /home/leiyi/codeSpace/ApiRelay/claude-relay-service

# 执行部署
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

部署脚本会自动执行：
1. ✅ 检查本地和服务器环境
2. ✅ 备份当前版本
3. ✅ 上传代码文件
4. ✅ 安装依赖（如需要）
5. ✅ 停止旧服务
6. ✅ 启动新服务
7. ✅ 健康检查
8. ✅ 运行 API 测试

### 强制重新安装依赖

```bash
./scripts/deploy.sh --force
```

---

## 手动部署

如果需要手动控制每个步骤：

### 1. 上传代码

```bash
# 上传单个文件
sshpass -p "密码" scp -o StrictHostKeyChecking=no \
  src/routes/admin.js \
  root@156.229.163.86:/opt/claude-relay-service/src/routes/admin.js

# 上传整个目录
sshpass -p "密码" scp -r -o StrictHostKeyChecking=no \
  src/ \
  root@156.229.163.86:/opt/claude-relay-service/src/
```

### 2. 安装依赖

```bash
sshpass -p "密码" ssh -o StrictHostKeyChecking=no root@156.229.163.86 \
  "cd /opt/claude-relay-service && npm install --production"
```

### 3. 重启服务

```bash
# 方式1: 使用 npm 脚本
sshpass -p "密码" ssh -o StrictHostKeyChecking=no root@156.229.163.86 \
  "cd /opt/claude-relay-service && npm run service:restart"

# 方式2: 手动重启
sshpass -p "密码" ssh -o StrictHostKeyChecking=no root@156.229.163.86 \
  "cd /opt/claude-relay-service && \
   pkill -f 'node.*server.js' && \
   sleep 2 && \
   npm run service:start:daemon"
```

---

## 环境配置

### 检查环境配置

使用环境检查工具验证所有配置：

```bash
chmod +x scripts/check-env.sh
./scripts/check-env.sh
```

### 必需的环境变量

在服务器的 `.env` 文件中配置：

```bash
# 数据库
MONGODB_URI=mongodb://localhost:27017/claude-relay
MONGODB_ENABLED=true

# 安全
JWT_SECRET=your-jwt-secret-here
ADMIN_JWT_SECRET=your-admin-jwt-secret-here

# CORS
CORS_ORIGIN=https://codewith.site,https://www.codewith.site

# Redis (可选)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 服务
PORT=3000
NODE_ENV=production
```

### 更新环境变量

```bash
# 登录服务器
ssh root@156.229.163.86

# 编辑 .env 文件
cd /opt/claude-relay-service
nano .env

# 重启服务使配置生效
npm run service:restart
```

---

## 健康检查

### 1. 自动化 API 测试

运行完整的接口测试套件：

```bash
# 设置管理员 Token（可选，用于测试需要认证的接口）
export ADMIN_TOKEN="your-admin-token"

# 运行测试
node scripts/test-api.js
```

测试内容包括：
- ✅ 健康检查端点
- ✅ 用户管理接口
- ✅ 订单管理接口
- ✅ 公告管理接口
- ✅ 套餐管理接口
- ✅ 系统统计接口
- ✅ CORS 配置

### 2. 手动健康检查

```bash
# 基础健康检查
curl https://api.codewith.site/health

# 检查管理员接口（需要 Token）
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.codewith.site/admin/users

# 检查 CORS
curl -I -H "Origin: https://codewith.site" \
     https://api.codewith.site/admin/users
```

### 3. 服务状态检查

```bash
# 检查进程
ps aux | grep 'node.*server.js'

# 检查端口
netstat -tlnp | grep :3000

# 检查数据库连接
mongosh --eval 'db.adminCommand({ping: 1})'

# 检查 Redis 连接
redis-cli ping
```

---

## 日志管理

### 查看实时日志

```bash
# 实时跟踪所有日志
./scripts/view-logs.sh -f

# 只查看错误日志
./scripts/view-logs.sh -e

# 查看最后 100 行
./scripts/view-logs.sh -n 100

# 搜索特定关键词
./scripts/view-logs.sh -s "MongoDB"

# 组合使用
./scripts/view-logs.sh -e -n 50
```

### 日志文件位置

```
/opt/claude-relay-service/logs/
├── service.log          # 主服务日志
├── requests.log         # 请求日志（详细）
├── error.log           # 错误日志
└── access.log          # 访问日志
```

### 远程查看日志

```bash
# 查看服务日志
sshpass -p "密码" ssh root@156.229.163.86 \
  "tail -100 /opt/claude-relay-service/logs/service.log"

# 查看错误日志
sshpass -p "密码" ssh root@156.229.163.86 \
  "grep -i error /opt/claude-relay-service/logs/service.log | tail -50"

# 实时跟踪日志
sshpass -p "密码" ssh root@156.229.163.86 \
  "tail -f /opt/claude-relay-service/logs/service.log"
```

---

## 故障排查

### 常见问题和解决方案

#### 1. 端口被占用 (EADDRINUSE)

```bash
# 查找占用进程
netstat -tlnp | grep :3000

# 杀掉进程
kill -9 PID

# 重启服务
npm run service:start:daemon
```

#### 2. MongoDB 连接超时

```bash
# 检查 MongoDB 服务
systemctl status mongod

# 启动 MongoDB
systemctl start mongod

# 测试连接
mongosh --eval 'db.adminCommand({ping: 1})'

# 检查 .env 中的 MONGODB_URI
cat .env | grep MONGODB_URI
```

#### 3. CORS 错误

```bash
# 检查 CORS_ORIGIN 配置
cat .env | grep CORS_ORIGIN

# 确保包含前端域名
CORS_ORIGIN=https://codewith.site,https://www.codewith.site

# 重启服务
npm run service:restart
```

#### 4. 404 错误（路由不存在）

```bash
# 确认代码已部署
ls -la /opt/claude-relay-service/src/routes/

# 检查路由文件内容
cat /opt/claude-relay-service/src/routes/admin.js | grep "router.get"

# 如果文件不存在或内容不对，重新部署
./scripts/deploy.sh
```

#### 5. 401 认证错误

```bash
# 检查 JWT_SECRET 配置
cat .env | grep JWT_SECRET

# 检查 Token 是否有效
# 前端应使用 getAdminApiClient() 获取带 Token 的客户端

# 检查中间件是否正确
grep "authenticateAdmin" src/routes/admin.js
```

### 调试模式

启用详细日志输出：

```bash
# 设置环境变量
export DEBUG=*
export LOG_LEVEL=debug

# 重启服务
npm run service:restart
```

---

## 回滚流程

### 自动回滚

如果部署失败，可以快速回滚到上一个版本：

```bash
# 登录服务器
ssh root@156.229.163.86

# 查看可用备份
ls -lh /opt/claude-relay-service/backups/

# 回滚到指定备份
cd /opt/claude-relay-service
tar -xzf backups/backup_20250127_120000.tar.gz

# 重启服务
npm run service:restart
```

### 使用 Git 回滚

```bash
# 查看提交历史
git log --oneline -10

# 回滚到指定提交
git reset --hard COMMIT_HASH

# 重新部署
./scripts/deploy.sh
```

---

## 监控和告警

### 设置监控

```bash
# 使用 PM2 监控
pm2 monit

# 查看进程状态
pm2 status

# 查看日志
pm2 logs
```

### 性能监控

```bash
# CPU 和内存使用
top -p $(pgrep -f 'node.*server.js')

# 网络连接
netstat -an | grep :3000 | wc -l

# 磁盘使用
df -h /opt/claude-relay-service
```

---

## 最佳实践

### 部署前检查清单

- [ ] 本地测试通过
- [ ] Git 提交已推送
- [ ] 环境配置已更新
- [ ] 数据库迁移已准备（如需要）
- [ ] 备份当前版本
- [ ] 通知团队成员

### 部署后验证清单

- [ ] 健康检查通过 (`curl /health`)
- [ ] 服务进程运行中 (`ps aux | grep node`)
- [ ] 端口正常监听 (`netstat -tlnp | grep :3000`)
- [ ] 数据库连接正常
- [ ] API 测试通过 (`node scripts/test-api.js`)
- [ ] 前端功能正常
- [ ] 日志无错误 (`tail logs/service.log`)

### 定期维护

```bash
# 每周清理旧日志
find /opt/claude-relay-service/logs -name "*.log" -mtime +7 -delete

# 每月清理旧备份
find /opt/claude-relay-service/backups -name "*.tar.gz" -mtime +30 -delete

# 更新依赖
npm outdated
npm update
```

---

## 联系和支持

如有问题，请查看：
- 📖 [项目文档](./README.md)
- 🐛 [问题追踪](https://github.com/your-repo/issues)
- 💬 [讨论区](https://github.com/your-repo/discussions)

---

**最后更新**: 2025-01-27

