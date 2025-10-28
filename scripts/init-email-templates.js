#!/usr/bin/env node

/**
 * 初始化邮件模板脚本
 * 创建常用的邮件模板
 */

const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/claude-relay', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const EmailTemplate = require('../src/models/EmailTemplate');

const templates = [
  {
    name: '欢迎新用户',
    slug: 'welcome-new-user',
    type: 'welcome',
    subject: '欢迎加入 {{siteName}}！',
    content: `# 欢迎，{{username}}！

感谢您注册 {{siteName}}。您的账户已成功创建！

## 🎉 您现在可以：

- 🔑 生成您的 API Key
- 📚 查看使用文档
- 💬 联系技术支持

## 快速开始

1. 登录您的账户
2. 前往 API 密钥页面
3. 创建您的第一个 API Key
4. 开始使用我们的服务

如有任何问题，请随时联系我们的支持团队。

祝您使用愉快！

---
{{siteName}} 团队`,
    contentType: 'markdown',
    variables: [
      { name: 'username', label: '用户名', type: 'string', required: true, defaultValue: '用户' },
      { name: 'siteName', label: '网站名称', type: 'string', required: true, defaultValue: 'AI Code Relay' }
    ],
    category: 'user',
    description: '用户注册成功后发送的欢迎邮件',
    status: 'active',
    isSystem: false,
    usageCount: 0,
  },
  {
    name: '订单确认通知',
    slug: 'order-confirmation',
    type: 'order-confirmation',
    subject: '订单确认 - {{orderNumber}}',
    content: `# 订单确认

尊敬的 {{username}}，

感谢您的购买！您的订单已成功创建。

## 📋 订单详情

- **订单号**: {{orderNumber}}
- **套餐**: {{planName}}
- **金额**: ¥{{amount}}
- **购买时间**: {{purchaseTime}}

## 💳 套餐内容

- **有效期**: {{duration}} 天
- **积分**: {{credits}} 点

您的套餐将在支付成功后立即生效。

## 📞 需要帮助？

如有任何问题，请联系我们：
- 📧 邮箱：support@codewith.site
- 💬 在线客服

感谢您的支持！

---
{{siteName}} 团队`,
    contentType: 'markdown',
    variables: [
      { name: 'username', label: '用户名', type: 'string', required: true, defaultValue: '用户' },
      { name: 'orderNumber', label: '订单号', type: 'string', required: true, defaultValue: 'ORD123456' },
      { name: 'planName', label: '套餐名称', type: 'string', required: true, defaultValue: '专业版' },
      { name: 'amount', label: '金额', type: 'number', required: true, defaultValue: '99' },
      { name: 'purchaseTime', label: '购买时间', type: 'string', required: false, defaultValue: '' },
      { name: 'duration', label: '有效期（天）', type: 'number', required: true, defaultValue: '30' },
      { name: 'credits', label: '积分', type: 'number', required: true, defaultValue: '1000' },
      { name: 'siteName', label: '网站名称', type: 'string', required: true, defaultValue: 'AI Code Relay' }
    ],
    category: 'order',
    description: '用户购买套餐后发送的订单确认邮件',
    status: 'active',
    isSystem: false,
    usageCount: 0,
  },
  {
    name: '密码重置邮件',
    slug: 'password-reset',
    type: 'password-reset',
    subject: '重置您的密码 - {{siteName}}',
    content: `# 重置密码

您好 {{username}}，

我们收到了您的密码重置请求。

## 🔐 重置密码

请点击下面的链接重置您的密码：

[重置密码]({{resetLink}})

**此链接将在 {{expiryTime}} 小时后失效。**

## ⚠️ 安全提示

- 如果您没有请求重置密码，请忽略此邮件
- 不要将此链接分享给任何人
- 我们永远不会通过邮件询问您的密码

如有任何疑问，请联系我们的支持团队。

---
{{siteName}} 团队`,
    contentType: 'markdown',
    variables: [
      { name: 'username', label: '用户名', type: 'string', required: true, defaultValue: '用户' },
      { name: 'resetLink', label: '重置链接', type: 'url', required: true, defaultValue: 'https://example.com/reset' },
      { name: 'expiryTime', label: '过期时间（小时）', type: 'number', required: true, defaultValue: '24' },
      { name: 'siteName', label: '网站名称', type: 'string', required: true, defaultValue: 'AI Code Relay' }
    ],
    category: 'security',
    description: '用户请求重置密码时发送的邮件',
    status: 'active',
    isSystem: false,
    usageCount: 0,
  },
  {
    name: '积分充值成功',
    slug: 'credits-recharged',
    type: 'notification',
    subject: '积分充值成功 - {{siteName}}',
    content: `# 积分充值成功

您好 {{username}}，

您的积分充值已成功！

## 💰 充值详情

- **充值积分**: {{rechargeAmount}} 点
- **当前余额**: {{currentBalance}} 点
- **充值时间**: {{rechargeTime}}

## 📊 积分使用

您可以使用积分来：
- 调用 API 服务
- 升级套餐
- 购买增值服务

查看您的积分使用记录，请访问控制台。

感谢您的支持！

---
{{siteName}} 团队`,
    contentType: 'markdown',
    variables: [
      { name: 'username', label: '用户名', type: 'string', required: true, defaultValue: '用户' },
      { name: 'rechargeAmount', label: '充值积分', type: 'number', required: true, defaultValue: '1000' },
      { name: 'currentBalance', label: '当前余额', type: 'number', required: true, defaultValue: '5000' },
      { name: 'rechargeTime', label: '充值时间', type: 'string', required: false, defaultValue: '' },
      { name: 'siteName', label: '网站名称', type: 'string', required: true, defaultValue: 'AI Code Relay' }
    ],
    category: 'credits',
    description: '用户积分充值成功后发送的通知邮件',
    status: 'active',
    isSystem: false,
    usageCount: 0,
  },
  {
    name: 'API Key 创建通知',
    slug: 'apikey-created',
    type: 'notification',
    subject: '新的 API Key 已创建 - {{siteName}}',
    content: `# API Key 创建成功

您好 {{username}}，

您已成功创建一个新的 API Key。

## 🔑 API Key 信息

- **名称**: {{keyName}}
- **创建时间**: {{createdTime}}
- **状态**: 已激活

## ⚠️ 安全提示

- 请妥善保管您的 API Key
- 不要在公开场合分享
- 如发现泄露，请立即删除并重新创建
- 建议定期更换 API Key

## 📚 使用文档

查看 API 使用文档，请访问：[文档中心]({{docsLink}})

如有任何问题，请联系技术支持。

---
{{siteName}} 团队`,
    contentType: 'markdown',
    variables: [
      { name: 'username', label: '用户名', type: 'string', required: true, defaultValue: '用户' },
      { name: 'keyName', label: 'Key 名称', type: 'string', required: true, defaultValue: 'My API Key' },
      { name: 'createdTime', label: '创建时间', type: 'string', required: false, defaultValue: '' },
      { name: 'docsLink', label: '文档链接', type: 'url', required: false, defaultValue: 'https://docs.codewith.site' },
      { name: 'siteName', label: '网站名称', type: 'string', required: true, defaultValue: 'AI Code Relay' }
    ],
    category: 'apikey',
    description: '用户创建 API Key 后发送的通知邮件',
    status: 'active',
    isSystem: false,
    usageCount: 0,
  },
  {
    name: '套餐即将到期提醒',
    slug: 'subscription-expiring',
    type: 'notification',
    subject: '您的套餐即将到期 - {{siteName}}',
    content: `# 套餐到期提醒

您好 {{username}}，

您的套餐即将到期，请及时续费以继续使用服务。

## 📅 套餐信息

- **套餐名称**: {{planName}}
- **到期时间**: {{expiryDate}}
- **剩余天数**: {{daysLeft}} 天

## 🔄 续费优惠

现在续费可享受：
- 💰 续费优惠价
- 🎁 额外赠送积分
- ⭐ 优先技术支持

## 📞 联系我们

如需帮助或有任何疑问：
- 📧 邮箱：support@codewith.site
- 💬 在线客服

[立即续费]({{renewLink}})

感谢您的支持！

---
{{siteName}} 团队`,
    contentType: 'markdown',
    variables: [
      { name: 'username', label: '用户名', type: 'string', required: true, defaultValue: '用户' },
      { name: 'planName', label: '套餐名称', type: 'string', required: true, defaultValue: '专业版' },
      { name: 'expiryDate', label: '到期时间', type: 'string', required: true, defaultValue: '' },
      { name: 'daysLeft', label: '剩余天数', type: 'number', required: true, defaultValue: '7' },
      { name: 'renewLink', label: '续费链接', type: 'url', required: false, defaultValue: 'https://codewith.site/pricing' },
      { name: 'siteName', label: '网站名称', type: 'string', required: true, defaultValue: 'AI Code Relay' }
    ],
    category: 'subscription',
    description: '套餐即将到期时发送的提醒邮件',
    status: 'active',
    isSystem: false,
    usageCount: 0,
  },
  {
    name: '测试邮件',
    slug: 'test-email',
    type: 'test',
    subject: '✅ 邮件服务测试 - {{siteName}}',
    content: `# 邮件服务测试

这是一封测试邮件，用于验证邮件服务配置是否正确。

## 📊 测试信息

- **发送时间**: {{sendTime}}
- **服务商**: {{provider}}
- **测试人**: {{tester}}

## ✅ 测试成功

如果您收到这封邮件，说明邮件服务配置成功！

现在您可以：
- 发送欢迎邮件
- 发送订单确认
- 发送系统通知

---
系统自动发送，请勿回复。`,
    contentType: 'markdown',
    variables: [
      { name: 'sendTime', label: '发送时间', type: 'string', required: false, defaultValue: '' },
      { name: 'provider', label: '服务商', type: 'string', required: false, defaultValue: 'Resend' },
      { name: 'tester', label: '测试人', type: 'string', required: false, defaultValue: '管理员' },
      { name: 'siteName', label: '网站名称', type: 'string', required: true, defaultValue: 'AI Code Relay' }
    ],
    category: 'system',
    description: '用于测试邮件服务配置的系统模板',
    status: 'active',
    isSystem: true,
    usageCount: 0,
  },
];

async function initTemplates() {
  try {
    console.log('🔄 清空现有模板...');
    await EmailTemplate.deleteMany({});
    
    console.log('📝 创建预设模板...');
    for (const template of templates) {
      await EmailTemplate.create(template);
      console.log(`  ✅ ${template.name}`);
    }
    
    console.log('');
    console.log(`✅ 成功创建 ${templates.length} 个邮件模板！`);
    console.log('');
    console.log('📋 模板列表:');
    const allTemplates = await EmailTemplate.find({}, 'name slug type isSystem');
    allTemplates.forEach(t => {
      const systemTag = t.isSystem ? '[系统]' : '';
      console.log(`  • ${t.name} (${t.slug}) [${t.type}] ${systemTag}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建模板失败:', error);
    process.exit(1);
  }
}

initTemplates();

