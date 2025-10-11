const { CardKey, User, CreditRecord } = require('../models')
const logger = require('../utils/logger')
const crypto = require('crypto')

class CardKeyService {
  /**
   * 批量生成卡密
   */
  async generateBatch(options = {}) {
    try {
      const {
        count = 1,
        creditAmount = 100,
        type = 'credit', // 'credit' | 'days' | 'plan'
        expiresInDays = null,
        planId = null,
        planDuration = 30,
        prefix = 'CRD',
        note = ''
      } = options
      
      if (count < 1 || count > 1000) {
        throw new Error('Count must be between 1 and 1000')
      }
      
      if (type === 'credit' && creditAmount <= 0) {
        throw new Error('Credit amount must be greater than 0')
      }
      
      if (type === 'plan' && !planId) {
        throw new Error('Plan ID is required for plan type')
      }
      
      const cardKeys = []
      const now = new Date()
      
      for (let i = 0; i < count; i++) {
        const code = this._generateCode(prefix)
        
        const cardKey = new CardKey({
          code,
          type,
          creditAmount: type === 'credit' ? creditAmount : 0,
          planId: type === 'plan' ? planId : null,
          planDuration: type === 'plan' ? planDuration : 0,
          status: 'active',
          expiresAt: expiresInDays ? new Date(now.getTime() + expiresInDays * 86400000) : null,
          note
        })
        
        await cardKey.save()
        cardKeys.push(cardKey)
      }
      
      logger.success(`✅ Generated ${count} card keys (type: ${type})`)
      
      return cardKeys
    } catch (error) {
      logger.error('❌ Failed to generate card keys:', error)
      throw error
    }
  }

  /**
   * 兑换卡密
   */
  async redeem(userId, code, ipAddress = null) {
    try {
      // 规范化卡密(去除空格和转大写)
      const normalizedCode = code.trim().toUpperCase().replace(/\s/g, '')
      
      const cardKey = await CardKey.findOne({ code: normalizedCode })
      
      if (!cardKey) {
        logger.warning(`⚠️ Card key not found: ${normalizedCode}`)
        return {
          success: false,
          message: '卡密不存在或已失效'
        }
      }
      
      // 检查卡密状态
      if (cardKey.status !== 'active') {
        return {
          success: false,
          message: `卡密状态异常: ${cardKey.status}`
        }
      }
      
      // 检查是否已兑换
      if (cardKey.redeemedBy) {
        return {
          success: false,
          message: '卡密已被使用'
        }
      }
      
      // 检查是否过期
      if (cardKey.expiresAt && new Date() > cardKey.expiresAt) {
        cardKey.status = 'expired'
        await cardKey.save()
        return {
          success: false,
          message: '卡密已过期'
        }
      }
      
      const user = await User.findById(userId)
      
      if (!user) {
        return {
          success: false,
          message: '用户不存在'
        }
      }
      
      // 根据卡密类型处理
      let result
      switch (cardKey.type) {
        case 'credit':
          result = await this._redeemCredit(user, cardKey)
          break
        case 'plan':
          result = await this._redeemPlan(user, cardKey)
          break
        default:
          throw new Error(`Unknown card key type: ${cardKey.type}`)
      }
      
      // 更新卡密状态
      cardKey.status = 'used'
      cardKey.redeemedBy = userId
      cardKey.redeemedAt = new Date()
      cardKey.redeemIp = ipAddress
      await cardKey.save()
      
      logger.success(`✅ Card key redeemed: ${normalizedCode} by user ${user.username}`)
      
      return {
        success: true,
        message: result.message,
        type: cardKey.type,
        amount: result.amount,
        planId: result.planId,
        newBalance: result.newBalance
      }
    } catch (error) {
      logger.error('❌ Failed to redeem card key:', error)
      throw error
    }
  }

  /**
   * 获取卡密列表
   */
  async getCardKeys(options = {}) {
    try {
      const {
        status = null,
        type = null,
        limit = 50,
        offset = 0,
        includeUsed = true
      } = options
      
      const query = {}
      if (status) {
        query.status = status
      }
      if (type) {
        query.type = type
      }
      if (!includeUsed) {
        query.status = { $ne: 'used' }
      }
      
      const total = await CardKey.countDocuments(query)
      const cardKeys = await CardKey.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
      
      return {
        cardKeys,
        total
      }
    } catch (error) {
      logger.error('❌ Failed to get card keys:', error)
      throw error
    }
  }

  /**
   * 删除卡密
   */
  async deleteCardKey(cardKeyId) {
    try {
      const cardKey = await CardKey.findById(cardKeyId)
      
      if (!cardKey) {
        throw new Error('Card key not found')
      }
      
      if (cardKey.status === 'used') {
        throw new Error('Cannot delete used card key')
      }
      
      await CardKey.deleteOne({ _id: cardKeyId })
      
      logger.success(`✅ Deleted card key: ${cardKey.code}`)
      
      return true
    } catch (error) {
      logger.error('❌ Failed to delete card key:', error)
      throw error
    }
  }

  /**
   * 批量删除未使用的卡密
   */
  async deleteUnusedBatch(cardKeyIds) {
    try {
      const result = await CardKey.deleteMany({
        _id: { $in: cardKeyIds },
        status: { $ne: 'used' }
      })
      
      logger.success(`✅ Deleted ${result.deletedCount} unused card keys`)
      
      return result.deletedCount
    } catch (error) {
      logger.error('❌ Failed to delete unused card keys:', error)
      throw error
    }
  }

  /**
   * 兑换积分类卡密
   */
  async _redeemCredit(user, cardKey) {
    user.credits = (user.credits || 0) + cardKey.creditAmount
    await user.save()
    
    // 记录积分变动
    await CreditRecord.create({
      userId: user._id,
      type: 'cardkey_redeem',
      amount: cardKey.creditAmount,
      balance: user.credits,
      description: `兑换卡密: ${cardKey.code.substring(0, 8)}***`,
      metadata: {
        cardKeyId: cardKey._id,
        cardKeyCode: cardKey.code
      }
    })
    
    return {
      message: `成功兑换 ${cardKey.creditAmount} 积分`,
      amount: cardKey.creditAmount,
      newBalance: user.credits
    }
  }

  /**
   * 兑换套餐类卡密
   */
  async _redeemPlan(user, cardKey) {
    const { SubscriptionPlan } = require('../models')
    
    const plan = await SubscriptionPlan.findOne({ planId: cardKey.planId })
    
    if (!plan) {
      throw new Error('Plan not found')
    }
    
    const now = new Date()
    let startDate = now
    let expiryDate = new Date(now)
    
    // 如果有现有订阅且未过期,从现有结束时间延长
    if (user.subscription && user.subscription.expiryDate) {
      const currentExpiry = new Date(user.subscription.expiryDate)
      if (currentExpiry > now) {
        startDate = currentExpiry
        expiryDate = currentExpiry
      }
    }
    
    // 根据卡密的planDuration延长
    expiryDate.setDate(expiryDate.getDate() + cardKey.planDuration)
    
    // 更新用户订阅
    user.subscription = {
      planId: plan.planId,
      planName: plan.displayName,
      status: 'active',
      startDate,
      expiryDate,
      autoRenew: false,
      features: plan.features
    }
    
    await user.save()
    
    // 记录积分变动(如果卡密赠送积分)
    if (cardKey.creditAmount > 0) {
      user.credits = (user.credits || 0) + cardKey.creditAmount
      await user.save()
      
      await CreditRecord.create({
        userId: user._id,
        type: 'cardkey_bonus',
        amount: cardKey.creditAmount,
        balance: user.credits,
        description: `套餐卡密赠送积分: ${cardKey.code.substring(0, 8)}***`,
        metadata: {
          cardKeyId: cardKey._id,
          cardKeyCode: cardKey.code
        }
      })
    }
    
    return {
      message: `成功激活 ${plan.displayName} (${cardKey.planDuration}天)`,
      planId: plan.planId,
      amount: cardKey.planDuration,
      newBalance: user.credits
    }
  }

  /**
   * 生成卡密代码
   */
  _generateCode(prefix = 'CRD') {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random1 = crypto.randomBytes(4).toString('hex').toUpperCase()
    const random2 = crypto.randomBytes(4).toString('hex').toUpperCase()
    
    // 格式: PREFIX-XXXX-XXXX-XXXX
    return `${prefix}-${random1.substring(0, 4)}-${timestamp.substring(0, 4)}-${random2.substring(0, 4)}`
  }
}

module.exports = new CardKeyService()
