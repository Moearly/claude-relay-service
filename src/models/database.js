const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('../../config/config');

/**
 * 数据库连接管理
 */
class Database {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  /**
   * 连接数据库
   */
  async connect() {
    if (this.isConnected) {
      logger.info('📊 Database already connected');
      return this.connection;
    }

    try {
      const mongoUri = config.database?.mongoUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/claude-relay';
      
      logger.info('🔄 Connecting to MongoDB...');
      
      this.connection = await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
      });

      this.isConnected = true;
      logger.success('✅ MongoDB connected successfully');

      // 监听连接事件
      mongoose.connection.on('error', (err) => {
        logger.error('❌ MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('⚠️ MongoDB disconnected');
        this.isConnected = false;
      });

      return this.connection;
    } catch (error) {
      logger.error('❌ Failed to connect to MongoDB:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * 断开数据库连接
   */
  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('📊 MongoDB disconnected');
    } catch (error) {
      logger.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  }
}

// 导出单例
module.exports = new Database();

