# 哈基米优势发现器 🐱

> 一只聪明的猫猫 AI 顾问，通过对话帮你发现自己都未曾意识到的天赋与优势。
> 基于盖洛普 34 才干框架，融合自然对话 + 量表评估，生成专业三层才干报告。

---

## 功能概览

| 功能 | 说明 |
|------|------|
| **才干对话评估** | 哈基米通过轻松聊天，从你的回答中识别才干信号（Mode A） |
| **量表辅助评估** | 关键才干维度使用李克特量表深度校准（Mode B） |
| **三层专业报告** | Top 5 才干 × 盖洛普风格描述 × 工作坊工具包 |
| **领域匹配推荐** | 选择感兴趣的行业领域，获取最匹配的职位推荐 |
| **AI 语音播报** | 哈基米的回复可通过 MiniMax TTS 合成语音朗读 |
| **演示模式** | 无需 API Key，使用 Mock 数据体验完整流程 |

---

## 技术栈

| 层 | 技术 |
|----|------|
| **前端** | React 18 · Vite 5 · React Router 6 · Tailwind CSS · Recharts |
| **后端** | Node.js · Express 4 · 会话持久化（sessions.json） |
| **LLM** | Kimi-K2.5 / GLM-4.7 / GLM-4.5-Air / MiniMax（via AIping / 智谱AI） |
| **TTS** | MiniMax Speech 2.8 HD（via AIping） |
| **数据库** | 盖洛普 34 才干题库（Markdown，本地加载） |

---

## 项目结构

```
hakimi-advantage-finder/
├── backend/                    # Express 后端
│   ├── routes/
│   │   ├── chat.js             # POST /api/chat — 对话评估主引擎
│   │   ├── analyze.js          # POST /api/analyze — 才干报告生成
│   │   ├── recommend.js        # POST /api/recommend — 职位推荐
│   │   ├── session.js          # GET  /api/session/:id — 会话状态
│   │   ├── tts.js              # POST /api/tts — 语音合成
│   │   └── voice.js            # GET  /api/voice/config — 音色配置
│   ├── services/
│   │   ├── llmService.js       # 统一 LLM 调用 + 多模型 Fallback
│   │   ├── gallupService.js    # 盖洛普题库加载与才干信号检测
│   │   ├── sessionService.js   # 会话管理（内存 + 文件持久化）
│   │   └── ttsService.js       # TTS 合成（AIping 接口封装）
│   ├── middleware/
│   │   └── errorHandler.js     # 全局错误处理
│   ├── prompts.js              # AI 系统提示词（对话 / 分析 / 推荐）
│   ├── server.js               # 入口：Express 应用 + 路由注册
│   ├── .env.example            # 环境变量模板
│   └── package.json
│
├── frontend/                   # React 前端
│   └── src/
│       ├── pages/
│       │   ├── WelcomePage.jsx         # 首页
│       │   ├── ChatAssessmentPage.jsx  # 对话评估主页面
│       │   ├── ResultsPage.jsx         # 才干报告页
│       │   ├── DomainSelectionPage.jsx # 领域选择页
│       │   └── JobRecommendationPage.jsx # 职位推荐页
│       ├── components/
│       │   ├── CatAvatar.jsx           # 哈基米猫猫头像（带表情动效）
│       │   ├── LikertScaleCard.jsx     # Mode B 量表卡片
│       │   ├── RadarChart.jsx          # 才干雷达图
│       │   ├── ThemeCard.jsx           # 单个才干展示卡
│       │   ├── ToolkitPanel.jsx        # 工作坊工具包
│       │   ├── ProgressBar.jsx         # 四维度进度条
│       │   ├── DomainMap.jsx           # 领域分布图
│       │   ├── VoiceButton.jsx         # TTS 播放按钮
│       │   ├── DemoModeButton.jsx      # 演示模式入口
│       │   └── Skeleton.jsx            # 加载骨架屏
│       ├── context/
│       │   ├── ChatContext.jsx         # 全局状态管理（Redux-like）
│       │   └── DemoModeContext.jsx     # 演示模式状态
│       ├── hooks/
│       │   └── useApi.js               # API 请求封装（含 Demo 模式适配）
│       ├── utils/
│       │   └── mockData.js             # 演示模式 Mock 数据
│       ├── App.jsx                     # 路由配置
│       └── main.jsx                    # 入口
│
├── Gallup_Strengths_Bank/      # 34 才干题库（Markdown 格式）
├── Plan-v1.md                  # 项目规划 v1
├── Plan-v2.md                  # 项目规划 v2
└── package.json                # Monorepo 脚本
```

---

## 快速启动

### 前置要求

- Node.js >= 18
- 至少一个 LLM API Key（见下方说明）

### 1. 克隆并安装依赖

```bash
# 安装前后端所有依赖
npm run install:all
```

或分别安装：

```bash
cd backend && npm install
cd frontend && npm install
```

### 2. 配置环境变量

```bash
cp backend/.env.example backend/.env
```

编辑 `backend/.env`，至少填入一个 LLM API Key：

```env
# 推荐：AIping 统一接口（支持 Kimi-K2.5 / MiniMax）
KIMI_K2_API_KEY=your_aiping_api_key

# 或：智谱AI GLM 系列
GLM_API_KEY=your_glm_api_key

# TTS 语音合成（可选）
AIPING_API_KEY=your_aiping_api_key
```

> 没有 API Key？使用[演示模式](#演示模式)体验完整流程，无需任何配置。

### 3. 启动服务

```bash
# 同时启动前后端（推荐）
npm run dev

# 或分别启动
npm run backend   # http://localhost:5175
npm run frontend  # http://localhost:3004
```

### 4. 打开浏览器

```
http://localhost:3004
```

---

## 演示模式

无需 API Key，可直接体验完整评估流程：

在首页点击 **「体验演示」** 按钮即可进入演示模式，所有 AI 回复使用预设 Mock 数据模拟，含延迟效果。

---

## LLM 模型配置

在 `backend/.env` 中可分阶段配置不同模型：

```env
# 对话阶段（需要快速响应，推荐轻量模型）
CHAT_LLM_MODEL=kimi-k2-5

# 报告生成阶段（需要高质量输出，推荐强模型）
ANALYZE_LLM_MODEL=glm-4.7
ANALYZE_LLM_FALLBACK=kimi-k2-5

# 全局默认 Fallback
LLM_PROVIDER=glm-4.7-flash
```

支持的模型：

| 模型 | 接口来源 | 适用阶段 |
|------|---------|---------|
| `kimi-k2-5` | AIping | 对话 / 分析 |
| `glm-4.7` | 智谱AI | 分析（推荐） |
| `glm-4.5-air` | 智谱AI | 对话 |
| `glm-4.7-flash` | AIping | 全局 Fallback |
| `minimax-m2.5` | AIping | 对话 |

---

## 语音配置（TTS）

支持 MiniMax TTS 通过 AIping 调用，可在聊天页面右上角「🎵 音色」按钮切换：

| 音色 ID | 名称 |
|---------|------|
| `female-shaonv` | 少女音色（默认） |
| `qiaopi_mengmei` | 俏皮萌妹 |
| `female-yujie` | 御姐音色 |
| `female-tianmei` | 甜美女性 |
| `male-qn-jingying` | 精英青年 |
| `Chinese (Mandarin)_Gentleman` | 温润男声 |
| `Chinese (Mandarin)_Radio_Host` | 电台男主播 |

TTS 为可选功能，未配置 `AIPING_API_KEY` 时自动静默降级。

---

## 评估流程

```
首页 → 开始对话
    ↓
ChatAssessmentPage（5+ 轮对话）
  ├─ Mode A：自然对话，哈基米提问，LLM 提取才干信号
  └─ Mode B：量表评分，对关键才干进行精准校准
    ↓
生成报告（/results）
  ├─ Top 5 才干 + 盖洛普描述 + 证据引用
  ├─ 四维度雷达图（执行力 / 影响力 / 关系建立 / 战略思维）
  └─ 工作坊工具包（优势激活 / 盲点提示 / 本周微行动）
    ↓
领域选择（/domain）→ 职位推荐（/jobs）
```

---

## 开发说明

### 端口约定

| 服务 | 端口 |
|------|------|
| 前端 Vite Dev Server | 3004 |
| 后端 Express API | 5175 |

前端通过 Vite 代理将 `/api/*` 请求转发到后端，生产环境需自行配置反向代理。

### 会话持久化

后端将活跃会话写入 `backend/data/sessions.json`，重启服务后会话数据保留。

### 题库说明

`Gallup_Strengths_Bank/` 目录包含 34 个才干维度的情景问题（本科生 / 研究生版本）与量表陈述，由 `gallupService.js` 在启动时加载，注入对话系统提示词。

---

## 常见问题

**Q: 启动后前端报 API 错误？**
确认后端已启动（端口 5175），且 `backend/.env` 中 API Key 已填写。

**Q: TTS 报 400 错误 `voice id not exist`？**
检查 `AIPING_VOICE_ID` 是否为上方表格中的有效音色 ID，不要使用不存在的 ID（如 `male-qinchen`、`male-gufeng`）。

**Q: 对话几轮后 NPC 重置到初始状态？**
确认后端使用最新代码（量表提交使用 `__scale_answer__` 哨兵消息），重启后端服务：
```bash
cd backend && node server.js
```

**Q: 如何只体验 UI 不调用 AI？**
在首页点击「体验演示」进入演示模式，无需任何 API Key。

📄 License
MIT — feel free to fork and adapt for your own interview practice tools.
