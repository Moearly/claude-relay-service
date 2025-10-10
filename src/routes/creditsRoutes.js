const express = require('express')
const router = express.Router()
const { authenticateUser } = require('../middleware/auth')
const { authenticateUserDb } = require('../middleware/dbAuth')
const logger = require('../utils/logger')
const { CreditRecord, User } = require('../models')
const cardKeyService = require('../services/cardKeyService')

/**
 * 积分管理路由
 * 提供积分查询、兑换、历史记录等功能
 */

// 获取积分历史记录
router.get('/history', authenticateUser, async (req, res) => {
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
router.get('/trends', authenticateUser, async (req, res) => {
  try {
    const { days = 7 } = req.query
    const userId = req.user.id

    // TODO: 从数据库计算趋势
    // 暂时返回模拟数据
    const mockTrends = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000)
      mockTrends.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        credits: Math.floor(1200 + Math.random() * 1000),
        rmb: Math.floor(6 + Math.random() * 5),
        usd: parseFloat((0.85 + Math.random() * 0.7).toFixed(2)),
        tokens: Math.floor(24000 + Math.random() * 20000)
      })
    }

    res.json({
      success: true,
      trends: mockTrends
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
router.post('/redeem', authenticateUser, async (req, res) => {
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
