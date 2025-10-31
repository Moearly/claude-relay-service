# Scripts 目录说明

本目录包含 Claude Relay Service 的所有运维脚本，按功能分类组织。

## 📁 目录结构

```
scripts/
├── manage.js              # 服务管理主脚本（根目录）
├── README.md             # 本文档
├── deployment/           # 部署相关脚本
├── testing/              # 测试相关脚本
├── maintenance/          # 维护相关脚本
└── tools/                # 运维工具脚本
```

---

## 🚀 部署脚本 (deployment/)

### `deploy-optimized.sh` ⭐ **推荐使用**
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
cd /home/leiyi/codeSpace/ApiRelay/claude-relay-service
./scripts/deployment/deploy-optimized.sh
```

### `check-env.sh`
**用途**: 检查服务器环境配置

**使用**:
```bash
./scripts/deployment/check-env.sh
```

---

## 🧪 测试脚本 (testing/)

### `test-api.js` ⭐ **主要测试脚本**
**用途**: API 接口完整测试

**使用**:
```bash
# 基础测试
node scripts/testing/test-api.js

# 完整测试（需要 admin token）
export ADMIN_TOKEN="your-token"
node scripts/testing/test-api.js
```

### `generate-test-data.js`
**用途**: 生成历史测试数据

**使用**:
```bash
# 生成测试数据
node scripts/testing/generate-test-data.js

# 清理测试数据
node scripts/testing/generate-test-data.js --clean
```

### 其他测试脚本
- `test-account-display.js` - 测试账户显示
- `test-api-response.js` - 测试 API 响应格式
- `test-bedrock-models.js` - 测试 Bedrock 模型
- `test-dedicated-accounts.js` - 测试专用账户
- `test-gemini-refresh.js` - 测试 Gemini Token 刷新
- `test-group-scheduling.js` - 测试分组调度
- `test-model-mapping.js` - 测试模型映射
- `test-pricing-fallback.js` - 测试价格回退
- `test-window-remaining.js` - 测试窗口剩余

---

## 🔧 维护脚本 (maintenance/)

### `init-database.js`
**用途**: 数据库初始化

**使用**:
```bash
node scripts/maintenance/init-database.js
```

### `init-email-templates.js`
**用途**: 邮件模板初始化

**使用**:
```bash
node scripts/maintenance/init-email-templates.js
```

### `update-model-pricing.js`
**用途**: 更新模型价格数据

**使用**:
```bash
node scripts/maintenance/update-model-pricing.js
```

### `migrate-apikey-expiry.js`
**用途**: API Key 过期迁移

**使用**:
```bash
node scripts/maintenance/migrate-apikey-expiry.js
```

### `fix-usage-stats.js`
**用途**: 修复使用统计数据

**使用**:
```bash
# 预览修复（不实际修改）
node scripts/maintenance/fix-usage-stats.js --dry-run

# 执行修复
node scripts/maintenance/fix-usage-stats.js
```

---

## 🛠️ 运维工具 (tools/)

### `view-logs.sh` ⭐ **日志查看**
**用途**: 查看服务日志

**使用**:
```bash
# 查看最近日志
./scripts/tools/view-logs.sh

# 实时跟踪
./scripts/tools/view-logs.sh -f

# 只看错误
./scripts/tools/view-logs.sh -e

# 搜索关键词
./scripts/tools/view-logs.sh -s "MongoDB"
```

### `data-transfer-enhanced.js` ⭐ **数据导入导出**
**用途**: 数据备份和迁移

**使用**:
```bash
# 导出所有数据
node scripts/tools/data-transfer-enhanced.js export

# 导出并脱敏
node scripts/tools/data-transfer-enhanced.js export --sanitize

# 导入数据
node scripts/tools/data-transfer-enhanced.js import --input=backup.json

# 强制覆盖
node scripts/tools/data-transfer-enhanced.js import --input=backup.json --force
```

### `check-redis-keys.js`
**用途**: 检查 Redis 中的所有键

**使用**:
```bash
node scripts/tools/check-redis-keys.js
```

### `analyze-log-sessions.js`
**用途**: 从日志文件分析 Claude 账户请求时间

**使用**:
```bash
# 分析默认日志目录
node scripts/tools/analyze-log-sessions.js

# 分析指定目录
node scripts/tools/analyze-log-sessions.js --log-dir=/path/to/logs

# 分析单个文件
node scripts/tools/analyze-log-sessions.js --file=/path/to/logfile.log

# 更新 Redis 数据（模拟）
node scripts/tools/analyze-log-sessions.js --update-redis

# 实际更新 Redis
node scripts/tools/analyze-log-sessions.js --update-redis --no-dry-run
```

### `manage-session-windows.js`
**用途**: 管理 Claude 账户的会话窗口

**使用**:
```bash
# 调试会话窗口状态
node scripts/tools/manage-session-windows.js debug

# 初始化会话窗口
node scripts/tools/manage-session-windows.js init

# 强制重新计算
node scripts/tools/manage-session-windows.js force

# 手动设置
node scripts/tools/manage-session-windows.js set

# 创建测试窗口
node scripts/tools/manage-session-windows.js test

# 清除所有窗口
node scripts/tools/manage-session-windows.js clear
```

### `status-unified.sh`
**用途**: 统一状态检查

**使用**:
```bash
./scripts/tools/status-unified.sh
```

### `monitor-enhanced.sh`
**用途**: 增强监控

**使用**:
```bash
./scripts/tools/monitor-enhanced.sh
```

### `check-gemini-status.sh`
**用途**: 检查 Gemini 服务状态

**使用**:
```bash
./scripts/tools/check-gemini-status.sh
```

### `refresh-gemini-token.sh`
**用途**: 刷新 Gemini Token

**使用**:
```bash
./scripts/tools/refresh-gemini-token.sh
```

### `setup-email.sh`
**用途**: 邮件服务设置

**使用**:
```bash
./scripts/tools/setup-email.sh
```

---

## 📋 服务管理 (根目录)

### `manage.js` ⭐ **服务管理主脚本**
**用途**: 服务启动、停止、重启、状态查看

**使用**:
```bash
# 启动服务（前台）
npm run service start

# 启动服务（后台）
npm run service:start:daemon
# 或
node scripts/manage.js start -d

# 停止服务
npm run service stop

# 重启服务
npm run service restart

# 后台重启
npm run service:restart:daemon

# 查看状态
npm run service status

# 查看日志
npm run service logs
# 或指定行数
node scripts/manage.js logs 100
```

---

## 🎯 常用命令速查

### 部署流程
```bash
# 1. 部署后端
./scripts/deployment/deploy-optimized.sh

# 2. 验证部署
curl https://api.codewith.site/health

# 3. 查看日志
./scripts/tools/view-logs.sh -e
```

### 测试流程
```bash
# 1. 运行 API 测试
export ADMIN_TOKEN="your-token"
node scripts/testing/test-api.js

# 2. 检查环境
./scripts/deployment/check-env.sh
```

### 日常运维
```bash
# 查看服务状态
npm run service status

# 查看日志
./scripts/tools/view-logs.sh -f -e

# 重启服务
npm run service:restart:daemon

# 检查 Redis
node scripts/tools/check-redis-keys.js

# 数据备份
node scripts/tools/data-transfer-enhanced.js export
```

### 维护操作
```bash
# 初始化数据库
node scripts/maintenance/init-database.js

# 更新模型价格
node scripts/maintenance/update-model-pricing.js

# 修复使用统计
node scripts/maintenance/fix-usage-stats.js

# 管理会话窗口
node scripts/tools/manage-session-windows.js debug
```

---

## ⚠️ 注意事项

### 部署相关
- ✅ 使用 `deploy-optimized.sh` 进行生产部署
- ⚠️ 部署前建议先运行 `check-env.sh` 检查环境
- ⚠️ 部署会自动备份，但建议手动备份重要数据

### 测试相关
- ⚠️ 测试脚本仅在开发/测试环境使用
- ⚠️ 不要在生产环境运行测试脚本
- ⚠️ `generate-test-data.js` 会创建测试数据，记得清理

### 维护相关
- ⚠️ 维护脚本可能影响生产数据，使用前请备份
- ⚠️ `fix-usage-stats.js` 建议先用 `--dry-run` 预览
- ⚠️ 数据迁移前务必测试

### 工具相关
- ✅ 日志查看使用 `view-logs.sh` 而不是直接 `tail`
- ✅ 服务管理使用 `npm scripts` 或 `manage.js`
- ⚠️ 数据导出时注意使用 `--sanitize` 脱敏敏感信息

---

## 📚 相关文档

- [部署指南](../../QUICK_DEPLOY.md)
- [部署总结](../../DEPLOYMENT_SUMMARY.md)
- [后端部署规则](../.cursor/rules/deployment.mdc)
- [前端部署规则](../../commercial-website/.cursor/rules/deployment.mdc)
- [故障排查](../../commercial-website/.cursor/rules/troubleshooting.mdc)

---

## 📞 需要帮助？

### 查看脚本帮助
大多数脚本支持 `--help` 参数：
   ```bash
node scripts/tools/data-transfer-enhanced.js --help
node scripts/tools/manage-session-windows.js help
   ```

### 常见问题
1. **部署失败**: 检查 SSH 连接和服务器状态
2. **服务无法启动**: 查看错误日志 `logs/service-error.log`
3. **测试失败**: 确认环境变量和数据库连接
4. **数据导入失败**: 检查数据格式和 Redis 连接

---

## 🔄 版本历史

- **v2.0** (2025-10-29): 重新组织目录结构，按功能分类
- **v1.0** (2025-10-27): 初始版本，所有脚本在根目录

---

**最后更新**: 2025-10-29
