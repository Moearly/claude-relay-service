# Claude Relay Service 部署指南

## 🚀 快速部署到生产服务器

### 服务器信息

- **服务器IP**: 156.229.163.86
- **部署目录**: `/opt/claude-relay-service`
- **服务端口**: 3000
- **Admin账户**: 见 `部署完成文档.md`

---

## 📦 一键部署

### 方式1: 使用部署脚本（推荐）

```bash
cd /home/leiyi/codeSpace/ApiRelay/claude-relay-service
chmod +x deploy-to-server.sh
./deploy-to-server.sh
```

**脚本会自动完成**:
1. ✅ 检查服务器连接
2. ✅ 停止现有服务
3. ✅ 备份现有配置
4. ✅ 打包本地代码
5. ✅ 上传到服务器
6. ✅ 更新代码
7. ✅ 恢复配置
8. ✅ 安装依赖
9. ✅ 启动服务
10. ✅ 验证健康检查

---

### 方式2: 手动部署

```bash
# 1. 打包本地代码
cd /home/leiyi/codeSpace/ApiRelay/claude-relay-service
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='logs/*' \
    --exclude='data/*' \
    --exclude='.env' \
    -czf /tmp/claude-relay.tar.gz .

# 2. 上传到服务器
scp /tmp/claude-relay.tar.gz root@156.229.163.86:/tmp/

# 3. SSH登录服务器
ssh root@156.229.163.86

# 4. 停止服务
cd /opt/claude-relay-service
npm run service:stop

# 5. 备份配置
cp .env /tmp/.env.backup
cp -r data /tmp/data.backup

# 6. 解压新代码
tar -xzf /tmp/claude-relay.tar.gz

# 7. 恢复配置
cp /tmp/.env.backup .env
cp -r /tmp/data.backup/* data/

# 8. 确保MongoDB启用
echo "MONGODB_ENABLED=true" >> .env

# 9. 安装依赖
npm install --production

# 10. 启动服务
npm run service:start:daemon

# 11. 验证
curl http://localhost:3000/health
```

---

## 🔍 验证部署

### 1. 健康检查

```bash
curl http://156.229.163.86:3000/health
```

**预期响应**:
```json
{
  "status": "healthy",
  "service": "claude-relay-service",
  "version": "1.1.164",
  "components": {
    "redis": {"status": "healthy"},
    "logger": {"status": "healthy"}
  }
}
```

### 2. 检查服务状态

```bash
ssh root@156.229.163.86 'cd /opt/claude-relay-service && npm run service:status'
```

### 3. 查看日志

```bash
ssh root@156.229.163.86 'cd /opt/claude-relay-service && npm run service:logs'
```

---

## 🔧 服务管理

### 重启服务

```bash
ssh root@156.229.163.86 'cd /opt/claude-relay-service && npm run service:restart:daemon'
```

### 停止服务

```bash
ssh root@156.229.163.86 'cd /opt/claude-relay-service && npm run service:stop'
```

### 启动服务

```bash
ssh root@156.229.163.86 'cd /opt/claude-relay-service && npm run service:start:daemon'
```

### 查看实时日志

```bash
ssh root@156.229.163.86 'cd /opt/claude-relay-service && npm run service:logs:follow'
```

---

## 📝 重要配置

### 必需的环境变量

确保 `/opt/claude-relay-service/.env` 包含以下配置:

```bash
# MongoDB 必须启用
MONGODB_ENABLED=true

# MongoDB 连接 (Docker容器会自动配置)
MONGODB_URI=mongodb://localhost:27017/claude-relay

# Redis 配置
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# 服务配置
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# 安全配置
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
```

---

## 🐛 故障排查

### 服务无法启动

```bash
# 查看错误日志
ssh root@156.229.163.86 'cat /opt/claude-relay-service/logs/service-error.log'

# 检查端口占用
ssh root@156.229.163.86 'netstat -tlnp | grep 3000'

# 手动启动查看错误
ssh root@156.229.163.86 'cd /opt/claude-relay-service && npm start'
```

### MongoDB 连接失败

```bash
# 检查 MONGODB_ENABLED 是否设置
ssh root@156.229.163.86 'grep MONGODB_ENABLED /opt/claude-relay-service/.env'

# 如果没有，添加
ssh root@156.229.163.86 'echo "MONGODB_ENABLED=true" >> /opt/claude-relay-service/.env'

# 重启服务
ssh root@156.229.163.86 'cd /opt/claude-relay-service && npm run service:restart:daemon'
```

### Redis 连接失败

```bash
# 检查 Redis 状态
ssh root@156.229.163.86 'systemctl status redis-server'

# 重启 Redis
ssh root@156.229.163.86 'systemctl restart redis-server'
```

---

## 📊 访问服务

- **健康检查**: http://156.229.163.86:3000/health
- **Admin 界面**: http://156.229.163.86:3000/admin-next/
- **API 端点**: http://156.229.163.86:3000/api/v1/messages
- **Claude 别名**: http://156.229.163.86:3000/claude/v1/messages
- **Gemini API**: http://156.229.163.86:3000/gemini/v1/messages
- **OpenAI 兼容**: http://156.229.163.86:3000/openai/v1/chat/completions

---

## 🔐 Admin 凭据

查看 `部署完成文档.md` 获取管理员账户信息。

---

## 📦 更新日志

### 2025-10-11
- ✅ 添加 MongoDB 支持和商业化功能
- ✅ 添加自动部署脚本
- ✅ 优化启动流程
- ✅ 添加端口自动清理

---

**部署脚本**: `deploy-to-server.sh`  
**配置文档**: `部署完成文档.md`  
**本地启动**: `./start.sh`

