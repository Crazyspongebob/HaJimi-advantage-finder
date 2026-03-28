// LLM统一服务层
// 两套API：
//   AIping (代理): Kimi-K2.5, GLM-5, MiniMax-M2.5  → AIPING_API_KEY + https://aiping.cn/api/v1
//   ZAI Coding Plan: GLM-4.7, GLM-4.5-Air, GLM-4-Flash → GLM_API_KEY + GLM_BASE_URL

let fetchFn;
async function getFetch() {
  if (!fetchFn) {
    const module = await import('node-fetch');
    fetchFn = module.default;
  }
  return fetchFn;
}

const MODEL_MAP = {
  // ── AIping 代理模型（共用 AIPING_API_KEY + aiping.cn baseURL）────────

  // Kimi-K2.5 — 聊天首选
  'kimi-k2-5': {
    baseURL: process.env.KIMI_K2_BASE_URL || process.env.AIPING_BASE_URL || 'https://aiping.cn/api/v1',
    apiKey:  process.env.AIPING_API_KEY || process.env.KIMI_K2_API_KEY,
    model:   process.env.KIMI_K2_MODEL  || 'kimi-k2.5',
    type:    'openai',
  },

  // GLM-5 via AIping
  'glm-5': {
    baseURL: process.env.AIPING_BASE_URL || 'https://aiping.cn/api/v1',
    apiKey:  process.env.AIPING_API_KEY,
    model:   'glm-4-plus',   // ZAI/AIping model identifier for GLM-5 tier
    type:    'openai',
  },

  // MiniMax-M2.5 via AIping
  'minimax-m2.5': {
    baseURL: process.env.AIPING_BASE_URL || 'https://aiping.cn/api/v1',
    apiKey:  process.env.AIPING_API_KEY,
    model:   'minimax-text-01',  // AIping model identifier for MiniMax-M2.5
    type:    'openai',
  },

  // ── ZAI Coding Plan（GLM_API_KEY + /api/coding/paas/v4）─────────────

  // GLM-4.7 — 报告生成首选
  'glm-4.7': {
    baseURL: process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/coding/paas/v4',
    apiKey:  process.env.GLM_API_KEY,
    model:   'glm-4-plus',   // ZAI coding plan model identifier for GLM-4.7
    type:    'openai',
  },

  // GLM-4.5-Air — 快速分析 fallback
  'glm-4.5-air': {
    baseURL: process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/coding/paas/v4',
    apiKey:  process.env.GLM_API_KEY,
    model:   'glm-4-air',
    type:    'openai',
  },

  // GLM-4-Flash — 最快 fallback（聊天回退）
  'glm-4-flash': {
    baseURL: process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/coding/paas/v4',
    apiKey:  process.env.GLM_API_KEY,
    model:   'glm-4-flash',
    type:    'openai',
  },

  // 通用兜底 — 读取 LLM_BASE_URL / LLM_API_KEY / LLM_MODEL
  'llm-default': {
    baseURL: process.env.LLM_BASE_URL || 'https://aiping.cn/api/v1',
    apiKey:  process.env.LLM_API_KEY  || process.env.AIPING_API_KEY,
    model:   process.env.LLM_MODEL    || 'kimi-k2.5',
    type:    'openai',
  },

  // 向后兼容别名
  'glm-4.7-flash': {
    baseURL: process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/coding/paas/v4',
    apiKey:  process.env.GLM_API_KEY,
    model:   'glm-4-flash',
    type:    'openai',
  },
};

async function callOpenAICompatible(config, messages) {
  const fetch = await getFetch();
  const endpoint = `${config.baseURL}/chat/completions`;
  // AbortController 兼容 Node 14/15+
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 60000) : null;
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({ model: config.model, messages, stream: false }),
      ...(controller ? { signal: controller.signal } : {}),
    });
  } catch (fetchErr) {
    if (fetchErr.name === 'AbortError') throw new Error(`LLM API请求超时 (60s): ${endpoint}`);
    throw new Error(`LLM API网络错误: ${fetchErr.message}`);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
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

/**
 * 统一LLM调用接口
 */
async function chat(messages, systemPrompt, options = {}) {
  const modelKey = (options.model || process.env.LLM_PROVIDER || 'kimi-k2-5').toLowerCase();
  const config = MODEL_MAP[modelKey];

  if (!config) {
    throw new Error(`不支持的LLM模型: ${modelKey}。可选: ${Object.keys(MODEL_MAP).join(', ')}`);
  }
  if (!config.apiKey) {
    throw new Error(`未配置 ${modelKey} 的API密钥，请检查 .env`);
  }

  let fullMessages = [];
  if (systemPrompt) fullMessages.push({ role: 'system', content: systemPrompt });
  fullMessages = fullMessages.concat(messages);

  const content = await callOpenAICompatible(config, fullMessages);
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
    console.warn(`[LLM] 主模型 ${primaryModel} 失败 (${err.message.substring(0, 80)})，切换到 ${fallbackModel}`);
    return await chat(messages, systemPrompt, { model: fallbackModel });
  }
}

function getCurrentModelInfo() {
  const provider = (process.env.LLM_PROVIDER || 'kimi-k2-5').toLowerCase();
  const config = MODEL_MAP[provider];
  if (!config) return { provider, model: '未知', status: '不支持' };
  return { provider, model: config.model, type: config.type, status: config.apiKey ? '已配置' : '未配置API密钥' };
}

module.exports = { chat, chatWithFallback, getCurrentModelInfo, MODEL_MAP };
