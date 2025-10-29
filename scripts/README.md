# Scripts 目录说明

## 📋 脚本分类

### 🚀 部署脚本（Production Deployment）

#### `deploy-optimized.sh` ⭐ **推荐使用**
**用途**: 生产环境部署脚本（优化版）

**特点**:
- ✅ 只需 3 次 SSH 连接
- ✅ 自动备份
- ✅ 自动上传文件
- ✅ 自动重启服务
- ✅ 健康检查验证
- ⏱️ 约 2 分钟完成

**使用**:
```bash
./scripts/deploy-optimized.sh
```

#### `deploy.sh`
**用途**: 原始部署脚本

**说明**: 功能完整但 SSH 连接较多，建议使用 `deploy-optimized.sh`

---

### 🧪 测试脚本（Testing）

#### `test-api.js`
**用途**: API 接口测试

**使用**:
```bash
# 基础测试
node scripts/test-api.js

# 完整测试（需要 admin token）
export ADMIN_TOKEN="your-token"
node scripts/test-api.js
```

#### `test-*.js`
- `test-account-display.js` - 测试账户显示
- `test-api-response.js` - 测试 API 响应
- `test-bedrock-models.js` - 测试 Bedrock 模型
- `test-dedicated-accounts.js` - 测试专用账户
- `test-gemini-refresh.js` - 测试 Gemini Token 刷新
- `test-group-scheduling.js` - 测试分组调度
- `test-model-mapping.js` - 测试模型映射
- `test-pricing-fallback.js` - 测试价格回退
- `test-web-dist.sh` - 测试 Web 分发
- `test-window-remaining.js` - 测试窗口剩余

---

### 🔍 运维工具（Operations）

#### `view-logs.sh`
**用途**: 查看服务日志

**使用**:
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

#### `check-env.sh`
**用途**: 检查环境配置

**使用**:
```bash
./scripts/check-env.sh
```

#### `manage.js` / `manage.sh`
**用途**: 服务管理

**使用**:
```bash
# 启动服务
npm run service:start:daemon

# 停止服务
npm run service:stop

# 重启服务
npm run service:restart

# 查看状态
npm run service:status
```

#### `status-unified.sh`
**用途**: 统一状态检查

#### `monitor-enhanced.sh`
**用途**: 增强监控

---

### 🛠️ 初始化和设置（Setup）

#### `setup.js`
**用途**: 项目初始化设置

#### `init-database.js`
**用途**: 数据库初始化

#### `init-email-templates.js`
**用途**: 邮件模板初始化

#### `setup-email.sh`
**用途**: 邮件服务设置

---

### 🔧 维护工具（Maintenance）

#### `update-model-pricing.js`
**用途**: 更新模型价格数据

#### `migrate-apikey-expiry.js`
**用途**: API Key 过期迁移

#### `fix-usage-stats.js`
**用途**: 修复使用统计

#### `fix-inquirer.js`
**用途**: 修复 Inquirer 依赖

---

### 📊 数据和分析（Data & Analytics）

#### `data-transfer.js` / `data-transfer-enhanced.js`
**用途**: 数据传输

#### `generate-test-data.js`
**用途**: 生成测试数据

#### `analyze-log-sessions.js`
**用途**: 分析日志会话

---

### 🔑 Redis 和账户管理（Redis & Accounts）

#### `check-redis-keys.js`
**用途**: 检查 Redis 键

#### `debug-redis-keys.js`
**用途**: 调试 Redis 键

#### `check-gemini-status.sh`
**用途**: 检查 Gemini 状态

#### `refresh-gemini-token.sh`
**用途**: 刷新 Gemini Token

#### `manage-session-windows.js`
**用途**: 管理会话窗口

---

## 🎯 常用命令

### 部署流程
```bash
# 1. 部署后端
./scripts/deploy-optimized.sh

# 2. 验证部署
curl https://api.codewith.site/health

# 3. 查看日志
./scripts/view-logs.sh -e
```

### 测试流程
```bash
# 1. 运行 API 测试
export ADMIN_TOKEN="your-token"
node scripts/test-api.js

# 2. 检查环境
./scripts/check-env.sh
```

### 日常运维
```bash
# 查看服务状态
npm run service:status

# 查看日志
./scripts/view-logs.sh -f -e

# 重启服务
npm run service:restart
```

---

## ⚠️ 注意事项

1. **部署脚本**: 使用 `deploy-optimized.sh` 而不是 `deploy.sh`
2. **测试脚本**: 仅在开发/测试环境使用，不要在生产环境运行
3. **日志查看**: 使用 `view-logs.sh` 而不是直接 `tail`
4. **服务管理**: 使用 npm scripts 而不是直接操作进程

---

## 📚 相关文档

- [部署指南](../../QUICK_DEPLOY.md)
- [部署总结](../../DEPLOYMENT_SUMMARY.md)
- [故障排查](../../commercial-website/.cursor/rules/troubleshooting.mdc)
