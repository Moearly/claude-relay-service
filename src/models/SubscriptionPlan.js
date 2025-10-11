const mongoose = require('mongoose')

/**
 * 订阅套餐模型 (仅Claude服务)
 */
const subscriptionPlanSchema = new mongoose.Schema(
  {
    // 套餐标识
    planId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    
    // 套餐名称
    name: {
      type: String,
      required: true,
      trim: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    
    // 价格信息
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      enum: ['CNY', 'USD'],
      default: 'CNY'
    },
    originalPrice: {
      type: Number,
      default: null
    },
    
    // 订阅周期
    billingCycle: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'lifetime'],
      default: 'monthly'
    },
    billingCycleDays: {
      type: Number,
      default: 30 // 对应月付
    },
    
    // 套餐配额 (仅Claude)
    features: {
      // Claude 配额
      dailyRequests: {
        type: Number,
        default: 1000 // 每日请求次数
      },
      dailyTokens: {
        type: Number,
        default: 0 // 0表示无限制
      },
      dailyCost: {
        type: Number,
        default: 0 // 每日费用限额
      },
      
      // API Key 限制
      maxApiKeys: {
        type: Number,
        default: 1
      },
      
      // 服务权限 (固定为 claude)
      services: {
        type: [String],
        default: ['claude']
      },
      
      // 可用模型
      models: {
        type: [String],
        default: ['claude-sonnet-4-5']
      },
      
      // 支持服务
      support: {
        type: String,
        enum: ['community', 'email', 'priority', 'dedicated'],
        default: 'community'
      },
      
      // 功能开关
      enableCache: {
        type: Boolean,
        default: true
      },
      enableStreamResponse: {
        type: Boolean,
        default: true
      },
      
      // SLA
      sla: {
        type: String,
        default: '99%'
      }
    },
    
    // 套餐限制
    restrictions: {
      // 速率限制
      rateLimitWindow: {
        type: Number,
        default: 60 // 分钟
      },
      rateLimitRequests: {
        type: Number,
        default: 0 // 0表示无限制
      },
      
      // 并发限制
      concurrencyLimit: {
        type: Number,
        default: 0
      }
    },
    
    // 套餐状态
    isActive: {
      type: Boolean,
      default: true
    },
    isVisible: {
      type: Boolean,
      default: true // 是否在前端显示
    },
    isPopular: {
      type: Boolean,
      default: false // 是否标记为"热门"
    },
    
    // 排序
    sortOrder: {
      type: Number,
      default: 0
    },
    
    // 促销
    promotion: {
      enabled: {
        type: Boolean,
        default: false
      },
      discount: {
        type: Number,
        default: 0 // 折扣百分比
      },
      startDate: {
        type: Date,
        default: null
      },
      endDate: {
        type: Date,
        default: null
      }
    },
    
    // 试用期
    trialDays: {
      type: Number,
      default: 0
    },
    
    // 标签
    tags: {
      type: [String],
      default: []
    },
    
    // 图标
    icon: {
      type: String,
      default: ''
    },
    
    // 创建信息
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    
    // 时间戳
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
)

// 索引
subscriptionPlanSchema.index({ planId: 1 })
subscriptionPlanSchema.index({ isActive: 1, isVisible: 1 })
subscriptionPlanSchema.index({ sortOrder: 1 })

// 计算实际价格（考虑促销）
subscriptionPlanSchema.methods.getEffectivePrice = function () {
  if (!this.promotion.enabled) {
    return this.price
  }
  
  const now = new Date()
  if (this.promotion.startDate && now < this.promotion.startDate) {
    return this.price
  }
  
  if (this.promotion.endDate && now > this.promotion.endDate) {
    return this.price
  }
  
  const discount = this.promotion.discount || 0
  return Math.max(0, this.price * (1 - discount / 100))
}

// 检查套餐是否可用
subscriptionPlanSchema.methods.isAvailable = function () {
  return this.isActive && this.isVisible
}

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema)

module.exports = SubscriptionPlan

