// 职业推荐路由 - POST /api/recommend
// 基于天赋分析结果推荐匹配的职业方向

const express = require('express');
const router = express.Router();
const llmService = require('../services/llmService');

// 尝试加载提示词文件，失败时使用内联备用提示词
let RECOMMEND_SYSTEM_PROMPT;
try {
  const prompts = require('../prompts');
  RECOMMEND_SYSTEM_PROMPT = prompts.RECOMMEND_SYSTEM_PROMPT;
} catch (err) {
  console.warn('[Recommend] 未找到prompts.js，使用内联备用提示词');
  RECOMMEND_SYSTEM_PROMPT = `你是职业顾问。根据天赋分析推荐职业方向。
只返回JSON格式：
{"jobs":[{"title":"职位名","companyType":"公司类型","matchedTalents":["天赋1"],"reason":"推荐理由"}]}`;
}

/**
 * 从LLM响应中提取JSON数据
 * @param {string} content - LLM的原始响应文本
 * @returns {object} - 解析后的JSON对象
 */
function extractJSON(content) {
  let cleaned = content.trim();

  // 移除 ```json ... ``` 包裹
  const jsonBlockRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/;
  const blockMatch = cleaned.match(jsonBlockRegex);
  if (blockMatch) {
    cleaned = blockMatch[1].trim();
  }

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
 * 验证并规范化职业推荐结果
 * @param {object} raw - 原始解析的JSON对象
 * @returns {object} - 规范化后的推荐结果
 */
function normalizeRecommendResult(raw) {
  const jobs = Array.isArray(raw.jobs) ? raw.jobs : [];

  const normalizedJobs = jobs.map(job => ({
    title: job.title || '未知职位',
    companyType: job.companyType || '各类企业',
    matchedTalents: Array.isArray(job.matchedTalents) ? job.matchedTalents : [],
    reason: job.reason || ''
  }));

  return { jobs: normalizedJobs };
}

/**
 * POST /api/recommend
 * 根据天赋分析结果推荐职业方向
 */
router.post('/', async (req, res, next) => {
  try {
    const { topTalents = [], selectedDomains = [] } = req.body;

    // 验证输入数据
    if (!topTalents || topTalents.length === 0) {
      return res.status(400).json({ error: '缺少天赋数据（topTalents），请先完成天赋分析' });
    }

    // 构建天赋摘要文本
    const talentSummary = topTalents
      .map(t => `${t.rank}. ${t.name}（${t.domain}维度）：${t.description || ''}`)
      .join('\n');

    // 构建领域偏好文本（如果用户选择了特定领域）
    const domainPreference = selectedDomains.length > 0
      ? `\n用户偏好的发展领域：${selectedDomains.join('、')}`
      : '';

    // 构建推荐请求提示词
    const recommendPrompt = `请根据以下天赋分析结果，推荐最匹配的职业方向：

=== 用户天赋清单 ===
${talentSummary}${domainPreference}
=== 天赋信息结束 ===

请返回5-8个最适合的职业推荐JSON。`;

    // 构建LLM消息
    const messages = [{ role: 'user', content: recommendPrompt }];

    console.log(`[Recommend] 开始生成职业推荐，天赋数量: ${topTalents.length}`);

    // 调用LLM生成推荐
    const llmResponse = await llmService.chat(messages, RECOMMEND_SYSTEM_PROMPT);

    // 解析JSON响应
    let recommendResult;
    try {
      const rawResult = extractJSON(llmResponse.content);
      recommendResult = normalizeRecommendResult(rawResult);
    } catch (parseErr) {
      console.error('[Recommend] JSON解析失败:', parseErr.message);
      console.error('[Recommend] 原始响应:', llmResponse.content.substring(0, 500));
      return res.status(500).json({
        error: 'AI返回的推荐结果格式异常，请重试',
        detail: parseErr.message
      });
    }

    console.log(`[Recommend] 推荐完成，生成 ${recommendResult.jobs.length} 个职业方向`);

    res.json(recommendResult);

  } catch (err) {
    console.error('[Recommend] 处理推荐请求出错:', err.message);
    next(err);
  }
});

module.exports = router;
