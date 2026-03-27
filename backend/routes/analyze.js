// 分析路由 - POST /api/analyze
// 基于完整对话历史生成用户天赋分析报告

const express = require('express');
const router = express.Router();
const llmService = require('../services/llmService');
const sessionService = require('../services/sessionService');

// 尝试加载提示词文件，失败时使用内联备用提示词
let ANALYZE_SYSTEM_PROMPT;
try {
  const prompts = require('../prompts');
  ANALYZE_SYSTEM_PROMPT = prompts.ANALYZE_SYSTEM_PROMPT;
} catch (err) {
  console.warn('[Analyze] 未找到prompts.js，使用内联备用提示词');
  ANALYZE_SYSTEM_PROMPT = `你是天赋分析专家。根据对话历史分析用户天赋。
只返回JSON格式：
{"topTalents":[{"rank":1,"name":"天赋名","domain":"execution|influence|relationship|strategic","description":"描述","evidence":"证据","score":80}],"domainScores":{"execution":0,"influence":0,"relationship":0,"strategic":0}}`;
}

/**
 * 从LLM响应中提取JSON数据
 * 处理LLM可能返回markdown代码块包裹的JSON情况
 * @param {string} content - LLM的原始响应文本
 * @returns {object} - 解析后的JSON对象
 */
function extractJSON(content) {
  // 清理可能的markdown代码块包裹
  let cleaned = content.trim();

  // 移除 ```json ... ``` 包裹
  const jsonBlockRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/;
  const blockMatch = cleaned.match(jsonBlockRegex);
  if (blockMatch) {
    cleaned = blockMatch[1].trim();
  }

  // 尝试直接解析
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // 尝试提取第一个完整的JSON对象
    const jsonRegex = /\{[\s\S]*\}/;
    const jsonMatch = cleaned.match(jsonRegex);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error(`无法解析LLM返回的JSON: ${content.substring(0, 200)}`);
  }
}

/**
 * 验证并修复分析结果的数据结构
 * @param {object} raw - 原始解析的JSON对象
 * @returns {object} - 规范化后的分析结果
 */
function normalizeAnalysisResult(raw) {
  // 确保topTalents存在且为数组
  const topTalents = Array.isArray(raw.topTalents) ? raw.topTalents : [];

  // 规范化每个天赋条目
  const normalizedTalents = topTalents.map((talent, index) => ({
    rank: talent.rank || index + 1,
    name: talent.name || `天赋${index + 1}`,
    domain: ['execution', 'influence', 'relationship', 'strategic'].includes(talent.domain)
      ? talent.domain
      : 'execution',
    description: talent.description || '',
    evidence: talent.evidence || '',
    score: Math.min(100, Math.max(0, parseInt(talent.score) || 70))
  }));

  // 确保domainScores存在且数值有效
  const rawScores = raw.domainScores || {};
  const domainScores = {
    execution: Math.min(100, Math.max(0, parseInt(rawScores.execution) || 0)),
    influence: Math.min(100, Math.max(0, parseInt(rawScores.influence) || 0)),
    relationship: Math.min(100, Math.max(0, parseInt(rawScores.relationship) || 0)),
    strategic: Math.min(100, Math.max(0, parseInt(rawScores.strategic) || 0))
  };

  return { topTalents: normalizedTalents, domainScores };
}

/**
 * POST /api/analyze
 * 分析用户天赋，返回结构化的天赋报告
 */
router.post('/', async (req, res, next) => {
  try {
    const { sessionId, history = [] } = req.body;

    // 验证必要参数
    if (!sessionId) {
      return res.status(400).json({ error: '缺少sessionId参数' });
    }

    // 加载会话数据
    const session = sessionService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: `会话 ${sessionId} 不存在` });
    }

    // 确定使用的对话历史
    const conversationHistory = history.length > 0
      ? history
      : session.messages;

    if (conversationHistory.length === 0) {
      return res.status(400).json({ error: '对话历史为空，无法进行分析' });
    }

    // 构建分析请求的消息内容
    // 将对话历史格式化为文本供分析
    const historyText = conversationHistory
      .map(msg => {
        const role = msg.role === 'user' ? '用户' : '哈基米';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');

    const analysisPrompt = `请分析以下对话历史，深入挖掘用户展现出的天赋和优势：

=== 对话历史 ===
${historyText}
=== 对话结束 ===

请根据以上对话，返回天赋分析结果JSON。`;

    // 构建发送给LLM的消息
    const messages = [{ role: 'user', content: analysisPrompt }];

    console.log(`[Analyze] 开始分析会话 ${sessionId}，对话消息数: ${conversationHistory.length}`);

    // 调用LLM进行分析
    const llmResponse = await llmService.chat(messages, ANALYZE_SYSTEM_PROMPT);

    // 解析JSON响应
    let analysisResult;
    try {
      const rawResult = extractJSON(llmResponse.content);
      analysisResult = normalizeAnalysisResult(rawResult);
    } catch (parseErr) {
      console.error('[Analyze] JSON解析失败:', parseErr.message);
      console.error('[Analyze] 原始响应:', llmResponse.content.substring(0, 500));
      return res.status(500).json({
        error: 'AI返回的分析结果格式异常，请重试',
        detail: parseErr.message
      });
    }

    // 将分析结果保存到会话
    sessionService.updateSession(sessionId, {
      results: analysisResult
    });

    console.log(`[Analyze] 分析完成，发现 ${analysisResult.topTalents.length} 个天赋`);

    res.json(analysisResult);

  } catch (err) {
    console.error('[Analyze] 处理分析请求出错:', err.message);
    next(err);
  }
});

module.exports = router;
