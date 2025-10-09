const { CardKey, User } = require('../models');
const logger = require('../utils/logger');
const userService = require('./userService');

class CardKeyService {
  async redeem(userId, code, ipAddress) {
    try {
      const cardKey = await CardKey.findOne({ code: code.toUpperCase() });
      
      if (!cardKey) {
        return { success: false, message: '卡密不存在' };
      }

      const validation = cardKey.isValid();
      if (!validation.valid) {
        return { success: false, message: validation.reason };
      }

      const user = await User.findById(userId);
      if (!user) {
        return { success: false, message: '用户不存在' };
      }

      await cardKey.markAsUsed(userId, ipAddress);

      if (cardKey.type === 'credits') {
        await userService.addCredits(userId, cardKey.credits, `卡密兑换: ${code}`, 'redeem');
      }

      logger.info(`✅ 卡密兑换成功: ${code} by ${user.username}`);
      
      return {
        success: true,
        message: '兑换成功',
        credits: cardKey.credits,
        newBalance: user.credits + cardKey.credits
      };
    } catch (error) {
      logger.error('❌ 卡密兑换失败:', error);
      return { success: false, message: '兑换失败' };
    }
  }

  async createBatch(count, credits, duration = 0, createdBy = null) {
    try {
      const batchId = 'BATCH' + Date.now();
      const keys = [];

      for (let i = 0; i < count; i++) {
        const code = CardKey.generateCode();
        keys.push({
          code,
          type: 'credits',
          credits,
          duration,
          batchId,
          createdBy,
          status: 'unused'
        });
      }

      const result = await CardKey.insertMany(keys);
      logger.info(`✅ 批量创建卡密: ${count}个, 批次: ${batchId}`);
      
      return { success: true, keys: result, batchId };
    } catch (error) {
      logger.error('❌ 批量创建卡密失败:', error);
      return { success: false, message: '创建失败' };
    }
  }
}

module.exports = new CardKeyService();

