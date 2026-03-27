// 全局错误处理中间件
// 捕获所有未处理的错误，返回统一格式的错误响应

/**
 * Express全局错误处理器
 * 必须有4个参数才能被Express识别为错误处理中间件
 * @param {Error} err - 错误对象
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
function errorHandler(err, req, res, next) {
  // 带时间戳的错误日志
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] 服务器错误:`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });

  // 根据错误类型确定HTTP状态码
  let statusCode = err.status || err.statusCode || 500;
  let errorMessage = err.message || '服务器内部错误';

  // 处理常见错误类型
  if (err.name === 'ValidationError') {
    // 数据验证错误
    statusCode = 400;
    errorMessage = `请求数据格式错误: ${err.message}`;
  } else if (err.name === 'UnauthorizedError' || err.message.includes('API密钥')) {
    // API认证错误
    statusCode = 401;
    errorMessage = 'API认证失败，请检查密钥配置';
  } else if (err.message.includes('限流') || err.message.includes('429')) {
    // 限流错误
    statusCode = 429;
    errorMessage = '请求过于频繁，请稍后再试';
  } else if (err.message.includes('不支持的LLM提供商')) {
    // 配置错误
    statusCode = 500;
    errorMessage = `LLM配置错误: ${err.message}`;
  }

  // 返回统一的错误响应格式
  res.status(statusCode).json({
    error: errorMessage,
    code: statusCode,
    timestamp
  });
}

module.exports = errorHandler;
