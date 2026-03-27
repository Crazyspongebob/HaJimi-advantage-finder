// 分析路由 - POST /api/analyze
// 生成三层专业才干报告；首选 GLM-4.7，fallback Kimi-K2.5

const express = require('express');
const router = express.Router();
const llmService = require('../services/llmService');
const sessionService = require('../services/sessionService');

let ANALYZE_SYSTEM_PROMPT;
try {
  ANALYZE_SYSTEM_PROMPT = require('../prompts').ANALYZE_SYSTEM_PROMPT;
} catch (err) {
  console.warn('[Analyze] 未找到prompts.js，使用内联备用提示词');
  ANALYZE_SYSTEM_PROMPT = `你是天赋分析专家。根据对话历史分析用户天赋。
只返回JSON格式：{"themes":[{"rank":1,"nameZh":"名称","nameEn":"Name","domain":"executing","tagline":"","description":"","evidence":"","score":80,"toolkit":{"strength":"","blindspot":"","action":"","hakimiQuote":""}}],"domainScores":{"executing":0,"influencing":0,"relationship":0,"strategic":0},"domainNarrative":{"executing":"","influencing":"","relationship":"","strategic":""},"summary":"","hakimiVerdict":""}`;
}

const ANALYZE_PRIMARY_MODEL = process.env.ANALYZE_LLM_MODEL || 'glm-4.7';
const ANALYZE_FALLBACK_MODEL = process.env.ANALYZE_LLM_FALLBACK || 'kimi-k2-5';

/**
 * 多层JSON提取：支持纯JSON、markdown代码块、内嵌JSON
 */
function extractJSON(content) {
  let cleaned = content.trim();

  // 1. 移除 ```json ... ``` 或 ``` ... ```
  const fenceMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  // 2. 尝试直接解析
  try { return JSON.parse(cleaned); } catch (e) { /* fallthrough */ }

  // 3. 提取第一个完整JSON对象
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch (e) { /* fallthrough */ }
  }

  throw new Error(`无法解析LLM返回的JSON: ${content.substring(0, 300)}`);
}

const VALID_DOMAINS = ['executing', 'influencing', 'relationship', 'strategic'];

/**
 * 规范化三层报告结构
 * 同时兼容旧版 topTalents 格式（向后兼容）
 */
function normalizeReport(raw) {
  // 兼容旧格式：topTalents → themes
  const rawThemes = raw.themes || raw.topTalents || [];

  const themes = rawThemes.map((t, i) => ({
    rank: t.rank || i + 1,
    nameZh: t.nameZh || t.name || `才干${i + 1}`,
    nameEn: t.nameEn || t.englishName || '',
    domain: VALID_DOMAINS.includes(t.domain) ? t.domain : 'executing',
    tagline: t.tagline || '',
    description: t.description || '',
    evidence: t.evidence || '',
    score: Math.min(100, Math.max(60, parseInt(t.score) || 75)),
    toolkit: {
      strength: t.toolkit?.strength || '',
      blindspot: t.toolkit?.blindspot || '',
      action: t.toolkit?.action || '',
      hakimiQuote: t.toolkit?.hakimiQuote || '喵~ 你的才干在闪光！🐾',
    },
  }));

  const rawScores = raw.domainScores || {};
  const domainScores = {
    executing: clamp(rawScores.executing ?? rawScores.execution ?? 0),
    influencing: clamp(rawScores.influencing ?? rawScores.influence ?? 0),
    relationship: clamp(rawScores.relationship ?? 0),
    strategic: clamp(rawScores.strategic ?? 0),
  };

  const rawNarr = raw.domainNarrative || {};
  const domainNarrative = {
    executing: rawNarr.executing || rawNarr.execution || '',
    influencing: rawNarr.influencing || rawNarr.influence || '',
    relationship: rawNarr.relationship || '',
    strategic: rawNarr.strategic || '',
  };

  return {
    themes,
    domainScores,
    domainNarrative,
    summary: raw.summary || '',
    hakimiVerdict: raw.hakimiVerdict || raw.summary || '喵~ 你很棒！🐾',
    // backward-compat alias
    topTalents: themes,
  };
}

function clamp(v) { return Math.min(100, Math.max(0, parseInt(v) || 0)); }

// ── POST /api/analyze ────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const { sessionId, history = [] } = req.body;

    if (!sessionId) return res.status(400).json({ error: '缺少sessionId参数' });

    const session = sessionService.getSession(sessionId);
    if (!session) return res.status(404).json({ error: `会话 ${sessionId} 不存在` });

    const conversationHistory = history.length > 0 ? history : session.messages;
    if (conversationHistory.length === 0) {
      return res.status(400).json({ error: '对话历史为空，无法进行分析' });
    }

    const historyText = conversationHistory
      .map(msg => `${msg.role === 'user' ? '用户' : '哈基米'}: ${msg.content}`)
      .join('\n\n');

    const analysisPrompt = `请分析以下对话历史，生成三层专业才干报告：

=== 对话历史 ===
${historyText}
=== 对话结束 ===

请严格按照要求的JSON格式返回分析结果。`;

    const messages = [{ role: 'user', content: analysisPrompt }];
    console.log(`[Analyze] 开始分析会话 ${sessionId}，对话消息数: ${conversationHistory.length}`);

    // GLM-4.7 首选（稳定JSON输出），fallback Kimi-K2.5
    const llmResponse = await llmService.chatWithFallback(
      messages, ANALYZE_SYSTEM_PROMPT,
      ANALYZE_PRIMARY_MODEL, ANALYZE_FALLBACK_MODEL
    );

    let analysisResult;
    try {
      const raw = extractJSON(llmResponse.content);
      analysisResult = normalizeReport(raw);
    } catch (parseErr) {
      console.error('[Analyze] JSON解析失败:', parseErr.message);
      console.error('[Analyze] 原始响应:', llmResponse.content.substring(0, 500));
      return res.status(500).json({ error: 'AI返回的分析结果格式异常，请重试', detail: parseErr.message });
    }

    // 验证核心字段
    if (!analysisResult.themes || analysisResult.themes.length === 0) {
      return res.status(500).json({ error: '分析结果缺少才干数据，请重试' });
    }

    sessionService.updateSession(sessionId, { results: analysisResult });
    console.log(`[Analyze] 分析完成，发现 ${analysisResult.themes.length} 个才干`);

    res.json(analysisResult);

  } catch (err) {
    console.error('[Analyze] 处理分析请求出错:', err.message);
    next(err);
  }
});

module.exports = router;
