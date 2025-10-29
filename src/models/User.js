const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

/**
 * 用户模型
 */
const userSchema = new mongoose.Schema(
  {
    // 基本信息
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required() {
        // OAuth用户可以没有密码
        return !this.oauthProvider
      },
      minlength: 6
    },

    // 个人信息
    displayName: {
      type: String,
      trim: true,
      default() {
        return this.username
      }
    },
    avatar: {
      type: String,
      default: null
    },

    // OAuth信息
    oauthProvider: {
      type: String,
      enum: ['google', 'github', null],
      default: null
    },
    oauthId: {
      type: String,
      default: null
    },

    // 角色和权限
    role: {
      type: String,
      enum: ['user', 'admin', 'vip'],
      default: 'user'
    },

    // 积分系统
    credits: {
      type: Number,
      default: 0,
      min: 0
    },
    todayUsage: {
      type: Number,
      default: 0,
      min: 0
    },
    lastCreditReset: {
      type: Date,
      default: Date.now
    },

    // 订阅信息
    subscription: {
      planId: {
        type: String,
        enum: ['free', 'basic', 'pro', 'enterprise'],
        default: 'free'
      },
      planName: {
        type: String,
        default: '免费版'
      },
      dailyCredits: {
        type: Number,
        default: 0
      },
      startDate: {
        type: Date,
        default: null
      },
      expiryDate: {
        type: Date,
        default: null
      },
      autoRenew: {
        type: Boolean,
        default: false
      },
      status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active'
      }
    },

    // 邀请系统
    invitationCode: {
      type: String,
      unique: true,
      sparse: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    invitedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    invitationRewards: {
      type: Number,
      default: 0
    },

    // 账户状态
    isActive: {
      type: Boolean,
      default: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String,
      default: null
    },

    // 安全相关
    lastLogin: {
      type: Date,
      default: null
    },
    lastLoginIp: {
      type: String,
      default: null
    },
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date,
      default: null
    },
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
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
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        // 不返回敏感信息
        delete ret.password
        delete ret.emailVerificationToken
        delete ret.failedLoginAttempts
        delete ret.lockUntil
        return ret
      }
    }
  }
)

// 索引
userSchema.index({ email: 1 })
userSchema.index({ username: 1 })
userSchema.index({ invitationCode: 1 })
userSchema.index({ createdAt: -1 })

// 密码加密中间件
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// 验证密码方法
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// 生成邀请码
userSchema.methods.generateInvitationCode = function () {
  if (!this.invitationCode) {
    this.invitationCode = `INV${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`
  }
  return this.invitationCode
}

// 检查订阅是否有效
userSchema.methods.isSubscriptionActive = function () {
  if (this.subscription.status !== 'active') {
    return false
  }
  if (this.subscription.expiryDate && new Date() > this.subscription.expiryDate) {
    return false
  }
  return true
}

// 重置每日使用量
userSchema.methods.resetDailyUsage = function () {
  const now = new Date()
  const lastReset = new Date(this.lastCreditReset)

  // 如果是新的一天，重置使用量
  if (
    now.getDate() !== lastReset.getDate() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear()
  ) {
    this.todayUsage = 0
    this.lastCreditReset = now

    // 如果有订阅，恢复每日积分
    if (this.isSubscriptionActive()) {
      this.credits = Math.min(
        this.credits + this.subscription.dailyCredits,
        this.subscription.dailyCredits * 2 // 最多累积2天
      )
    }
  }
}

const User = mongoose.model('User', userSchema)

module.exports = User
