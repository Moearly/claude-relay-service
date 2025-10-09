const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * 订阅管理路由
 * 提供订阅查询、升级、取消等功能
 */

// 获取用户订阅信息
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // TODO: 从数据库获取用户订阅信息
    // 暂时返回模拟数据
    const mockSubscription = {
      userId,
      plan: '专业版',
      planId: 'pro',
      dailyCredits: 18000,
      price: 399,
      currency: 'CNY',
      startDate: '2025-01-01',
      expiryDate: '2025-02-02',
      autoRenew: true,
      status: 'active',
      features: [
        '每日 18000 积分',
        '支持所有 Claude 模型',
        '5 个 API 密钥',
        '优先技术支持',
        '99.9% 服务可用性',
        '分时段积分恢复',
      ],
    };

    res.json({
      success: true,
      ...mockSubscription,
    });
  } catch (error) {
    logger.error('获取订阅信息失败:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: '获取订阅信息失败',
    });
  }
});

// 获取可用套餐列表
router.get('/plans', async (req, res) => {
  try {
    // 返回所有可用套餐
    const plans = [
      {
        id: 'basic',
        name: '基础版',
        price: 199,
        currency: 'CNY',
        period: 'month',
        dailyCredits: 9000,
        features: [
          '每日 9000 积分',
          '支持所有 Claude 模型',
          '1 个 API 密钥',
          '基础技术支持',
          '99.5% 服务可用性',
        ],
      },
      {
        id: 'pro',
        name: '专业版',
        price: 399,
        currency: 'CNY',
        period: 'month',
        dailyCredits: 18000,
        recommended: true,
        features: [
          '每日 18000 积分',
          '支持所有 Claude 模型',
          '5 个 API 密钥',
          '优先技术支持',
          '99.9% 服务可用性',
          '分时段积分恢复',
        ],
      },
      {
        id: 'enterprise',
        name: '企业版',
        price: 799,
        currency: 'CNY',
        period: 'month',
        dailyCredits: 36000,
        features: [
          '每日 36000 积分',
          '支持所有 Claude 模型',
          '无限 API 密钥',
          '1v1 工程师支持',
          '99.99% 服务可用性',
          '分时段积分恢复',
          '专属客服',
          '定制化功能',
        ],
      },
    ];

    res.json({
      success: true,
      plans,
    });
  } catch (error) {
    logger.error('获取套餐列表失败:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: '获取套餐列表失败',
    });
  }
});

// 创建订阅订单
router.post('/orders', authenticateUser, async (req, res) => {
  try {
    const { planId, paymentMethod } = req.body;
    const userId = req.user.id;

    if (!planId) {
      return res.status(400).json({
        error: 'Invalid input',
        message: '请选择套餐',
      });
    }

    // TODO: 创建订单并生成支付链接
    logger.info(`用户 ${userId} 创建订单: 套餐=${planId}, 支付方式=${paymentMethod}`);

    const orderId = 'ORD' + Date.now() + Math.random().toString(36).substring(2, 9).toUpperCase();

    res.json({
      success: true,
      orderId,
      planId,
      amount: planId === 'basic' ? 199 : planId === 'pro' ? 399 : 799,
      currency: 'CNY',
      paymentUrl: `https://payment.example.com/pay/${orderId}`,
      qrCode: `https://payment.example.com/qr/${orderId}`,
      expiresAt: new Date(Date.now() + 900000).toISOString(), // 15分钟后过期
    });
  } catch (error) {
    logger.error('创建订单失败:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: '创建订单失败',
    });
  }
});

// 更新自动续费设置
router.put('/auto-renew', authenticateUser, async (req, res) => {
  try {
    const { autoRenew } = req.body;
    const userId = req.user.id;

    if (typeof autoRenew !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid input',
        message: '参数格式错误',
      });
    }

    // TODO: 更新数据库中的自动续费设置
    logger.info(`用户 ${userId} 更新自动续费设置: ${autoRenew}`);

    res.json({
      success: true,
      message: autoRenew ? '已开启自动续费' : '已关闭自动续费',
      autoRenew,
    });
  } catch (error) {
    logger.error('更新自动续费设置失败:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: '操作失败',
    });
  }
});

// 获取订单历史
router.get('/orders', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    // TODO: 从数据库获取订单历史
    const mockOrders = [
      {
        id: 'ORD20250110001',
        userId,
        planId: 'pro',
        planName: '专业版',
        amount: 399,
        currency: 'CNY',
        status: 'paid',
        paymentMethod: 'alipay',
        createdAt: '2025-01-10T00:00:00Z',
        paidAt: '2025-01-10T00:05:23Z',
      },
    ];

    res.json({
      success: true,
      orders: mockOrders.slice(offset, offset + limit),
      total: mockOrders.length,
    });
  } catch (error) {
    logger.error('获取订单历史失败:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: '获取订单历史失败',
    });
  }
});

module.exports = router;

