const mongoose = require('mongoose')

const apiKeySchema = new mongoose.Schema(
  {
    // API密钥ID
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    // 密钥值
    apiKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    // 密钥名称
    name: {
      type: String,
      required: true,
      trim: true
    },

    // 描述/备注
    description: {
      type: String,
      default: '',
      trim: true
    },

    // 用户ID
    userId: {
      type: String,
      required: true,
      index: true
    },

    // 用户名
    userUsername: {
      type: String,
      required: true
    },

    // 权限
    permissions: {
      type: String,
      default: 'all'
    },

    // Token限制
    tokenLimit: {
      type: Number,
      default: null
    },

    // 过期时间
    expiresAt: {
      type: Date,
      default: null
    },

    // 日消费限制
    dailyCostLimit: {
      type: Number,
      default: null
    },

    // 总消费限制
    totalCostLimit: {
      type: Number,
      default: null
    },

    // 日消费
    dailyCost: {
      type: Number,
      default: 0
    },

    // 总消费
    totalCost: {
      type: Number,
      default: 0
    },

    // 是否激活
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    // 是否删除
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },

    // 删除时间
    deletedAt: {
      type: Date,
      default: null
    },

    // 删除者
    deletedBy: {
      type: String,
      default: null
    },

    // 删除者类型
    deletedByType: {
      type: String,
      enum: ['user', 'admin', 'system'],
      default: null
    },

    // 创建者
    createdBy: {
      type: String,
      enum: ['user', 'admin', 'system'],
      default: 'user'
    },

    // 最后使用时间
    lastUsedAt: {
      type: Date,
      default: null
    },

    // 使用统计
    usage: {
      total: {
        requests: { type: Number, default: 0 },
        inputTokens: { type: Number, default: 0 },
        outputTokens: { type: Number, default: 0 },
        totalCost: { type: Number, default: 0 }
      },
      daily: {
        requests: { type: Number, default: 0 },
        inputTokens: { type: Number, default: 0 },
        outputTokens: { type: Number, default: 0 },
        totalCost: { type: Number, default: 0 }
      },
      monthly: {
        requests: { type: Number, default: 0 },
        inputTokens: { type: Number, default: 0 },
        outputTokens: { type: Number, default: 0 },
        totalCost: { type: Number, default: 0 }
      }
    }
  },
  {
    timestamps: true, // 自动添加 createdAt 和 updatedAt
    collection: 'apikeys'
  }
)

// 索引
apiKeySchema.index({ userId: 1, isDeleted: 1 })
apiKeySchema.index({ userId: 1, isActive: 1, isDeleted: 1 })
apiKeySchema.index({ createdAt: -1 })

// 虚拟字段：密钥预览
apiKeySchema.virtual('keyPreview').get(function () {
  if (!this.apiKey) {
    return null
  }
  return `${this.apiKey.substring(0, 8)}...${this.apiKey.substring(this.apiKey.length - 4)}`
})

// 确保虚拟字段被序列化
apiKeySchema.set('toJSON', { virtuals: true })
apiKeySchema.set('toObject', { virtuals: true })

const ApiKey = mongoose.model('ApiKey', apiKeySchema)

module.exports = ApiKey
