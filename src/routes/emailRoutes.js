const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const EmailLog = require('../models/EmailLog');
const EmailTemplate = require('../models/EmailTemplate');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

// ==================== 邮件发送历史 ====================

// 获取邮件发送历史列表
router.get('/logs', authenticateAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      search
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { to: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await EmailLog.countDocuments(query);
    const logs = await EmailLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: logs.map(log => ({
        id: log._id.toString(),
        to: log.to,
        subject: log.subject,
        type: log.type,
        status: log.status,
        error: log.error,
        provider: log.provider,
        messageId: log.messageId,
        sentAt: log.sentAt,
        createdAt: log.createdAt,
        from: log.from,
        templateName: log.templateName
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('❌ 获取邮件历史失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取邮件详情
router.get('/logs/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const log = await EmailLog.findById(id).lean();

    if (!log) {
      return res.status(404).json({
        success: false,
        error: '邮件记录不存在'
      });
    }

    res.json({
      success: true,
      data: {
        ...log,
        id: log._id.toString()
      }
    });
  } catch (error) {
    logger.error('❌ 获取邮件详情失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取邮件统计
router.get('/logs/stats/overview', authenticateAdmin, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [total, sent, failed, byType] = await Promise.all([
      EmailLog.countDocuments({ createdAt: { $gte: startDate } }),
      EmailLog.countDocuments({ status: 'sent', createdAt: { $gte: startDate } }),
      EmailLog.countDocuments({ status: 'failed', createdAt: { $gte: startDate } }),
      EmailLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total,
        sent,
        failed,
        successRate: total > 0 ? ((sent / total) * 100).toFixed(2) : 0,
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    logger.error('❌ 获取邮件统计失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== 邮件模板管理 ====================

// 获取模板列表
router.get('/templates', authenticateAdmin, async (req, res) => {
  try {
    const { status, type, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const templates = await EmailTemplate.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: templates.map(t => ({
        id: t._id.toString(),
        name: t.name,
        slug: t.slug,
        type: t.type,
        subject: t.subject,
        content: t.content,
        contentType: t.contentType,
        variables: t.variables,
        category: t.category,
        description: t.description,
        status: t.status,
        isSystem: t.isSystem,
        usageCount: t.usageCount,
        lastUsedAt: t.lastUsedAt,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      }))
    });
  } catch (error) {
    logger.error('❌ 获取模板列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取模板详情
router.get('/templates/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const template = await EmailTemplate.findById(id).lean();

    if (!template) {
      return res.status(404).json({
        success: false,
        error: '模板不存在'
      });
    }

    res.json({
      success: true,
      data: {
        ...template,
        id: template._id.toString()
      }
    });
  } catch (error) {
    logger.error('❌ 获取模板详情失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 创建模板
router.post('/templates', authenticateAdmin, async (req, res) => {
  try {
    const {
      name,
      slug,
      type,
      subject,
      content,
      contentType,
      variables,
      category,
      description,
      status
    } = req.body;

    // 检查 slug 是否已存在
    const existing = await EmailTemplate.findOne({ slug });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: '模板标识已存在'
      });
    }

    const template = new EmailTemplate({
      name,
      slug,
      type,
      subject,
      content,
      contentType: contentType || 'markdown',
      variables: variables || [],
      category: category || 'general',
      description: description || '',
      status: status || 'active',
      createdBy: req.admin.username
    });

    await template.save();

    logger.info(`✅ 管理员 ${req.admin.username} 创建邮件模板: ${name}`);

    res.json({
      success: true,
      message: '模板创建成功',
      data: {
        id: template._id.toString(),
        ...template.toObject()
      }
    });
  } catch (error) {
    logger.error('❌ 创建模板失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 更新模板
router.put('/templates/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const template = await EmailTemplate.findById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: '模板不存在'
      });
    }

    // 系统模板不允许修改某些字段
    if (template.isSystem) {
      const { slug, type, isSystem, ...updates } = req.body;
      Object.assign(template, updates);
    } else {
      Object.assign(template, req.body);
    }

    template.updatedBy = req.admin.username;
    await template.save();

    logger.info(`✅ 管理员 ${req.admin.username} 更新邮件模板: ${template.name}`);

    res.json({
      success: true,
      message: '模板更新成功',
      data: {
        id: template._id.toString(),
        ...template.toObject()
      }
    });
  } catch (error) {
    logger.error('❌ 更新模板失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 删除模板
router.delete('/templates/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const template = await EmailTemplate.findById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: '模板不存在'
      });
    }

    if (template.isSystem) {
      return res.status(400).json({
        success: false,
        error: '系统模板不能删除'
      });
    }

    await template.deleteOne();

    logger.info(`✅ 管理员 ${req.admin.username} 删除邮件模板: ${template.name}`);

    res.json({
      success: true,
      message: '模板删除成功'
    });
  } catch (error) {
    logger.error('❌ 删除模板失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 预览模板
router.post('/templates/:id/preview', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { variables = {} } = req.body;

    const template = await EmailTemplate.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: '模板不存在'
      });
    }

    // 渲染主题和内容
    const subject = emailService.renderTemplate(template.subject, variables);
    let content = emailService.renderTemplate(template.content, variables);

    // 如果是 Markdown，转换为 HTML
    let html = content;
    if (template.contentType === 'markdown') {
      const marked = require('marked');
      html = marked.parse(content);
    }

    res.json({
      success: true,
      data: {
        subject,
        content,
        html
      }
    });
  } catch (error) {
    logger.error('❌ 预览模板失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 使用模板发送测试邮件
router.post('/templates/:id/send-test', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { to, variables = {} } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: '请提供收件人邮箱'
      });
    }

    const template = await EmailTemplate.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: '模板不存在'
      });
    }

    const result = await emailService.sendEmailWithTemplate({
      to,
      templateSlug: template.slug,
      variables,
      sentBy: req.admin.username,
      metadata: { testMode: true }
    });

    logger.info(`✅ 管理员 ${req.admin.username} 使用模板 ${template.name} 发送测试邮件到 ${to}`);

    res.json({
      success: true,
      message: '测试邮件已发送',
      data: result
    });
  } catch (error) {
    logger.error('❌ 发送测试邮件失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: '发送失败：' + error.message
    });
  }
});

module.exports = router;

