# 📧 邮件功能集成文档

## 概述

邮件功能已成功集成到 ApiRelay 的核心业务流程中，所有邮件发送均使用预设的模板，并且不会阻塞主业务流程。

---

## ✅ 已集成的邮件功能

### 1. 欢迎新用户邮件 (Welcome Email)

**触发时机**：
- 用户通过注册表单注册成功后
- 用户通过 OAuth (Google/GitHub) 首次登录后

**模板**：`welcome-new-user`

**发送变量**：
```javascript
{
  username: '用户显示名称',
  siteName: 'AI Code Relay'
}
```

**代码位置**：
- `src/services/userService.js` - `register()` 方法
- `src/services/userService.js` - `oauthLogin()` 方法

---

### 2. 订单确认邮件 (Order Confirmation)

**触发时机**：
- 用户订阅套餐支付成功并激活后

**模板**：`order-confirmation`

**发送变量**：
```javascript
{
  username: '用户显示名称',
  orderNumber: '订单号',
  planName: '套餐名称',
  amount: '订单金额',
  siteName: 'AI Code Relay'
}
```

**代码位置**：
- `src/services/userSubscriptionService.js` - `activateSubscription()` 方法

---

### 3. 积分充值通知邮件 (Credits Recharged)

**触发时机**：
- 用户积分充值成功后（type 为 'refill' 或 'purchase'）

**模板**：`credits-recharged`

**发送变量**：
```javascript
{
  username: '用户显示名称',
  amount: '充值积分数量',
  balance: '充值后余额',
  siteName: 'AI Code Relay'
}
```

**代码位置**：
- `src/services/userService.js` - `addCredits()` 方法

---

### 4. 密码重置邮件 (Password Reset)

**触发时机**：
- 用户请求重置密码

**模板**：`password-reset`

**发送变量**：
```javascript
{
  username: '用户显示名称',
  resetLink: '密码重置链接',
  expiryTime: '24', // 小时
  siteName: 'AI Code Relay'
}
```

**新增接口**：
- `POST /users/request-password-reset` - 请求密码重置
- `POST /users/reset-password` - 重置密码

**代码位置**：
- `src/services/userService.js` - `requestPasswordReset()` 方法
- `src/services/userService.js` - `resetPassword()` 方法
- `src/routes/userRoutes.js` - 密码重置路由

---

## 🗄️ 数据库变更

### User 模型新增字段

```javascript
resetPasswordToken: {
  type: String,
  default: null
},
resetPasswordExpires: {
  type: Date,
  default: null
}
```

---

## 📝 邮件模板管理

所有邮件模板都存储在 MongoDB 的 `EmailTemplate` 集合中，可以通过管理后台进行管理：

**管理入口**：
- 系统设置 → 邮件设置 → 邮件模板

**预设模板**：
1. 欢迎新用户 (`welcome-new-user`)
2. 订单确认 (`order-confirmation`)
3. 密码重置 (`password-reset`)
4. 积分充值成功 (`credits-recharged`)
5. 测试邮件 (`test-email`)

**初始化脚本**：
```bash
cd /opt/claude-relay-service
node scripts/init-email-templates.js
```

---

## 🔧 配置要求

### 环境变量

确保在 `.env` 文件中配置了以下变量：

```bash
# 前端URL（用于生成密码重置链接）
FRONTEND_URL=https://commercial-website.vercel.app

# MongoDB连接（存储邮件配置和模板）
MONGODB_URI=mongodb://localhost:27017/claude-relay
```

### 邮件服务配置

在管理后台的"系统设置 → 邮件设置"中配置：

**Resend 配置**：
- API Key
- 发件人邮箱
- 发件人名称

**或 SMTP 配置**：
- SMTP 主机
- SMTP 端口
- SMTP 用户名
- SMTP 密码
- 发件人邮箱
- 发件人名称

---

## 🧪 测试指南

### 1. 测试欢迎邮件

**方法 A：注册新用户**
```bash
curl -X POST https://api.codewith.site/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**预期结果**：
- 注册成功
- 收到欢迎邮件

---

### 2. 测试密码重置邮件

**步骤 1：请求密码重置**
```bash
curl -X POST https://api.codewith.site/users/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**预期结果**：
- 返回成功消息
- 收到密码重置邮件

**步骤 2：使用令牌重置密码**
```bash
curl -X POST https://api.codewith.site/users/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "从邮件中获取的令牌",
    "newPassword": "newpassword123"
  }'
```

---

### 3. 测试订单确认邮件

需要完成一次真实的订阅购买流程：
1. 登录用户账户
2. 选择套餐并创建订单
3. 模拟支付成功
4. 激活订阅

**预期结果**：
- 订阅激活成功
- 收到订单确认邮件

---

### 4. 测试积分充值邮件

需要管理员权限给用户充值积分：
```bash
# 通过管理后台：会员管理 → 调整积分
# 或使用 API（需要管理员 token）
```

**预期结果**：
- 积分充值成功
- 收到充值通知邮件

---

### 5. 测试邮件发送（管理后台）

在"系统设置 → 邮件设置"中：
1. 配置邮件服务
2. 输入测试邮箱
3. 点击"发送测试邮件"

**预期结果**：
- 显示发送成功
- 收到测试邮件

---

## 📊 邮件发送历史

所有邮件发送记录都存储在 `EmailLog` 集合中，可以在管理后台查看：

**查看入口**：
- 系统设置 → 邮件设置 → 发送历史

**记录内容**：
- 收件人
- 邮件类型
- 发送状态
- 发送时间
- 错误信息（如果失败）

---

## 🚨 错误处理

### 邮件发送失败不会影响主业务

所有邮件发送都是异步的，使用 `.catch()` 捕获错误：

```javascript
emailService.sendEmailWithTemplate({
  to: user.email,
  templateSlug: 'welcome-new-user',
  variables: { username: user.username, siteName: 'AI Code Relay' }
}).catch(err => {
  logger.error('❌ 发送欢迎邮件失败:', err)
})
```

**即使邮件发送失败**：
- ✅ 用户注册仍然成功
- ✅ 订单激活仍然完成
- ✅ 积分充值仍然生效
- ❌ 只是用户不会收到邮件通知

---

## 🔍 日志查看

### 查看邮件相关日志

```bash
# 在服务器上
cd /opt/claude-relay-service
tail -100 logs/service.log | grep -i '邮件'
```

### 常见日志消息

**成功**：
```
✅ 密码重置邮件已发送: user@example.com
✅ 新用户注册成功: testuser (test@example.com)
```

**失败**：
```
❌ 发送欢迎邮件失败: Error: Email transporter not initialized
❌ 发送订单确认邮件失败: Error: Invalid API Key
```

---

## 📚 相关文档

- [邮件服务配置指南](./EMAIL_SERVICE_SETUP.md)
- [邮件模板开发指南](./EMAIL_TEMPLATE_GUIDE.md)
- [系统设置使用手册](./SYSTEM_SETTINGS.md)

---

## 🎯 后续优化建议

1. **邮件队列**：集成 Bull 或 Redis Queue 处理大量邮件发送
2. **邮件重试**：失败的邮件自动重试
3. **邮件统计**：更详细的发送统计和分析
4. **更多模板**：
   - 账户激活邮件
   - 订阅到期提醒
   - 积分不足提醒
   - 月度使用报告
5. **多语言支持**：根据用户语言偏好发送不同语言的邮件

---

## 📞 技术支持

如有问题，请查看：
- 服务日志：`/opt/claude-relay-service/logs/service.log`
- 邮件历史：管理后台 → 系统设置 → 邮件设置 → 发送历史
- 错误日志：`/opt/claude-relay-service/logs/service-error.log`

