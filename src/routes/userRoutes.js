const express = require('express')
const router = express.Router()
const ldapService = require('../services/ldapService')
const userServiceDb = require('../services/userService')
const apiKeyService = require('../services/apiKeyService')
const logger = require('../utils/logger')
const config = require('../../config/config')
const inputValidator = require('../utils/inputValidator')
const { RateLimiterRedis } = require('rate-limiter-flexible')
const redis = require('../models/redis')
const { authenticateUser, authenticateUserOrAdmin, requireAdmin } = require('../middleware/auth')
const { authenticateUserDb } = require('../middleware/dbAuth')

// 🚦 配置登录速率限制
// 只基于IP地址限制，避免攻击者恶意锁定特定账户

// 延迟初始化速率限制器，确保 Redis 已连接
let ipRateLimiter = null
let strictIpRateLimiter = null

// 初始化速率限制器函数
function initRateLimiters() {
  if (!ipRateLimiter) {
    try {
      const redisClient = redis.getClientSafe()

      // IP地址速率限制 - 正常限制
      ipRateLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'login_ip_limiter',
        points: 30, // 每个IP允许30次尝试
        duration: 900, // 15分钟窗口期
        blockDuration: 900 // 超限后封禁15分钟
      })

      // IP地址速率限制 - 严格限制（用于检测暴力破解）
      strictIpRateLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'login_ip_strict',
        points: 100, // 每个IP允许100次尝试
        duration: 3600, // 1小时窗口期
        blockDuration: 3600 // 超限后封禁1小时
      })
    } catch (error) {
      logger.error('❌ 初始化速率限制器失败:', error)
      // 速率限制器初始化失败时继续运行，但记录错误
    }
  }
  return { ipRateLimiter, strictIpRateLimiter }
}

// 📝 用户注册端点
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown'

    // 初始化速率限制器
    const limiters = initRateLimiters()

    // 检查IP速率限制
    if (limiters.ipRateLimiter) {
      try {
        await limiters.ipRateLimiter.consume(clientIp)
      } catch (rateLimiterRes) {
        const retryAfter = Math.round(rateLimiterRes.msBeforeNext / 1000) || 900
        logger.security(`🚫 注册请求频率过高 IP: ${clientIp}`)
        res.set('Retry-After', String(retryAfter))
        return res.status(429).json({
          error: 'Too many requests',
          message: '请求过于频繁，请稍后重试'
        })
      }
    }

    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Missing fields',
        message: '用户名、邮箱和密码不能为空'
      })
    }

    // 验证输入格式
    try {
      inputValidator.validateUsername(username)
      inputValidator.validatePassword(password)

      // 简单的邮箱格式验证
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('邮箱格式不正确')
      }
    } catch (validationError) {
      return res.status(400).json({
        error: 'Invalid input',
        message: validationError.message
      })
    }

    // 调用数据库注册服务
    const result = await userServiceDb.register({
      username,
      email,
      password
    })

    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        message: result.message
      })
    }

    // 注册成功，自动登录
    const loginResult = await userServiceDb.login(username, password)

    if (loginResult.success) {
      logger.info(`✅ 新用户注册并登录: ${username} from IP: ${clientIp}`)

      res.json({
        success: true,
        message: '注册成功',
        token: loginResult.token,
        user: loginResult.user
      })
    } else {
      // 注册成功但登录失败（不太可能发生）
      res.json({
        success: true,
        message: '注册成功，请登录',
        user: result.user
      })
    }
  } catch (error) {
    logger.error('❌ 用户注册错误:', error)
    res.status(500).json({
      error: 'Registration error',
      message: '注册失败，请稍后重试'
    })
  }
})

// 🔐 用户登录端点
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown'

    // 初始化速率限制器（如果尚未初始化）
    const limiters = initRateLimiters()

    // 检查IP速率限制 - 基础限制
    if (limiters.ipRateLimiter) {
      try {
        await limiters.ipRateLimiter.consume(clientIp)
      } catch (rateLimiterRes) {
        const retryAfter = Math.round(rateLimiterRes.msBeforeNext / 1000) || 900
        logger.security(`🚫 Login rate limit exceeded for IP: ${clientIp}`)
        res.set('Retry-After', String(retryAfter))
        return res.status(429).json({
          error: 'Too many requests',
          message: `Too many login attempts from this IP. Please try again later.`
        })
      }
    }

    // 检查IP速率限制 - 严格限制（防止暴力破解）
    if (limiters.strictIpRateLimiter) {
      try {
        await limiters.strictIpRateLimiter.consume(clientIp)
      } catch (rateLimiterRes) {
        const retryAfter = Math.round(rateLimiterRes.msBeforeNext / 1000) || 3600
        logger.security(`🚫 Strict rate limit exceeded for IP: ${clientIp} - possible brute force`)
        res.set('Retry-After', String(retryAfter))
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Too many login attempts detected. Access temporarily blocked.'
        })
      }
    }

    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required'
      })
    }

    // 验证输入格式
    let validatedUsername
    try {
      validatedUsername = inputValidator.validateUsername(username)
      inputValidator.validatePassword(password)
    } catch (validationError) {
      return res.status(400).json({
        error: 'Invalid input',
        message: validationError.message
      })
    }

    // 尝试数据库认证
    const authResult = await userServiceDb.login(validatedUsername, password)

    if (!authResult.success) {
      // 登录失败
      logger.info(`🚫 Failed login attempt for user: ${validatedUsername} from IP: ${clientIp}`)
      return res.status(401).json({
        error: 'Authentication failed',
        message: authResult.message
      })
    }

    // 登录成功
    logger.info(`✅ User login successful: ${validatedUsername} from IP: ${clientIp}`)

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: authResult.user.id,
        username: authResult.user.username,
        email: authResult.user.email,
        displayName: authResult.user.displayName,
        firstName: authResult.user.firstName,
        lastName: authResult.user.lastName,
        role: authResult.user.role
      },
      token: authResult.token // Changed from sessionToken to token
    })
  } catch (error) {
    logger.error('❌ User login error:', error)
    res.status(500).json({
      error: 'Login error',
      message: 'Internal server error during login'
    })
  }
})

// 🚪 用户登出端点
router.post('/logout', authenticateUser, async (req, res) => {
  try {
    await userService.invalidateUserSession(req.user.sessionToken)

    logger.info(`👋 User logout: ${req.user.username}`)

    res.json({
      success: true,
      message: 'Logout successful'
    })
  } catch (error) {
    logger.error('❌ User logout error:', error)
    res.status(500).json({
      error: 'Logout error',
      message: 'Internal server error during logout'
    })
  }
})

// 👤 获取当前用户信息
router.get('/profile', authenticateUserDb, async (req, res) => {
  try {
    const user = await userServiceDb.getUserById(req.user.id)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      })
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        apiKeyCount: user.apiKeyCount,
        totalUsage: user.totalUsage
      },
      config: {
        maxApiKeysPerUser: config.userManagement.maxApiKeysPerUser,
        allowUserDeleteApiKeys: config.userManagement.allowUserDeleteApiKeys
      }
    })
  } catch (error) {
    logger.error('❌ Get user profile error:', error)
    res.status(500).json({
      error: 'Profile error',
      message: 'Failed to retrieve user profile'
    })
  }
})

// 🔑 获取用户的API Keys
router.get('/apikeys', authenticateUserDb, async (req, res) => {
  try {
    const { includeDeleted = 'false' } = req.query
    const apiKeys = await apiKeyService.getUserApiKeys(req.user.id, includeDeleted === 'true')

    // 移除敏感信息并格式化usage数据
    const safeApiKeys = apiKeys.map((key) => {
      // Flatten usage structure for frontend compatibility
      let flatUsage = {
        requests: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalCost: 0
      }

      if (key.usage && key.usage.total) {
        flatUsage = {
          requests: key.usage.total.requests || 0,
          inputTokens: key.usage.total.inputTokens || 0,
          outputTokens: key.usage.total.outputTokens || 0,
          totalCost: key.totalCost || 0
        }
      }

      return {
        id: key.id,
        name: key.name,
        description: key.description,
        key: key.apiKey || null, // 返回完整的带前缀的密钥供前端显示/隐藏
        keyPreview: key.keyPreview || null,
        tokenLimit: key.tokenLimit,
        isActive: key.isActive,
        createdAt: key.createdAt,
        lastUsedAt: key.lastUsedAt,
        expiresAt: key.expiresAt,
        usage: flatUsage,
        dailyCost: key.dailyCost,
        dailyCostLimit: key.dailyCostLimit,
        totalCost: key.totalCost,
        totalCostLimit: key.totalCostLimit,
        // Include deletion fields for deleted keys
        isDeleted: key.isDeleted,
        deletedAt: key.deletedAt,
        deletedBy: key.deletedBy,
        deletedByType: key.deletedByType
      }
    })

    res.json({
      success: true,
      apiKeys: safeApiKeys,
      total: safeApiKeys.length
    })
  } catch (error) {
    logger.error('❌ Get user API keys error:', error)
    res.status(500).json({
      error: 'API Keys error',
      message: 'Failed to retrieve API keys'
    })
  }
})

// 🔑 创建新的API Key
router.post('/apikeys', authenticateUserDb, async (req, res) => {
  try {
    const { name, description, tokenLimit, expiresAt, dailyCostLimit, totalCostLimit } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Missing name',
        message: 'API key name is required'
      })
    }

    if (
      totalCostLimit !== undefined &&
      totalCostLimit !== null &&
      totalCostLimit !== '' &&
      (Number.isNaN(Number(totalCostLimit)) || Number(totalCostLimit) < 0)
    ) {
      return res.status(400).json({
        error: 'Invalid total cost limit',
        message: 'Total cost limit must be a non-negative number'
      })
    }

    // 检查用户API Key数量限制
    const userApiKeys = await apiKeyService.getUserApiKeys(req.user.id)
    if (userApiKeys.length >= config.userManagement.maxApiKeysPerUser) {
      return res.status(400).json({
        error: 'API key limit exceeded',
        message: `You can only have up to ${config.userManagement.maxApiKeysPerUser} API keys`
      })
    }

    // 创建API Key数据
    const apiKeyData = {
      name: name.trim(),
      description: description?.trim() || '',
      userId: req.user.id,
      userUsername: req.user.username,
      tokenLimit: tokenLimit || null,
      expiresAt: expiresAt || null,
      dailyCostLimit: dailyCostLimit || null,
      totalCostLimit: totalCostLimit || null,
      createdBy: 'user',
      // 设置服务权限为全部服务，确保前端显示“服务权限”为“全部服务”且具备完整访问权限
      permissions: 'all'
    }

    const newApiKey = await apiKeyService.createApiKey(apiKeyData)

    logger.info(`🔑 User ${req.user.username} created API key: ${name}`)

    res.status(201).json({
      success: true,
      message: 'API key created successfully',
      apiKey: {
        id: newApiKey.id,
        name: newApiKey.name,
        description: newApiKey.description,
        key: newApiKey.apiKey, // 只在创建时返回完整key
        tokenLimit: newApiKey.tokenLimit,
        expiresAt: newApiKey.expiresAt,
        dailyCostLimit: newApiKey.dailyCostLimit,
        totalCostLimit: newApiKey.totalCostLimit,
        createdAt: newApiKey.createdAt
      }
    })
  } catch (error) {
    logger.error('❌ Create user API key error:', error)
    res.status(500).json({
      error: 'API Key creation error',
      message: 'Failed to create API key'
    })
  }
})

// ✏️ 更新API Key名称
router.put('/apikeys/:keyId', authenticateUserDb, async (req, res) => {
  try {
    const { keyId } = req.params
    const { name } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Invalid input',
        message: '密钥名称不能为空'
      })
    }

    // 检查API Key是否属于当前用户
    const existingKey = await apiKeyService.getApiKeyById(keyId)
    if (!existingKey || existingKey.userId !== req.user.id) {
      return res.status(404).json({
        error: 'API key not found',
        message: 'API key not found or you do not have permission to access it'
      })
    }

    // 更新密钥名称
    await apiKeyService.updateApiKey(keyId, { name: name.trim() })

    logger.info(`✏️ User ${req.user.username} updated API key name: ${existingKey.name} -> ${name.trim()}`)

    res.json({
      success: true,
      message: 'API key name updated successfully'
    })
  } catch (error) {
    logger.error('❌ Update user API key error:', error)
    res.status(500).json({
      error: 'API Key update error',
      message: 'Failed to update API key'
    })
  }
})

// 🗑️ 删除API Key
router.delete('/apikeys/:keyId', authenticateUserDb, async (req, res) => {
  try {
    const { keyId } = req.params

    // 检查是否允许用户删除自己的API Keys
    if (!config.userManagement.allowUserDeleteApiKeys) {
      return res.status(403).json({
        error: 'Operation not allowed',
        message:
          'Users are not allowed to delete their own API keys. Please contact an administrator.'
      })
    }

    // 检查API Key是否属于当前用户
    const existingKey = await apiKeyService.getApiKeyById(keyId)
    if (!existingKey || existingKey.userId !== req.user.id) {
      return res.status(404).json({
        error: 'API key not found',
        message: 'API key not found or you do not have permission to access it'
      })
    }

    await apiKeyService.deleteApiKey(keyId, req.user.username, 'user')

    logger.info(`🗑️ User ${req.user.username} deleted API key: ${existingKey.name}`)

    res.json({
      success: true,
      message: 'API key deleted successfully'
    })
  } catch (error) {
    logger.error('❌ Delete user API key error:', error)
    res.status(500).json({
      error: 'API Key deletion error',
      message: 'Failed to delete API key'
    })
  }
})

// 📊 获取用户使用统计
router.get('/usage-stats', authenticateUserDb, async (req, res) => {
  try {
    const { period = 'week', model } = req.query

    // 获取用户的API Keys (including deleted ones for complete usage stats)
    const userApiKeys = await apiKeyService.getUserApiKeys(req.user.id, true)
    const apiKeyIds = userApiKeys.map((key) => key.id)

    if (apiKeyIds.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalRequests: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalCost: 0,
          dailyStats: [],
          modelStats: []
        }
      })
    }

    // 获取使用统计
    const stats = await apiKeyService.getAggregatedUsageStats(apiKeyIds, { period, model })

    res.json({
      success: true,
      stats
    })
  } catch (error) {
    logger.error('❌ Get user usage stats error:', error)
    res.status(500).json({
      error: 'Usage stats error',
      message: 'Failed to retrieve usage statistics'
    })
  }
})

// === 管理员用户管理端点 ===

// 📋 获取用户列表（管理员）
router.get('/', authenticateUserOrAdmin, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, isActive, search } = req.query

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      role,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
    }

    const result = await userService.getAllUsers(options)

    // 如果有搜索条件，进行过滤
    let filteredUsers = result.users
    if (search) {
      const searchLower = search.toLowerCase()
      filteredUsers = result.users.filter(
        (user) =>
          user.username.toLowerCase().includes(searchLower) ||
          user.displayName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      )
    }

    res.json({
      success: true,
      users: filteredUsers,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    })
  } catch (error) {
    logger.error('❌ Get users list error:', error)
    res.status(500).json({
      error: 'Users list error',
      message: 'Failed to retrieve users list'
    })
  }
})

// 👤 获取特定用户信息（管理员）
router.get('/:userId', authenticateUserOrAdmin, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params

    const user = await userService.getUserById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      })
    }

    // 获取用户的API Keys（包括已删除的以保留统计数据）
    const apiKeys = await apiKeyService.getUserApiKeys(userId, true)

    res.json({
      success: true,
      user: {
        ...user,
        apiKeys: apiKeys.map((key) => {
          // Flatten usage structure for frontend compatibility
          let flatUsage = {
            requests: 0,
            inputTokens: 0,
            outputTokens: 0,
            totalCost: 0
          }

          if (key.usage && key.usage.total) {
            flatUsage = {
              requests: key.usage.total.requests || 0,
              inputTokens: key.usage.total.inputTokens || 0,
              outputTokens: key.usage.total.outputTokens || 0,
              totalCost: key.totalCost || 0
            }
          }

          return {
            id: key.id,
            name: key.name,
            description: key.description,
            isActive: key.isActive,
            createdAt: key.createdAt,
            lastUsedAt: key.lastUsedAt,
            usage: flatUsage,
            keyPreview: key.key
              ? `${key.key.substring(0, 8)}...${key.key.substring(key.key.length - 4)}`
              : null
          }
        })
      }
    })
  } catch (error) {
    logger.error('❌ Get user details error:', error)
    res.status(500).json({
      error: 'User details error',
      message: 'Failed to retrieve user details'
    })
  }
})

// 🔄 更新用户状态（管理员）
router.patch('/:userId/status', authenticateUserOrAdmin, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const { isActive } = req.body

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'isActive must be a boolean value'
      })
    }

    const updatedUser = await userService.updateUserStatus(userId, isActive)

    const adminUser = req.admin?.username || req.user?.username
    logger.info(
      `🔄 Admin ${adminUser} ${isActive ? 'enabled' : 'disabled'} user: ${updatedUser.username}`
    )

    res.json({
      success: true,
      message: `User ${isActive ? 'enabled' : 'disabled'} successfully`,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        isActive: updatedUser.isActive,
        updatedAt: updatedUser.updatedAt
      }
    })
  } catch (error) {
    logger.error('❌ Update user status error:', error)
    res.status(500).json({
      error: 'Update status error',
      message: error.message || 'Failed to update user status'
    })
  }
})

// 🔄 更新用户角色（管理员）
router.patch('/:userId/role', authenticateUserOrAdmin, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const { role } = req.body

    const validRoles = ['user', 'admin']
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: `Role must be one of: ${validRoles.join(', ')}`
      })
    }

    const updatedUser = await userService.updateUserRole(userId, role)

    const adminUser = req.admin?.username || req.user?.username
    logger.info(`🔄 Admin ${adminUser} changed user ${updatedUser.username} role to: ${role}`)

    res.json({
      success: true,
      message: `User role updated to ${role} successfully`,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt
      }
    })
  } catch (error) {
    logger.error('❌ Update user role error:', error)
    res.status(500).json({
      error: 'Update role error',
      message: error.message || 'Failed to update user role'
    })
  }
})

// 🔑 禁用用户的所有API Keys（管理员）
router.post('/:userId/disable-keys', authenticateUserOrAdmin, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params

    const user = await userService.getUserById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      })
    }

    const result = await apiKeyService.disableUserApiKeys(userId)

    const adminUser = req.admin?.username || req.user?.username
    logger.info(`🔑 Admin ${adminUser} disabled all API keys for user: ${user.username}`)

    res.json({
      success: true,
      message: `Disabled ${result.count} API keys for user ${user.username}`,
      disabledCount: result.count
    })
  } catch (error) {
    logger.error('❌ Disable user API keys error:', error)
    res.status(500).json({
      error: 'Disable keys error',
      message: 'Failed to disable user API keys'
    })
  }
})

// 📊 获取用户使用统计（管理员）
router.get('/:userId/usage-stats', authenticateUserOrAdmin, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const { period = 'week', model } = req.query

    const user = await userService.getUserById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      })
    }

    // 获取用户的API Keys（包括已删除的以保留统计数据）
    const userApiKeys = await apiKeyService.getUserApiKeys(userId, true)
    const apiKeyIds = userApiKeys.map((key) => key.id)

    if (apiKeyIds.length === 0) {
      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName
        },
        stats: {
          totalRequests: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalCost: 0,
          dailyStats: [],
          modelStats: []
        }
      })
    }

    // 获取使用统计
    const stats = await apiKeyService.getAggregatedUsageStats(apiKeyIds, { period, model })

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName
      },
      stats
    })
  } catch (error) {
    logger.error('❌ Get user usage stats (admin) error:', error)
    res.status(500).json({
      error: 'Usage stats error',
      message: 'Failed to retrieve user usage statistics'
    })
  }
})

// 📊 获取用户管理统计（管理员）
router.get('/stats/overview', authenticateUserOrAdmin, requireAdmin, async (req, res) => {
  try {
    const stats = await userService.getUserStats()

    res.json({
      success: true,
      stats
    })
  } catch (error) {
    logger.error('❌ Get user stats overview error:', error)
    res.status(500).json({
      error: 'Stats error',
      message: 'Failed to retrieve user statistics'
    })
  }
})

// 🔧 测试LDAP连接（管理员）
router.get('/admin/ldap-test', authenticateUserOrAdmin, requireAdmin, async (req, res) => {
  try {
    const testResult = await ldapService.testConnection()

    res.json({
      success: true,
      ldapTest: testResult,
      config: ldapService.getConfigInfo()
    })
  } catch (error) {
    logger.error('❌ LDAP test error:', error)
    res.status(500).json({
      error: 'LDAP test error',
      message: 'Failed to test LDAP connection'
    })
  }
})

// 🔄 更新用户信息
router.put('/profile', authenticateUserDb, async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        error: 'Invalid input',
        message: '邮箱地址不能为空'
      })
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid input',
        message: '邮箱格式不正确'
      })
    }

    // 检查邮箱是否已被其他用户使用
    const existingUser = await userServiceDb.findUserByEmail(email)
    if (existingUser && existingUser._id.toString() !== req.user.id) {
      return res.status(400).json({
        error: 'Email already exists',
        message: '该邮箱已被使用'
      })
    }

    // 更新用户信息
    const result = await userServiceDb.updateUser(req.user.id, { email })

    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        message: result.message
      })
    }

    logger.info(`✏️ User ${req.user.username} updated profile`)

    res.json({
      success: true,
      message: '个人信息已更新',
      user: result.user
    })
  } catch (error) {
    logger.error('❌ Update profile error:', error)
    res.status(500).json({
      error: 'Update error',
      message: '更新个人信息失败'
    })
  }
})

// 🔒 修改密码
router.post('/change-password', authenticateUserDb, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Invalid input',
        message: '当前密码和新密码不能为空'
      })
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Invalid input',
        message: '新密码长度至少6位'
      })
    }

    // 验证当前密码
    const user = await userServiceDb.findUserById(req.user.id)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: '用户不存在'
      })
    }

    const bcrypt = require('bcryptjs')
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isPasswordValid) {
      return res.status(400).json({
        error: 'Invalid password',
        message: '当前密码不正确'
      })
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    const result = await userServiceDb.updateUser(req.user.id, {
      password: hashedPassword
    })

    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        message: result.message
      })
    }

    logger.info(`🔒 User ${req.user.username} changed password`)

    res.json({
      success: true,
      message: '密码已更改'
    })
  } catch (error) {
    logger.error('❌ Change password error:', error)
    res.status(500).json({
      error: 'Change password error',
      message: '修改密码失败'
    })
  }
})

// 🔑 请求密码重置
router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        error: 'Invalid input',
        message: '邮箱不能为空'
      })
    }

    // 简单的邮箱格式验证
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: 'Invalid input',
        message: '邮箱格式不正确'
      })
    }

    const result = await userServiceDb.requestPasswordReset(email)

    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        message: result.message
      })
    }

    res.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    logger.error('❌ Request password reset error:', error)
    res.status(500).json({
      error: 'Request password reset error',
      message: '请求密码重置失败'
    })
  }
})

// 🔑 重置密码
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Invalid input',
        message: '令牌和新密码不能为空'
      })
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Invalid input',
        message: '新密码长度至少6位'
      })
    }

    const result = await userServiceDb.resetPassword(token, newPassword)

    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        message: result.message
      })
    }

    res.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    logger.error('❌ Reset password error:', error)
    res.status(500).json({
      error: 'Reset password error',
      message: '重置密码失败'
    })
  }
})

module.exports = router
