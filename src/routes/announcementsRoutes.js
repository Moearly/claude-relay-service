const express = require('express');
const router = express.Router();
const { authenticateUser, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');
const announcementService = require('../services/announcementService');

/**
 * 公告管理路由
 * 提供公告的CRUD功能
 */

// 获取公告列表（公开接口，无需认证）
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, category } = req.query;

    const result = await announcementService.getList({ limit, offset, category });
    
    if (result.success && result.announcements.length > 0) {
      return res.json(result);
    }

    const mockAnnouncements = [
      {
        id: '1',
        title: 'claude code 官方正在大量封号',
        content: `近期我们观察到 Claude Code 官方加强了账号监控，大量用户账号被封禁。我们建议：

1. 使用我们的中转服务，避免直接使用官方账号
2. 不要在多个设备上同时登录同一账号
3. 避免频繁切换 IP 地址

我们的服务采用账户池技术，完全不存在封号风险。如有任何问题，请随时联系客服。`,
        author: '管理员',
        date: '2025年10月2日',
        createdAt: '2025-10-02T00:00:00Z',
        category: 'important',
        status: 'published',
      },
      {
        id: '2',
        title: 'Claude Code 官方已经实装周限制',
        content: `Claude Code 官方已经实装了周限制功能，每周使用量有上限。

主要影响：
- 免费版用户每周 5 次对话
- 付费版用户每周 500 次快速请求
- 超过限制后速度明显下降

我们的服务不受此限制影响，每日 18000 积分持续供应，无需担心周限制。`,
        author: '管理员',
        date: '2025年10月1日',
        createdAt: '2025-10-01T00:00:00Z',
        category: 'update',
        status: 'published',
      },
      {
        id: '3',
        title: 'Codex的配置文件需要修改一下',
        content: `最新版本的 Codex 配置方式有所更新，请按照以下步骤修改配置：

1. 打开配置文件：~/.codex/config.json
2. 修改 API 地址和密钥
3. 重启 Codex

详细配置方法请查看"Codex 安装教程"页面。

如遇到问题，欢迎联系技术支持。`,
        author: '管理员',
        date: '2025年9月29日',
        createdAt: '2025-09-29T00:00:00Z',
        category: 'tutorial',
        status: 'published',
      },
    ];

    let filtered = mockAnnouncements;
    if (category) {
      filtered = filtered.filter(a => a.category === category);
    }

    res.json({
      success: true,
      announcements: filtered.slice(offset, offset + limit),
      total: filtered.length,
    });
  } catch (error) {
    logger.error('获取公告列表失败:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: '获取公告列表失败',
    });
  }
});

// 获取单个公告详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: 从数据库获取公告详情
    res.json({
      success: true,
      id,
      title: '示例公告',
      content: '公告内容',
      author: '管理员',
      createdAt: new Date().toISOString(),
      category: 'update',
    });
  } catch (error) {
    logger.error('获取公告详情失败:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: '获取公告详情失败',
    });
  }
});

// 创建公告（管理员）
router.post('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const author = req.user.username;

    if (!title || !content) {
      return res.status(400).json({
        error: 'Invalid input',
        message: '标题和内容不能为空',
      });
    }

    // TODO: 保存到数据库
    const announcementId = 'ANN' + Date.now();
    logger.info(`管理员 ${author} 创建公告: ${title}`);

    res.json({
      success: true,
      message: '公告创建成功',
      id: announcementId,
      title,
      content,
      category: category || 'update',
      author,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('创建公告失败:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: '创建公告失败',
    });
  }
});

// 更新公告（管理员）
router.put('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, status } = req.body;
    const author = req.user.username;

    // TODO: 更新数据库
    logger.info(`管理员 ${author} 更新公告: ${id}`);

    res.json({
      success: true,
      message: '公告更新成功',
      id,
      title,
      content,
      category,
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('更新公告失败:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: '更新公告失败',
    });
  }
});

// 删除公告（管理员）
router.delete('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const author = req.user.username;

    // TODO: 从数据库删除
    logger.info(`管理员 ${author} 删除公告: ${id}`);

    res.json({
      success: true,
      message: '公告删除成功',
    });
  } catch (error) {
    logger.error('删除公告失败:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: '删除公告失败',
    });
  }
});

module.exports = router;

