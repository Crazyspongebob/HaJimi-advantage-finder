// LLM统一服务层 - 根据环境变量路由到不同的模型提供商
// 支持: Kimi-K2.5, GLM-5, GLM-4.7, GLM-4.7-Flash, MiniMax-M2.5, MiniMax-M2.7

// 动态导入node-fetch（ESM模块兼容处理）
let fetchFn;
async function getFetch() {
  if (!fetchFn) {
    const module = await import('node-fetch');
    fetchFn = module.default;
  }
  return fetchFn;
}

// 各提供商的模型配置映射表
const MODEL_MAP = {
  // Kimi (月之暗面) - 兼容OpenAI格式
  'kimi': {
    baseURL: process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1',
    apiKey: process.env.KIMI_API_KEY,
    model: 'moonshot-v1-8k',
    type: 'openai'
  },
  // GLM-5 (智谱AI) - 兼容OpenAI格式
  'glm-5': {
    baseURL: process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: process.env.GLM_API_KEY,
    model: 'glm-4-plus',
    type: 'openai'
  },
  // GLM-4.7 (智谱AI) - 兼容OpenAI格式
  'glm-4.7': {
    baseURL: process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: process.env.GLM_API_KEY,
    model: 'glm-4',
    type: 'openai'
  },
  // GLM-4.7-Flash (智谱AI) - 兼容OpenAI格式，速度快，成本低
  'glm-4.7-flash': {
    baseURL: process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: process.env.GLM_API_KEY,
    model: 'glm-4-flash',
    type: 'openai'
  },
  // MiniMax-M2.5 - 使用MiniMax原生API格式
  'minimax-m2.5': {
    baseURL: process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat/v1',
    apiKey: process.env.MINIMAX_API_KEY,
    model: 'abab5.5-chat',
    type: 'minimax'
  },
  // MiniMax-M2.7 - 使用MiniMax原生API格式
  'minimax-m2.7': {
    baseURL: process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat/v1',
    apiKey: process.env.MINIMAX_API_KEY,
    model: 'abab6.5s-chat',
    type: 'minimax'
  }
};

/**
 * 调用兼容OpenAI格式的API (适用于GLM和Kimi)
 * @param {object} config - 模型配置
 * @param {Array} messages - 消息数组
 * @returns {Promise<string>} - AI回复文本
 */
async function callOpenAICompatible(config, messages) {
  const fetch = await getFetch();

  const endpoint = `${config.baseURL}/chat/completions`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages,
      stream: false
    })
  });

  // 处理HTTP错误
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API请求失败 [${response.status}]: ${errorText}`);
  }

  const data = await response.json();

  // 提取回复内容
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error(`LLM API返回格式异常: ${JSON.stringify(data)}`);
  }

  return data.choices[0].message.content;
}

/**
 * 调用MiniMax原生API格式
 * MiniMax使用不同的端点和请求格式
 * @param {object} config - 模型配置
 * @param {Array} messages - 消息数组
 * @returns {Promise<string>} - AI回复文本
 */
async function callMiniMax(config, messages) {
  const fetch = await getFetch();

  // MiniMax使用chatcompletion_v2端点
  const endpoint = `${config.baseURL}/text/chatcompletion_v2`;

  // 分离system消息和对话消息
  const systemMessages = messages.filter(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const requestBody = {
    model: config.model,
    messages: conversationMessages,
    stream: false
  };

  // 如果有system提示，加入bot_setting
  if (systemMessages.length > 0) {
    requestBody.bot_setting = [{
      bot_name: '哈基米',
      content: systemMessages[0].content
    }];
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  // 处理HTTP错误
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MiniMax API请求失败 [${response.status}]: ${errorText}`);
  }

  const data = await response.json();

  // MiniMax返回格式处理
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  }

  // 兼容旧版MiniMax返回格式
  if (data.reply) {
    return data.reply;
  }

  throw new Error(`MiniMax API返回格式异常: ${JSON.stringify(data)}`);
}

/**
 * 统一LLM调用接口
 * 根据LLM_PROVIDER环境变量自动选择提供商
 * @param {Array} messages - 对话消息数组 [{role, content}]
 * @param {string} systemPrompt - 系统提示词（可选）
 * @returns {Promise<{content: string}>} - 包含AI回复内容的对象
 */
async function chat(messages, systemPrompt) {
  // 读取当前配置的提供商
  const provider = (process.env.LLM_PROVIDER || 'glm-4.7-flash').toLowerCase();
  const config = MODEL_MAP[provider];

  if (!config) {
    throw new Error(`不支持的LLM提供商: ${provider}。可选值: ${Object.keys(MODEL_MAP).join(', ')}`);
  }

  if (!config.apiKey) {
    throw new Error(`未配置${provider}的API密钥，请检查.env文件`);
  }

  // 构建完整消息列表（包含system提示）
  let fullMessages = [];

  if (systemPrompt) {
    fullMessages.push({ role: 'system', content: systemPrompt });
  }

  // 合并传入的消息历史
  fullMessages = fullMessages.concat(messages);

  let content;

  // 根据提供商类型调用不同的API
  if (config.type === 'minimax') {
    content = await callMiniMax(config, fullMessages);
  } else {
    // GLM 和 Kimi 均使用OpenAI兼容格式
    content = await callOpenAICompatible(config, fullMessages);
  }

  return { content };
}

/**
 * 获取当前激活的模型信息
 * @returns {object} - 当前模型配置信息
 */
function getCurrentModelInfo() {
  const provider = (process.env.LLM_PROVIDER || 'glm-4.7-flash').toLowerCase();
  const config = MODEL_MAP[provider];

  if (!config) {
    return { provider, model: '未知', status: '不支持' };
  }

  return {
    provider,
    model: config.model,
    type: config.type,
    status: config.apiKey ? '已配置' : '未配置API密钥'
  };
}

module.exports = { chat, getCurrentModelInfo, MODEL_MAP };
