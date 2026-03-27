// 聊天路由 - POST /api/chat
// 信号感知探测引擎：roundCount + signalTags + ReadyForReport + 最少5轮

const express = require('express');
const router = express.Router();
const llmService = require('../services/llmService');
const sessionService = require('../services/sessionService');
const gallupService = require('../services/gallupService');

let CHAT_SYSTEM_PROMPT, buildChatSystemPrompt;
try {
  const prompts = require('../prompts');
  CHAT_SYSTEM_PROMPT = prompts.CHAT_SYSTEM_PROMPT;
  buildChatSystemPrompt = prompts.buildChatSystemPrompt;
} catch (err) {
  console.warn('[Chat] 未找到prompts.js，使用内联备用提示词');
  CHAT_SYSTEM_PROMPT = '你是哈基米，请帮助用户发现才干。';
  buildChatSystemPrompt = () => CHAT_SYSTEM_PROMPT;
}

// 主模型：Kimi-K2.5；fallback：GLM-4.7-flash
const CHAT_PRIMARY_MODEL = process.env.CHAT_LLM_MODEL || 'kimi-k2-5';
const CHAT_FALLBACK_MODEL = 'glm-4.7-flash';

const GREETING_MESSAGE = `喵~ 你好呀！我是哈基米，一只很爱思考的猫猫 🐱

我最近在研究一件事——每个人都有自己独特的天赋，只是有时候需要一只猫猫来帮你发现它喵~

咱们来聊5分钟，我会通过轻松的对话找到你最闪耀的才干！

先说说：**你是本科生还是研究生？** 这样我能用最适合你的方式来聊~`;

const SKIP_TRIGGERS = [
  '换一个', '下一个', '这个不想聊', '不想说', 'skip', 'pass',
  '换个话题', '下一题', '跳过', '不聊这个',
];

// ── 工具函数 ──────────────────────────────────────────────

function detectSkip(message) {
  const lower = message.toLowerCase().trim();
  return SKIP_TRIGGERS.some(t => lower.includes(t));
}

/**
 * 从AI回复中解析所有信号标签
 * 格式: [Signal: Achiever +2] [Signal: Analytical +1]
 * @returns { signals: [{theme, weight}], readyForReport: bool, text: string (cleaned) }
 */
function parseSignalsFromAI(content) {
  const signals = [];
  let readyForReport = false;
  let cleaned = content;

  // 解析 [Signal: ThemeName +N] 或 [Signal: ThemeName -N]
  const signalRegex = /\[Signal:\s*([A-Za-z]+)\s*([+-]\d+(?:\.\d+)?)\]/g;
  let match;
  while ((match = signalRegex.exec(content)) !== null) {
    signals.push({ theme: match[1], weight: parseFloat(match[2]) });
    cleaned = cleaned.replace(match[0], '');
  }

  // 解析 [ReadyForReport: true]
  if (/\[ReadyForReport:\s*true\]/i.test(cleaned)) {
    readyForReport = true;
    cleaned = cleaned.replace(/\[ReadyForReport:\s*true\]/gi, '');
  }

  return { signals, readyForReport, text: cleaned.trim() };
}

/**
 * 从AI回复中提取进度JSON数据块
 */
function parseProgressJSON(content) {
  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/gi;
  let match;
  let progressData = null;
  let cleanText = content;

  while ((match = jsonBlockRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed && parsed.progress) {
        progressData = parsed;
        cleanText = cleanText.replace(match[0], '').trim();
      }
    } catch (e) { /* ignore */ }
  }

  if (!progressData) {
    const fallback = content.match(/\{[\s\S]*"progress"[\s\S]*\}$/);
    if (fallback) {
      try {
        progressData = JSON.parse(fallback[0]);
        cleanText = content.replace(fallback[0], '').trim();
      } catch (e) { /* ignore */ }
    }
  }

  return {
    text: cleanText || content,
    progress: progressData?.progress || null,
    isComplete: progressData?.isComplete === true,
  };
}

function estimateProgress(messageCount) {
  let base;
  if (messageCount < 4) base = 20;
  else if (messageCount < 8) base = Math.min(40 + (messageCount - 4) * 5, 60);
  else if (messageCount < 12) base = Math.min(70 + (messageCount - 8) * 5, 90);
  else base = 85;

  const v = 10;
  return {
    execution: Math.min(100, base + Math.floor(Math.random() * v)),
    influence: Math.min(100, base + Math.floor(Math.random() * v)),
    relationship: Math.min(100, base - Math.floor(Math.random() * v)),
    strategic: Math.min(100, base + Math.floor(Math.random() * v)),
  };
}

function ensureAssessmentState(session) {
  if (!session.assessmentState) {
    const defaultState = {
      mode: 'A',
      themeOrder: gallupService.getThemeOrder(),
      themeIndex: 0,
      currentTheme: null,
      seedIndex: 0,
      consecutiveSingleReplies: 0,
      scaleAnswers: {},
      signalTags: [],            // [{theme, signal, weight}]
      confirmedThemes: [],       // [{nameEn, nameZh, score}] — score ≥ 6
      signalScores: {},          // { [themeEn]: cumulativeScore }
      conversationSummary: '',
      lastSkipped: null,
      roundCount: 0,             // user→AI exchange count
    };
    sessionService.updateAssessmentState(session.sessionId, defaultState);
    return { ...session, assessmentState: defaultState };
  }
  if (!session.assessmentState.themeOrder?.length) {
    const patch = { themeOrder: gallupService.getThemeOrder() };
    sessionService.updateAssessmentState(session.sessionId, patch);
    return { ...session, assessmentState: { ...session.assessmentState, ...patch } };
  }
  // Ensure new fields exist on older sessions
  if (session.assessmentState.roundCount === undefined) {
    const patch = { roundCount: 0, confirmedThemes: [], signalScores: {} };
    sessionService.updateAssessmentState(session.sessionId, patch);
    return { ...session, assessmentState: { ...session.assessmentState, ...patch } };
  }
  return session;
}

function advanceTheme(state) {
  const nextIndex = state.themeIndex + 1;
  const nextTheme = state.themeOrder[nextIndex] || null;
  console.log(`[Chat] Moving to next theme: ${state.currentTheme} → ${nextTheme}`);
  return { mode: 'A', themeIndex: nextIndex, currentTheme: nextTheme, seedIndex: 0, consecutiveSingleReplies: 0 };
}

function buildSeedPrompt(seed, themeZh, domain, summary, eduLevel) {
  return `
[当前探测维度]: ${themeZh}（${domain}领域）
[教育背景]: ${eduLevel === 'pg' ? '研究生' : '本科生'}
[对话摘要]: ${summary || '对话刚开始'}

[话题种子（请基于用户上下文自然发挥，不要照搬原句）]:
"${seed}"

请你作为哈基米，结合上面的对话摘要和这个话题种子，用朋友聊天的方式自然引出这个话题。
如果用户之前已经透露了相关倾向，请在新问题中呼应。`;
}

// ── POST /api/chat ──────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const { sessionId: existingSessionId, message, history = [], scaleAnswer } = req.body;

    // ── 初始问候 ─────────────────────────────────────────────
    if (!message || message.trim() === '') {
      const session = sessionService.createSession();
      sessionService.addMessage(session.sessionId, { role: 'assistant', content: GREETING_MESSAGE });
      return res.json({
        sessionId: session.sessionId,
        reply: GREETING_MESSAGE,
        isComplete: false,
        readyForReport: false,
        roundCount: 0,
        mode: 'A',
        currentTheme: null,
        skipDetected: false,
        progress: { execution: 0, influence: 0, relationship: 0, strategic: 0 },
      });
    }

    // ── 获取/创建会话 ─────────────────────────────────────────
    let session = existingSessionId
      ? (sessionService.getSession(existingSessionId) || sessionService.createSession())
      : sessionService.createSession();

    session = ensureAssessmentState(session);
    let state = session.assessmentState;

    // ── 量表答案提交 ─────────────────────────────────────────
    if (scaleAnswer?.theme && Array.isArray(scaleAnswer.answers)) {
      const { theme: scaleTheme, answers } = scaleAnswer;
      console.log(`[Chat] Scale answer: theme=${scaleTheme}, answers=[${answers.join(',')}]`);

      const updatedScaleAnswers = { ...state.scaleAnswers, [scaleTheme]: answers };
      const nextStatePatch = { ...advanceTheme(state), scaleAnswers: updatedScaleAnswers };
      sessionService.updateAssessmentState(session.sessionId, nextStatePatch);
      session = sessionService.getSession(session.sessionId);
      state = session.assessmentState;

      const nextTheme = state.currentTheme;
      const seeds = nextTheme ? gallupService.getSeedsForTheme(nextTheme, session.eduLevel || 'ug') : [];
      const seed = seeds[0] || null;
      const estimated = estimateProgress(session.messages?.length || 0);

      return res.json({
        sessionId: session.sessionId,
        reply: seed ? `好的~ 咱们继续聊别的！喵~ ${seed}` : '好的，咱们继续探索吧！喵~',
        mode: 'A', currentTheme: nextTheme, skipDetected: false,
        isComplete: false, readyForReport: false,
        roundCount: state.roundCount || 0,
        progress: estimated,
      });
    }

    // 记录用户消息
    sessionService.addMessage(session.sessionId, { role: 'user', content: message });
    session = sessionService.getSession(session.sessionId);

    // ── 跳过检测 ──────────────────────────────────────────────
    const skipDetected = detectSkip(message);
    let implicitSkip = false;

    if (!skipDetected && message.trim().length <= 3) {
      const newConsecutive = (state.consecutiveSingleReplies || 0) + 1;
      sessionService.updateAssessmentState(session.sessionId, { consecutiveSingleReplies: newConsecutive });
      state = { ...state, consecutiveSingleReplies: newConsecutive };
      if (newConsecutive >= 2) implicitSkip = true;
    } else if (!skipDetected) {
      sessionService.updateAssessmentState(session.sessionId, { consecutiveSingleReplies: 0 });
      state = { ...state, consecutiveSingleReplies: 0 };
    }

    const isSkip = skipDetected || implicitSkip;

    if (isSkip) {
      console.log(`[Chat] Skip detected: "${message}", theme: ${state.currentTheme}`);
      const recentSkips = (state.signalTags || []).filter(t => t.signal === 'skip').length;
      const encouragement = recentSkips >= 2
        ? '喵~ 没关系！每个人都有不一样的舒适区，我们一起找到最适合你的方向～ '
        : '';

      const updatedSignalTags = [...(state.signalTags || []), { theme: state.currentTheme, signal: 'skip', weight: -1 }];
      const nextStatePatch = { ...advanceTheme(state), lastSkipped: new Date().toISOString(), signalTags: updatedSignalTags, consecutiveSingleReplies: 0 };
      sessionService.updateAssessmentState(session.sessionId, nextStatePatch);
      session = sessionService.getSession(session.sessionId);
      state = session.assessmentState;

      const nextTheme = state.currentTheme;
      const seeds = nextTheme ? gallupService.getSeedsForTheme(nextTheme, session.eduLevel || 'ug') : [];
      const seed = seeds[0] || null;
      const skipReply = encouragement + (seed ? `好的，咱们换个话题~ 喵~ ${seed}` : '好的，咱们换个话题~ 喵~');
      sessionService.addMessage(session.sessionId, { role: 'assistant', content: skipReply });

      return res.json({
        sessionId: session.sessionId, reply: skipReply,
        mode: 'A', currentTheme: nextTheme, skipDetected: true,
        isComplete: false, readyForReport: false,
        roundCount: state.roundCount || 0,
        progress: estimateProgress(session.messages?.length || 0),
      });
    }

    // ── Mode B：返回量表题 ────────────────────────────────────
    if (state.mode === 'B') {
      const theme = state.currentTheme;
      const scaleQuestions = theme ? gallupService.getScaleQuestionsForTheme(theme) : [];
      console.log(`[Chat] Mode B for theme: ${theme}`);
      return res.json({
        sessionId: session.sessionId,
        reply: `喵~ 让我用一种更精准的方式了解你！对于以下几个说法，你的感受是 1-5 分？\n\n（1=完全不同意，5=非常同意）`,
        mode: 'B', scaleQuestions, currentTheme: theme, skipDetected: false,
        isComplete: false, readyForReport: false,
        roundCount: state.roundCount || 0,
        progress: estimateProgress(session.messages?.length || 0),
      });
    }

    // ── Mode A：初始化当前主题 ────────────────────────────────
    if (!state.currentTheme && state.themeOrder?.length > 0) {
      const initTheme = state.themeOrder[state.themeIndex || 0];
      sessionService.updateAssessmentState(session.sessionId, { currentTheme: initTheme });
      state = { ...state, currentTheme: initTheme };
    }

    const currentTheme = state.currentTheme;
    const eduLevel = session.eduLevel || 'ug';

    // 构建对话消息数组
    let conversationMessages;
    if (history && history.length > 0) {
      conversationMessages = history.map(msg => ({ role: msg.role, content: msg.content }));
      const last = conversationMessages[conversationMessages.length - 1];
      if (!last || last.content !== message) conversationMessages.push({ role: 'user', content: message });
    } else {
      conversationMessages = (session.messages || []).map(msg => ({ role: msg.role, content: msg.content }));
    }

    // ── 构建信号状态注入到系统提示 ───────────────────────────
    const signalState = {
      confirmedThemes: state.confirmedThemes || [],
      pendingTheme: currentTheme ? (gallupService.getThemeInfo(currentTheme)?.zh || currentTheme) : '待确定',
      summary: state.conversationSummary || '',
      roundCount: state.roundCount || 0,
    };

    let systemPrompt = buildChatSystemPrompt(eduLevel, signalState);

    if (currentTheme) {
      const themeInfo = gallupService.getThemeInfo(currentTheme);
      const seeds = gallupService.getSeedsForTheme(currentTheme, eduLevel);
      const seedIndex = state.seedIndex || 0;
      const seed = seeds[seedIndex] || seeds[0] || null;

      if (seed) {
        systemPrompt = systemPrompt + '\n\n' + buildSeedPrompt(seed, themeInfo.zh, themeInfo.domain, state.conversationSummary || '', eduLevel);

        const nextSeedIndex = seedIndex + 1;
        if (nextSeedIndex >= seeds.length) {
          const nextStatePatch = advanceTheme(state);
          sessionService.updateAssessmentState(session.sessionId, nextStatePatch);
          state = { ...state, ...nextStatePatch };
        } else {
          sessionService.updateAssessmentState(session.sessionId, { seedIndex: nextSeedIndex });
          state = { ...state, seedIndex: nextSeedIndex };
        }
      }
    }

    // ── 调用 LLM (Kimi-K2.5 → fallback) ─────────────────────
    const llmResponse = await llmService.chatWithFallback(
      conversationMessages, systemPrompt,
      CHAT_PRIMARY_MODEL, CHAT_FALLBACK_MODEL
    );

    // ── 解析信号标签 + ReadyForReport ────────────────────────
    const { signals, readyForReport: aiReadyForReport, text: afterSignals } = parseSignalsFromAI(llmResponse.content);
    const { text: replyText, progress: parsedProgress } = parseProgressJSON(afterSignals);

    console.log(`[Chat] Round ${(state.roundCount || 0) + 1}, signals:`, signals, 'readyForReport:', aiReadyForReport);

    // ── 更新信号积分 + 确认才干 ──────────────────────────────
    const updatedSignalScores = { ...(state.signalScores || {}) };
    const updatedConfirmed = [...(state.confirmedThemes || [])];
    const updatedSignalTags = [...(state.signalTags || [])];

    for (const sig of signals) {
      const th = sig.theme;
      updatedSignalScores[th] = (updatedSignalScores[th] || 0) + sig.weight;
      updatedSignalTags.push({ theme: th, signal: 'llm', weight: sig.weight });
      // 确认：积分达到6
      if (updatedSignalScores[th] >= 6 && !updatedConfirmed.find(c => c.nameEn === th)) {
        const info = gallupService.getThemeInfo(th) || {};
        updatedConfirmed.push({ nameEn: th, nameZh: info.zh || th, score: updatedSignalScores[th] });
        console.log(`[Chat] Theme confirmed: ${th} (score=${updatedSignalScores[th]})`);
      }
    }

    // ── 递增 roundCount ───────────────────────────────────────
    const newRoundCount = (state.roundCount || 0) + 1;

    // ── 学历识别 ──────────────────────────────────────────────
    if (!session.eduLevel) {
      const pgKw = ['研究生', '导师', '实验室', '课题', '论文', '答辩', '硕士', '博士', 'PhD'];
      const ugKw = ['本科', '大学生', '社团', '大一', '大二', '大三', '大四'];
      if (pgKw.some(k => message.includes(k))) sessionService.updateSession(session.sessionId, { eduLevel: 'pg' });
      else if (ugKw.some(k => message.includes(k))) sessionService.updateSession(session.sessionId, { eduLevel: 'ug' });
    }

    // ── 判断是否完成（最少5轮） ───────────────────────────────
    const MIN_ROUNDS = 5;
    const MAX_ROUNDS = 15;
    let finalIsComplete = false;

    if (newRoundCount >= MAX_ROUNDS) {
      finalIsComplete = true;
    } else if (newRoundCount >= MIN_ROUNDS) {
      if (aiReadyForReport && updatedConfirmed.length >= 3) {
        finalIsComplete = true;
      } else if (parsedProgress) {
        const allDone = Object.values(parsedProgress).every(v => v >= 70);
        if (allDone) finalIsComplete = true;
      }
    }

    // ── 最终进度 ──────────────────────────────────────────────
    const finalProgress = parsedProgress || estimateProgress(session.messages?.length || 0);

    // 保存状态
    sessionService.updateAssessmentState(session.sessionId, {
      signalScores: updatedSignalScores,
      confirmedThemes: updatedConfirmed,
      signalTags: updatedSignalTags,
      roundCount: newRoundCount,
    });
    sessionService.addMessage(session.sessionId, { role: 'assistant', content: replyText });
    sessionService.updateSession(session.sessionId, { progress: finalProgress, isComplete: finalIsComplete });

    session = sessionService.getSession(session.sessionId);
    state = session.assessmentState || state;

    res.json({
      sessionId: session.sessionId,
      reply: replyText,
      isComplete: finalIsComplete,
      readyForReport: finalIsComplete || (aiReadyForReport && newRoundCount >= MIN_ROUNDS),
      roundCount: newRoundCount,
      mode: state.mode || 'A',
      currentTheme: state.currentTheme || null,
      skipDetected: false,
      progress: finalProgress,
    });

  } catch (err) {
    console.error('[Chat] 处理聊天请求出错:', err.message);
    next(err);
  }
});

// ── GET /api/chat/state/:sessionId ──────────────────────────

router.get('/state/:sessionId', (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = sessionService.getSession(sessionId);
    if (!session) return res.status(404).json({ error: '会话不存在', sessionId });

    res.json({
      sessionId,
      assessmentState: session.assessmentState || null,
      eduLevel: session.eduLevel || 'ug',
      progress: session.progress,
      isComplete: session.isComplete,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
