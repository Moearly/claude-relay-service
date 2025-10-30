const userService = require('../services/userService')
const logger = require('../utils/logger')

/**
 * 数据库认证中间件
 */
async function authenticateUserDb(req, res, next) {
  try {
    // 从多个来源获取 token
    let token = null
    
    // 1. 从 Authorization header 获取
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    
    // 2. 从 cookie 获取
    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token
    }

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '未提供认证令牌'
      })
    }
    const decoded = userService.verifyToken(token)

    if (!decoded) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '无效的令牌'
      })
    }

    const user = await userService.getUserById(decoded.id)

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '用户不存在或已被禁用'
      })
    }

    req.user = {
      id: user._id.toString(), // 转换为字符串以匹配Redis中的userId
      _id: user._id, // 保持MongoDB ObjectId格式以兼容现有代码
      username: user.username,
      email: user.email,
      role: user.role
    }

    next()
  } catch (error) {
    logger.error('❌ 认证失败:', error)
    res.status(401).json({
      error: 'Unauthorized',
      message: '认证失败'
    })
  }
}

module.exports = { authenticateUserDb }
