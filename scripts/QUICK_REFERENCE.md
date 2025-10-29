# Scripts 快速参考

## 🚀 最常用命令

### 部署
```bash
# 生产部署（推荐）
./scripts/deployment/deploy-optimized.sh

# 检查环境
./scripts/deployment/check-env.sh
```

### 服务管理
```bash
# 后台启动
npm run service:start:daemon

# 停止服务
npm run service stop

# 重启服务
npm run service:restart:daemon

# 查看状态
npm run service status
```

### 日志查看
```bash
# 查看最近日志
./scripts/tools/view-logs.sh

# 实时跟踪
./scripts/tools/view-logs.sh -f

# 只看错误
./scripts/tools/view-logs.sh -e
```

### 测试
```bash
# API 测试
node scripts/testing/test-api.js

# 生成测试数据
node scripts/testing/generate-test-data.js
```

### 数据备份
```bash
# 导出数据
node scripts/tools/data-transfer-enhanced.js export

# 导入数据
node scripts/tools/data-transfer-enhanced.js import --input=backup.json
```

---

## 📁 目录速查

| 目录 | 用途 | 脚本数 |
|------|------|--------|
| `deployment/` | 部署相关 | 2 |
| `testing/` | 测试相关 | 11 |
| `maintenance/` | 维护相关 | 5 |
| `tools/` | 运维工具 | 10 |

---

## ⭐ 重点脚本

| 脚本 | 用途 | 使用频率 |
|------|------|----------|
| `deployment/deploy-optimized.sh` | 生产部署 | 每次发布 |
| `manage.js` | 服务管理 | 每天 |
| `tools/view-logs.sh` | 日志查看 | 每天 |
| `testing/test-api.js` | API测试 | 每次变更 |
| `tools/data-transfer-enhanced.js` | 数据备份 | 每周 |

---

## 🔗 相关文档

- [完整文档](./README.md)
- [重组总结](./REORGANIZATION_SUMMARY.md)
- [部署指南](../../QUICK_DEPLOY.md)
