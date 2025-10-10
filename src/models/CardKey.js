const mongoose = require('mongoose')
const crypto = require('crypto')

/**
 * 卡密模型
 */
const cardKeySchema = new mongoose.Schema(
  {
    // 卡密信息
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },

    // 卡密类型
    type: {
      type: String,
      enum: ['credits', 'subscription', 'trial'],
      required: true
    },

    // 价值
    credits: {
      type: Number,
      default: 0,
      min: 0
    },
    planId: {
      type: String,
      default: null
    },
    planName: {
      type: String,
      default: null
    },
    duration: {
      type: Number, // 天数
      default: 0
    },

    // 状态
    status: {
      type: String,
      enum: ['unused', 'used', 'expired', 'disabled'],
      default: 'unused'
    },

    // 使用信息
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    usedAt: {
      type: Date,
      default: null
    },
    usedIp: {
      type: String,
      default: null
    },

    // 创建信息
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    batchId: {
      type: String,
      default: null
    },

    // 有效期
    validFrom: {
      type: Date,
      default: Date.now
    },
    validUntil: {
      type: Date,
      default: null
    },

    // 备注
    note: {
      type: String,
      default: null
    },

    // 时间戳
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
)

// 索引
cardKeySchema.index({ code: 1 })
cardKeySchema.index({ status: 1 })
cardKeySchema.index({ batchId: 1 })
cardKeySchema.index({ createdAt: -1 })

// 生成卡密
cardKeySchema.statics.generateCode = function () {
  const prefix = 'CRK'
  const randomStr = crypto.randomBytes(8).toString('hex').toUpperCase()
  return `${prefix}-${randomStr.substring(0, 4)}-${randomStr.substring(4, 8)}-${randomStr.substring(8, 12)}`
}

// 验证卡密是否有效
cardKeySchema.methods.isValid = function () {
  if (this.status !== 'unused') {
    return { valid: false, reason: '卡密已被使用或已失效' }
  }

  const now = new Date()

  if (this.validFrom && now < this.validFrom) {
    return { valid: false, reason: '卡密尚未生效' }
  }

  if (this.validUntil && now > this.validUntil) {
    this.status = 'expired'
    this.save()
    return { valid: false, reason: '卡密已过期' }
  }

  return { valid: true }
}

// 标记为已使用
cardKeySchema.methods.markAsUsed = function (userId, ipAddress) {
  this.status = 'used'
  this.usedBy = userId
  this.usedAt = new Date()
  this.usedIp = ipAddress
  return this.save()
}

const CardKey = mongoose.model('CardKey', cardKeySchema)

module.exports = CardKey
