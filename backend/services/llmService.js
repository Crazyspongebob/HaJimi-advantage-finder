// LLM统一服务层 - 根据环境变量路由到不同的模型提供商
// 支持: Kimi-K2.5 (AIping), GLM-4.7, GLM-4.7-Flash, MiniMax 等

let fetchFn;
async function getFetch() {
  if (!fetchFn) {
    const module = await import('node-fetch');
    fetchFn = module.default;
  }
  return fetchFn;
}

const MODEL_MAP = {
  // ── Kimi-K2.5 via AIping（聊天首选）───────────────────────
  'kimi-k2-5': {
    baseURL: process.env.KIMI_K2_BASE_URL || 'https://api.aipng.cn/v1',
    apiKey: process.env.KIMI_K2_API_KEY || process.env.KIMI_API_KEY,
    model: process.env.KIMI_K2_MODEL || 'kimi-k2.5',
    type: 'openai',
  },
  // ── Kimi (月之暗面原生) ────────────────────────────────────
  'kimi': {
    baseURL: process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1',
    apiKey: process.env.KIMI_API_KEY,
    model: 'moonshot-v1-8k',
    type: 'openai',
  },
  // ── GLM-4.7 (智谱AI，报告生成首选) ───────────────────────
  'glm-4.7': {
    baseURL: process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: process.env.GLM_API_KEY,
    model: 'glm-4',
    type: 'openai',
  },
  // ── GLM-4.7-Flash（快速廉价 fallback） ─────────────────────
  'glm-4.7-flash': {
    baseURL: process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: process.env.GLM_API_KEY,
    model: 'glm-4-flash',
    type: 'openai',
  },
  // ── GLM-5 ─────────────────────────────────────────────────
  'glm-5': {
    baseURL: process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: process.env.GLM_API_KEY,
    model: 'glm-4-plus',
    type: 'openai',
  },
  // ── MiniMax ───────────────────────────────────────────────
  'minimax-m2.5': {
    baseURL: process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat/v1',
    apiKey: process.env.MINIMAX_API_KEY,
    model: 'abab5.5-chat',
    type: 'minimax',
  },
  'minimax-m2.7': {
    baseURL: process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat/v1',
    apiKey: process.env.MINIMAX_API_KEY,
    model: 'abab6.5s-chat',
    type: 'minimax',
  },
};

async function callOpenAICompatible(config, messages) {
  const fetch = await getFetch();
  const endpoint = `${config.baseURL}/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({ model: config.model, messages, stream: false }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API请求失败 [${response.status}]: ${errorText}`);
  }
  const data = await response.json();
  if (!data.choices?.[0]?.message) {
    throw new Error(`LLM API返回格式异常: ${JSON.stringify(data)}`);
  }
  return data.choices[0].message.content;
}

async function callMiniMax(config, messages) {
  const fetch = await getFetch();
  const endpoint = `${config.baseURL}/text/chatcompletion_v2`;
  const systemMessages = messages.filter(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');
  const requestBody = { model: config.model, messages: conversationMessages, stream: false };
  if (systemMessages.length > 0) {
    requestBody.bot_setting = [{ bot_name: '哈基米', content: systemMessages[0].content }];
  }
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
    body: JSON.stringify(requestBody),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MiniMax API请求失败 [${response.status}]: ${errorText}`);
  }
  const data = await response.json();
  if (data.choices?.[0]?.message) return data.choices[0].message.content;
  if (data.reply) return data.reply;
  throw new Error(`MiniMax API返回格式异常: ${JSON.stringify(data)}`);
}

/**
 * 统一LLM调用接口
 * @param {Array}  messages     - 对话消息数组 [{role, content}]
 * @param {string} systemPrompt - 系统提示词（可选）
 * @param {object} options      - { model: 'kimi-k2-5' | ... } 覆盖默认提供商
 */
async function chat(messages, systemPrompt, options = {}) {
  const modelKey = (options.model || process.env.LLM_PROVIDER || 'glm-4.7-flash').toLowerCase();
  const config = MODEL_MAP[modelKey];

  if (!config) {
    throw new Error(`不支持的LLM提供商: ${modelKey}。可选: ${Object.keys(MODEL_MAP).join(', ')}`);
  }
  if (!config.apiKey) {
    throw new Error(`未配置${modelKey}的API密钥，请检查.env`);
  }

  let fullMessages = [];
  if (systemPrompt) fullMessages.push({ role: 'system', content: systemPrompt });
  fullMessages = fullMessages.concat(messages);

  let content;
  if (config.type === 'minimax') {
    content = await callMiniMax(config, fullMessages);
  } else {
    content = await callOpenAICompatible(config, fullMessages);
  }
  return { content };
}

/**
 * 带自动 fallback 的 chat 调用
 * 首选 primaryModel，失败时尝试 fallbackModel
 */
async function chatWithFallback(messages, systemPrompt, primaryModel, fallbackModel) {
  try {
    console.log(`[LLM] 使用主模型: ${primaryModel}`);
    return await chat(messages, systemPrompt, { model: primaryModel });
  } catch (err) {
    console.warn(`[LLM] 主模型 ${primaryModel} 失败 (${err.message})，切换到 ${fallbackModel}`);
    return await chat(messages, systemPrompt, { model: fallbackModel });
  }
}

function getCurrentModelInfo() {
  const provider = (process.env.LLM_PROVIDER || 'glm-4.7-flash').toLowerCase();
  const config = MODEL_MAP[provider];
  if (!config) return { provider, model: '未知', status: '不支持' };
  return { provider, model: config.model, type: config.type, status: config.apiKey ? '已配置' : '未配置API密钥' };
}

module.exports = { chat, chatWithFallback, getCurrentModelInfo, MODEL_MAP };
