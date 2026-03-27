// 会话管理服务 - 内存存储 + JSON文件持久化
// 在服务重启后通过文件恢复会话数据

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const gallupService = require('./gallupService');

// 数据存储目录和文件路径
const DATA_DIR = path.join(__dirname, '..', 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// 内存中的会话存储（Map结构，key为sessionId）
const sessionStore = new Map();

/**
 * 确保数据目录存在
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`[Session] 创建数据目录: ${DATA_DIR}`);
  }
}

/**
 * 创建新会话
 * @returns {object} - 新创建的会话对象
 */
function createSession() {
  const sessionId = uuidv4();
  const now = new Date().toISOString();

  const session = {
    sessionId,
    createdAt: now,
    updatedAt: now,
    messages: [],        // 对话消息历史
    progress: {          // 各维度探索进度（0-100）
      execution: 0,      // 执行力维度
      influence: 0,      // 影响力维度
      relationship: 0,   // 关系力维度
      strategic: 0       // 战略思维维度
    },
    isComplete: false,   // 是否完成全部探索
    results: null,       // 分析结果（topTalents, domainScores）
    jobs: null,          // 职业推荐结果
    assessmentState: {
      mode: 'A',                    // 'A' = chatty, 'B' = Likert scale
      themeOrder: gallupService.getThemeOrder(), // 34 themes in domain-interleaved order
      themeIndex: 0,                // current index in themeOrder
      currentTheme: null,           // current theme English name (e.g. 'Achiever')
      seedIndex: 0,                 // current seed index in this theme's seeds
      consecutiveSingleReplies: 0,  // for implicit skip detection
      scaleAnswers: {},             // { 'Achiever': [3,4,5,...], ... }
      signalTags: [],               // accumulated signal tags [{ theme, signal, weight }]
      conversationSummary: '',      // rolling 300-char summary
      lastSkipped: null,            // timestamp of last skip
    },
  };

  sessionStore.set(sessionId, session);
  console.log(`[Session] 创建新会话: ${sessionId}`);

  // 异步保存到文件，不阻塞响应
  saveToFile().catch(err => console.error('[Session] 保存文件失败:', err));

  return session;
}

/**
 * 获取会话
 * @param {string} sessionId - 会话ID
 * @returns {object|null} - 会话对象，不存在时返回null
 */
function getSession(sessionId) {
  return sessionStore.get(sessionId) || null;
}

/**
 * 更新会话数据
 * @param {string} sessionId - 会话ID
 * @param {object} updates - 要更新的字段（浅合并）
 * @returns {object|null} - 更新后的会话，不存在时返回null
 */
function updateSession(sessionId, updates) {
  const session = sessionStore.get(sessionId);
  if (!session) {
    console.warn(`[Session] 尝试更新不存在的会话: ${sessionId}`);
    return null;
  }

  // 合并更新字段
  const updatedSession = {
    ...session,
    ...updates,
    sessionId,           // 确保sessionId不被覆盖
    updatedAt: new Date().toISOString()
  };

  // 如果更新包含progress，进行深度合并
  if (updates.progress) {
    updatedSession.progress = {
      ...session.progress,
      ...updates.progress
    };
  }

  sessionStore.set(sessionId, updatedSession);

  // 异步保存到文件
  saveToFile().catch(err => console.error('[Session] 保存文件失败:', err));

  return updatedSession;
}

/**
 * 向会话添加消息
 * @param {string} sessionId - 会话ID
 * @param {object} message - 消息对象 {role: 'user'|'assistant', content: string}
 * @returns {object|null} - 更新后的会话
 */
function addMessage(sessionId, message) {
  const session = sessionStore.get(sessionId);
  if (!session) {
    console.warn(`[Session] 尝试向不存在的会话添加消息: ${sessionId}`);
    return null;
  }

  // 为消息添加时间戳
  const messageWithTimestamp = {
    ...message,
    timestamp: new Date().toISOString()
  };

  const updatedSession = {
    ...session,
    messages: [...session.messages, messageWithTimestamp],
    updatedAt: new Date().toISOString()
  };

  sessionStore.set(sessionId, updatedSession);

  // 异步保存到文件
  saveToFile().catch(err => console.error('[Session] 保存文件失败:', err));

  return updatedSession;
}

/**
 * 将所有会话保存到JSON文件
 * @returns {Promise<void>}
 */
async function saveToFile() {
  ensureDataDir();

  // 将Map转换为普通对象以便JSON序列化
  const sessionsObj = {};
  for (const [id, session] of sessionStore) {
    sessionsObj[id] = session;
  }

  const jsonContent = JSON.stringify(sessionsObj, null, 2);

  await fs.promises.writeFile(SESSIONS_FILE, jsonContent, 'utf8');
}

/**
 * 从JSON文件加载会话数据（服务启动时调用）
 * @returns {void}
 */
function loadFromFile() {
  ensureDataDir();

  if (!fs.existsSync(SESSIONS_FILE)) {
    console.log('[Session] 未找到会话文件，从空状态启动');
    return;
  }

  try {
    const jsonContent = fs.readFileSync(SESSIONS_FILE, 'utf8');
    const sessionsObj = JSON.parse(jsonContent);

    // 将普通对象恢复为Map
    let count = 0;
    for (const [id, session] of Object.entries(sessionsObj)) {
      sessionStore.set(id, session);
      count++;
    }

    console.log(`[Session] 从文件加载了 ${count} 个会话`);
  } catch (err) {
    console.error('[Session] 加载会话文件失败:', err.message);
    console.log('[Session] 从空状态启动');
  }
}

/**
 * 获取所有会话数量（用于监控）
 * @returns {number}
 */
function getSessionCount() {
  return sessionStore.size;
}

/**
 * 合并更新 assessmentState 中的部分字段
 * @param {string} sessionId - 会话ID
 * @param {object} patch - 要合并到 assessmentState 的字段
 * @returns {object|null} - 更新后的会话，不存在时返回null
 */
function updateAssessmentState(sessionId, patch) {
  const session = sessionStore.get(sessionId);
  if (!session) {
    console.warn(`[Session] 尝试更新不存在会话的assessmentState: ${sessionId}`);
    return null;
  }

  const currentState = session.assessmentState || {
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

  const updatedSession = {
    ...session,
    assessmentState: { ...currentState, ...patch },
    updatedAt: new Date().toISOString(),
  };

  sessionStore.set(sessionId, updatedSession);
  saveToFile().catch(err => console.error('[Session] 保存文件失败:', err));
  return updatedSession;
}

// 在进程正常退出时同步保存会话数据
process.on('exit', () => {
  try {
    ensureDataDir();
    const sessionsObj = {};
    for (const [id, session] of sessionStore) {
      sessionsObj[id] = session;
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessionsObj, null, 2), 'utf8');
    console.log('[Session] 进程退出，已保存会话数据');
  } catch (err) {
    console.error('[Session] 进程退出保存失败:', err.message);
  }
});

// 捕获SIGINT（Ctrl+C）信号，确保保存后退出
process.on('SIGINT', () => {
  console.log('\n[Session] 收到SIGINT信号，正在保存会话数据...');
  process.exit(0);
});

// 捕获SIGTERM信号（容器停止等场景）
process.on('SIGTERM', () => {
  console.log('[Session] 收到SIGTERM信号，正在保存会话数据...');
  process.exit(0);
});

// 服务启动时自动加载已保存的会话
loadFromFile();

module.exports = {
  createSession,
  getSession,
  updateSession,
  addMessage,
  saveToFile,
  loadFromFile,
  getSessionCount,
  updateAssessmentState,
};
