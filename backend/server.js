// 哈基米优势发现器 - 后端服务入口
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const chatRouter = require('./routes/chat');
const analyzeRouter = require('./routes/analyze');
const recommendRouter = require('./routes/recommend');
const sessionRouter = require('./routes/session');
const ttsRouter = require('./routes/tts');
const voiceRouter = require('./routes/voice');
const errorHandler = require('./middleware/errorHandler');
const sessionService = require('./services/sessionService');
const { getCurrentModelInfo } = require('./services/llmService');

const app = express();
const PORT = process.env.PORT || 5175;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3004';

// ── 中间件 ────────────────────────────────────────────────
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3004', 'http://127.0.0.1:3004', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));

// 请求日志（开发用）
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── 路由 ────────────────────────────────────────────────
app.use('/api/chat', chatRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/recommend', recommendRouter);
app.use('/api/session', sessionRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/voice', voiceRouter);

// 健康检查
app.get('/api/health', (_req, res) => {
  const modelInfo = getCurrentModelInfo();
  res.json({
    status: 'ok',
    service: '哈基米优势发现器',
    model: modelInfo,
    timestamp: new Date().toISOString(),
  });
});

// ── 错误处理 ────────────────────────────────────────────
app.use(errorHandler);

// ── 启动 ────────────────────────────────────────────────
sessionService.loadFromFile();

app.listen(PORT, () => {
  const modelInfo = getCurrentModelInfo();
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   哈基米优势发现器 Backend 已启动 🐱     ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  服务地址: http://localhost:${PORT}         ║`);
  console.log(`║  当前模型: ${modelInfo.provider} (${modelInfo.model})`);
  console.log(`║  API状态:  ${modelInfo.status}`);
  console.log('╚════════════════════════════════════════╝\n');
});

// 防止未捕获异常崩溃后端进程（导致 Vite proxy ECONNRESET）
process.on('uncaughtException', (err) => {
  console.error('[Server] 未捕获异常 (进程继续运行):', err.message, err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Server] 未处理的 Promise rejection (进程继续运行):', reason);
});

// 进程退出时保存会话
process.on('SIGINT', () => {
  console.log('\n[Server] 正在保存会话数据...');
  sessionService.saveToFile();
  process.exit(0);
});

process.on('SIGTERM', () => {
  sessionService.saveToFile();
  process.exit(0);
});
