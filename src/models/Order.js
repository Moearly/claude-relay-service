const mongoose = require('mongoose')

/**
 * 订单模型
 */
const orderSchema = new mongoose.Schema(
  {
    // 订单基本信息
    orderId: {
      type: String,
      required: true,
      unique: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // 订单内容
    type: {
      type: String,
      enum: ['subscription', 'credits', 'recharge'],
      required: true
    },
    planId: {
      type: String,
      default: null
    },
    planName: {
      type: String,
      default: null
    },
    credits: {
      type: Number,
      default: 0
    },

    // 价格信息
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      enum: ['CNY', 'USD'],
      default: 'CNY'
    },
    originalAmount: {
      type: Number,
      default: null
    },
    discount: {
      type: Number,
      default: 0
    },

    // 支付信息
    paymentMethod: {
      type: String,
      enum: ['alipay', 'wechat', 'stripe', 'crypto', 'card_key'],
      default: null
    },
    paymentId: {
      type: String,
      default: null
    },
    paymentUrl: {
      type: String,
      default: null
    },
    qrCode: {
      type: String,
      default: null
    },

    // 订单状态
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled', 'refunded', 'expired'],
      default: 'pending'
    },

    // 时间信息
    createdAt: {
      type: Date,
      default: Date.now
    },
    paidAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default() {
        return new Date(Date.now() + 15 * 60 * 1000) // 15分钟后过期
      }
    },
    cancelledAt: {
      type: Date,
      default: null
    },

    // 其他信息
    note: {
      type: String,
      default: null
    },
    ipAddress: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
)

// 索引
orderSchema.index({ orderId: 1 })
orderSchema.index({ userId: 1, createdAt: -1 })
orderSchema.index({ status: 1 })
orderSchema.index({ expiresAt: 1 })

// 自动取消过期订单
orderSchema.methods.checkExpired = function () {
  if (this.status === 'pending' && new Date() > this.expiresAt) {
    this.status = 'expired'
    this.cancelledAt = new Date()
    return true
  }
  return false
}

const Order = mongoose.model('Order', orderSchema)

module.exports = Order
