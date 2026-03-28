// TTS语音合成服务 - 使用AIping语音API
// API文档: https://aiping.cn/api/v1/audio/speech
// 注意: 响应音频为HEX编码，不是base64

// 动态导入node-fetch（ESM模块兼容处理）
let fetchFn;
async function getFetch() {
  if (!fetchFn) {
    const module = await import('node-fetch');
    fetchFn = module.default;
  }
  return fetchFn;
}

/**
 * 将文本合成为语音
 * @param {string} text - 要合成的文本内容
 * @returns {Promise<Buffer>} - MP3音频数据的Buffer
 * @throws {Error} - API调用失败或配置错误时抛出异常
 */
async function synthesize(text, voiceIdOverride = null) {
  const fetch = await getFetch();

  // 检查必要的环境变量
  const apiKey = process.env.AIPING_API_KEY;
  const ttsUrl = process.env.AIPING_TTS_URL || 'https://aiping.cn/api/v1/audio/speech';
  const voiceId = voiceIdOverride || process.env.AIPING_VOICE_ID || 'qiaopi_mengmei';
  const ttsModel = process.env.AIPING_TTS_MODEL || 'MiniMax-Speech-2.8-hd';

  if (!apiKey) {
    throw new Error('未配置AIping API密钥（AIPING_API_KEY），请检查.env文件');
  }

  // 构建请求体
  const requestBody = {
    model: ttsModel,
    text: text,
    stream: false,
    voice_setting: {
      voice_id: voiceId,
      speed: 1.0,
      vol: 1.0,
      pitch: 0
    }
  };

  console.log(`[TTS] 开始合成语音，文本长度: ${text.length}字，模型: ${ttsModel}，声音: ${voiceId}`);

  const response = await fetch(ttsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  // 处理429限流错误
  if (response.status === 429) {
    throw new Error('TTS服务请求过于频繁，请稍后再试（限流中）');
  }

  // 处理其他HTTP错误
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AIping TTS API请求失败 [${response.status}]: ${errorText}`);
  }

  const data = await response.json();

  // 检查响应数据结构
  if (!data || !data.data || !data.data.audio) {
    // 尝试其他可能的响应格式
    if (data && data.audio) {
      // 直接在根层级的audio字段
      const audioBuffer = Buffer.from(data.audio, 'hex');
      console.log(`[TTS] 合成成功，音频大小: ${audioBuffer.length} bytes`);
      return audioBuffer;
    }
    throw new Error(`AIping TTS API返回格式异常，缺少audio字段: ${JSON.stringify(data)}`);
  }

  // 关键: AIping返回的音频是HEX编码字符串，不是base64！
  // 必须使用 Buffer.from(hexString, 'hex') 解码
  const hexString = data.data.audio;

  if (typeof hexString !== 'string' || hexString.length === 0) {
    throw new Error('AIping TTS API返回的audio字段为空或格式错误');
  }

  // 将HEX字符串转换为二进制Buffer
  const audioBuffer = Buffer.from(hexString, 'hex');

  console.log(`[TTS] 合成成功，音频大小: ${audioBuffer.length} bytes`);

  return audioBuffer;
}

module.exports = { synthesize };
