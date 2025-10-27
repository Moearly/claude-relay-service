const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  // 模板名称
  name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // 模板标识（用于代码中引用）
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // 模板类型
  type: {
    type: String,
    enum: ['test', 'welcome', 'password-reset', 'order-confirmation', 'notification', 'custom'],
    default: 'custom',
    index: true
  },
  
  // 邮件主题
  subject: {
    type: String,
    required: true
  },
  
  // 邮件内容（支持 Markdown 和变量）
  content: {
    type: String,
    required: true
  },
  
  // 内容格式
  contentType: {
    type: String,
    enum: ['html', 'markdown'],
    default: 'markdown'
  },
  
  // 变量定义
  variables: [{
    name: String,        // 变量名，如 username
    label: String,       // 显示名称，如 用户名
    type: String,        // 类型：string, number, date, url
    required: Boolean,   // 是否必填
    defaultValue: String // 默认值
  }],
  
  // 模板分类
  category: {
    type: String,
    default: 'general'
  },
  
  // 模板描述
  description: {
    type: String,
    default: ''
  },
  
  // 状态
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active',
    index: true
  },
  
  // 是否为系统模板（不可删除）
  isSystem: {
    type: Boolean,
    default: false
  },
  
  // 使用次数
  usageCount: {
    type: Number,
    default: 0
  },
  
  // 最后使用时间
  lastUsedAt: {
    type: Date,
    default: null
  },
  
  // 创建者
  createdBy: {
    type: String,
    default: 'system'
  },
  
  // 更新者
  updatedBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true
});

// 索引
emailTemplateSchema.index({ status: 1, type: 1 });
emailTemplateSchema.index({ createdAt: -1 });

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);

module.exports = EmailTemplate;

