// 语音配置路由 - /api/voice
// 提供 TTS 自动播放配置及未来流式 TTS 端点

const express = require('express');
const router = express.Router();

/**
 * GET /api/voice/config
 * 返回前端 TTS 自动播放配置
 */
router.get('/config', (_req, res) => {
  res.json({
    autoplay: true,
    maxTtsLength: 250,
    voice: 'qiaopi_mengmei',
    speed: 1.0,
  });
});

/**
 * POST /api/voice/autoplay-check
 * 前端询问：是否应该自动播放 TTS？
 */
router.post('/autoplay-check', (_req, res) => {
  res.json({ shouldAutoplay: true, maxLength: 200 });
});

/**
 * POST /api/voice/tts-stream
 * 未来流式 TTS 端点 — 当前转发至 /api/tts 逻辑（占位）
 */
router.post('/tts-stream', (_req, res) => {
  res.status(501).json({ error: '流式 TTS 暂未实现，请使用 /api/tts' });
});

module.exports = router;
