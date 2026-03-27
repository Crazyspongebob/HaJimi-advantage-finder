// 聊天路由 - POST /api/chat
// 处理与哈基米的实时对话，追踪探索进度

const express = require('express');
const router = express.Router();
const llmService = require('../services/llmService');
const sessionService = require('../services/sessionService');
const gallupService = require('../services/gallupService');

// 加载提示词（含盖洛普题库）
let CHAT_SYSTEM_PROMPT;
let buildChatSystemPrompt;
try {
  const prompts = require('../prompts');
  CHAT_SYSTEM_PROMPT = prompts.CHAT_SYSTEM_PROMPT;
  buildChatSystemPrompt = prompts.buildChatSystemPrompt;
} catch (err) {
  console.warn('[Chat] 未找到prompts.js，使用内联备用提示词');
  CHAT_SYSTEM_PROMPT = '你是哈基米，请帮助用户发现才干。';
  buildChatSystemPrompt = () => CHAT_SYSTEM_PROMPT;
}

// 初始问候语（当用户首次打开时展示）
const GREETING_MESSAGE = `喵~ 你好呀！我是哈基米，一只很爱思考的猫猫 🐱 我最近在研究一件事——每个人都有自己独特的天赋，只是有时候需要一只猫猫来帮你发现它。先说说，你一般在什么情况下会觉得时间过得特别快，完全沉浸其中的那种感觉？`;

// ── 跳过触发词 ──────────────────────────────────────────────
const SKIP_TRIGGERS = [
  '换一个', '下一个', '这个不想聊', '不想说', 'skip', 'pass',
  '换个话题', '下一题', '跳过', '不聊这个',
];

/**
 * 检测消息是否为跳过指令
 * @param {string} message
 * @returns {boolean}
 */
function detectSkip(message) {
  const lower = message.toLowerCase().trim();
  return SKIP_TRIGGERS.some(t => lower.includes(t));
}

// ── 种子注入提示词模板 ────────────────────────────────────────
/**
 * 构建含话题种子的系统提示词补丁
 */
function buildSeedPrompt(seed, themeZh, domain, summary, eduLevel) {
  return `
[当前探测维度]: ${themeZh}（${domain}领域）
[教育背景]: ${eduLevel === 'pg' ? '研究生' : '本科生'}
[对话摘要]: ${summary || '对话刚开始'}

[话题种子（请基于用户上下文自然发挥，不要照搬原句）]:
"${seed}"

请你作为哈基米，结合上面的对话摘要和这个话题种子，用朋友聊天的方式自然引出这个话题。
如果用户之前已经透露了相关倾向，请在新问题中呼应。
如果用户说"换一个"或表示不想聊，立刻回复"好的，咱们换个话题~" 并准备切换。
`;
}

// ── 响应解析工具函数（保留原有逻辑）────────────────────────────

/**
 * 从AI回复中提取进度JSON数据
 */
function parseAIResponse(content) {
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
    } catch (e) {
      // JSON解析失败，继续尝试
    }
  }

  if (!progressData) {
    const lastJsonRegex = /\{[\s\S]*"progress"[\s\S]*\}$/;
    const lastMatch = content.match(lastJsonRegex);
    if (lastMatch) {
      try {
        progressData = JSON.parse(lastMatch[0]);
        cleanText = content.replace(lastMatch[0], '').trim();
      } catch (e) {
        // 解析失败，忽略
      }
    }
  }

  return {
    text: cleanText || content,
    progress: progressData ? progressData.progress : null,
    isComplete: progressData ? (progressData.isComplete === true) : false,
  };
}

/**
 * 基于消息数量估算探索进度（当AI没有返回进度数据时使用）
 */
function estimateProgress(messageCount) {
  let baseValue;
  let isComplete = false;

  if (messageCount < 4) {
    baseValue = 20;
  } else if (messageCount < 8) {
    baseValue = Math.min(40 + (messageCount - 4) * 5, 60);
  } else if (messageCount < 12) {
    baseValue = Math.min(70 + (messageCount - 8) * 5, 90);
  } else {
    baseValue = 85;
    isComplete = true;
  }

  const variance = 10;
  return {
    progress: {
      execution: Math.min(100, baseValue + Math.floor(Math.random() * variance)),
      influence: Math.min(100, baseValue + Math.floor(Math.random() * variance)),
      relationship: Math.min(100, baseValue - Math.floor(Math.random() * variance)),
      strategic: Math.min(100, baseValue + Math.floor(Math.random() * variance)),
    },
    isComplete,
  };
}

/**
 * 判断探索是否完成
 */
function checkIsComplete(progress, messageCount) {
  if (messageCount > 12) return true;
  const allDimensionsDone = Object.values(progress).every(v => v >= 70);
  return allDimensionsDone;
}

// ── assessmentState 初始化辅助 ──────────────────────────────

/**
 * 确保 session 有 assessmentState，若无则初始化（兼容旧会话）
 */
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
      signalTags: [],
      conversationSummary: '',
      lastSkipped: null,
    };
    sessionService.updateAssessmentState(session.sessionId, defaultState);
    return { ...session, assessmentState: defaultState };
  }
  // Lazy-init themeOrder if empty
  if (!session.assessmentState.themeOrder || session.assessmentState.themeOrder.length === 0) {
    const patch = { themeOrder: gallupService.getThemeOrder() };
    sessionService.updateAssessmentState(session.sessionId, patch);
    return {
      ...session,
      assessmentState: { ...session.assessmentState, ...patch },
    };
  }
  return session;
}

/**
 * 移动到下一个主题，返回新的 assessmentState patch
 */
function advanceTheme(state) {
  const nextIndex = state.themeIndex + 1;
  const nextTheme = state.themeOrder[nextIndex] || null;
  console.log(`[Chat] Moving to next theme: ${state.currentTheme} → ${nextTheme}`);
  return {
    mode: 'A',
    themeIndex: nextIndex,
    currentTheme: nextTheme,
    seedIndex: 0,
    consecutiveSingleReplies: 0,
  };
}

// ── POST /api/chat ──────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const { sessionId: existingSessionId, message, history = [], scaleAnswer } = req.body;

    // 处理初始问候（消息为空时）
    if (!message || message.trim() === '') {
      const session = sessionService.createSession();
      sessionService.addMessage(session.sessionId, {
        role: 'assistant',
        content: GREETING_MESSAGE,
      });

      return res.json({
        sessionId: session.sessionId,
        reply: GREETING_MESSAGE,
        isComplete: false,
        mode: 'A',
        currentTheme: null,
        skipDetected: false,
        progress: { execution: 0, influence: 0, relationship: 0, strategic: 0 },
      });
    }

    // 获取或创建会话
    let session;
    if (existingSessionId) {
      session = sessionService.getSession(existingSessionId);
      if (!session) {
        console.warn(`[Chat] 会话 ${existingSessionId} 不存在，创建新会话`);
        session = sessionService.createSession();
      }
    } else {
      session = sessionService.createSession();
    }

    // 确保 assessmentState 存在
    session = ensureAssessmentState(session);
    let state = session.assessmentState;

    // ── 处理量表答案提交 ────────────────────────────────────
    if (scaleAnswer && scaleAnswer.theme && Array.isArray(scaleAnswer.answers)) {
      const { theme: scaleTheme, answers } = scaleAnswer;
      console.log(`[Chat] Scale answer received: theme=${scaleTheme}, answers=[${answers.join(',')}]`);

      // 保存量表答案
      const updatedScaleAnswers = { ...state.scaleAnswers, [scaleTheme]: answers };
      const nextStatePatch = {
        ...advanceTheme(state),
        scaleAnswers: updatedScaleAnswers,
      };
      sessionService.updateAssessmentState(session.sessionId, nextStatePatch);
      session = sessionService.getSession(session.sessionId);
      state = session.assessmentState;

      // 返回下一主题的 Mode A 响应
      const nextTheme = state.currentTheme;
      const themeInfo = nextTheme ? gallupService.getThemeInfo(nextTheme) : null;
      const seeds = nextTheme ? gallupService.getSeedsForTheme(nextTheme, session.eduLevel || 'ug') : [];
      const seed = seeds[0] || null;

      const estimated = estimateProgress(session.messages ? session.messages.length : 0);
      return res.json({
        sessionId: session.sessionId,
        reply: seed
          ? `好的~ 咱们继续聊别的！喵~ ${seed}`
          : '好的，咱们继续探索吧！喵~',
        mode: 'A',
        currentTheme: nextTheme,
        skipDetected: false,
        isComplete: false,
        progress: estimated.progress,
      });
    }

    // 将用户消息添加到会话
    sessionService.addMessage(session.sessionId, { role: 'user', content: message });
    session = sessionService.getSession(session.sessionId);

    // ── 跳过检测 ────────────────────────────────────────────
    const skipDetected = detectSkip(message);

    // 隐式跳过：连续短回复
    let implicitSkip = false;
    if (!skipDetected && message.trim().length <= 3) {
      const newConsecutive = (state.consecutiveSingleReplies || 0) + 1;
      sessionService.updateAssessmentState(session.sessionId, {
        consecutiveSingleReplies: newConsecutive,
      });
      state = { ...state, consecutiveSingleReplies: newConsecutive };
      if (newConsecutive >= 2) {
        implicitSkip = true;
        console.log(`[Chat] Skip detected (implicit consecutive short replies): "${message}", theme: ${state.currentTheme}, seedIndex: ${state.seedIndex}`);
      }
    } else if (!skipDetected) {
      // 正常消息，重置连续短回复计数
      sessionService.updateAssessmentState(session.sessionId, { consecutiveSingleReplies: 0 });
      state = { ...state, consecutiveSingleReplies: 0 };
    }

    const isSkip = skipDetected || implicitSkip;

    if (skipDetected) {
      console.log(`[Chat] Skip detected: "${message}", theme: ${state.currentTheme}, seedIndex: ${state.seedIndex}`);
    }

    // ── 处理跳过 ────────────────────────────────────────────
    if (isSkip) {
      // 记录跳过时间
      const now = new Date().toISOString();

      // 检查是否需要给出鼓励（对不同主题连续跳过3次）
      // 统计最近的跳过：通过 signalTags 的 skip 计数近似
      const recentSkips = (state.signalTags || []).filter(t => t.signal === 'skip').length;
      let encouragement = '';
      if (recentSkips >= 2) {
        encouragement = '喵~ 没关系！每个人都有不一样的舒适区，我们一起找到最适合你的方向～ ';
      }

      // 记录跳过信号
      const updatedSignalTags = [
        ...(state.signalTags || []),
        { theme: state.currentTheme, signal: 'skip', weight: -1 },
      ];

      const nextStatePatch = {
        ...advanceTheme(state),
        lastSkipped: now,
        signalTags: updatedSignalTags,
        consecutiveSingleReplies: 0,
      };
      sessionService.updateAssessmentState(session.sessionId, nextStatePatch);
      session = sessionService.getSession(session.sessionId);
      state = session.assessmentState;

      const nextTheme = state.currentTheme;
      const themeInfo = nextTheme ? gallupService.getThemeInfo(nextTheme) : null;
      const seeds = nextTheme ? gallupService.getSeedsForTheme(nextTheme, session.eduLevel || 'ug') : [];
      const seed = seeds[0] || null;

      const skipReply = encouragement +
        (seed
          ? `好的，咱们换个话题~ 喵~ ${seed}`
          : '好的，咱们换个话题~ 喵~');

      sessionService.addMessage(session.sessionId, { role: 'assistant', content: skipReply });

      const estimated = estimateProgress(session.messages ? session.messages.length : 0);
      return res.json({
        sessionId: session.sessionId,
        reply: skipReply,
        mode: 'A',
        currentTheme: nextTheme,
        skipDetected: true,
        isComplete: false,
        progress: estimated.progress,
      });
    }

    // ── Mode B：返回量表题 ──────────────────────────────────
    if (state.mode === 'B') {
      const theme = state.currentTheme;
      const scaleQuestions = theme ? gallupService.getScaleQuestionsForTheme(theme) : [];
      console.log(`[Chat] Mode transition: A→B for theme: ${theme} (weak signal)`);

      const estimated = estimateProgress(session.messages ? session.messages.length : 0);
      return res.json({
        sessionId: session.sessionId,
        reply: `喵~ 让我用一种更精准的方式了解你！对于以下几个说法，你的感受是 1-5 分？\n\n（1=完全不同意，5=非常同意）`,
        mode: 'B',
        scaleQuestions,
        currentTheme: theme,
        skipDetected: false,
        isComplete: false,
        progress: estimated.progress,
      });
    }

    // ── Mode A：构建 LLM 请求 ───────────────────────────────

    // 初始化当前主题（如果还没设置）
    if (!state.currentTheme && state.themeOrder && state.themeOrder.length > 0) {
      const initTheme = state.themeOrder[state.themeIndex || 0];
      sessionService.updateAssessmentState(session.sessionId, { currentTheme: initTheme });
      state = { ...state, currentTheme: initTheme };
    }

    const currentTheme = state.currentTheme;
    const eduLevel = session.eduLevel || 'ug';

    // 构建消息数组
    let conversationMessages;
    if (history && history.length > 0) {
      conversationMessages = history.map(msg => ({ role: msg.role, content: msg.content }));
      const lastMsg = conversationMessages[conversationMessages.length - 1];
      if (!lastMsg || lastMsg.content !== message) {
        conversationMessages.push({ role: 'user', content: message });
      }
    } else {
      conversationMessages = session.messages.map(msg => ({ role: msg.role, content: msg.content }));
    }

    // 构建系统提示词（含种子注入）
    let systemPrompt = buildChatSystemPrompt ? buildChatSystemPrompt(eduLevel) : CHAT_SYSTEM_PROMPT;

    if (currentTheme) {
      const themeInfo = gallupService.getThemeInfo(currentTheme);
      const seeds = gallupService.getSeedsForTheme(currentTheme, eduLevel);
      const seedIndex = state.seedIndex || 0;
      const seed = seeds[seedIndex] || seeds[0] || null;

      if (seed) {
        systemPrompt = systemPrompt + '\n\n' + buildSeedPrompt(
          seed,
          themeInfo.zh,
          themeInfo.domain,
          state.conversationSummary || '',
          eduLevel
        );

        // 推进 seedIndex（循环或前进到下一主题）
        const nextSeedIndex = seedIndex + 1;
        if (nextSeedIndex >= seeds.length) {
          // 当前主题的种子已用完，保持 seedIndex = 0 以备重复，或推进到下一主题
          // 这里选择推进到下一主题
          const nextStatePatch = advanceTheme(state);
          sessionService.updateAssessmentState(session.sessionId, nextStatePatch);
          state = { ...state, ...nextStatePatch };
        } else {
          sessionService.updateAssessmentState(session.sessionId, { seedIndex: nextSeedIndex });
          state = { ...state, seedIndex: nextSeedIndex };
        }
      }
    }

    // 调用 LLM
    const llmResponse = await llmService.chat(conversationMessages, systemPrompt);

    // 解析 AI 回复
    const { text: replyText, progress: parsedProgress, isComplete: parsedIsComplete } = parseAIResponse(llmResponse.content);

    // 确定最终进度
    let finalProgress;
    let finalIsComplete;
    if (parsedProgress) {
      finalProgress = parsedProgress;
      finalIsComplete = parsedIsComplete;
    } else {
      const estimated = estimateProgress(session.messages.length);
      finalProgress = estimated.progress;
      finalIsComplete = estimated.isComplete;
    }

    if (!finalIsComplete) {
      finalIsComplete = checkIsComplete(finalProgress, session.messages.length);
    }

    // 将 AI 回复加入会话
    sessionService.addMessage(session.sessionId, { role: 'assistant', content: replyText });

    // 检测学历级别
    if (!session.eduLevel) {
      const pgKeywords = ['研究生', '导师', '实验室', '课题', '论文', '答辩', '硕士', '博士', 'PhD', 'pg'];
      const ugKeywords = ['本科', '大学生', '社团', '大一', '大二', '大三', '大四', 'ug'];
      const msgLower = message.toLowerCase();
      if (pgKeywords.some(k => message.includes(k) || msgLower.includes(k.toLowerCase()))) {
        sessionService.updateSession(session.sessionId, { eduLevel: 'pg' });
      } else if (ugKeywords.some(k => message.includes(k) || msgLower.includes(k.toLowerCase()))) {
        sessionService.updateSession(session.sessionId, { eduLevel: 'ug' });
      }
    }

    // 更新会话进度
    sessionService.updateSession(session.sessionId, {
      progress: finalProgress,
      isComplete: finalIsComplete,
    });

    // 刷新 session 获取最新 assessmentState
    session = sessionService.getSession(session.sessionId);
    state = session.assessmentState || state;

    res.json({
      sessionId: session.sessionId,
      reply: replyText,
      isComplete: finalIsComplete,
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

/**
 * 返回当前评测状态，供前端页面刷新时同步
 */
router.get('/state/:sessionId', (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = sessionService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: '会话不存在', sessionId });
    }

    const state = session.assessmentState || null;
    res.json({
      sessionId,
      assessmentState: state,
      eduLevel: session.eduLevel || 'ug',
      progress: session.progress,
      isComplete: session.isComplete,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
