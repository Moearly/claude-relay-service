const mongoose = require('mongoose')

const invoiceSchema = new mongoose.Schema({
  // 用户信息
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  username: { type: String, required: true },
  userEmail: { type: String, required: true },

  // 订单信息
  orderNumber: { type: String, required: true },
  amount: { type: Number, required: true },

  // 发票信息
  invoiceType: {
    type: String,
    enum: ['normal', 'vat'], // normal: 普通发票, vat: 增值税专用发票
    default: 'normal'
  },
  invoiceTitle: {
    type: String,
    enum: ['personal', 'company'], // personal: 个人, company: 企业
    required: true
  },

  // 企业信息（企业抬头时必填）
  companyName: { type: String },
  taxNumber: { type: String }, // 税号

  // 联系信息
  email: { type: String, required: true },
  phone: { type: String },
  address: { type: String },

  // 发票状态
  status: {
    type: String,
    enum: ['pending', 'processing', 'issued', 'rejected'],
    default: 'pending'
  },

  // 发票文件
  invoiceNumber: { type: String }, // 发票号码
  downloadUrl: { type: String }, // 下载链接

  // 备注和原因
  remark: { type: String }, // 用户备注
  rejectedReason: { type: String }, // 拒绝原因
  adminRemark: { type: String }, // 管理员备注

  // 时间戳
  appliedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  issuedAt: { type: Date },
  rejectedAt: { type: Date }
}, {
  timestamps: true
})

// 索引
invoiceSchema.index({ userId: 1, status: 1 })
invoiceSchema.index({ orderNumber: 1 })
invoiceSchema.index({ createdAt: -1 })

// 实例方法：更新状态
invoiceSchema.methods.updateStatus = function(status, data = {}) {
  this.status = status
  
  if (status === 'processing') {
    this.processedAt = new Date()
  } else if (status === 'issued') {
    this.issuedAt = new Date()
    if (data.invoiceNumber) this.invoiceNumber = data.invoiceNumber
    if (data.downloadUrl) this.downloadUrl = data.downloadUrl
  } else if (status === 'rejected') {
    this.rejectedAt = new Date()
    if (data.rejectedReason) this.rejectedReason = data.rejectedReason
  }
  
  if (data.adminRemark) this.adminRemark = data.adminRemark
  
  return this.save()
}

const Invoice = mongoose.model('Invoice', invoiceSchema)

module.exports = Invoice
