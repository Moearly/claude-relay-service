const { Announcement } = require('../models');
const logger = require('../utils/logger');

class AnnouncementService {
  async getList(filters = {}) {
    try {
      const { limit = 50, offset = 0, category, status = 'published' } = filters;
      
      const query = { status };
      if (category) query.category = category;

      const announcements = await Announcement.find(query)
        .sort({ isPinned: -1, priority: -1, publishedAt: -1 })
        .skip(offset)
        .limit(limit);

      const total = await Announcement.countDocuments(query);

      return { success: true, announcements, total };
    } catch (error) {
      logger.error('❌ 获取公告列表失败:', error);
      return { success: false, announcements: [], total: 0 };
    }
  }

  async create(data, authorId) {
    try {
      const announcement = new Announcement({
        ...data,
        authorId,
        publishedAt: new Date()
      });

      await announcement.save();
      logger.info(`✅ 创建公告: ${announcement.title}`);
      
      return { success: true, announcement };
    } catch (error) {
      logger.error('❌ 创建公告失败:', error);
      return { success: false, message: '创建失败' };
    }
  }

  async update(id, updates) {
    try {
      const announcement = await Announcement.findByIdAndUpdate(
        id,
        { $set: { ...updates, updatedAt: new Date() } },
        { new: true }
      );

      if (!announcement) {
        return { success: false, message: '公告不存在' };
      }

      return { success: true, announcement };
    } catch (error) {
      logger.error('❌ 更新公告失败:', error);
      return { success: false, message: '更新失败' };
    }
  }

  async delete(id) {
    try {
      const result = await Announcement.findByIdAndDelete(id);
      if (!result) {
        return { success: false, message: '公告不存在' };
      }

      return { success: true };
    } catch (error) {
      logger.error('❌ 删除公告失败:', error);
      return { success: false, message: '删除失败' };
    }
  }
}

module.exports = new AnnouncementService();

