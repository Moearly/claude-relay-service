const mongoose = require('mongoose')

/**
 * 工单系统模型
 */
const ticketSchema = new mongoose.Schema(
  {
    // 工单编号
    ticketNo: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    // 用户信息
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    username: {
      type: String,
      required: true
    },
    userEmail: {
      type: String,
      required: true
    },

    // 工单基本信息
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    category: {
      type: String,
      required: true,
      enum: ['technical', 'billing', 'account', 'feature', 'other'],
      default: 'other'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'waiting_user', 'waiting_admin', 'resolved', 'closed'],
      default: 'open',
      index: true
    },

    // 工单内容
    description: {
      type: String,
      required: true,
      maxlength: 5000
    },

    // 附件（可选）
    attachments: [
      {
        filename: String,
        url: String,
        size: Number,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // 回复记录
    replies: [
      {
        replyBy: {
          type: String,
          enum: ['user', 'admin'],
          required: true
        },
        replyById: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'replies.replyBy'
        },
        replyByName: {
          type: String,
          required: true
        },
        content: {
          type: String,
          required: true,
          maxlength: 5000
        },
        attachments: [
          {
            filename: String,
            url: String,
            size: Number
          }
        ],
        isInternal: {
          type: Boolean,
          default: false // 内部备注，用户不可见
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // 处理信息
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    assignedToName: {
      type: String,
      default: null
    },

    // 时间信息
    firstResponseAt: {
      type: Date,
      default: null
    },
    lastReplyAt: {
      type: Date,
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    closedAt: {
      type: Date,
      default: null
    },

    // 满意度评价
    rating: {
      score: {
        type: Number,
        min: 1,
        max: 5,
        default: null
      },
      comment: {
        type: String,
        maxlength: 500,
        default: null
      },
      ratedAt: {
        type: Date,
        default: null
      }
    },

    // 标签
    tags: [
      {
        type: String,
        trim: true
      }
    ],

    // 元数据
    metadata: {
      userAgent: String,
      ipAddress: String,
      referrer: String
    }
  },
  {
    timestamps: true
  }
)

// 索引
ticketSchema.index({ userId: 1, status: 1 })
ticketSchema.index({ status: 1, priority: 1 })
ticketSchema.index({ category: 1, status: 1 })
ticketSchema.index({ createdAt: -1 })

// 生成工单编号
ticketSchema.statics.generateTicketNo = async function () {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const prefix = `TK${year}${month}${day}`

  // 查找今天的最后一个工单号
  const lastTicket = await this.findOne({
    ticketNo: new RegExp(`^${prefix}`)
  })
    .sort({ ticketNo: -1 })
    .limit(1)

  let sequence = 1
  if (lastTicket) {
    const lastSequence = parseInt(lastTicket.ticketNo.slice(-4))
    sequence = lastSequence + 1
  }

  return `${prefix}${String(sequence).padStart(4, '0')}`
}

// 添加回复
ticketSchema.methods.addReply = function (replyData) {
  this.replies.push(replyData)
  this.lastReplyAt = new Date()

  // 更新状态
  if (replyData.replyBy === 'admin') {
    if (!this.firstResponseAt) {
      this.firstResponseAt = new Date()
    }
    if (this.status === 'open' || this.status === 'waiting_admin') {
      this.status = 'waiting_user'
    }
  } else {
    if (this.status === 'waiting_user') {
      this.status = 'waiting_admin'
    }
  }

  return this.save()
}

// 更新状态
ticketSchema.methods.updateStatus = function (newStatus) {
  this.status = newStatus

  if (newStatus === 'resolved') {
    this.resolvedAt = new Date()
  } else if (newStatus === 'closed') {
    this.closedAt = new Date()
  }

  return this.save()
}

// 分配工单
ticketSchema.methods.assignTo = function (adminId, adminName) {
  this.assignedTo = adminId
  this.assignedToName = adminName
  if (this.status === 'open') {
    this.status = 'in_progress'
  }
  return this.save()
}

// 添加评分
ticketSchema.methods.addRating = function (score, comment) {
  this.rating = {
    score,
    comment,
    ratedAt: new Date()
  }
  return this.save()
}

// 虚拟字段：响应时间（分钟）
ticketSchema.virtual('responseTime').get(function () {
  if (!this.firstResponseAt) return null
  return Math.floor((this.firstResponseAt - this.createdAt) / 1000 / 60)
})

// 虚拟字段：解决时间（小时）
ticketSchema.virtual('resolutionTime').get(function () {
  if (!this.resolvedAt) return null
  return Math.floor((this.resolvedAt - this.createdAt) / 1000 / 60 / 60)
})

// 虚拟字段：回复数量
ticketSchema.virtual('replyCount').get(function () {
  return this.replies.filter((r) => !r.isInternal).length
})

// toJSON 配置
ticketSchema.set('toJSON', { virtuals: true })
ticketSchema.set('toObject', { virtuals: true })

const Ticket = mongoose.model('Ticket', ticketSchema)

module.exports = Ticket

