const mongoose = require('mongoose');

/**
 * 公告模型
 */
const announcementSchema = new mongoose.Schema({
  // 公告内容
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  
  // 分类和标签
  category: {
    type: String,
    enum: ['important', 'update', 'tutorial', 'maintenance', 'feature'],
    default: 'update',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  
  // 作者信息
  author: {
    type: String,
    default: '管理员',
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  
  // 状态和优先级
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published',
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  
  // 显示设置
  showOnHomepage: {
    type: Boolean,
    default: false,
  },
  showOnDashboard: {
    type: Boolean,
    default: true,
  },
  
  // 统计信息
  views: {
    type: Number,
    default: 0,
  },
  
  // 时间信息
  publishedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// 索引
announcementSchema.index({ status: 1, publishedAt: -1 });
announcementSchema.index({ category: 1 });
announcementSchema.index({ isPinned: -1, priority: -1, publishedAt: -1 });

// 增加浏览量
announcementSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;

