const { User, CreditRecord } = require('../models')
const logger = require('../utils/logger')
const jwt = require('jsonwebtoken')
const config = require('../../config/config')

/**
 * 用户服务
 */
class UserService {
  /**
   * 用户注册
   */
  async register(userData) {
    try {
      const { username, email, password } = userData

      // 检查用户名是否已存在
      const existingUsername = await User.findOne({ username })
      if (existingUsername) {
        return {
          success: false,
          error: 'Username already exists',
          message: '用户名已被使用'
        }
      }

      // 检查邮箱是否已存在
      const existingEmail = await User.findOne({ email })
      if (existingEmail) {
        return {
          success: false,
          error: 'Email already exists',
          message: '邮箱已被注册'
        }
      }

      // 创建新用户
      const user = new User({
        username,
        email,
        password,
        displayName: username,
        role: 'user',
        credits: 1000, // 注册赠送1000积分
        subscription: {
          planId: 'free',
          planName: '免费版',
          dailyCredits: 1000,
          status: 'active'
        }
      })

      // 生成邀请码
      user.generateInvitationCode()

      await user.save()

      // 记录赠送积分
      await this.addCreditRecord({
        userId: user._id,
        type: 'gift',
        amount: 1000,
        balanceBefore: 0,
        balanceAfter: 1000,
        description: '新用户注册赠送',
        source: 'registration'
      })

      logger.info(`✅ 新用户注册成功: ${username} (${email})`)

      return {
        success: true,
        message: '注册成功',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          credits: user.credits,
          invitationCode: user.invitationCode
        }
      }
    } catch (error) {
      logger.error('❌ 用户注册失败:', error)
      return {
        success: false,
        error: 'Registration failed',
        message: '注册失败，请稍后重试'
      }
    }
  }

  /**
   * 用户登录（使用数据库）
   */
  async login(username, password) {
    try {
      // 查找用户
      const user = await User.findOne({
        $or: [{ username }, { email: username }]
      })

      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials',
          message: '用户名或密码错误'
        }
      }

      // 检查账户是否被锁定
      if (user.lockUntil && user.lockUntil > Date.now()) {
        const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000)
        return {
          success: false,
          error: 'Account locked',
          message: `账户已被锁定，请在 ${minutesLeft} 分钟后重试`
        }
      }

      // 验证密码
      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        // 增加失败次数
        user.failedLoginAttempts += 1

        // 如果失败次数超过5次，锁定账户30分钟
        if (user.failedLoginAttempts >= 5) {
          user.lockUntil = Date.now() + 30 * 60 * 1000
          logger.warn(`⚠️ 账户被锁定: ${username} (失败次数: ${user.failedLoginAttempts})`)
        }

        await user.save()

        return {
          success: false,
          error: 'Invalid credentials',
          message: '用户名或密码错误'
        }
      }

      // 重置失败次数
      user.failedLoginAttempts = 0
      user.lockUntil = null
      user.lastLogin = Date.now()

      // 重置每日使用量（如果需要）
      user.resetDailyUsage()

      await user.save()

      // 生成Token
      const token = this.generateToken(user)

      logger.info(`✅ 用户登录成功: ${username}`)

      return {
        success: true,
        message: '登录成功',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          credits: user.credits,
          subscription: user.subscription
        }
      }
    } catch (error) {
      logger.error('❌ 用户登录失败:', error)
      return {
        success: false,
        error: 'Login failed',
        message: '登录失败，请稍后重试'
      }
    }
  }

  /**
   * 生成JWT Token
   */
  generateToken(user) {
    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }

    const secret =
      config.jwt?.secret || process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    const expiresIn = config.jwt?.expiresIn || '7d'

    return jwt.sign(payload, secret, { expiresIn })
  }

  /**
   * 验证Token
   */
  verifyToken(token) {
    try {
      const secret =
        config.jwt?.secret || process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      return jwt.verify(token, secret)
    } catch (error) {
      return null
    }
  }

  /**
   * 获取用户信息
   */
  async getUserById(userId) {
    try {
      const user = await User.findById(userId)
      if (!user) {
        return null
      }

      // 重置每日使用量
      user.resetDailyUsage()
      await user.save()

      return user
    } catch (error) {
      logger.error('❌ 获取用户信息失败:', error)
      return null
    }
  }

  /**
   * 根据ID查找用户
   */
  async findUserById(userId) {
    try {
      return await User.findById(userId)
    } catch (error) {
      logger.error('❌ 查找用户失败:', error)
      return null
    }
  }

  /**
   * 根据邮箱查找用户
   */
  async findUserByEmail(email) {
    try {
      return await User.findOne({ email })
    } catch (error) {
      logger.error('❌ 查找用户失败:', error)
      return null
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId, updates) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates, updatedAt: Date.now() },
        { new: true }
      )

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          message: '用户不存在'
        }
      }

      // 转换为普通对象，确保前端可以正确读取
      return {
        success: true,
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive
        }
      }
    } catch (error) {
      logger.error('❌ 更新用户信息失败:', error)
      return {
        success: false,
        error: 'Update failed',
        message: '更新失败'
      }
    }
  }

  /**
   * 添加积分记录
   */
  async addCreditRecord(recordData) {
    try {
      const record = new CreditRecord(recordData)
      await record.save()
      return record
    } catch (error) {
      logger.error('❌ 添加积分记录失败:', error)
      return null
    }
  }

  /**
   * 消耗积分
   */
  async consumeCredits(userId, amount, description, metadata = {}) {
    try {
      const user = await User.findById(userId)
      if (!user) {
        return {
          success: false,
          error: 'User not found',
          message: '用户不存在'
        }
      }

      // 检查积分是否足够
      if (user.credits < amount) {
        return {
          success: false,
          error: 'Insufficient credits',
          message: '积分不足'
        }
      }

      const balanceBefore = user.credits
      user.credits -= amount
      user.todayUsage += amount

      await user.save()

      // 记录消耗
      await this.addCreditRecord({
        userId: user._id,
        type: 'usage',
        amount: -amount,
        balanceBefore,
        balanceAfter: user.credits,
        description,
        ...metadata
      })

      return {
        success: true,
        credits: user.credits,
        todayUsage: user.todayUsage
      }
    } catch (error) {
      logger.error('❌ 消耗积分失败:', error)
      return {
        success: false,
        error: 'Failed to consume credits',
        message: '积分扣除失败'
      }
    }
  }

  /**
   * 添加积分
   */
  async addCredits(userId, amount, description, type = 'refill') {
    try {
      const user = await User.findById(userId)
      if (!user) {
        return {
          success: false,
          error: 'User not found',
          message: '用户不存在'
        }
      }

      const balanceBefore = user.credits
      user.credits += amount

      await user.save()

      // 记录充值
      await this.addCreditRecord({
        userId: user._id,
        type,
        amount,
        balanceBefore,
        balanceAfter: user.credits,
        description
      })

      return {
        success: true,
        credits: user.credits
      }
    } catch (error) {
      logger.error('❌ 添加积分失败:', error)
      return {
        success: false,
        error: 'Failed to add credits',
        message: '积分充值失败'
      }
    }
  }

  /**
   * OAuth登录/注册
   */
  async oauthLogin(provider, profile) {
    try {
      const { id, email, name, avatar } = profile

      // 查找是否已有此OAuth用户
      let user = await User.findOne({
        oauthProvider: provider,
        oauthId: id
      })

      if (!user) {
        // 尝试通过邮箱查找
        user = await User.findOne({ email })

        if (user) {
          // 绑定OAuth账号
          user.oauthProvider = provider
          user.oauthId = id
          if (avatar) {
            user.avatar = avatar
          }
          await user.save()
        } else {
          // 创建新用户
          user = new User({
            username: `${provider}_${id}`,
            email,
            displayName: name || email,
            avatar,
            oauthProvider: provider,
            oauthId: id,
            role: 'user',
            credits: 1000,
            isEmailVerified: true, // OAuth用户默认邮箱已验证
            subscription: {
              planId: 'free',
              planName: '免费版',
              dailyCredits: 1000,
              status: 'active'
            }
          })

          user.generateInvitationCode()
          await user.save()

          // 记录赠送积分
          await this.addCreditRecord({
            userId: user._id,
            type: 'gift',
            amount: 1000,
            balanceBefore: 0,
            balanceAfter: 1000,
            description: `${provider}登录注册赠送`,
            source: `oauth_${provider}`
          })

          logger.info(`✅ OAuth新用户注册: ${provider} - ${email}`)
        }
      }

      // 更新登录信息
      user.lastLogin = Date.now()
      await user.save()

      // 生成Token
      const token = this.generateToken(user)

      return {
        success: true,
        message: '登录成功',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          role: user.role,
          credits: user.credits
        }
      }
    } catch (error) {
      logger.error(`❌ OAuth登录失败 (${provider}):`, error)
      return {
        success: false,
        error: 'OAuth login failed',
        message: 'OAuth登录失败'
      }
    }
  }
}

module.exports = new UserService()
