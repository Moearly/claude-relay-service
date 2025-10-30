const express = require('express')
const router = express.Router()
const Invoice = require('../models/Invoice')
const Order = require('../models/Order')
const { authenticateUserDb } = require('../middleware/dbAuth')
const logger = require('../utils/logger')

/**
 * 获取用户的发票列表
 * GET /users/invoices
 */
router.get('/', authenticateUserDb, async (req, res) => {
  try {
    const userId = req.user._id
    const { status, page = 1, limit = 20 } = req.query

    const query = { userId }
    if (status) {
      query.status = status
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Invoice.countDocuments(query)
    ])

    logger.info(`✅ 用户 ${req.user.username} 获取发票列表，共 ${invoices.length} 条`)

    res.json({
      success: true,
      invoices,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    })
  } catch (error) {
    logger.error('❌ 获取发票列表失败:', error)
    res.status(500).json({
      success: false,
      error: error.message || '获取发票列表失败'
    })
  }
})

/**
 * 获取发票详情
 * GET /users/invoices/:id
 */
router.get('/:id', authenticateUserDb, async (req, res) => {
  try {
    const userId = req.user._id
    const { id } = req.params

    const invoice = await Invoice.findOne({
      _id: id,
      userId
    }).lean()

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: '发票不存在'
      })
    }

    logger.info(`✅ 用户 ${req.user.username} 获取发票详情: ${id}`)

    res.json({
      success: true,
      invoice
    })
  } catch (error) {
    logger.error('❌ 获取发票详情失败:', error)
    res.status(500).json({
      success: false,
      error: error.message || '获取发票详情失败'
    })
  }
})

/**
 * 申请发票
 * POST /users/invoices
 */
router.post('/', authenticateUserDb, async (req, res) => {
  try {
    const userId = req.user._id
    const username = req.user.username
    const userEmail = req.user.email

    const {
      orderNumber,
      invoiceType = 'normal',
      invoiceTitle,
      companyName,
      taxNumber,
      email,
      phone,
      address,
      remark
    } = req.body

    // 验证必填字段
    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        error: '订单号不能为空'
      })
    }

    if (!invoiceTitle) {
      return res.status(400).json({
        success: false,
        error: '发票抬头类型不能为空'
      })
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        error: '邮箱不能为空'
      })
    }

    // 如果是企业抬头，验证企业信息
    if (invoiceTitle === 'company') {
      if (!companyName) {
        return res.status(400).json({
          success: false,
          error: '企业名称不能为空'
        })
      }
      if (!taxNumber) {
        return res.status(400).json({
          success: false,
          error: '税号不能为空'
        })
      }
    }

    // 验证订单是否存在且属于该用户
    const order = await Order.findOne({
      orderNumber,
      userId
    })

    if (!order) {
      return res.status(404).json({
        success: false,
        error: '订单不存在或不属于当前用户'
      })
    }

    // 检查订单是否已支付
    if (order.status !== 'paid' && order.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: '订单未支付，无法申请发票'
      })
    }

    // 检查是否已经申请过发票
    const existingInvoice = await Invoice.findOne({
      orderNumber,
      userId,
      status: { $in: ['pending', 'processing', 'issued'] }
    })

    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        error: '该订单已申请过发票'
      })
    }

    // 创建发票申请
    const newInvoice = new Invoice({
      userId,
      username,
      userEmail,
      orderNumber,
      amount: order.amount,
      invoiceType,
      invoiceTitle,
      companyName: invoiceTitle === 'company' ? companyName : undefined,
      taxNumber: invoiceTitle === 'company' ? taxNumber : undefined,
      email,
      phone,
      address,
      remark,
      status: 'pending'
    })

    await newInvoice.save()

    logger.info(`✅ 用户 ${username} 申请发票成功: ${orderNumber}`)

    res.status(201).json({
      success: true,
      message: '发票申请提交成功',
      invoice: newInvoice
    })
  } catch (error) {
    logger.error('❌ 申请发票失败:', error)
    res.status(500).json({
      success: false,
      error: error.message || '申请发票失败'
    })
  }
})

/**
 * 获取发票统计
 * GET /users/invoices/stats/summary
 */
router.get('/stats/summary', authenticateUserDb, async (req, res) => {
  try {
    const userId = req.user._id

    const [total, pending, processing, issued, rejected] = await Promise.all([
      Invoice.countDocuments({ userId }),
      Invoice.countDocuments({ userId, status: 'pending' }),
      Invoice.countDocuments({ userId, status: 'processing' }),
      Invoice.countDocuments({ userId, status: 'issued' }),
      Invoice.countDocuments({ userId, status: 'rejected' })
    ])

    logger.info(`✅ 用户 ${req.user.username} 获取发票统计`)

    res.json({
      success: true,
      stats: {
        total,
        pending,
        processing,
        issued,
        rejected
      }
    })
  } catch (error) {
    logger.error('❌ 获取发票统计失败:', error)
    res.status(500).json({
      success: false,
      error: error.message || '获取发票统计失败'
    })
  }
})

module.exports = router
