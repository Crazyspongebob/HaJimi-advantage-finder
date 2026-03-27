// 会话路由 - GET /api/session/:sessionId
// 提供会话状态查询接口，供前端刷新或恢复会话使用

const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');

/**
 * GET /api/session/:sessionId
 * 获取指定会话的完整状态
 * 前端可用此接口在页面刷新后恢复会话
 */
router.get('/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  // 验证sessionId格式（UUID格式）
  if (!sessionId || sessionId.trim() === '') {
    return res.status(400).json({ error: '无效的sessionId' });
  }

  // 查询会话
  const session = sessionService.getSession(sessionId);

  if (!session) {
    return res.status(404).json({
      error: `会话 ${sessionId} 不存在或已过期`,
      code: 404
    });
  }

  // 返回完整会话状态（前端可用于恢复界面状态）
  res.json({
    sessionId: session.sessionId,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    messages: session.messages,
    progress: session.progress,
    isComplete: session.isComplete,
    results: session.results,
    jobs: session.jobs
  });
});

/**
 * GET /api/session
 * 获取服务器上的会话统计信息（运维监控用）
 */
router.get('/', (req, res) => {
  const count = sessionService.getSessionCount();
  res.json({
    totalSessions: count,
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
