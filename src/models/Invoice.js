const mongoose = require('mongoose')

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    orderNumber: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    invoiceType: {
      type: String,
      enum: ['normal', 'special'], // normal: 普通发票, special: 专用发票
      required: true
    },
    invoiceTitle: {
      type: String,
      enum: ['personal', 'company'],
      required: true
    },
    companyName: {
      type: String
    },
    taxNumber: {
      type: String
    },
    email: {
      type: String,
      required: true
    },
    remark: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected'],
      default: 'pending',
      index: true
    },
    downloadUrl: {
      type: String
    },
    issuedAt: {
      type: Date
    },
    rejectedReason: {
      type: String
    }
  },
  {
    timestamps: true // 自动添加 createdAt 和 updatedAt
  }
)

// 索引
invoiceSchema.index({ userId: 1, createdAt: -1 })
invoiceSchema.index({ status: 1, createdAt: -1 })

const Invoice = mongoose.model('Invoice', invoiceSchema)

module.exports = Invoice

