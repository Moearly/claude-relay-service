# Claude Relay Service - API 文档

**版本**: v2.0  
**基础URL**: `http://localhost:18080`  
**更新时间**: 2025-10-11

---

## 📋 目录

1. [认证方式](#认证方式)
2. [用户端 API](#用户端-api)
   - [套餐管理](#套餐管理)
   - [订阅管理](#订阅管理)
   - [积分与卡密](#积分与卡密)
   - [API Key 管理](#api-key-管理)
3. [管理员 API](#管理员-api)
   - [套餐管理](#管理员套餐管理)
   - [卡密管理](#管理员卡密管理)
   - [财务报表](#财务报表)
4. [权限系统](#权限系统)
5. [错误码](#错误码)

---

## 🔐 认证方式

### 用户认证
```http
Authorization: Bearer <user_token>
```

### 管理员认证
```http
Authorization: Bearer <admin_token>
```

### API Key 认证
```http
X-API-Key: <api_key>
```

---

## 👤 用户端 API

### 套餐管理

#### 1. 获取可用套餐列表

**端点**: `GET /subscriptions/plans`

**描述**: 获取所有可见的 Claude 订阅套餐

**认证**: 无需认证

**响应示例**:
```json
{
  "success": true,
  "plans": [
    {
      "id": "free",
      "planId": "free",
      "name": "免费版",
      "displayName": "免费版",
      "description": "适合个人试用和轻量使用",
      "price": 0,
      "currency": "CNY",
      "billingCycle": "monthly",
      "dailyRequests": 1000,
      "maxApiKeys": 1,
      "service": "Claude",
      "services": ["claude"],
      "models": ["claude-sonnet-4-5"],
      "support": "community",
      "recommended": false,
      "features": [
        "每日 1,000 次请求",
        "支持 1 个 Claude 模型",
        "1 个 API 密钥",
        "社区技术支持",
        "99% 服务可用性"
      ]
    },
    {
      "id": "pro",
      "planId": "pro",
      "name": "专业版",
      "displayName": "专业版",
      "price": 399,
      "originalPrice": 599,
      "currency": "CNY",
      "billingCycle": "monthly",
      "dailyRequests": 50000,
      "maxApiKeys": 10,
      "recommended": true,
      "isOnPromotion": true,
      "promotion": {
        "discount": 33,
        "endDate": "2025-12-31"
      }
    }
  ]
}
```

---

### 订阅管理

#### 2. 获取当前订阅

**端点**: `GET /subscriptions/`

**描述**: 获取用户当前订阅信息

**认证**: 需要用户Token

**响应示例**:
```json
{
  "success": true,
  "userId": "user_123",
  "planId": "pro",
  "planName": "专业版",
  "displayName": "专业版",
  "status": "active",
  "dailyRequests": 50000,
  "maxApiKeys": 10,
  "startDate": "2025-10-01T00:00:00.000Z",
  "expiryDate": "2025-11-01T00:00:00.000Z",
  "autoRenew": false,
  "isFree": false
}
```

#### 3. 创建订阅订单

**端点**: `POST /subscriptions/orders`

**描述**: 创建订阅订单并获取支付信息

**认证**: 需要用户Token

**请求体**:
```json
{
  "planId": "pro",
  "paymentMethod": "wechat"
}
```

**响应示例**:
```json
{
  "success": true,
  "orderId": "SUB1728633000000ABC123",
  "planId": "pro",
  "planName": "专业版",
  "amount": 399,
  "currency": "CNY",
  "paymentMethod": "wechat",
  "paymentUrl": "https://payment.example.com/pay/SUB...",
  "qrCode": "https://payment.example.com/qr/SUB...",
  "expiresAt": "2025-10-11T10:15:00.000Z"
}
```

#### 4. 升级订阅

**端点**: `POST /subscriptions/upgrade`

**描述**: 升级到更高级别的套餐

**认证**: 需要用户Token

**请求体**:
```json
{
  "newPlanId": "enterprise",
  "paymentMethod": "alipay"
}
```

**响应**: 同创建订单

#### 5. 取消订阅

**端点**: `POST /subscriptions/cancel`

**描述**: 取消订阅(到期后不再续费)

**认证**: 需要用户Token

**响应示例**:
```json
{
  "success": true,
  "message": "Subscription cancelled. Your plan will remain active until expiry date.",
  "expiryDate": "2025-11-01T00:00:00.000Z"
}
```

#### 6. 更新自动续费设置

**端点**: `PUT /subscriptions/auto-renew`

**描述**: 开启或关闭自动续费

**认证**: 需要用户Token

**请求体**:
```json
{
  "autoRenew": true
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "已开启自动续费",
  "subscription": {
    "planId": "pro",
    "autoRenew": true,
    ...
  }
}
```

#### 7. 获取订单历史

**端点**: `GET /subscriptions/orders`

**描述**: 获取用户的所有订单

**认证**: 需要用户Token

**查询参数**:
- `limit`: 每页数量 (默认: 20)
- `offset`: 偏移量 (默认: 0)
- `status`: 订单状态过滤 (可选: pending, paid, activated, cancelled)

**响应示例**:
```json
{
  "success": true,
  "orders": [
    {
      "id": "SUB1728633000000ABC123",
      "orderId": "SUB1728633000000ABC123",
      "planId": "pro",
      "planName": "专业版",
      "amount": 399,
      "currency": "CNY",
      "status": "paid",
      "paymentMethod": "wechat",
      "createdAt": "2025-10-11T10:00:00.000Z",
      "paidAt": "2025-10-11T10:05:00.000Z"
    }
  ],
  "total": 5
}
```

---

### 积分与卡密

#### 8. 获取积分余额

**端点**: `GET /credits/balance`

**描述**: 获取用户当前积分余额

**认证**: 需要用户Token

**响应示例**:
```json
{
  "success": true,
  "userId": "user_123",
  "credits": 15000,
  "dailyLimit": 50000,
  "usedToday": 5000,
  "resetTime": "2025-10-12T00:00:00.000Z"
}
```

#### 9. 获取积分历史

**端点**: `GET /credits/history`

**描述**: 获取积分变动历史

**认证**: 需要用户Token

**查询参数**:
- `limit`: 每页数量 (默认: 50)
- `offset`: 偏移量 (默认: 0)

**响应示例**:
```json
{
  "success": true,
  "records": [
    {
      "id": "credit_001",
      "userId": "user_123",
      "type": "cardkey_redeem",
      "amount": 1000,
      "balance": 15000,
      "description": "兑换卡密: CRD-A1B2***",
      "createdAt": "2025-10-11T10:00:00.000Z"
    }
  ],
  "total": 25
}
```

#### 10. 兑换卡密

**端点**: `POST /credits/redeem`

**描述**: 兑换卡密获取积分或套餐

**认证**: 需要用户Token

**请求体**:
```json
{
  "code": "CRD-A1B2-C3D4-E5F6"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "成功兑换 1000 积分",
  "type": "credit",
  "amount": 1000,
  "newBalance": 16000
}
```

---

### API Key 管理

#### 11. 创建 API Key

**端点**: `POST /users/apikeys`

**描述**: 创建新的 API Key (自动设置为 Claude 权限)

**认证**: 需要用户Token

**请求体**:
```json
{
  "name": "My Production Key",
  "description": "用于生产环境",
  "expiresAt": "2026-01-01T00:00:00.000Z"
}
```

**响应示例**:
```json
{
  "success": true,
  "apiKey": {
    "id": "key_123",
    "name": "My Production Key",
    "key": "claude-relay-1234567890abcdef",
    "permissions": "claude",
    "source": "commercial",
    "isActive": true,
    "createdAt": "2025-10-11T10:00:00.000Z"
  }
}
```

> **注意**: commercial-website 用户创建的 API Key 自动设置 `permissions='claude'`,仅可访问 Claude 服务。

---

## 👨‍💼 管理员 API

### 管理员套餐管理

#### 12. 获取所有套餐

**端点**: `GET /admin/subscription-plans`

**描述**: 获取所有套餐(包括隐藏的)

**认证**: 需要管理员Token

**查询参数**:
- `includeInactive`: 是否包含未激活的套餐 (默认: false)

**响应**: 参考用户端套餐列表,但包含更多管理信息

#### 13. 创建套餐

**端点**: `POST /admin/subscription-plans`

**描述**: 创建新套餐

**认证**: 需要管理员Token

**请求体**:
```json
{
  "planId": "custom",
  "name": "Custom",
  "displayName": "定制版",
  "description": "企业定制套餐",
  "price": 1999,
  "currency": "CNY",
  "billingCycle": "monthly",
  "billingCycleDays": 30,
  "features": {
    "dailyRequests": 100000,
    "dailyCost": 500,
    "maxApiKeys": 50,
    "services": ["claude"],
    "models": ["claude-sonnet-4-5", "claude-opus-4"],
    "support": "dedicated"
  },
  "isActive": true,
  "isVisible": true
}
```

#### 14. 更新套餐

**端点**: `PUT /admin/subscription-plans/:planId`

**描述**: 更新套餐信息

**认证**: 需要管理员Token

**请求体**: 需要更新的字段

#### 15. 删除套餐

**端点**: `DELETE /admin/subscription-plans/:planId`

**描述**: 删除套餐(软删除)

**认证**: 需要管理员Token

#### 16. 初始化默认套餐

**端点**: `POST /admin/subscription-plans/init-defaults`

**描述**: 初始化系统默认套餐

**认证**: 需要管理员Token

**响应示例**:
```json
{
  "success": true,
  "message": "Default plans initialized successfully"
}
```

---

### 管理员卡密管理

#### 17. 批量生成卡密

**端点**: `POST /admin/cardkeys/generate`

**描述**: 批量生成卡密

**认证**: 需要管理员Token

**请求体**:
```json
{
  "count": 100,
  "type": "credit",
  "creditAmount": 1000,
  "expiresInDays": 30,
  "prefix": "CRD",
  "note": "双11活动卡密"
}
```

**套餐类型卡密**:
```json
{
  "count": 50,
  "type": "plan",
  "planId": "pro",
  "planDuration": 30,
  "expiresInDays": 90,
  "prefix": "PRO",
  "note": "专业版体验卡"
}
```

**响应示例**:
```json
{
  "success": true,
  "count": 100,
  "cardKeys": [
    {
      "id": "ck_001",
      "code": "CRD-A1B2-C3D4-E5F6",
      "type": "credit",
      "creditAmount": 1000,
      "status": "active",
      "expiresAt": "2025-11-10T00:00:00.000Z",
      "note": "双11活动卡密"
    }
  ]
}
```

#### 18. 获取卡密列表

**端点**: `GET /admin/cardkeys`

**描述**: 获取卡密列表

**认证**: 需要管理员Token

**查询参数**:
- `status`: 状态过滤 (active, used, expired)
- `type`: 类型过滤 (credit, plan)
- `limit`: 每页数量 (默认: 50)
- `offset`: 偏移量 (默认: 0)
- `includeUsed`: 是否包含已使用的卡密 (默认: true)

#### 19. 删除卡密

**端点**: `DELETE /admin/cardkeys/:id`

**描述**: 删除未使用的卡密

**认证**: 需要管理员Token

#### 20. 批量删除卡密

**端点**: `POST /admin/cardkeys/delete-batch`

**描述**: 批量删除未使用的卡密

**认证**: 需要管理员Token

**请求体**:
```json
{
  "cardKeyIds": ["ck_001", "ck_002", "ck_003"]
}
```

#### 21. 卡密统计

**端点**: `GET /admin/cardkeys/stats`

**描述**: 获取卡密统计信息

**认证**: 需要管理员Token

**响应示例**:
```json
{
  "success": true,
  "stats": {
    "total": 1000,
    "active": 750,
    "used": 200,
    "expired": 50,
    "byType": {
      "credit": 800,
      "plan": 200
    }
  }
}
```

---

### 财务报表

#### 22. 每日收入统计

**端点**: `GET /admin/revenue/daily`

**描述**: 获取每日收入统计

**认证**: 需要管理员Token

**查询参数**:
- `startDate`: 开始日期 (可选, 默认: 30天前)
- `endDate`: 结束日期 (可选, 默认: 今天)
- `limit`: 返回数量 (默认: 30)

**响应示例**:
```json
{
  "success": true,
  "dailyRevenue": [
    {
      "date": "2025-10-11",
      "totalRevenue": 15980,
      "orderCount": 42,
      "avgOrderValue": 380.48
    }
  ]
}
```

#### 23. 月度收入统计

**端点**: `GET /admin/revenue/monthly`

**描述**: 获取月度收入统计

**认证**: 需要管理员Token

**查询参数**:
- `year`: 年份 (可选, 默认: 当前年份)

**响应示例**:
```json
{
  "success": true,
  "year": 2025,
  "monthlyRevenue": [
    {
      "month": "2025-01",
      "totalRevenue": 125600,
      "orderCount": 315,
      "avgOrderValue": 398.73
    }
  ]
}
```

#### 24. 按套餐统计收入

**端点**: `GET /admin/revenue/by-plan`

**描述**: 按套餐统计收入

**认证**: 需要管理员Token

**查询参数**:
- `startDate`: 开始日期 (可选)
- `endDate`: 结束日期 (可选)

**响应示例**:
```json
{
  "success": true,
  "revenueByPlan": [
    {
      "planId": "pro",
      "planName": "专业版",
      "totalRevenue": 85680,
      "orderCount": 215,
      "avgOrderValue": 398.51,
      "percentage": 68.2
    },
    {
      "planId": "basic",
      "planName": "基础版",
      "totalRevenue": 31800,
      "orderCount": 160,
      "avgOrderValue": 198.75,
      "percentage": 25.3
    }
  ],
  "totalRevenue": 125600
}
```

#### 25. 综合财务概览

**端点**: `GET /admin/revenue/overview`

**描述**: 获取综合财务概览

**认证**: 需要管理员Token

**响应示例**:
```json
{
  "success": true,
  "overview": {
    "today": {
      "revenue": 15980,
      "orders": 42,
      "newUsers": 15,
      "cardKeysRedeemed": 8
    },
    "thisMonth": {
      "revenue": 125600,
      "orders": 315,
      "newUsers": 456,
      "cardKeysRedeemed": 89,
      "growthRate": 23.5
    },
    "lastMonth": {
      "revenue": 101700
    },
    "users": {
      "total": 5432,
      "activeSubscribers": 1250,
      "freeUsers": 4182
    }
  }
}
```

#### 26. 导出财务报表

**端点**: `GET /admin/revenue/export`

**描述**: 导出财务报表 (CSV/JSON)

**认证**: 需要管理员Token

**查询参数**:
- `startDate`: 开始日期 (可选)
- `endDate`: 结束日期 (可选)
- `format`: 格式 (csv 或 json, 默认: csv)

**响应**: CSV 文件下载或 JSON 数据

---

## 🔑 权限系统

### API Key 权限类型

| 权限值 | 描述 | 可访问服务 | 谁可以创建 |
|--------|------|------------|-----------|
| `claude` | Claude专用 | Claude API | Commercial Website 用户 (自动) |
| `gemini` | Gemini专用 | Gemini API | 管理员 (手动) |
| `openai` | OpenAI专用 | OpenAI API | 管理员 (手动) |
| `bedrock` | Bedrock专用 | Bedrock API | 管理员 (手动) |
| `all` | 全部服务 | 所有服务 | 管理员 (手动) |

### 服务路径映射

| URL路径 | 服务类型 | 需要权限 |
|---------|---------|----------|
| `/api/*` | Claude | `claude` 或 `all` |
| `/claude/*` | Claude | `claude` 或 `all` |
| `/gemini/*` | Gemini | `gemini` 或 `all` |
| `/openai/*` | OpenAI | `openai` 或 `all` |
| `/bedrock/*` | Bedrock | `bedrock` 或 `all` |

### 权限验证流程

```
1. 用户请求 → 提取 API Key
2. 验证 API Key 是否有效
3. 根据请求路径判断服务类型
4. 检查 API Key 权限是否匹配
5. 通过 → 继续处理 | 拒绝 → 返回 403
```

---

## ❌ 错误码

### HTTP 状态码

| 状态码 | 含义 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器错误 |

### 错误响应格式

```json
{
  "error": "Error Type",
  "message": "详细错误信息"
}
```

### 常见错误

```json
// 权限不足
{
  "error": "Access denied",
  "message": "This API key does not have permission to access gemini service",
  "keyPermissions": "claude",
  "requestedService": "gemini"
}

// API Key 无效
{
  "error": "Invalid API key",
  "message": "API key is invalid or expired"
}

// 套餐不存在
{
  "error": "Plan not found",
  "message": "Plan not found or inactive"
}

// 卡密已使用
{
  "success": false,
  "message": "卡密已被使用"
}
```

---

## 📝 使用示例

### 完整用户流程示例

```bash
# 1. 用户注册/登录 (获取 user_token)
curl -X POST http://localhost:18080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "user@example.com", "password": "password"}'

# 2. 查看可用套餐
curl http://localhost:18080/subscriptions/plans

# 3. 创建订阅订单
curl -X POST http://localhost:18080/subscriptions/orders \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"planId": "pro", "paymentMethod": "wechat"}'

# 4. (支付完成后) 创建 Claude API Key
curl -X POST http://localhost:18080/users/apikeys \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "My App Key", "description": "用于我的应用"}'

# 5. 使用 API Key 调用 Claude
curl -X POST http://localhost:18080/api/messages \
  -H "X-API-Key: claude-relay-1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{"model": "claude-sonnet-4-5", "messages": [...]}'
```

### 管理员操作示例

```bash
# 1. 初始化默认套餐
curl -X POST http://localhost:18080/admin/subscription-plans/init-defaults \
  -H "Authorization: Bearer <admin_token>"

# 2. 生成100个积分卡密
curl -X POST http://localhost:18080/admin/cardkeys/generate \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "count": 100,
    "type": "credit",
    "creditAmount": 1000,
    "expiresInDays": 30,
    "note": "活动赠送"
  }'

# 3. 查看财务概览
curl http://localhost:18080/admin/revenue/overview \
  -H "Authorization: Bearer <admin_token>"

# 4. 导出本月财务报表
curl "http://localhost:18080/admin/revenue/export?format=csv&startDate=2025-10-01" \
  -H "Authorization: Bearer <admin_token>" \
  --output revenue-report.csv
```

---

## 🚀 快速开始

### 1. 启动服务

```bash
cd claude-relay-service
node src/app.js
```

### 2. 初始化数据

```bash
# 初始化默认套餐
curl -X POST http://localhost:18080/admin/subscription-plans/init-defaults \
  -H "Authorization: Bearer <your_admin_token>"
```

### 3. 测试 API

```bash
# 测试套餐列表
curl http://localhost:18080/subscriptions/plans
```

---

## 📚 相关文档

- [开发进度报告](../开发进度报告.md)
- [项目说明](../项目说明.md)
- [Claude Relay Service 说明](./CLAUDE.md)

---

**文档版本**: v2.0  
**最后更新**: 2025-10-11  
**维护者**: Claude Relay Team

