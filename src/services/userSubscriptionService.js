const { User, SubscriptionPlan, Order } = require('../models')
const logger = require('../utils/logger')
const emailService = require('./emailService')

class UserSubscriptionService {
  /**
   * 获取用户的当前订阅
   */
  async getUserSubscription(userId) {
    try {
      const user = await User.findById(userId).lean()
      
      if (!user) {
        throw new Error('User not found')
      }
      
      // 如果没有订阅,返回默认免费版
      if (!user.subscription || user.subscription.planId === 'free') {
        return {
          planId: 'free',
          planName: '免费版',
          displayName: '免费版',
          status: 'active',
          dailyRequests: 1000,
          maxApiKeys: 1,
          startDate: user.createdAt,
          expiryDate: null,
          autoRenew: false,
          isFree: true
        }
      }
      
      return {
        ...user.subscription,
        isFree: false
      }
    } catch (error) {
      logger.error('❌ Failed to get user subscription:', error)
      throw error
    }
  }

  /**
   * 创建订阅订单
   */
  async createSubscriptionOrder(userId, planId, paymentMethod = 'wechat') {
    try {
      const user = await User.findById(userId)
      
      if (!user) {
        throw new Error('User not found')
      }
      
      const plan = await SubscriptionPlan.findOne({ planId, isActive: true })
      
      if (!plan) {
        throw new Error('Plan not found or inactive')
      }
      
      // 检查是否是 Claude 套餐
      if (!plan.features.services.includes('claude')) {
        throw new Error('Invalid plan: Only Claude plans are supported')
      }
      
      // 计算实际价格
      const effectivePrice = this._calculateEffectivePrice(plan)
      
      // 创建订单
      const orderId = this._generateOrderId()
      
      const order = new Order({
        orderId,
        userId: user._id,
        userUsername: user.username,
        type: 'subscription',
        planId: plan.planId,
        planName: plan.displayName,
        amount: effectivePrice,
        originalAmount: plan.price,
        currency: plan.currency,
        paymentMethod,
        status: 'pending',
        metadata: {
          billingCycle: plan.billingCycle,
          billingCycleDays: plan.billingCycleDays,
          features: plan.features
        }
      })
      
      await order.save()
      
      logger.success(`✅ Created subscription order: ${orderId} for user ${user.username}`)
      
      // 生成支付信息
      return {
        orderId,
        planId: plan.planId,
        planName: plan.displayName,
        amount: effectivePrice,
        currency: plan.currency,
        paymentMethod,
        paymentUrl: this._generatePaymentUrl(orderId, paymentMethod),
        qrCode: this._generateQrCode(orderId, paymentMethod),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15分钟后过期
      }
    } catch (error) {
      logger.error('❌ Failed to create subscription order:', error)
      throw error
    }
  }

  /**
   * 激活订阅 (在支付成功后调用)
   */
  async activateSubscription(userId, orderId) {
    try {
      const order = await Order.findOne({ orderId })
      
      if (!order) {
        throw new Error('Order not found')
      }
      
      if (order.userId.toString() !== userId) {
        throw new Error('Order does not belong to this user')
      }
      
      if (order.status !== 'paid') {
        throw new Error('Order is not paid')
      }
      
      const user = await User.findById(userId)
      const plan = await SubscriptionPlan.findOne({ planId: order.planId })
      
      if (!plan) {
        throw new Error('Plan not found')
      }
      
      // 计算订阅开始和结束时间
      const now = new Date()
      let startDate = now
      let expiryDate = new Date(now)
      
      // 如果有现有订阅且未过期,从现有结束时间延长
      if (user.subscription && user.subscription.expiryDate) {
        const currentExpiry = new Date(user.subscription.expiryDate)
        if (currentExpiry > now) {
          startDate = currentExpiry
          expiryDate = currentExpiry
        }
      }
      
      // 根据计费周期计算结束时间
      expiryDate.setDate(expiryDate.getDate() + plan.billingCycleDays)
      
      // 更新用户订阅
      user.subscription = {
        planId: plan.planId,
        planName: plan.displayName,
        status: 'active',
        startDate,
        expiryDate,
        autoRenew: false,
        features: plan.features
      }
      
      await user.save()
      
      // 更新订单状态
      order.status = 'activated'
      order.activatedAt = now
      await order.save()
      
      logger.success(`✅ Activated subscription for user ${user.username}: ${plan.planId}`)
      
      // 发送订单确认邮件（不阻塞激活流程）
      emailService.sendEmailWithTemplate({
        to: user.email,
        templateSlug: 'order-confirmation',
        variables: {
          username: user.displayName || user.username,
          orderNumber: order.orderId,
          planName: plan.displayName,
          amount: order.amount.toString(),
          siteName: 'AI Code Relay'
        }
      }).catch(err => {
        logger.error('❌ 发送订单确认邮件失败:', err)
      })
      
      return user.subscription
    } catch (error) {
      logger.error('❌ Failed to activate subscription:', error)
      throw error
    }
  }

  /**
   * 升级订阅
   */
  async upgradeSubscription(userId, newPlanId, paymentMethod = 'wechat') {
    try {
      const user = await User.findById(userId)
      
      if (!user) {
        throw new Error('User not found')
      }
      
      const currentPlanId = user.subscription?.planId || 'free'
      
      if (currentPlanId === newPlanId) {
        throw new Error('Already subscribed to this plan')
      }
      
      const newPlan = await SubscriptionPlan.findOne({ planId: newPlanId, isActive: true })
      
      if (!newPlan) {
        throw new Error('Plan not found or inactive')
      }
      
      // 验证升级逻辑 (可选:根据业务需求)
      // ...
      
      // 创建升级订单
      return await this.createSubscriptionOrder(userId, newPlanId, paymentMethod)
    } catch (error) {
      logger.error('❌ Failed to upgrade subscription:', error)
      throw error
    }
  }

  /**
   * 取消订阅 (到期后不再续费)
   */
  async cancelSubscription(userId) {
    try {
      const user = await User.findById(userId)
      
      if (!user) {
        throw new Error('User not found')
      }
      
      if (!user.subscription || user.subscription.planId === 'free') {
        throw new Error('No active subscription to cancel')
      }
      
      // 设置自动续费为false
      user.subscription.autoRenew = false
      user.subscription.status = 'cancelled'
      
      await user.save()
      
      logger.success(`✅ Cancelled subscription for user ${user.username}`)
      
      return {
        success: true,
        message: 'Subscription cancelled. Your plan will remain active until expiry date.',
        expiryDate: user.subscription.expiryDate
      }
    } catch (error) {
      logger.error('❌ Failed to cancel subscription:', error)
      throw error
    }
  }

  /**
   * 更新自动续费设置
   */
  async updateAutoRenew(userId, autoRenew) {
    try {
      const user = await User.findById(userId)
      
      if (!user) {
        throw new Error('User not found')
      }
      
      if (!user.subscription || user.subscription.planId === 'free') {
        throw new Error('No active subscription')
      }
      
      user.subscription.autoRenew = autoRenew
      
      await user.save()
      
      logger.success(`✅ Updated auto-renew for user ${user.username}: ${autoRenew}`)
      
      return user.subscription
    } catch (error) {
      logger.error('❌ Failed to update auto-renew:', error)
      throw error
    }
  }

  /**
   * 检查并更新过期订阅
   */
  async checkExpiredSubscriptions() {
    try {
      const now = new Date()
      
      const expiredUsers = await User.find({
        'subscription.expiryDate': { $lt: now },
        'subscription.status': 'active'
      })
      
      logger.info(`🔍 Found ${expiredUsers.length} expired subscriptions`)
      
      for (const user of expiredUsers) {
        // 如果不自动续费,降级到免费版
        if (!user.subscription.autoRenew) {
          user.subscription = {
            planId: 'free',
            planName: '免费版',
            status: 'active',
            startDate: now,
            expiryDate: null,
            autoRenew: false
          }
          
          await user.save()
          
          logger.info(`📉 Downgraded user ${user.username} to free plan`)
        } else {
          // TODO: 实现自动续费逻辑
          logger.info(`🔄 Auto-renew subscription for user ${user.username}`)
        }
      }
    } catch (error) {
      logger.error('❌ Failed to check expired subscriptions:', error)
      throw error
    }
  }

  /**
   * 计算实际价格 (考虑促销)
   */
  _calculateEffectivePrice(plan) {
    if (!plan.promotion || !plan.promotion.enabled) {
      return plan.price
    }
    
    const now = new Date()
    if (plan.promotion.startDate && now < new Date(plan.promotion.startDate)) {
      return plan.price
    }
    
    if (plan.promotion.endDate && now > new Date(plan.promotion.endDate)) {
      return plan.price
    }
    
    const discount = plan.promotion.discount || 0
    return Math.max(0, plan.price * (1 - discount / 100))
  }

  /**
   * 生成订单ID
   */
  _generateOrderId() {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2, 9).toUpperCase()
    return `SUB${timestamp}${random}`
  }

  /**
   * 生成支付URL (示例)
   */
  _generatePaymentUrl(orderId, paymentMethod) {
    // TODO: 集成真实支付网关
    return `https://payment.example.com/pay/${orderId}?method=${paymentMethod}`
  }

  /**
   * 生成支付二维码 (示例)
   */
  _generateQrCode(orderId, paymentMethod) {
    // TODO: 生成真实二维码
    return `https://payment.example.com/qr/${orderId}?method=${paymentMethod}`
  }
}

module.exports = new UserSubscriptionService()

