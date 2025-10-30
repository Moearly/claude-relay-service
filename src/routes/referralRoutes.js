const express = require('express')
const router = express.Router()
const User = require('../models/User')
const { authenticateUserDb } = require('../middleware/dbAuth')
const logger = require('../utils/logger')

/**
 * 获取邀请信息
 * GET /users/referral
 */
router.get('/', authenticateUserDb, async (req, res) => {
  try {
    // 从数据库获取完整的用户对象
    const user = await User.findById(req.user._id)
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      })
    }

    // 确保用户有邀请码
    if (!user.invitationCode) {
      user.generateInvitationCode()
      await user.save()
    }

    // 获取邀请的用户列表
    const invitedUsers = await User.find({
      invitedBy: user._id
    })
      .select('username email createdAt subscription credits')
      .sort({ createdAt: -1 })
      .lean()

    // 计算统计数据
    const totalInvited = invitedUsers.length
    const totalCredits = user.invitationRewards || 0

    // 生成邀请链接
    const baseUrl = process.env.FRONTEND_URL || 'https://codewith.site'
    const inviteLink = `${baseUrl}/dashboard/register?ref=${user.invitationCode}`

    // 格式化邀请记录
    const records = invitedUsers.map((invitedUser) => ({
      id: invitedUser._id,
      username: invitedUser.username,
      email: invitedUser.email,
      registeredAt: invitedUser.createdAt,
      plan: invitedUser.subscription?.planName || '免费版',
      credits: 0, // TODO: 计算实际奖励的积分
      status: invitedUser.subscription?.planId !== 'free' ? 'active' : 'pending'
    }))

    logger.info(`✅ 用户 ${user.username} 获取邀请信息`)

    res.json({
      success: true,
      data: {
        inviteCode: user.invitationCode,
        inviteLink,
        totalInvited,
        totalCredits,
        records
      }
    })
  } catch (error) {
    logger.error('❌ 获取邀请信息失败:', error)
    res.status(500).json({
      success: false,
      error: error.message || '获取邀请信息失败'
    })
  }
})

/**
 * 重新生成邀请码
 * POST /users/referral/regenerate
 */
router.post('/regenerate', authenticateUserDb, async (req, res) => {
  try {
    // 从数据库获取完整的用户对象
    const user = await User.findById(req.user._id)
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      })
    }

    // 生成新的邀请码
    user.generateInvitationCode()
    await user.save()

    // 生成新的邀请链接
    const baseUrl = process.env.FRONTEND_URL || 'https://codewith.site'
    const inviteLink = `${baseUrl}/dashboard/register?ref=${user.invitationCode}`

    logger.info(`✅ 用户 ${user.username} 重新生成邀请码: ${user.invitationCode}`)

    res.json({
      success: true,
      data: {
        inviteCode: user.invitationCode,
        inviteLink
      }
    })
  } catch (error) {
    logger.error('❌ 重新生成邀请码失败:', error)
    res.status(500).json({
      success: false,
      error: error.message || '重新生成邀请码失败'
    })
  }
})

/**
 * 获取邀请统计
 * GET /users/referral/stats
 */
router.get('/stats', authenticateUserDb, async (req, res) => {
  try {
    // 从数据库获取完整的用户对象
    const user = await User.findById(req.user._id)
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      })
    }

    // 获取邀请的用户
    const invitedUsers = await User.find({
      invitedBy: user._id
    }).lean()

    // 统计数据
    const totalInvited = invitedUsers.length
    const activeInvited = invitedUsers.filter(
      (u) => u.subscription?.planId !== 'free'
    ).length
    const totalRewards = user.invitationRewards || 0

    // 按月统计
    const monthlyStats = {}
    invitedUsers.forEach((invitedUser) => {
      const month = new Date(invitedUser.createdAt)
        .toISOString()
        .substring(0, 7)
      if (!monthlyStats[month]) {
        monthlyStats[month] = 0
      }
      monthlyStats[month]++
    })

    logger.info(`✅ 用户 ${user.username} 获取邀请统计`)

    res.json({
      success: true,
      data: {
        totalInvited,
        activeInvited,
        totalRewards,
        conversionRate:
          totalInvited > 0
            ? ((activeInvited / totalInvited) * 100).toFixed(2)
            : 0,
        monthlyStats
      }
    })
  } catch (error) {
    logger.error('❌ 获取邀请统计失败:', error)
    res.status(500).json({
      success: false,
      error: error.message || '获取邀请统计失败'
    })
  }
})

module.exports = router

