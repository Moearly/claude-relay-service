const userService = require('../services/userService')
const logger = require('../utils/logger')

/**
 * 数据库认证中间件
 */
async function authenticateUserDb(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '未提供认证令牌'
      })
    }

    const token = authHeader.substring(7)
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
