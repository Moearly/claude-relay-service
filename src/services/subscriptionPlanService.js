const { SubscriptionPlan } = require('../models')
const logger = require('../utils/logger')

class SubscriptionPlanService {
  /**
   * 获取所有可见的套餐列表
   */
  async getAllPlans(includeInactive = false) {
    try {
      const query = includeInactive ? {} : { isActive: true, isVisible: true }
      
      const plans = await SubscriptionPlan.find(query).sort({ sortOrder: 1 }).lean()
      
      return plans.map(plan => ({
        ...plan,
        effectivePrice: this._calculateEffectivePrice(plan),
        isOnPromotion: this._isOnPromotion(plan)
      }))
    } catch (error) {
      logger.error('❌ Failed to get all plans:', error)
      throw error
    }
  }

  /**
   * 根据ID获取套餐
   */
  async getPlanById(planId) {
    try {
      const plan = await SubscriptionPlan.findOne({ planId }).lean()
      
      if (!plan) {
        return null
      }
      
      return {
        ...plan,
        effectivePrice: this._calculateEffectivePrice(plan),
        isOnPromotion: this._isOnPromotion(plan)
      }
    } catch (error) {
      logger.error(`❌ Failed to get plan ${planId}:`, error)
      throw error
    }
  }

  /**
   * 创建新套餐
   */
  async createPlan(planData) {
    try {
      // 验证planId唯一性
      const existing = await SubscriptionPlan.findOne({ planId: planData.planId })
      if (existing) {
        throw new Error(`Plan with ID ${planData.planId} already exists`)
      }
      
      const plan = new SubscriptionPlan(planData)
      await plan.save()
      
      logger.success(`✅ Created subscription plan: ${plan.planId} (${plan.displayName})`)
      
      return plan.toObject()
    } catch (error) {
      logger.error('❌ Failed to create plan:', error)
      throw error
    }
  }

  /**
   * 更新套餐
   */
  async updatePlan(planId, updates) {
    try {
      const plan = await SubscriptionPlan.findOne({ planId })
      
      if (!plan) {
        throw new Error(`Plan ${planId} not found`)
      }
      
      // 不允许修改planId
      delete updates.planId
      
      Object.assign(plan, updates)
      plan.updatedAt = new Date()
      
      await plan.save()
      
      logger.success(`✅ Updated subscription plan: ${planId}`)
      
      return plan.toObject()
    } catch (error) {
      logger.error(`❌ Failed to update plan ${planId}:`, error)
      throw error
    }
  }

  /**
   * 删除套餐 (软删除)
   */
  async deletePlan(planId) {
    try {
      const plan = await SubscriptionPlan.findOne({ planId })
      
      if (!plan) {
        throw new Error(`Plan ${planId} not found`)
      }
      
      plan.isActive = false
      plan.isVisible = false
      await plan.save()
      
      logger.success(`✅ Deleted subscription plan: ${planId}`)
      
      return true
    } catch (error) {
      logger.error(`❌ Failed to delete plan ${planId}:`, error)
      throw error
    }
  }

  /**
   * 初始化默认套餐
   */
  async initializeDefaultPlans() {
    try {
      const existingCount = await SubscriptionPlan.countDocuments()
      
      if (existingCount > 0) {
        logger.info(`ℹ️ Subscription plans already exist (${existingCount}), skipping initialization`)
        return
      }
      
      const defaultPlans = [
        {
          planId: 'free',
          name: 'Free',
          displayName: '免费版',
          description: '适合个人试用和轻量使用',
          price: 0,
          currency: 'CNY',
          billingCycle: 'monthly',
          billingCycleDays: 30,
          features: {
            dailyRequests: 1000,
            dailyTokens: 0,
            dailyCost: 0,
            maxApiKeys: 1,
            services: ['claude'],
            models: ['claude-sonnet-4-5'],
            support: 'community',
            enableCache: true,
            enableStreamResponse: true,
            sla: '99%'
          },
          restrictions: {
            rateLimitWindow: 60,
            rateLimitRequests: 100,
            concurrencyLimit: 2
          },
          isActive: true,
          isVisible: true,
          sortOrder: 1
        },
        {
          planId: 'basic',
          name: 'Basic',
          displayName: '基础版',
          description: '适合个人开发者和小型项目',
          price: 199,
          currency: 'CNY',
          originalPrice: 299,
          billingCycle: 'monthly',
          billingCycleDays: 30,
          features: {
            dailyRequests: 10000,
            dailyTokens: 0,
            dailyCost: 50,
            maxApiKeys: 3,
            services: ['claude'],
            models: ['claude-sonnet-4-5', 'claude-opus-4'],
            support: 'email',
            enableCache: true,
            enableStreamResponse: true,
            sla: '99.5%'
          },
          restrictions: {
            rateLimitWindow: 60,
            rateLimitRequests: 500,
            concurrencyLimit: 5
          },
          isActive: true,
          isVisible: true,
          sortOrder: 2,
          trialDays: 7
        },
        {
          planId: 'pro',
          name: 'Professional',
          displayName: '专业版',
          description: '适合中小型团队和高频使用场景',
          price: 399,
          currency: 'CNY',
          originalPrice: 599,
          billingCycle: 'monthly',
          billingCycleDays: 30,
          features: {
            dailyRequests: 50000,
            dailyTokens: 0,
            dailyCost: 200,
            maxApiKeys: 10,
            services: ['claude'],
            models: ['claude-sonnet-4-5', 'claude-opus-4'],
            support: 'priority',
            enableCache: true,
            enableStreamResponse: true,
            sla: '99.9%'
          },
          restrictions: {
            rateLimitWindow: 60,
            rateLimitRequests: 2000,
            concurrencyLimit: 20
          },
          isActive: true,
          isVisible: true,
          isPopular: true,
          sortOrder: 3,
          trialDays: 7
        },
        {
          planId: 'enterprise',
          name: 'Enterprise',
          displayName: '企业版',
          description: '适合大型团队和企业级应用',
          price: 999,
          currency: 'CNY',
          originalPrice: 1499,
          billingCycle: 'monthly',
          billingCycleDays: 30,
          features: {
            dailyRequests: 0, // 无限制
            dailyTokens: 0,
            dailyCost: 0,
            maxApiKeys: 0, // 无限制
            services: ['claude'],
            models: ['claude-sonnet-4-5', 'claude-opus-4'],
            support: 'dedicated',
            enableCache: true,
            enableStreamResponse: true,
            sla: '99.99%'
          },
          restrictions: {
            rateLimitWindow: 60,
            rateLimitRequests: 0, // 无限制
            concurrencyLimit: 0 // 无限制
          },
          isActive: true,
          isVisible: true,
          sortOrder: 4,
          trialDays: 14
        }
      ]
      
      await SubscriptionPlan.insertMany(defaultPlans)
      
      logger.success(`✅ Initialized ${defaultPlans.length} default subscription plans`)
    } catch (error) {
      logger.error('❌ Failed to initialize default plans:', error)
      throw error
    }
  }

  /**
   * 计算实际价格（考虑促销）
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
   * 检查是否在促销期
   */
  _isOnPromotion(plan) {
    if (!plan.promotion || !plan.promotion.enabled) {
      return false
    }
    
    const now = new Date()
    if (plan.promotion.startDate && now < new Date(plan.promotion.startDate)) {
      return false
    }
    
    if (plan.promotion.endDate && now > new Date(plan.promotion.endDate)) {
      return false
    }
    
    return true
  }
}

module.exports = new SubscriptionPlanService()

