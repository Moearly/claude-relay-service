const express = require('express')
const router = express.Router()
const { authenticateUser } = require('../middleware/auth')
const { authenticateUserDb } = require('../middleware/dbAuth')
const logger = require('../utils/logger')
const { User, Order, SubscriptionPlan } = require('../models')
const subscriptionPlanService = require('../services/subscriptionPlanService')
const userSubscriptionService = require('../services/userSubscriptionService')

/**
 * 订阅管理路由
 * 提供订阅查询、升级、取消等功能
 */

// 获取用户订阅信息
router.get('/', authenticateUserDb, async (req, res) => {
  try {
    const userId = req.user.id
    
    const subscription = await userSubscriptionService.getUserSubscription(userId)
    
    res.json({
      success: true,
      userId,
      ...subscription
    })
  } catch (error) {
    logger.error('❌ 获取订阅信息失败:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: '获取订阅信息失败'
    })
  }
})

// 获取可用套餐列表 (仅Claude套餐)
router.get('/plans', async (req, res) => {
  try {
    const plans = await subscriptionPlanService.getAllPlans(false)
    
    // 格式化为前端友好的格式
    const formattedPlans = plans.map(plan => ({
      id: plan.planId,
      planId: plan.planId,
      name: plan.displayName,
      displayName: plan.displayName,
      description: plan.description,
      price: plan.effectivePrice,
      originalPrice: plan.originalPrice,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      billingCycleDays: plan.billingCycleDays,
      dailyRequests: plan.features.dailyRequests,
      dailyCost: plan.features.dailyCost,
      maxApiKeys: plan.features.maxApiKeys,
      service: 'Claude', // 🔒 固定为 Claude
      services: plan.features.services, // ['claude']
      models: plan.features.models,
      support: plan.features.support,
      sla: plan.features.sla,
      recommended: plan.isPopular,
      trialDays: plan.trialDays,
      isOnPromotion: plan.isOnPromotion,
      promotion: plan.isOnPromotion ? {
        discount: plan.promotion.discount,
        endDate: plan.promotion.endDate
      } : null,
      // 生成特性列表
      features: [
        plan.features.dailyRequests > 0 
          ? `每日 ${plan.features.dailyRequests.toLocaleString()} 次请求`
          : '无限次请求',
        `支持 ${plan.features.models.length} 个 Claude 模型`,
        plan.features.maxApiKeys > 0
          ? `${plan.features.maxApiKeys} 个 API 密钥`
          : '无限 API 密钥',
        `${plan.features.support === 'community' ? '社区' : plan.features.support === 'email' ? '邮件' : plan.features.support === 'priority' ? '优先' : '专属'}技术支持`,
        `${plan.features.sla} 服务可用性`
      ]
    }))
    
    res.json({
      success: true,
      plans: formattedPlans
    })
  } catch (error) {
    logger.error('❌ 获取套餐列表失败:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: '获取套餐列表失败'
    })
  }
})

// 创建订阅订单
router.post('/orders', authenticateUserDb, async (req, res) => {
  try {
    const { planId, paymentMethod = 'wechat' } = req.body
    const userId = req.user.id

    if (!planId) {
      return res.status(400).json({
        error: 'Invalid input',
        message: '请选择套餐'
      })
    }

    const order = await userSubscriptionService.createSubscriptionOrder(
      userId,
      planId,
      paymentMethod
    )

    res.json({
      success: true,
      ...order
    })
  } catch (error) {
    logger.error('❌ 创建订单失败:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || '创建订单失败'
    })
  }
})

// 更新自动续费设置
router.put('/auto-renew', authenticateUserDb, async (req, res) => {
  try {
    const { autoRenew } = req.body
    const userId = req.user.id

    if (typeof autoRenew !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid input',
        message: '参数格式错误'
      })
    }

    const subscription = await userSubscriptionService.updateAutoRenew(userId, autoRenew)

    res.json({
      success: true,
      message: autoRenew ? '已开启自动续费' : '已关闭自动续费',
      subscription
    })
  } catch (error) {
    logger.error('❌ 更新自动续费设置失败:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || '操作失败'
    })
  }
})

// 升级订阅
router.post('/upgrade', authenticateUserDb, async (req, res) => {
  try {
    const { newPlanId, paymentMethod = 'wechat' } = req.body
    const userId = req.user.id

    if (!newPlanId) {
      return res.status(400).json({
        error: 'Invalid input',
        message: '请选择新套餐'
      })
    }

    const order = await userSubscriptionService.upgradeSubscription(
      userId,
      newPlanId,
      paymentMethod
    )

    res.json({
      success: true,
      message: '升级订单已创建',
      ...order
    })
  } catch (error) {
    logger.error('❌ 升级订阅失败:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || '升级订阅失败'
    })
  }
})

// 取消订阅
router.post('/cancel', authenticateUserDb, async (req, res) => {
  try {
    const userId = req.user.id

    const result = await userSubscriptionService.cancelSubscription(userId)

    res.json({
      success: true,
      ...result
    })
  } catch (error) {
    logger.error('❌ 取消订阅失败:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || '取消订阅失败'
    })
  }
})

// 获取订单历史
router.get('/orders', authenticateUserDb, async (req, res) => {
  try {
    const userId = req.user.id
    const { limit = 20, offset = 0, status } = req.query

    const query = { userId }
    if (status) {
      query.status = status
    }

    const total = await Order.countDocuments(query)
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean()

    res.json({
      success: true,
      orders: orders.map(order => ({
        id: order.orderId,
        orderId: order.orderId,
        planId: order.planId,
        planName: order.planName,
        amount: order.amount,
        originalAmount: order.originalAmount,
        currency: order.currency,
        status: order.status,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        activatedAt: order.activatedAt
      })),
      total
    })
  } catch (error) {
    logger.error('❌ 获取订单历史失败:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: '获取订单历史失败'
    })
  }
})

// 获取单个订单详情
router.get('/orders/:orderId', authenticateUserDb, async (req, res) => {
  try {
    const userId = req.user.id
    const { orderId } = req.params

    const order = await Order.findOne({ orderId, userId }).lean()

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        message: '订单不存在'
      })
    }

    res.json({
      success: true,
      order: {
        id: order.orderId,
        orderId: order.orderId,
        planId: order.planId,
        planName: order.planName,
        amount: order.amount,
        originalAmount: order.originalAmount,
        currency: order.currency,
        status: order.status,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        activatedAt: order.activatedAt,
        metadata: order.metadata
      }
    })
  } catch (error) {
    logger.error('❌ 获取订单详情失败:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: '获取订单详情失败'
    })
  }
})

module.exports = router
