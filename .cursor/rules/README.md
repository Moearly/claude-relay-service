# Cursor Rules 说明

这个目录包含了 ApiRelay 项目的 Cursor Rules，用于帮助 AI 助手更好地理解项目结构、开发流程和运维工具。

## 📋 规则列表

### 1. project-structure.mdc
**类型**: 始终应用 (alwaysApply: true)

**内容**:
- 项目基本信息和技术栈
- 目录结构和关键文件
- 服务器信息和访问方式
- API 路径规范
- 认证机制说明
- 基本部署流程

**用途**: 让 AI 助手了解项目的整体结构和基本信息。

---

### 2. deployment.mdc
**类型**: 按需应用 (description: "Deployment procedures and server management")

**内容**:
- 🚀 自动化部署脚本使用方法
- 手动部署流程（不推荐）
- 服务管理命令
- 环境变量配置
- 📋 日志管理工具
- 回滚策略
- 监控和告警

**用途**: 指导 AI 助手如何正确部署项目到生产环境。

**关键改进**:
- 强调使用自动化部署脚本 `./scripts/deploy.sh`
- 详细说明部署脚本的执行流程
- 提供日志查看工具的使用方法

---

### 3. testing.mdc
**类型**: 按需应用 (description: "Testing and API validation procedures")

**内容**:
- 🧪 自动化 API 测试工具使用
- 测试覆盖范围说明
- 手动测试接口方法
- 📊 部署后验证清单
- 🐛 测试失败处理流程
- 添加新测试用例的方法
- 持续集成建议

**用途**: 指导 AI 助手如何测试和验证 API 接口。

**关键功能**:
- 完整的测试套件 `node scripts/test-api.js`
- 部署后必须完成的验证清单
- 测试失败的排查步骤

---

### 4. troubleshooting.mdc
**类型**: 按需应用 (description: "Common issues and troubleshooting guide")

**内容**:
- 常见问题和解决方案
  - SSH 连接失败
  - 端口被占用
  - API 401 错误
  - 前端构建失败
  - Vercel 部署失败
  - 数据库连接失败
  - 等等...
- 日志查看技巧
- 性能问题排查
- 紧急恢复流程

**用途**: 帮助 AI 助手快速诊断和解决常见问题。

**关键改进**:
- 推荐使用自动化工具解决问题
- 提供详细的排查步骤
- 包含紧急恢复流程

---

### 5. development-workflow.mdc
**类型**: 按需应用 (description: "Development workflow and best practices")

**内容**:
- 🔄 标准开发流程
  - 本地开发
  - 代码检查
  - 提交代码
  - 部署到生产
  - 验证部署
- 📝 提交信息规范
- 🔧 添加新 API 接口的步骤
- 🐛 调试技巧
- 🔍 常见开发场景
- ⚠️ 注意事项和最佳实践

**用途**: 指导 AI 助手遵循规范的开发流程。

**关键内容**:
- 语义化提交信息
- 添加新接口的完整流程
- 部署前后检查清单
- 禁止和推荐的操作

---

### 6. devops-tools.mdc
**类型**: 按需应用 (description: "DevOps tools and automation scripts usage")

**内容**:
- 📦 工具概览
- 🚀 deploy.sh - 自动化部署
  - 基本用法
  - 执行流程
  - 何时使用
  - 优势
- 🧪 test-api.js - API 接口测试
  - 基本用法
  - 测试覆盖
  - 添加新测试
- 📋 view-logs.sh - 日志查看工具
  - 基本用法
  - 选项说明
  - 常用场景
- 🔍 check-env.sh - 环境配置检查
  - 基本用法
  - 检查内容
  - 何时使用
- 🔄 典型工作流
- 🛡️ 安全注意事项
- 💡 最佳实践

**用途**: 详细说明所有运维工具的使用方法。

**关键价值**:
- 完整的工具使用文档
- 实际使用场景示例
- 工具维护和自定义方法

---

### 7. backend-api.mdc
**类型**: 按需应用 (原有规则)

**内容**:
- 后端 API 相关的规则和约定

---

## 🎯 规则使用场景

### 场景 1: 部署代码
AI 助手会自动参考：
- `deployment.mdc` - 了解部署流程
- `devops-tools.mdc` - 使用自动化部署脚本
- `testing.mdc` - 部署后验证

### 场景 2: 添加新接口
AI 助手会自动参考：
- `development-workflow.mdc` - 了解开发流程
- `testing.mdc` - 添加测试用例
- `deployment.mdc` - 部署新代码

### 场景 3: 排查问题
AI 助手会自动参考：
- `troubleshooting.mdc` - 常见问题解决方案
- `devops-tools.mdc` - 使用日志工具
- `testing.mdc` - 运行测试定位问题

### 场景 4: 查看日志
AI 助手会自动参考：
- `devops-tools.mdc` - 日志工具使用方法
- `deployment.mdc` - 日志文件位置

## 📊 规则统计

| 规则文件 | 类型 | 主要用途 |
|---------|------|---------|
| project-structure.mdc | 始终应用 | 项目结构和基本信息 |
| deployment.mdc | 按需应用 | 部署流程和服务管理 |
| testing.mdc | 按需应用 | 测试和验证 |
| troubleshooting.mdc | 按需应用 | 问题排查 |
| development-workflow.mdc | 按需应用 | 开发流程和规范 |
| devops-tools.mdc | 按需应用 | 运维工具使用 |
| backend-api.mdc | 按需应用 | 后端 API 规范 |

## 🔄 规则更新

### 何时更新规则

1. **项目结构变化**
   - 更新 `project-structure.mdc`

2. **部署流程改进**
   - 更新 `deployment.mdc`
   - 更新 `devops-tools.mdc`

3. **添加新工具**
   - 更新 `devops-tools.mdc`
   - 可能需要更新 `development-workflow.mdc`

4. **发现新的常见问题**
   - 更新 `troubleshooting.mdc`

5. **开发规范变化**
   - 更新 `development-workflow.mdc`

### 如何更新规则

1. 编辑对应的 `.mdc` 文件
2. 保持 frontmatter 格式正确
3. 使用 Markdown 格式
4. 使用 `[filename](mdc:filename)` 引用文件
5. 测试规则是否生效

## 💡 最佳实践

1. **保持规则简洁**
   - 只包含关键信息
   - 避免过度详细

2. **及时更新**
   - 项目变化时同步更新规则
   - 保持规则与实际情况一致

3. **合理分类**
   - 不同类型的信息放在不同规则中
   - 避免规则之间重复

4. **使用描述性标题**
   - 让 AI 助手容易找到相关规则
   - 使用清晰的 description

5. **提供示例**
   - 包含实际使用示例
   - 展示命令输出

## 🔗 相关文档

- [DEPLOYMENT.md](mdc:../DEPLOYMENT.md) - 完整部署指南
- [QUICK_REFERENCE.md](mdc:../QUICK_REFERENCE.md) - 快速参考
- [scripts/README.md](mdc:../scripts/README.md) - 工具文档

---

**最后更新**: 2025-01-27

这些规则是为了帮助 AI 助手更好地理解和操作 ApiRelay 项目而创建的。如果你发现规则需要更新或改进，请及时修改相应的 `.mdc` 文件。

