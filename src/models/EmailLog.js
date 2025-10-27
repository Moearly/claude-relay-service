const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  // 收件人信息
  to: {
    type: String,
    required: true,
    index: true
  },
  
  // 邮件内容
  subject: {
    type: String,
    required: true
  },
  
  // 邮件类型
  type: {
    type: String,
    enum: ['test', 'welcome', 'password-reset', 'order-confirmation', 'notification', 'custom'],
    default: 'custom',
    index: true
  },
  
  // 使用的模板
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate',
    default: null
  },
  templateName: {
    type: String,
    default: ''
  },
  
  // 发送状态
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
    index: true
  },
  
  // 错误信息
  error: {
    type: String,
    default: ''
  },
  
  // 邮件服务商信息
  provider: {
    type: String,
    enum: ['resend', 'smtp'],
    default: 'resend'
  },
  
  // 邮件服务商返回的 messageId
  messageId: {
    type: String,
    default: ''
  },
  
  // 发送时间
  sentAt: {
    type: Date,
    default: null
  },
  
  // 发件人信息（记录当时的配置）
  from: {
    name: String,
    email: String
  },
  
  // 操作人
  sentBy: {
    type: String,
    default: 'system'
  },
  
  // 元数据
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// 索引
emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ status: 1, createdAt: -1 });
emailLogSchema.index({ type: 1, createdAt: -1 });

const EmailLog = mongoose.model('EmailLog', emailLogSchema);

module.exports = EmailLog;

