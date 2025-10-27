# ApiRelay 快速参考卡片

## 🚀 常用命令速查

### 部署相关

```bash
# 一键部署（推荐）
./scripts/deploy.sh

# 强制重新安装依赖
./scripts/deploy.sh --force

# 检查环境配置
./scripts/check-env.sh

# 运行 API 测试
node scripts/test-api.js
```

### 日志查看

```bash
# 查看最近日志
./scripts/view-logs.sh

# 实时跟踪
./scripts/view-logs.sh -f

# 只看错误
./scripts/view-logs.sh -e

# 搜索关键词
./scripts/view-logs.sh -s "MongoDB"
```

### 服务管理

```bash
# 启动服务
npm run service:start:daemon

# 停止服务
npm run service:stop

# 重启服务
npm run service:restart

# 查看状态
npm run service:status

# 查看日志
npm run service:logs
```

---

## 🔍 故障排查速查

### 端口被占用

```bash
# 查找进程
netstat -tlnp | grep :3000

# 杀掉进程
kill -9 <PID>

# 重启服务
npm run service:start:daemon
```

### MongoDB 连接问题

```bash
# 检查服务
systemctl status mongod

# 启动服务
systemctl start mongod

# 测试连接
mongosh --eval 'db.adminCommand({ping: 1})'

# 检查配置
cat .env | grep MONGODB_URI
```

### CORS 错误

```bash
# 检查配置
cat .env | grep CORS_ORIGIN

# 应该包含前端域名
CORS_ORIGIN=https://codewith.site,https://www.codewith.site

# 重启服务
npm run service:restart
```

### 404 错误

```bash
# 检查路由文件
ls -la src/routes/

# 重新部署
./scripts/deploy.sh

# 测试接口
curl https://api.codewith.site/health
```

---

## 📊 健康检查速查

### 基础检查

```bash
# 健康端点
curl https://api.codewith.site/health

# 检查进程
ps aux | grep 'node.*server.js'

# 检查端口
netstat -tlnp | grep :3000
```

### 完整检查

```bash
# 环境配置
./scripts/check-env.sh

# API 测试
export ADMIN_TOKEN="your-token"
node scripts/test-api.js

# 查看错误日志
./scripts/view-logs.sh -e -n 50
```

---

## 🔐 服务器访问

```bash
# SSH 登录
ssh root@156.229.163.86

# 服务目录
cd /opt/claude-relay-service

# 查看环境变量
cat .env

# 查看日志
tail -100 logs/service.log
```

---

## 📝 环境变量清单

### 必需配置

```bash
MONGODB_URI=mongodb://localhost:27017/claude-relay
MONGODB_ENABLED=true
JWT_SECRET=your-jwt-secret
ADMIN_JWT_SECRET=your-admin-jwt-secret
CORS_ORIGIN=https://codewith.site,https://www.codewith.site
```

### 可选配置

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
PORT=3000
NODE_ENV=production
```

---

## 🔄 典型工作流

### 开发部署流程

```bash
1. git add . && git commit -m "feat: 新功能"
2. git push
3. ./scripts/deploy.sh
4. 验证（自动执行）
```

### 问题排查流程

```bash
1. ./scripts/check-env.sh          # 检查环境
2. ./scripts/view-logs.sh -e       # 查看错误
3. node scripts/test-api.js        # 测试接口
4. ./scripts/view-logs.sh -f -e    # 实时监控
```

### 紧急回滚流程

```bash
1. ssh root@156.229.163.86
2. cd /opt/claude-relay-service
3. ls backups/
4. tar -xzf backups/backup_XXXXXX.tar.gz
5. npm run service:restart
6. curl https://api.codewith.site/health
```

---

## 🎯 关键路径

| 项目 | 路径 |
|------|------|
| 服务器目录 | `/opt/claude-relay-service` |
| 日志文件 | `/opt/claude-relay-service/logs/` |
| 环境配置 | `/opt/claude-relay-service/.env` |
| 备份目录 | `/opt/claude-relay-service/backups/` |
| 路由文件 | `/opt/claude-relay-service/src/routes/` |

---

## 📞 重要链接

- 🌐 API 地址: https://api.codewith.site
- 🖥️ 前端地址: https://codewith.site
- 📖 完整文档: [DEPLOYMENT.md](./DEPLOYMENT.md)
- 🛠️ 工具文档: [scripts/README.md](./scripts/README.md)

---

**提示**: 将此文件保存到你的收藏夹，以便快速查阅！

