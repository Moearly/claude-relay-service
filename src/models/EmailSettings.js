const mongoose = require('mongoose');

const emailSettingsSchema = new mongoose.Schema({
  // 服务提供商
  provider: {
    type: String,
    enum: ['resend', 'smtp'],
    default: 'resend'
  },
  
  // 是否启用
  enabled: {
    type: Boolean,
    default: false
  },
  
  // Resend 配置
  resendApiKey: {
    type: String,
    default: ''
  },
  
  // SMTP 配置
  smtpHost: {
    type: String,
    default: ''
  },
  smtpPort: {
    type: Number,
    default: 587
  },
  smtpUser: {
    type: String,
    default: ''
  },
  smtpPassword: {
    type: String,
    default: ''
  },
  smtpSecure: {
    type: Boolean,
    default: true
  },
  
  // 发件人信息
  fromName: {
    type: String,
    default: 'AI Code Relay'
  },
  fromEmail: {
    type: String,
    default: ''
  },
  
  // 元数据
  updatedBy: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 确保只有一个配置文档
emailSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const EmailSettings = mongoose.model('EmailSettings', emailSettingsSchema);

module.exports = EmailSettings;

