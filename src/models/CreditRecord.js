const mongoose = require('mongoose');

/**
 * 积分记录模型
 */
const creditRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // 积分变动
  type: {
    type: String,
    enum: ['refill', 'usage', 'reward', 'refund', 'redeem', 'gift'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  balanceBefore: {
    type: Number,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  
  // 描述信息
  description: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    default: null,
  },
  
  // 关联信息
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
  },
  apiKeyId: {
    type: String,
    default: null,
  },
  model: {
    type: String,
    default: null,
  },
  tokens: {
    type: Number,
    default: 0,
  },
  
  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: false,
});

// 索引
creditRecordSchema.index({ userId: 1, createdAt: -1 });
creditRecordSchema.index({ type: 1 });
creditRecordSchema.index({ createdAt: -1 });

const CreditRecord = mongoose.model('CreditRecord', creditRecordSchema);

module.exports = CreditRecord;

