/**
 * 增强的请求日志中间件
 * 记录所有 API 请求的详细信息，便于问题排查
 */

const logger = require('./logger');
const fs = require('fs');
const path = require('path');

// 确保日志目录存在
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 创建请求日志流
const requestLogStream = fs.createWriteStream(
  path.join(logsDir, 'requests.log'),
  { flags: 'a' }
);

// 敏感字段列表（不记录到日志）
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'authorization',
  'cookie',
  'x-api-key',
  'sessionKey'
];

/**
 * 过滤敏感信息
 */
function sanitizeData(data) {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = Array.isArray(data) ? [] : {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * 格式化日志消息
 */
function formatLogMessage(data) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    ...data
  }) + '\n';
}

/**
 * 请求日志中间件
 */
function requestLoggerMiddleware(req, res, next) {
  const startTime = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // 将 requestId 附加到请求对象
  req.requestId = requestId;
  
  // 记录请求信息
  const requestLog = {
    type: 'REQUEST',
    requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    headers: sanitizeData(req.headers),
    query: sanitizeData(req.query),
    body: sanitizeData(req.body)
  };
  
  // 写入请求日志
  requestLogStream.write(formatLogMessage(requestLog));
  
  // 记录响应
  const originalSend = res.send;
  const originalJson = res.json;
  
  // 拦截 res.send
  res.send = function(data) {
    res.send = originalSend;
    
    const duration = Date.now() - startTime;
    const responseLog = {
      type: 'RESPONSE',
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length') || 0
    };
    
    // 如果是错误响应，记录响应体
    if (res.statusCode >= 400) {
      try {
        responseLog.body = typeof data === 'string' ? JSON.parse(data) : data;
      } catch (e) {
        responseLog.body = data;
      }
    }
    
    requestLogStream.write(formatLogMessage(responseLog));
    
    // 控制台输出
    const statusColor = res.statusCode >= 500 ? 'error' : 
                       res.statusCode >= 400 ? 'warn' : 'info';
    logger[statusColor](
      `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`
    );
    
    return originalSend.call(this, data);
  };
  
  // 拦截 res.json
  res.json = function(data) {
    res.json = originalJson;
    
    const duration = Date.now() - startTime;
    const responseLog = {
      type: 'RESPONSE',
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    };
    
    // 如果是错误响应，记录响应体
    if (res.statusCode >= 400) {
      responseLog.body = sanitizeData(data);
    }
    
    requestLogStream.write(formatLogMessage(responseLog));
    
    // 控制台输出
    const statusColor = res.statusCode >= 500 ? 'error' : 
                       res.statusCode >= 400 ? 'warn' : 'info';
    logger[statusColor](
      `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`
    );
    
    return originalJson.call(this, data);
  };
  
  next();
}

/**
 * 错误日志中间件
 */
function errorLoggerMiddleware(err, req, res, next) {
  const errorLog = {
    type: 'ERROR',
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code,
      status: err.status || err.statusCode
    },
    user: req.user ? { id: req.user.id, username: req.user.username } : null
  };
  
  requestLogStream.write(formatLogMessage(errorLog));
  logger.error(`Error in ${req.method} ${req.url}: ${err.message}`);
  
  next(err);
}

/**
 * 数据库操作日志
 */
function logDatabaseOperation(operation, collection, query, result) {
  const dbLog = {
    type: 'DATABASE',
    operation,
    collection,
    query: sanitizeData(query),
    success: !!result,
    timestamp: new Date().toISOString()
  };
  
  requestLogStream.write(formatLogMessage(dbLog));
}

module.exports = {
  requestLoggerMiddleware,
  errorLoggerMiddleware,
  logDatabaseOperation,
  sanitizeData
};

