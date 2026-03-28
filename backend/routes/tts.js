// TTS路由 - POST /api/tts
// 将文字转成音频，调用 AIping-voice 接口并返回 MP3 音频流

const express = require('express');
const router = express.Router();
const ttsService = require('../services/ttsService');

/**
 * POST /api/tts
 * Body: { text: string }
 * Response: audio/mpeg 二进制流
 */
router.post('/', async (req, res, next) => {
  try {
    const { text, voiceId } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: '请提供要合成的文字' });
    }

    // 截断过长文本（AIping 单次建议不超过500字）
    const truncatedText = text.length > 500 ? text.slice(0, 500) + '...' : text;

    // 文本太短时填充以避免音频过短
    const finalText = truncatedText.length < 10
      ? truncatedText + ' 哈基米喜欢你喵~'
      : truncatedText;

    const audioBuffer = await ttsService.synthesize(finalText, voiceId || null);

    // 返回 MP3 音频
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache',
    });
    res.send(audioBuffer);

  } catch (err) {
    console.error('[TTS] 合成失败:', err.message);
    // TTS失败不应阻断主流程，返回友好错误
    res.status(500).json({
      error: '语音合成暂时不可用',
      message: '哈基米的嗓子有点沙哑，文字版也很棒的喵~',
    });
  }
});

module.exports = router;
