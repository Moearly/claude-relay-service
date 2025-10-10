const express = require('express')
const router = express.Router()
const Invoice = require('../models/Invoice')
const { authenticateUserDb } = require('../middleware/dbAuth')
const logger = require('../utils/logger')

// 生成发票号
function generateInvoiceNumber() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')
  return `INV-${year}${month}${day}-${random}`
}

// 📋 获取用户的发票列表
router.get('/', authenticateUserDb, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query

    const query = { userId: req.user.id }
    if (status) {
      query.status = status
    }

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean()

    const total = await Invoice.countDocuments(query)

    const formattedInvoices = invoices.map((invoice) => ({
      id: invoice.invoiceNumber,
      orderNumber: invoice.orderNumber,
      amount: invoice.amount,
      type:
        invoice.invoiceType === 'special'
          ? '增值税专用发票'
          : '增值税普通发票',
      status: invoice.status,
      appliedAt: invoice.createdAt.toISOString().split('T')[0],
      issuedAt: invoice.issuedAt
        ? invoice.issuedAt.toISOString().split('T')[0]
        : null,
      downloadUrl: invoice.downloadUrl || null,
      remark: invoice.remark,
      rejectedReason: invoice.rejectedReason
    }))

    res.json({
      success: true,
      invoices: formattedInvoices,
      total
    })
  } catch (error) {
    logger.error('❌ Get invoices error:', error)
    res.status(500).json({
      error: 'Get invoices error',
      message: 'Failed to get invoices'
    })
  }
})

// 📝 申请发票
router.post('/', authenticateUserDb, async (req, res) => {
  try {
    const {
      orderNumber,
      invoiceType,
      invoiceTitle,
      companyName,
      taxNumber,
      email,
      remark
    } = req.body

    // 验证必填字段
    if (!orderNumber || !invoiceType || !invoiceTitle || !email) {
      return res.status(400).json({
        error: 'Invalid input',
        message: '请填写所有必填项'
      })
    }

    // 企业发票需要公司名称和税号
    if (invoiceTitle === 'company' && (!companyName || !taxNumber)) {
      return res.status(400).json({
        error: 'Invalid input',
        message: '企业发票需要提供公司名称和纳税人识别号'
      })
    }

    // TODO: 验证订单号是否存在且属于当前用户
    // TODO: 验证订单是否已经申请过发票
    // 这里暂时使用模拟金额，实际应该从订单中获取
    const amount = 399.0

    // 生成发票号
    let invoiceNumber
    let attempts = 0
    while (attempts < 5) {
      invoiceNumber = generateInvoiceNumber()
      const exists = await Invoice.findOne({ invoiceNumber })
      if (!exists) break
      attempts++
    }

    if (attempts >= 5) {
      throw new Error('Failed to generate unique invoice number')
    }

    // 创建发票记录
    const invoice = new Invoice({
      invoiceNumber,
      userId: req.user.id,
      orderNumber,
      amount,
      invoiceType,
      invoiceTitle,
      companyName: invoiceTitle === 'company' ? companyName : undefined,
      taxNumber: invoiceTitle === 'company' ? taxNumber : undefined,
      email,
      remark,
      status: 'processing'
    })

    await invoice.save()

    logger.info(
      `📝 User ${req.user.username} applied for invoice: ${invoiceNumber}`
    )

    res.status(201).json({
      success: true,
      message: '发票申请已提交，我们会在 3-5 个工作日内处理',
      invoice: {
        id: invoice.invoiceNumber,
        orderNumber: invoice.orderNumber,
        amount: invoice.amount,
        type:
          invoice.invoiceType === 'special'
            ? '增值税专用发票'
            : '增值税普通发票',
        status: invoice.status,
        appliedAt: invoice.createdAt.toISOString().split('T')[0]
      }
    })
  } catch (error) {
    logger.error('❌ Create invoice error:', error)
    res.status(500).json({
      error: 'Create invoice error',
      message: 'Failed to create invoice'
    })
  }
})

// 📥 下载发票 (TODO: 实现文件下载逻辑)
router.get('/:invoiceNumber/download', authenticateUserDb, async (req, res) => {
  try {
    const { invoiceNumber } = req.params

    const invoice = await Invoice.findOne({
      invoiceNumber,
      userId: req.user.id
    })

    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found',
        message: '发票不存在'
      })
    }

    if (invoice.status !== 'completed' || !invoice.downloadUrl) {
      return res.status(400).json({
        error: 'Invoice not available',
        message: '发票尚未开具，无法下载'
      })
    }

    // TODO: 实现实际的文件下载
    res.json({
      success: true,
      downloadUrl: invoice.downloadUrl
    })
  } catch (error) {
    logger.error('❌ Download invoice error:', error)
    res.status(500).json({
      error: 'Download invoice error',
      message: 'Failed to download invoice'
    })
  }
})

module.exports = router

