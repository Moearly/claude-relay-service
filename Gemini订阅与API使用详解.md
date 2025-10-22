# Gemini 订阅与 API 使用详解

> 📅 更新时间：2025-10-18  
> 📝 说明：本文档详细解释 Gemini 订阅方案、API 使用方式，以及代理系统的实现原理

---

## 📚 目录

- [1. Google AI 订阅方案对比](#1-google-ai-订阅方案对比)
- [2. Gemini Ultra 详解](#2-gemini-ultra-详解)
- [3. 网页 vs App vs API](#3-网页-vs-app-vs-api)
- [4. API Key 方式 vs OAuth 方式](#4-api-key-方式-vs-oauth-方式)
- [5. 当前代理系统实现原理](#5-当前代理系统实现原理)
- [6. 为什么必须要项目ID](#6-为什么必须要项目id)
- [7. 常见误区澄清](#7-常见误区澄清)
- [8. 问题排查结论](#8-问题排查结论)

---

## 1. Google AI 订阅方案对比

### 完整订阅层级（2025 最新）

| 特性 | 免费版 | Gemini Advanced | **Gemini Ultra** |
|------|--------|----------------|-----------------|
| **价格** | $0 | $19.99/月 | **$249.99/月** |
| **每日提示次数** | 5次 | 100次 | **500次** |
| **AI 模型** | Gemini 1.5 | Gemini 2.0 Flash | **Gemini 2.5 Pro Deep Think** |
| **Deep Research** | ❌ | 50份/天 | **200份/天** |
| **Veo 3 视频生成** | ❌ | 2个/天 | **5个/天** |
| **AI 积分** | ❌ | 10,000/月 | **25,000/月** |
| **存储空间** | 15GB | 2TB | **30TB** |
| **YouTube Premium** | ❌ | ❌ | ✅ **包含** |
| **Flow 视频编辑** | ❌ | 基础版 | **完整版** |
| **Whisk 创意工具** | ❌ | 基础版 | **完整版** |
| **NotebookLM** | 基础版 | 标准版 | **高级版** |

---

## 2. Gemini Ultra 详解

### 💰 订阅费用
- **价格**：$249.99/月（约 ¥1,800/月）
- **定位**：面向专业用户和企业的旗舰方案

### ⭐ 核心特权

#### 2.1 文本对话类（不消耗积分）

```
基于每日次数限制，不消耗 AI 积分
```

| 功能 | 每日限额 | 说明 |
|------|---------|------|
| **Gemini 聊天** | 500 次 | 最强的 2.5 Pro Deep Think 模型 |
| **Deep Research** | 200 份 | 深度研究报告生成 |
| **NotebookLM** | 不限 | AI 笔记助手 |
| **Google 搜索 AI 模式** | 不限 | 智能搜索增强 |

#### 2.2 多媒体生成类（消耗 AI 积分）

```
每月 25,000 个 AI 积分，用于以下功能
```

| 功能 | 消耗积分（估算） | 说明 |
|------|----------------|------|
| **Flow 视频制作** | ~100-500/个 | 电影级视频生成，支持 Veo 3.1 |
| **Veo 3 视频** | ~200-1000/个 | 高质量视频生成（含音频） |
| **Whisk 动画** | ~50-200/个 | 图片转动画 |
| **Imagen 4 图像** | ~10-50/张 | 高质量图像生成 |

**25,000 积分大约可以生成**：
- 🎬 50-250 个 Flow 视频（中等质量）
- 🎥 25-125 个 Veo 3 高质量视频
- 🖼️ 500-2500 张 Imagen 4 图片

#### 2.3 附加福利

- ✅ 30TB Google One 存储空间
- ✅ YouTube Premium 个人方案（无广告、离线、后台播放）
- ✅ Google 相册、云端硬盘、Gmail 共享存储

### 📋 使用场景示例

```
早上：
- Gemini 聊天 50 次 → 0 积分（计入 500 次/天）
- Deep Research 10 份 → 0 积分（计入 200 份/天）

下午：
- Flow 制作 3 个视频 → ~900 积分
- Whisk 生成 5 个动画 → ~500 积分

晚上：
- Veo 3 生成 2 个视频 → ~1000 积分

当日消耗：~2400 积分（剩余 22,600）
```

---

## 3. 网页 vs App vs API

### 3.1 网页使用（gemini.google.com）

```
🔗 访问地址：https://gemini.google.com/
```

**界面示意**：
```
┌─────────────────────────────────────┐
│  🔵 Gemini                     登录  │
├─────────────────────────────────────┤
│                                     │
│  👤 你好，我是 Gemini               │
│      我可以帮你做什么？              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 在这里输入问题...      [发送]│   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**特点**：
- ✅ 浏览器直接访问，有可视化界面
- ✅ 用 Google 账号登录
- ✅ 可以上传图片、文件、语音输入
- ✅ **可以使用 Ultra 的 25,000 AI 积分**
- ✅ 享受订阅的所有功能（Flow、Veo 3、Whisk 等）

### 3.2 App 使用（移动应用）

**下载地址**：
- 📱 iOS: App Store 搜索 "Gemini"
- 🤖 Android: Google Play 搜索 "Gemini"

**界面示意**：
```
手机屏幕：
┌───────────────────┐
│ < Gemini      ⋮  │
├───────────────────┤
│                   │
│  💬 你好          │
│     ↓             │
│  🤖 你好！我能    │
│     帮你什么？     │
│                   │
├───────────────────┤
│ [🎤] [📷] [⌨️]   │
└───────────────────┘
```

**特点**：
- ✅ 手机上的独立应用
- ✅ 同样用 Google 账号登录
- ✅ 支持语音输入、拍照提问
- ✅ **同样可以使用 Ultra 的 25,000 AI 积分**
- ✅ 功能与网页版一致

### 3.3 API 使用（程序调用）

**代码示例**：
```javascript
// 没有界面，纯代码调用
const response = await axios.post(
  'https://cloudcode-pa.googleapis.com/v1internal:generateContent',
  {
    model: 'gemini-2.0-flash-exp',
    request: {
      contents: [{ parts: [{ text: '1+1=?' }] }]
    },
    project: 'gen-lang-client-0620762716'
  },
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
)
```

**特点**：
- ❌ **没有**可视化界面
- ❌ **不能**用浏览器打开
- ✅ 用代码自动调用
- ✅ 可以集成到应用中
- ❌ **不能使用 Ultra 的 25,000 AI 积分**
- ✅ 使用 Google Cloud 的 RPM/RPD 限额（见下文）

### 📊 三者对比表

| 特性 | 网页 | App | API |
|------|------|-----|-----|
| **访问方式** | gemini.google.com | 手机应用 | 代码调用 |
| **有界面** | ✅ 聊天界面 | ✅ 聊天界面 | ❌ 无界面 |
| **登录方式** | Google 账号 | Google 账号 | Access Token |
| **Ultra 积分** | ✅ 可用 25,000 | ✅ 可用 25,000 | ❌ 不适用 |
| **适合人群** | 普通用户 | 手机用户 | 开发者/企业 |
| **代理系统** | ❌ | ❌ | ✅ **使用这个** |

---

## 4. API Key 方式 vs OAuth 方式

### 4.1 直接使用 API Key

```bash
# Google 官方公开 API
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{"parts":[{"text": "Hello"}]}]
  }'
```

**特点**：

| 项目 | 说明 |
|------|------|
| **认证方式** | API Key (如 `AIza...`) |
| **API 端点** | `generativelanguage.googleapis.com` |
| **是否需要项目ID** | ❌ 不需要 |
| **免费额度** | 15 RPM, 1,500 RPD |
| **模型访问** | 受限的公开模型（如 gemini-pro） |
| **适用场景** | 个人开发、小规模应用 |

### 4.2 OAuth 方式（当前系统使用）

```javascript
// 使用 OAuth Token 调用内部 API
const { OAuth2Client } = require('google-auth-library')

// 1. 使用 Gemini CLI 的公开 OAuth 凭据
const client = new OAuth2Client(
  '681255809395-oo8ft2oprdrnp9e3aqf6av3hmdib135j.apps.googleusercontent.com',
  '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'
)

// 2. 设置用户的 Access Token 和 Refresh Token
client.setCredentials({
  access_token: 'ya29.a0AQQ_BDT3...',
  refresh_token: '1//06_RG0j6PJ5eR...'
})

// 3. 调用内部 API（需要项目ID）
const response = await axios.post(
  'https://cloudcode-pa.googleapis.com/v1internal:generateContent',
  {
    model: 'gemini-2.0-flash-exp',
    request: { contents: [...] },
    project: 'gen-lang-client-0620762716'  // ← 必需！
  },
  {
    headers: {
      'Authorization': `Bearer ${(await client.getAccessToken()).token}`
    }
  }
)
```

**特点**：

| 项目 | 说明 |
|------|------|
| **认证方式** | OAuth 2.0 (Access Token + Refresh Token) |
| **API 端点** | `cloudcode-pa.googleapis.com/v1internal` |
| **是否需要项目ID** | ✅ **必需** |
| **免费额度** | 更高（取决于账户类型） |
| **模型访问** | 更多实验性模型（如 gemini-2.0-flash-exp） |
| **适用场景** | 代理服务、企业应用 |

### 📊 对比总结

| 特性 | API Key 方式 | OAuth 方式（系统使用） |
|------|-------------|---------------------|
| **API 端点** | generativelanguage.googleapis.com | cloudcode-pa.googleapis.com/v1internal |
| **认证** | API Key | Access Token |
| **项目ID** | ❌ 不需要 | ✅ **必需** |
| **Token 刷新** | 不需要 | 支持自动刷新 |
| **API 类型** | 公开 API | 内部 API（Google Cloud Code Assist） |
| **免费额度** | 15/分钟, 1500/天 | 更高（具体看项目配额） |
| **可用模型** | gemini-pro, gemini-pro-vision | gemini-2.0-flash-exp, gemini-1.5-pro 等 |

---

## 5. 当前代理系统实现原理

### 5.1 系统架构

```
用户客户端
    ↓
    | HTTP 请求（携带你发的 API Key）
    ↓
你的代理服务器 (156.229.163.86:3000)
    ↓
    | 1. 验证 API Key
    | 2. 检查权限（gemini 权限）
    | 3. 选择可用的 Gemini 账户
    ↓
    | 使用 OAuth Token 调用
    ↓
Google Cloud API (cloudcode-pa.googleapis.com)
    | ⚠️ 需要项目启用 API
    ↓
    | 返回 Gemini 响应
    ↓
你的代理服务器
    ↓
    | 返回给用户
    ↓
用户客户端
```

### 5.2 关键代码位置

#### 📄 OAuth 配置
```javascript:19-22:claude-relay-service/src/services/geminiAccountService.js
// Gemini CLI OAuth 配置 - 这些是公开的 Gemini CLI 凭据
const OAUTH_CLIENT_ID = '681255809395-oo8ft2oprdrnp9e3aqf6av3hmdib135j.apps.googleusercontent.com'
const OAUTH_CLIENT_SECRET = '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'
const OAUTH_SCOPES = ['https://www.googleapis.com/auth/cloud-platform']
```

#### 📄 API 调用端点
```javascript:1288-1289:claude-relay-service/src/services/geminiAccountService.js
  const axios = require('axios')
  const CODE_ASSIST_ENDPOINT = 'https://cloudcode-pa.googleapis.com'
  const CODE_ASSIST_API_VERSION = 'v1internal'
```

#### 📄 项目ID处理
```javascript:1307-1310:claude-relay-service/src/services/geminiAccountService.js
  // 只有当projectId存在时才添加project字段
  if (projectId) {
    request.project = projectId
  }
```

### 5.3 请求流程详解

#### 步骤 1：用户调用你的 API

```bash
curl -X POST "http://156.229.163.86:3000/gemini/v1/models/gemini-2.0-flash-exp:generateContent" \
  -H "Authorization: Bearer cr_df16e7ca..." \
  -d '{"contents":[{"parts":[{"text":"1+1=?"}]}]}'
```

#### 步骤 2：API Key 验证

```javascript
// src/middleware/auth.js
const apiKey = req.headers['authorization']?.replace(/^Bearer\s+/i, '')
const validation = await apiKeyService.validateApiKey(apiKey)

// 检查是否有 gemini 权限
if (!hasServicePermission(validation.keyData.permissions, 'gemini')) {
  return res.status(403).json({ error: 'No permission for gemini service' })
}
```

#### 步骤 3：选择 Gemini 账户

```javascript
// src/services/unifiedGeminiScheduler.js
const { accountId } = await unifiedGeminiScheduler.selectAccountForApiKey(
  req.apiKey,
  sessionHash,
  model
)

// 如果 API Key 绑定了专属账户
if (apiKeyData.geminiAccountId) {
  return boundAccount  // 返回绑定的账户
} else {
  // 从共享账户池选择
  return selectFromSharedPool()
}
```

#### 步骤 4：获取 OAuth 客户端

```javascript
// src/services/geminiAccountService.js
const account = await geminiAccountService.getAccount(accountId)
const client = await geminiAccountService.getOauthClient(
  account.accessToken,
  account.refreshToken,
  proxyConfig
)
```

#### 步骤 5：调用 Google Cloud API

```javascript
// 构造请求体（必须包含项目ID）
const request = {
  model: 'gemini-2.0-flash-exp',
  request: {
    contents: [{ parts: [{ text: '1+1=?' }] }],
    generationConfig: { ... }
  },
  project: 'gen-lang-client-0620762716'  // ← 关键！
}

// 调用内部 API
const response = await axios.post(
  'https://cloudcode-pa.googleapis.com/v1internal:generateContent',
  request,
  {
    headers: {
      'Authorization': `Bearer ${(await client.getAccessToken()).token}`,
      'Content-Type': 'application/json'
    }
  }
)
```

### 5.4 Token 自动刷新机制

```javascript
// 检查 Token 是否过期
if (isTokenExpired(account)) {
  await refreshAccountToken(account.id)
  account = await getAccount(account.id)
}

// 刷新 Token
async function refreshAccountToken(accountId) {
  const account = await getAccount(accountId)
  const client = new OAuth2Client(OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET)
  client.setCredentials({
    refresh_token: account.refreshToken
  })
  
  const { credentials } = await client.refreshAccessToken()
  
  // 更新账户信息
  await updateAccount(accountId, {
    accessToken: credentials.access_token,
    expiresAt: credentials.expiry_date
  })
}
```

---

## 6. 为什么必须要项目ID

### 6.1 技术原因

**API 端点差异**：

```
公开 API（不需要项目ID）:
https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent

内部 API（需要项目ID）:
https://cloudcode-pa.googleapis.com/v1internal:generateContent
```

当前系统使用的是 **Google Cloud Code Assist 内部 API**，不是公开的 Gemini API。

### 6.2 项目ID的作用

| 用途 | 说明 |
|------|------|
| **计费管理** | 关联到 Google Cloud 项目，用于费用追踪 |
| **配额管理** | 每个项目有独立的 QPM/QPD 限额 |
| **API 启用检查** | 验证项目是否启用了 Gemini API |
| **权限验证** | 检查账户对项目的访问权限 |
| **使用统计** | 记录项目的 API 使用情况 |

### 6.3 从日志看项目ID

```javascript
// 日志显示的请求详情
{
  "url": "https://cloudcode-pa.googleapis.com/v1internal:generateContent",
  "requestBody": {
    "model": "gemini-2.0-flash-exp",
    "request": { ... },
    "project": "gen-lang-client-0620762716"  // ← 必需字段
  }
}
```

**如果没有项目ID或项目未启用API，会返回 403 错误**：

```json
{
  "error": {
    "code": 403,
    "message": "Gemini for Google Cloud API has not been used in project gen-lang-client-0620762716 before or it is disabled.",
    "status": "PERMISSION_DENIED"
  }
}
```

### 6.4 项目ID的来源

当前系统中，项目ID的优先级：

```javascript
// 1. 账户配置的固定项目ID
effectiveProjectId = account.projectId

// 2. 临时项目ID（从 loadCodeAssist 获取）
if (!effectiveProjectId) {
  effectiveProjectId = account.tempProjectId
}

// 3. 尝试调用 loadCodeAssist 获取
if (!effectiveProjectId) {
  const loadRes = await loadCodeAssist(client)
  effectiveProjectId = loadRes.cloudaicompanionProject
}
```

当前使用的项目ID：`gen-lang-client-0620762716`

---

## 7. 常见误区澄清

### ❌ 误区 1：Ultra 订阅 = API 可用

```
错误理解：
"我订阅了 Gemini Ultra，所以我的 API 应该能用"

正确理解：
Ultra 订阅只能在网页/App使用，与 API 调用是两个独立系统
```

**对比**：

| 订阅（网页/App） | API（代码调用） |
|----------------|---------------|
| gemini.google.com | cloudcode-pa.googleapis.com |
| Google 账号登录 | OAuth Token 认证 |
| 500次/天 + 25,000积分 | Google Cloud 配额（RPM/RPD） |
| ✅ 可用 Ultra 功能 | ❌ 不能用 Ultra 功能 |

### ❌ 误区 2：Ultra 积分可用于 API

```
错误理解：
"我有 25,000 AI 积分，可以用来调用 API"

正确理解：
25,000 积分只能在官方网页/App上生成视频/图像，不能用于 API 调用
```

**积分使用场景**：
- ✅ gemini.google.com 上使用 Flow 生成视频
- ✅ 手机 App 上使用 Whisk 生成动画
- ❌ 通过 API 调用（不消耗也不能使用积分）

### ❌ 误区 3：API Key = OAuth Token

```
错误理解：
"我有 Google API Key，应该能直接用"

正确理解：
当前系统使用 OAuth 方式，不是 API Key 方式
```

**两种方式对比**：

```bash
# API Key 方式（系统不用）
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIza..."

# OAuth 方式（系统使用）
curl "https://cloudcode-pa.googleapis.com/v1internal:generateContent" \
  -H "Authorization: Bearer ya29.a0AQQ_..."
```

### ❌ 误区 4：Ultra 订阅能提高 API 配额

```
错误理解：
"订阅 Ultra 后，API 的 1500次/天限制会提高"

正确理解：
Ultra 订阅不影响 API 配额，API 配额由 Google Cloud 项目配置决定
```

**实际情况**：
- Ultra 订阅：500次提示/天（网页/App使用）
- API 免费额度：1500次请求/天（API 调用）
- 两者**完全独立**，互不影响

### ❌ 误区 5："Gemini Ultra Veo3 会员"

```
错误说法：
"Gemini Ultra Veo3 会员账号"

正确说法：
"Gemini Ultra 订阅账号"（包含 Veo 3 使用权限）
```

**原因**：
- Veo 3 是一个**功能**，不是会员类型
- 官方只有：Gemini Advanced 和 Gemini Ultra 两种付费订阅

---

## 8. 问题排查结论

### 8.1 当前遇到的问题

**错误日志**：
```
Error: Gemini for Google Cloud API has not been used in project 
gen-lang-client-0620762716 before or it is disabled.

Enable it by visiting https://console.developers.google.com/apis/api/
cloudaicompanion.googleapis.com/overview?project=gen-lang-client-0620762716
```

### 8.2 问题根本原因

```
❌ 不是因为：
   - 没有订阅 Gemini Ultra
   - 积分不够
   - API Key 错误
   - Token 过期（已刷新）
   - 账户不可调度（已修复）

✅ 真正原因：
   Google Cloud 项目 'gen-lang-client-0620762716' 
   没有启用 'Gemini for Google Cloud API'
```

### 8.3 解决方案

**步骤 1：访问 API 启用页面**

```
https://console.developers.google.com/apis/api/cloudaicompanion.googleapis.com/overview?project=gen-lang-client-0620762716
```

**步骤 2：点击"启用"按钮**

![启用 API](https://console.cloud.google.com/)

**步骤 3：等待生效**
- 通常需要 2-5 分钟
- 如果刚刚启用，请等待后再测试

**步骤 4：验证**

```bash
# 测试 API 调用
curl -X POST "http://156.229.163.86:3000/gemini/v1/models/gemini-2.0-flash-exp:generateContent" \
  -H "Authorization: Bearer cr_df16e7ca..." \
  -d '{"contents":[{"parts":[{"text":"测试"}]}]}'
```

### 8.4 排查时间线

| 时间 | 操作 | 结果 |
|------|------|------|
| 15:47:59 | 刷新 Token | ✅ 成功 |
| 15:48:13 | 调用 API | ❌ 403 错误 |
| 排查 | 检查日志 | 🔍 发现项目未启用 API |
| 待执行 | 启用 API | ⏳ 等待操作 |

### 8.5 API 免费配额说明

启用 API 后，**无需付费**即可使用：

| 配额类型 | 限制 | 说明 |
|---------|------|------|
| **RPM** | 15 | 每分钟 15 次请求 |
| **RPD** | 1,500 | 每天 1,500 次请求 |
| **TPM** | 1,500,000 | 每分钟 150 万 tokens |

**对比 Ultra 订阅**：
- Ultra 订阅：500 次/天（网页使用）
- API 免费：1,500 次/天（代码调用）
- **API 免费额度比 Ultra 订阅还高！**

---

## 📋 附录

### A. 相关链接

| 名称 | 链接 |
|------|------|
| Gemini 官网 | https://gemini.google.com/ |
| 订阅方案 | https://gemini.google.com/subscriptions/ |
| Google Cloud Console | https://console.cloud.google.com/ |
| API 文档（公开） | https://ai.google.dev/docs |
| 启用 API | https://console.developers.google.com/apis/api/cloudaicompanion.googleapis.com/ |

### B. 技术术语对照

| 英文 | 中文 | 说明 |
|------|------|------|
| API Key | API 密钥 | 直接调用公开 API 的凭据 |
| Access Token | 访问令牌 | OAuth 认证获取的短期凭据 |
| Refresh Token | 刷新令牌 | 用于自动获取新 Access Token |
| OAuth 2.0 | OAuth 授权 | 开放授权协议 |
| Project ID | 项目 ID | Google Cloud 项目唯一标识 |
| RPM | Requests Per Minute | 每分钟请求次数 |
| RPD | Requests Per Day | 每天请求次数 |
| TPM | Tokens Per Minute | 每分钟 token 数量 |
| QPM | Queries Per Minute | 每分钟查询次数 |

### C. 代理系统配置摘要

```yaml
服务器: 156.229.163.86
端口: 3000
服务: Claude Relay Service

Gemini 账户:
  名称: gemini1
  ID: 75d15458-d301-4dc3-8408-5f64a0f50ba2
  类型: Gemini Cli (官方)
  认证: OAuth 授权
  项目ID: gen-lang-client-0620762716
  状态: 正常 + 可调度

API Key:
  名称: Gemini测试Key
  ID: 5119ae94-96a5-4aca-bc07-b762af403560
  Key: cr_df16e7ca...
  权限: gemini
  绑定账户: gemini1

管理后台:
  地址: http://156.229.163.86:3000/admin-next/
  用户名: cr_admin_3ba48c3b
  密码: D0vI06DB0VEOpOlM
```

---

## 📝 总结

### 核心要点

1. **Gemini Ultra 订阅**：
   - 💰 $249.99/月
   - 🌐 只能在网页/App使用
   - 💎 25,000 AI积分（生成视频/图像）
   - ❌ 不能用于 API 调用

2. **API 使用**：
   - 🔧 完全独立于订阅系统
   - 🆓 有免费配额（1500次/天）
   - ⚠️ 需要在 Google Cloud 中启用 API
   - ✅ 适合代理服务

3. **当前问题**：
   - ❌ Google Cloud 项目未启用 API
   - ✅ 解决方案：访问链接启用 API
   - ⏱️ 等待 2-5 分钟生效

4. **关键区别**：
   - 网页/App ≠ API
   - 订阅 ≠ API 权限
   - Ultra 积分 ≠ API 配额

---

📅 **最后更新**：2025-10-18  
📧 **维护者**：Claude Relay Service 团队  
📖 **文档版本**：v1.0

