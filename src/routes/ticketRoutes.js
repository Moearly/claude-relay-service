const express = require('express')
const router = express.Router()
const Ticket = require('../models/Ticket')
const User = require('../models/User')
const { authenticateUserDb } = require('../middleware/dbAuth')
const logger = require('../utils/logger')

// ==================== 用户端工单接口 ====================

/**
 * 创建工单
 * POST /users/tickets
 */
router.post('/', authenticateUserDb, async (req, res) => {
  try {
    const { subject, category, priority, description, attachments } = req.body
    const user = req.user

    // 验证必填字段
    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        error: '标题和描述不能为空'
      })
    }

    // 生成工单编号
    const ticketNo = await Ticket.generateTicketNo()

    // 创建工单
    const ticket = new Ticket({
      ticketNo,
      userId: user._id,
      username: user.username,
      userEmail: user.email,
      subject,
      category: category || 'other',
      priority: priority || 'medium',
      description,
      attachments: attachments || [],
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        referrer: req.headers.referer
      }
    })

    await ticket.save()

    logger.info(`✅ 用户 ${user.username} 创建工单: ${ticketNo}`)

    res.json({
      success: true,
      data: ticket
    })
  } catch (error) {
    logger.error('❌ 创建工单失败:', error)
    res.status(500).json({
      success: false,
      error: error.message || '创建工单失败'
    })
  }
})

/**
 * 获取我的工单列表
 * GET /users/tickets
 */
router.get('/', authenticateUserDb, async (req, res) => {
  try {
    const user = req.user
    const { status, category, page = 1, limit = 20 } = req.query

    const query = { userId: user._id }

    if (status) {
      query.status = status
    }
    if (category) {
      query.category = category
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Ticket.countDocuments(query)
    ])

    logger.info(`📋 用户 ${user.username} 查询工单列表，共 ${total} 条`)

    res.json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    logger.error('❌ 获取工单列表失败:', error)
    res.status(500).json({
      success: false,
      error: error.message || '获取工单列表失败'
    })
  }
})

/**
 * 获取工单详情
 * GET /users/tickets/:ticketId
 */
router.get('/:ticketId', authenticateUserDb, async (req, res) => {
  try {
    const user = req.user
    const { ticketId } = req.params

    const ticket = await Ticket.findOne({
      _id: ticketId,
      userId: user._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: '工单不存在'
      })
    }

    // 过滤内部备注
    const ticketData = ticket.toObject()
    ticketData.replies = ticketData.replies.filter((r) => !r.isInternal)

    logger.info(`📄 用户 ${user.username} 查看工单: ${ticket.ticketNo}`)

    res.json({
      success: true,
      data: ticketData
    })
  } catch (error) {
    logger.error('❌ 获取工单详情失败:', error)
    res.status(500).json({
      success: false,
      error: error.message || '获取工单详情失败'
    })
  }
})

/**
 * 回复工单
 * POST /users/tickets/:ticketId/reply
 */
router.post('/:ticketId/reply', authenticateUserDb, async (req, res) => {
  try {
    const user = req.user
    const { ticketId } = req.params
    const { content, attachments } = req.body

    if (!content) {
      return res.status(400).json({
        success: false,
        error: '回复内容不能为空'
      })
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      userId: user._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: '工单不存在'
      })
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({
        success: false,
        error: '工单已关闭，无法回复'
      })
    }

    await ticket.addReply({
      replyBy: 'user',
      replyById: user._id,
      replyByName: user.username,
      content,
      attachments: attachments || []
    })

    logger.info(`💬 用户 ${user.username} 回复工单: ${ticket.ticketNo}`)

    res.json({
      success: true,
      data: ticket
    })
  } catch (error) {
    logger.error('❌ 回复工单失败:', error)
    res.status(500).json({
      success: false,
      error: error.message || '回复工单失败'
    })
  }
})

/**
 * 关闭工单
 * POST /users/tickets/:ticketId/close
 */
router.post('/:ticketId/close', authenticateUserDb, async (req, res) => {
  try {
    const user = req.user
    const { ticketId } = req.params

    const ticket = await Ticket.findOne({
      _id: ticketId,
      userId: user._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: '工单不存在'
      })
    }

    await ticket.updateStatus('closed')

    logger.info(`🔒 用户 ${user.username} 关闭工单: ${ticket.ticketNo}`)

    res.json({
      success: true,
      data: ticket
    })
  } catch (error) {
    logger.error('❌ 关闭工单失败:', error)
    res.status(500).json({
      success: false,
      error: error.message || '关闭工单失败'
    })
  }
})

/**
 * 评价工单
 * POST /users/tickets/:ticketId/rate
 */
router.post('/:ticketId/rate', authenticateUserDb, async (req, res) => {
  try {
    const user = req.user
    const { ticketId } = req.params
    const { score, comment } = req.body

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        error: '评分必须在 1-5 之间'
      })
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      userId: user._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: '工单不存在'
      })
    }

    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      return res.status(400).json({
        success: false,
        error: '只能对已解决或已关闭的工单进行评价'
      })
    }

    await ticket.addRating(score, comment)

    logger.info(`⭐ 用户 ${user.username} 评价工单 ${ticket.ticketNo}: ${score}分`)

    res.json({
      success: true,
      data: ticket
    })
  } catch (error) {
    logger.error('❌ 评价工单失败:', error)
    res.status(500).json({
      success: false,
      error: error.message || '评价工单失败'
    })
  }
})

/**
 * 获取工单统计
 * GET /users/tickets/stats/summary
 */
router.get('/stats/summary', authenticateUserDb, async (req, res) => {
  try {
    const user = req.user

    const [total, open, resolved, closed] = await Promise.all([
      Ticket.countDocuments({ userId: user._id }),
      Ticket.countDocuments({ userId: user._id, status: { $in: ['open', 'in_progress', 'waiting_user', 'waiting_admin'] } }),
      Ticket.countDocuments({ userId: user._id, status: 'resolved' }),
      Ticket.countDocuments({ userId: user._id, status: 'closed' })
    ])

    res.json({
      success: true,
      data: {
        total,
        open,
        resolved,
        closed
      }
    })
  } catch (error) {
    logger.error('❌ 获取工单统计失败:', error)
    res.status(500).json({
      success: false,
      error: error.message || '获取工单统计失败'
    })
  }
})

module.exports = router

