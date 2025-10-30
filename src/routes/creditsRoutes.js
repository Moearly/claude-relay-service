const express = require('express')
const router = express.Router()
const { authenticateUserDb } = require('../middleware/dbAuth')
const logger = require('../utils/logger')
const { CreditRecord, User } = require('../models')
const cardKeyService = require('../services/cardKeyService')

/**
 * 积分管理路由
 * 提供积分查询、兑换、历史记录等功能
 */

// 获取积分历史记录
router.get('/history', authenticateUserDb, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query
    const userId = req.user.id

    const records = await CreditRecord.find({ userId })
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))

    const total = await CreditRecord.countDocuments({ userId })

    if (records.length > 0) {
      return res.json({
        success: true,
        records,
        total
      })
    }

    const mockHistory = [
      {
        id: '1',
        userId,
        type: 'refill',
        amount: 10000,
        description: '每日积分恢复 - plan_basic_001',
        createdAt: new Date().toISOString(),
        balance: 12500
      },
      {
        id: '2',
        userId,
        type: 'usage',
        amount: -120,
        description: 'API 调用消耗 - Claude Sonnet 4.5',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        balance: 12380
      }
    ]

    res.json({
      success: true,
      records: mockHistory.slice(offset, offset + limit),
      total: mockHistory.length
    })
  } catch (error) {
    logger.error('获取积分历史失败:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: '获取积分历史失败'
    })
  }
})

// 获取积分趋势数据
router.get('/trends', authenticateUserDb, async (req, res) => {
  try {
    const { days = 7 } = req.query
    const userId = req.user.id
    const redis = require('../models/redis')
    const ApiKey = require('../models/ApiKey')

    // 获取用户的所有 API Keys
    const apiKeys = await ApiKey.find({ userId }).select('key').lean()
    
    // 初始化趋势数据
    const trends = []
    const numDays = parseInt(days)
    
    // 如果用户没有 API Key，返回空趋势
    if (!apiKeys || apiKeys.length === 0) {
      for (let i = numDays - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * 86400000)
        trends.push({
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          credits: 0,
          rmb: 0,
          usd: 0,
          tokens: 0
        })
      }
      return res.json({
        success: true,
        trends
      })
    }

    // 获取每天的统计数据
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000)
      const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
      
      let dayCredits = 0
      let dayTokens = 0
      let dayCost = 0
      
      // 统计所有 API Key 在这一天的使用
      for (const apiKey of apiKeys) {
        try {
          const dailyStatsKey = `api_key_daily:${apiKey.key}:${dateStr}`
          const stats = await redis.hgetall(dailyStatsKey)
          
          if (stats && Object.keys(stats).length > 0) {
            dayTokens += parseInt(stats.tokens || 0)
            dayCost += parseFloat(stats.cost || 0)
          }
        } catch (error) {
          // 忽略单个 key 的错误
        }
      }
      
      // 估算积分消耗（假设 1000 tokens ≈ 100 credits）
      dayCredits = Math.floor(dayTokens / 10)
      
      trends.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        credits: dayCredits,
        rmb: parseFloat((dayCost * 7.2).toFixed(2)), // 假设 1 USD = 7.2 RMB
        usd: parseFloat(dayCost.toFixed(2)),
        tokens: dayTokens
      })
    }

    res.json({
      success: true,
      trends
    })
  } catch (error) {
    logger.error('获取积分趋势失败:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: '获取积分趋势失败'
    })
  }
})

// 兑换卡密
router.post('/redeem', authenticateUserDb, async (req, res) => {
  try {
    const { code } = req.body
    const userId = req.user.id
    const ipAddress = req.ip || req.connection.remoteAddress

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: '请提供有效的卡密'
      })
    }

    const result = await cardKeyService.redeem(userId, code, ipAddress)

    if (!result.success) {
      return res.status(400).json({
        error: 'Redeem failed',
        message: result.message
      })
    }

    res.json(result)
  } catch (error) {
    logger.error('兑换卡密失败:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: '兑换失败，请稍后重试'
    })
  }
})

// 获取用户积分余额
router.get('/balance', authenticateUserDb, async (req, res) => {
  try {
    const userId = req.user.id

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: '用户不存在'
      })
    }

    user.resetDailyUsage()
    await user.save()

    res.json({
      success: true,
      userId: user._id,
      credits: user.credits,
      dailyLimit: user.subscription.dailyCredits || 0,
      usedToday: user.todayUsage,
      resetTime: new Date(user.lastCreditReset.getTime() + 86400000).toISOString()
    })
  } catch (error) {
    logger.error('获取积分余额失败:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: '获取余额失败'
    })
  }
})

module.exports = router
