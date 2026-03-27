# Hakimi Advantage Discoverer — Plan-v1.md
**Architectural Remediation Plan**
Date: 2026-03-27
Author: Senior Full-Stack Architect (AI-assisted)

---

## Executive Summary

Three critical defects prevent the "哈基米优势发现器" from delivering the user experience promised in the original SubAgent Prompt. This plan specifies **what** to fix, **where** to touch the codebase, and **how** each fix integrates end-to-end — without any code. Implementation agents can pick up individual sections as isolated work units.

---

## Scope of Broken Areas

| # | Area | Root Cause | Severity |
|---|------|-----------|----------|
| 1 | Demo Mode non-functional | `useApi.js` mock paths return thin stubs; `mockData.js` conversation is only 3 shallow messages; ResultsPage never receives pre-set Top-5 data | HIGH |
| 2a | Hakimi avatar too small | CSS/layout in `ChatAssessmentPage.jsx` renders avatar at ~32-40px; no visual persona presence | MEDIUM |
| 2b | Dialogue logic broken | `chat.js` advances theme purely on message count; AI has no awareness of what signal was extracted; round ceiling is 12 messages but UX feels like 3-4; no persistent action buttons | HIGH |
| 3 | Report too shallow | `ResultsPage.jsx` shows only a radar chart + talent name list; no full theme descriptions, no domain distribution narrative, no actionable toolkit | HIGH |

---

## Section 1 — Demo Mode: Full Wiring

### 1.1 Current State (Diagnosis)

- `DemoModeContext.jsx` exposes `isDemoMode` and `simulateDelay()` but the mock responses in `useApi.js` are thin: `sendMessage()` returns a fixed 3-item conversation and a hardcoded `isComplete: true` after index ≥ 4.
- `mockData.js` has only 3 conversation messages — far too few to feel like a real session.
- `analyzeResults()` in `useApi.js` returns `mockData.analysis` directly but that object lacks the new three-layer structure needed by the refactored ResultsPage.
- There is **no automatic trigger** to transition from mock chat → mock report; the user must manually click "生成报告" without any visual cue.

### 1.2 Target Behavior

| Stage | Trigger | Expected Outcome |
|-------|---------|-----------------|
| Demo ON | Toggle in header | `isDemoMode = true`; banner visible |
| Rounds 1-3 | User sends any message | Hakimi responds with richly-scripted cat-persona reply; progress bars animate realistically |
| After round 3 | Auto | System inserts a "Hakimi insight" message + "我已经了解你足够多了，来看看你的优势报告吧！" prompt; two action buttons appear |
| User clicks "View Results" | Click | `analyzeResults()` returns pre-set Top-5 object; NavigateTo ResultsPage |
| ResultsPage | Mount | Pre-set professional report renders without any API call |

### 1.3 Files to Change

#### `frontend/src/utils/mockData.js` — Owner: Data Agent

**Extend to include:**

1. **Extended mock conversation** (8 messages, 4 rounds):
   - Round 1: Hakimi asks about a recent project; user replies with short sentence.
   - Round 2: Hakimi extracts "Achiever" signal; asks follow-up about feelings after task completion.
   - Round 3: Hakimi extracts "Analytical" signal; asks how they handle data/uncertainty.
   - Round 4: Hakimi asks about leading a group; extracts "Command" signal.
   - Each AI message must include `[Signal: Achiever +2]` style tags embedded in text for visual authenticity.
   - Progress mock sequence must animate believably: after round 2 execution≥40%, after round 3 strategic≥50%, after round 4 all≥65%.

2. **Pre-set Top-5 analysis object** matching the NEW three-layer schema (see Section 3):
   ```
   mockData.fullAnalysis = {
     themes: [
       { rank: 1, nameZh: "成就", nameEn: "Achiever", domain: "executing",
         tagline: "...", description: "...(3-4句全文)...",
         evidence: "...", score: 92,
         toolkit: { strength: "...", blindspot: "...", action: "..." } },
       ... × 5
     ],
     domainScores: { executing: 78, influencing: 45, relationship: 60, strategic: 72 },
     domainNarrative: "你的核心优势集中在执行域与战略思维域...",
     summary: "...",
     hakimiVerdict: "喵~ 你就是那种把想法变成现实的猫！"
   }
   ```

3. **Mock progress sequence** must have 5 checkpoints (not current 3) with realistic incremental values.

#### `frontend/src/hooks/useApi.js` — Owner: Frontend Agent

**`sendMessage()` demo branch:**
- Track call count inside `isDemoMode` using a `ref` or closure counter stored on `DemoModeContext`.
- Return `mockData.demoConversation[callIndex]` with proper `progress`, `mode`, `currentTheme`, `skipDetected`.
- On call index ≥ 3 (round 4), inject a special `isComplete: true` and `autoPromptReport: true` flag.

**`analyzeResults()` demo branch:**
- Return `mockData.fullAnalysis` immediately (with 1200ms simulated delay for realism).
- Ensure returned object shape exactly matches the new three-layer schema.

#### `frontend/src/context/DemoModeContext.jsx` — Owner: Frontend Agent

- Add `demoRound` counter (0-based) to context state, increment on each `sendMessage` call.
- Expose `isDemoComplete` computed boolean (`demoRound >= 3`).
- Add `resetDemo()` method called on session reset.

#### `frontend/src/pages/ChatAssessmentPage.jsx` — Owner: Frontend Agent

- In `processResponse()`: check for `data.autoPromptReport === true`.
- When true: append a special Hakimi system message ("已探索完毕！"), then show the two persistent action buttons (see Section 2 for button spec).
- Demo flow must not require user to know to click "生成报告".

---

## Section 2 — Chat Interface: Avatar + Dialogue Engine

### 2.1 Hakimi Avatar — Size & Presence

#### Current State
The avatar is rendered as a small inline icon (~32-40px) beside each AI message bubble. It reads as a decoration, not a persona.

#### Target State
- **Persistent sidebar avatar** (not per-message) in desktop layout: 80×80px minimum, ideally 100×100px with a soft shadow and gold ring border.
- **Per-message avatar** (mobile or narrow layout): 48×48px; currently ~32px.
- Avatar should express state: idle (normal), thinking (slight opacity pulse), speaking (gold ring glow animation).
- Cat image source: `cataas.com` with local SVG fallback (already implemented — just needs sizing).
- Avatar component lives in `ChatAssessmentPage.jsx` and `CatAvatar.jsx`; both need updated size props.

#### Files to Change
- `frontend/src/components/CatAvatar.jsx` — Owner: Frontend Agent
  - Add `size` prop: `'sm'` (48px) | `'md'` (80px) | `'lg'` (100px).
  - Add `state` prop: `'idle'` | `'thinking'` | `'speaking'` — drives CSS animation class.
  - Gold ring: 2px solid `#C9A84C` with 4px `box-shadow: 0 0 0 4px rgba(201,168,76,0.2)`.
  - Thinking state: `opacity: 0.7` with slow pulse keyframe.
  - Speaking state: ring glow (`box-shadow` animated 0→8px radius).

- `frontend/src/pages/ChatAssessmentPage.jsx` — Owner: Frontend Agent
  - Add a fixed/sticky avatar panel on the left side (desktop ≥768px) showing `<CatAvatar size="lg" state={avatarState} />`.
  - `avatarState` computed: `isTyping → 'thinking'`, TTS active → `'speaking'`, else `'idle'`.
  - Per-message avatars use `size="sm"`.

### 2.2 Dynamic Talent-Probing Dialogue Engine

#### Current State (Root Cause Analysis)

`chat.js` progression logic:
- Advances `themeIndex` when skip is detected or message count thresholds hit.
- The LLM prompt injects a "seed question" per theme but does **not** carry forward extracted signals.
- The backend marks `isComplete: true` when `messageCount >= 12` OR all progress dimensions ≥ 70 — whichever comes first.
- **Critical gap**: the AI has no memory of what talent evidence it has gathered; each turn it starts fresh within the conversation history, but the **system prompt does not update** to reflect accumulated signals.
- Result: conversations feel scripted because the follow-up questions are random seeds, not reactive probes.

#### Target Architecture: Signal-Aware Probing Engine

The core insight is: **the system prompt must be updated each turn to inject the accumulated signal state**, so the LLM can ask genuinely reactive follow-up questions.

##### Backend: `backend/routes/chat.js` — Owner: Backend Agent

**Signal Extraction:**
- After each LLM response, parse for `[Signal: ThemeName +N]` tags (already present in current prompt design).
- Accumulate into `session.assessmentState.signalTags: { [theme]: totalScore }`.
- When a theme accumulates score ≥ 6, mark it as "confirmed" (`session.assessmentState.confirmedThemes`).
- Confirmed themes are NOT re-probed; the engine moves on.

**Minimum Round Enforcement:**
- Add `session.assessmentState.roundCount` (increments each user→AI exchange).
- `isComplete` must NOT be set true until `roundCount >= 5` AND at least 3 themes confirmed.
- This overrides the current message-count-based completion.
- Maximum rounds: 15 (prevents infinite loop).

**Dynamic System Prompt Injection:**
- Each turn: call `buildChatSystemPrompt(eduLevel, signalState)` where `signalState` is a formatted string:
  ```
  已确认才干: 成就(Achiever, 9分), 分析(Analytical, 7分)
  待探索才干: 统筹, 责任, 关联 (优先: 统筹)
  本轮目标: 深挖"统筹"维度，追问用户上次提到的"同时管理多个项目"细节
  ```
- The LLM therefore knows exactly what it's looking for and what evidence it has.

**Prompt Update:** `backend/prompts.js` — Owner: AI Prompt Agent

`buildChatSystemPrompt(eduLevel, signalState)` signature change:
- New `signalState` parameter containing confirmed themes, pending themes, and conversation summary.
- New instruction block: "根据以下信号状态，生成追问..."
- Require AI to always end each response with ONE clear follow-up question (no multi-question turns).
- Require AI to continue emitting `[Signal: ...]` tags for backend parsing.
- Add explicit instruction: "在第5轮之前，不要提议生成报告；第5轮起，如果你感觉信号足够，在回复末尾加上 [ReadyForReport: true]".

**Completion Signal:**
- Backend parses `[ReadyForReport: true]` from AI response OR `roundCount >= 15`.
- When detected: set `isComplete: true` in response; do NOT auto-navigate — let frontend show the two buttons.

##### Frontend: `ChatAssessmentPage.jsx` — Owner: Frontend Agent

**Two Persistent Action Buttons:**

These replace the current single "生成报告" button. Spec:

```
┌────────────────────────────────────────┐
│  继续聊天 (Keep Chatting)              │  ← Secondary style, left
│  立即查看结果 (View Results Now)       │  ← Gold primary, right
└────────────────────────────────────────┘
```

- **Visibility rules:**
  - Hidden during rounds 1-4 (while `roundCount < 5` and `!isComplete`).
  - Appear (slide up from bottom) once `isComplete === true` OR `roundCount >= 5`.
  - "Keep Chatting" stays active as long as `roundCount < 15`.
  - "View Results Now" always active once visible.

- **"Keep Chatting" behavior:**
  - Sends a special sentinel message `__continue__` OR simply re-enables the input box.
  - Backend recognizes `__continue__` as user choosing to keep going; resets `[ReadyForReport]` signal.
  - Does NOT restart the session; continues probing.

- **"View Results Now" behavior:**
  - Calls `analyzeResults(sessionId, messages)`.
  - Shows loading overlay.
  - Navigates to ResultsPage on success.

- **Layout:** sticky bar at the bottom of the message pane (above input box), visible above keyboard on mobile.

**Round Counter Display:**
- Small indicator in the chat header: "探索进度: 第 N 轮" with a dot-progress indicator (5 dots, filled as rounds complete).
- Shows only once round 2+ has been reached (avoid intimidating new users on round 1).

---

## Section 3 — Professional Result Report: Three-Layer Architecture

### 3.1 Current State (Diagnosis)

`ResultsPage.jsx` currently renders:
- A loading overlay (3s fake progress).
- A top-line summary string.
- A flat list of Top 5 talent names with domain color badges.
- A single `RadarChart` from recharts with 4 domain axes.
- Copy-to-clipboard and screenshot buttons.

Missing vs. official Gallup standard:
- No full theme descriptions (Gallup reports have 200-400 word profiles per theme).
- No four-domain distribution map with narrative.
- No actionable toolkit / coaching advice per theme.
- Visually plain — a lonely radar chart with a list reads like a JSON dump.

### 3.2 Target Three-Layer Report Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: Signature Themes (Top 5 Cards)                     │
│  Full theme description + evidence from conversation          │
│  Rank badge + domain color + score meter                     │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: Four-Domain Distribution Map                       │
│  Bar chart + domain narrative paragraph + domain strengths   │
│  Radar replaced by horizontal bar distribution               │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3: Hakimi Career Toolkit                              │
│  Per-theme: Strength activation / Blind spot / Action item  │
│  "哈基米说" coaching quote per theme                         │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Layer 1: Signature Themes

**Card Design (per theme):**
```
┌─ Rank #1 ─── [EXECUTING] ──────────────────────────────────┐
│  成就 · Achiever                               Score: 92/100│
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (animated score bar)        │
│                                                              │
│  [Theme Description — 3-4 sentences from Gallup canon]      │
│  "成就主题的人内心燃烧着一团永不熄灭的火焰..."              │
│                                                              │
│  📌 对话中的证据                                            │
│  "当你提到同时管理3个项目还觉得充实时..."                   │
└──────────────────────────────────────────────────────────────┘
```

**Data requirements (new fields in `/api/analyze` response):**
- `themes[i].tagline` — one-line theme summary (≤20 chars)
- `themes[i].description` — 3-4 sentence description in Gallup style
- `themes[i].evidence` — specific quote/reference from conversation (AI-generated)
- `themes[i].score` — 0-100 confidence score (already exists, but now must be required field)

**Visual spec:**
- Cards expand/collapse on click (default: top 1 expanded, 2-5 collapsed).
- Domain color left border (4px): executing=#3B82F6, influencing=#F59E0B, relationship=#10B981, strategic=#8B5CF6.
- Rank badge: circular gradient badge (gold #1, silver #2, bronze #3, grey #4/#5).
- Animated score bar: fills on mount with 800ms ease-out transition.

### 3.4 Layer 2: Four-Domain Distribution Map

**Replace radar chart with:**

1. **Horizontal bar chart** (4 bars, domain colors):
   ```
   执行域 ████████████████░░░░  78%
   战略域 ████████████░░░░░░░░  72%
   关系域 ████████░░░░░░░░░░░░  60%
   影响域 ███████░░░░░░░░░░░░░  45%
   ```
   - Built with pure CSS or recharts `BarChart` (horizontal).
   - Each bar animates on mount.
   - Domain icon (emoji or SVG) left of each bar.

2. **Domain narrative** (AI-generated, 2 sentences each):
   - Placed in a 2×2 grid card layout, one card per domain.
   - Each card: domain name + score chip + 2-sentence description of what this means for the user.
   - Highlight the top 2 domains with a subtle gold accent.

3. **"你的优势地图" heading** styled like a certification section.

**Data requirements:**
- `domainScores: { executing, influencing, relationship, strategic }` (already exists)
- `domainNarrative: { executing: "...", influencing: "...", relationship: "...", strategic: "..." }` — NEW field AI must generate

### 3.5 Layer 3: Hakimi Career Toolkit

**Per-theme toolkit card:**
```
┌── 成就 Achiever — 哈基米建议 ────────────────────────────┐
│                                                            │
│  💪 发挥你的优势                                          │
│  "在项目初期承担目标设定的责任..."                        │
│                                                            │
│  ⚠️ 注意盲点                                             │
│  "成就感驱动可能让你对休息感到内疚..."                    │
│                                                            │
│  ✅ 本周行动                                              │
│  "写下你本周3个小目标，完成后给自己画个 ✓"               │
│                                                            │
│  🐾 哈基米说: "喵~ 你就是那种把计划变成现实的猫！        │
│     记住，成就感是你的燃料，但别忘了加油 🐾"              │
└────────────────────────────────────────────────────────────┘
```

**Data requirements (new fields):**
- `themes[i].toolkit.strength` — 1-2 sentences: how to activate this theme
- `themes[i].toolkit.blindspot` — 1-2 sentences: common pitfall for this theme
- `themes[i].toolkit.action` — 1 concrete micro-action for this week
- `themes[i].toolkit.hakimiQuote` — Hakimi's cat-persona coaching quip (≤50 chars)

**Visual spec:**
- Horizontal tab layout: clicking a theme tab switches to its toolkit card.
- Tabs show theme rank number + short name.
- "哈基米说" quote has the cat avatar (small, 40px) next to it.
- Cards use cream (`#FAFAF8`) background with navy text for high contrast readability.

### 3.6 Visual & Layout Overhaul for ResultsPage

**Page structure (top-to-bottom):**

```
[Header] 哈基米优势报告 · [User's name or "探索者"]
[Subheader] 生成时间 + 分享/下载按钮 (right-aligned)

[Hero Banner] hakimiVerdict — large serif gold text on navy
   + big cat avatar (100px) with speaking ring

[Section 1] 你的五大签名优势   ← Layer 1 cards
[Section 2] 四域分布地图       ← Layer 2 bars + narratives
[Section 3] 哈基米职场工具箱   ← Layer 3 toolkit tabs

[Footer] 开始职位匹配 (gold CTA button) → DomainSelectionPage
```

**Certification-grade touches:**
- Top-right corner: small "哈基米认证" stamp SVG (circular, gold, with cat paw icon).
- Section dividers: thin gold horizontal rule with diamond center.
- Print/PDF mode: hide action buttons, keep all content, use white background.

---

## Section 4 — LLM Routing Changes

### 4.1 Chat Phase: Kimi-K2.5 via AIping

**Target:** All `POST /api/chat` calls use Kimi-K2.5.

**Changes needed in `backend/services/llmService.js`:**
- Add `kimi-k2-5` entry to `MODEL_MAP`:
  - Provider type: `openai-compatible`
  - Base URL: AIping proxy endpoint for Kimi-K2.5 (from `.env`: `KIMI_K2_BASE_URL`, `KIMI_K2_API_KEY`)
  - Model name: `kimi-k2.5` (confirm exact model ID with AIping docs)
- `chat.js` must explicitly call `llmService.chat(messages, systemPrompt, { model: 'kimi-k2-5' })` rather than relying on default env model.
- Rationale: Kimi-K2.5 is better at natural conversation and Chinese colloquial register (critical for Hakimi persona).

**Failover chain for chat:** `kimi-k2-5` → `glm-4.7` → `glm-4.7-flash`

### 4.2 Report Generation: GLM-4.7 / GLM-4-flash

**Target:** `POST /api/analyze` uses GLM-4.7 (higher accuracy for structured JSON output) with GLM-4-flash as fast failover.

**Changes needed:**
- `analyze.js` explicitly requests `model: 'glm-4.7'`.
- On error (timeout or API failure), retry with `model: 'kimi-k2-5'`.
- Rationale: Report generation is a one-shot structured JSON task; GLM-4.7 reliably outputs valid JSON schemas while Kimi can sometimes add prose.

### 4.3 `.env` Additions Required

```
# Kimi-K2.5 via AIping
KIMI_K2_BASE_URL=https://api.aipng.cn/v1   # confirm with AIping
KIMI_K2_API_KEY=<key>
KIMI_K2_MODEL=kimi-k2.5                    # exact model string TBD

# Default chat model
CHAT_LLM_MODEL=kimi-k2.5

# Default analyze model
ANALYZE_LLM_MODEL=glm-4.7
ANALYZE_LLM_FALLBACK=kimi-k2.5
```

---

## Section 5 — `/api/analyze` Prompt Upgrade

### 5.1 Current `ANALYZE_SYSTEM_PROMPT` Gap

The current prompt returns a minimal object:
```json
{ "talents": [{ "rank", "name", "domain", "description", "evidence", "score" }],
  "domainScores": {...}, "summary": "..." }
```

This is missing all three-layer fields required by the new ResultsPage.

### 5.2 New Required Output Schema

`backend/prompts.js` — `ANALYZE_SYSTEM_PROMPT` must request:

```json
{
  "themes": [
    {
      "rank": 1,
      "nameZh": "成就",
      "nameEn": "Achiever",
      "domain": "executing",
      "tagline": "永不熄灭的内驱之火",
      "description": "3-4 sentences in Gallup coaching style...",
      "evidence": "specific quote from conversation...",
      "score": 92,
      "toolkit": {
        "strength": "...",
        "blindspot": "...",
        "action": "...",
        "hakimiQuote": "喵~ ..."
      }
    }
  ],
  "domainScores": { "executing": 78, "influencing": 45, "relationship": 60, "strategic": 72 },
  "domainNarrative": {
    "executing": "...",
    "influencing": "...",
    "relationship": "...",
    "strategic": "..."
  },
  "summary": "...",
  "hakimiVerdict": "喵~ ..."
}
```

**Prompt engineering requirements:**
- Instruct AI to write `description` in Gallup's official coaching language (not generic praise).
- `evidence` must reference a SPECIFIC moment from the conversation history — not a paraphrase of the theme definition.
- `toolkit.action` must be a micro-action completable this week (not vague advice like "be more assertive").
- `hakimiQuote` must be in Hakimi's cat persona voice, ≤50 characters, always ends with 🐾.
- `domainNarrative` should contextualize the score (e.g., "你在执行域的高分意味着...").
- Output MUST be valid JSON only — no prose wrapper, no markdown code fences in response.

### 5.3 JSON Parsing Robustness in `analyze.js`

The current regex-based JSON extraction is fragile. Upgrade:
- Primary: `JSON.parse(response)` directly.
- Fallback 1: strip markdown code fences ` ```json ... ``` `.
- Fallback 2: regex extract `{...}` first JSON object.
- Fallback 3: return a structured error + log the raw response.
- Validate required fields (`themes` array length 3-5, `domainScores` has all 4 keys) before returning to frontend.

---

## Section 6 — Implementation Work Units

The following are self-contained work units assignable to independent agents:

### Unit A: Mock Data Upgrade
**Owner:** Data Agent
**Files:** `frontend/src/utils/mockData.js`
**Deliverable:** Extended 8-message demo conversation + `fullAnalysis` matching new 3-layer schema.
**Dependencies:** Must know final schema before starting (defined in Section 5.2 above).

### Unit B: Demo Mode Wiring
**Owner:** Frontend Agent
**Files:** `DemoModeContext.jsx`, `useApi.js`, `ChatAssessmentPage.jsx`
**Deliverable:** Demo counter logic, auto-complete trigger after round 3, action buttons appear.
**Dependencies:** Unit A must be complete.

### Unit C: Avatar Enlargement
**Owner:** Frontend Agent
**Files:** `CatAvatar.jsx`, `ChatAssessmentPage.jsx`
**Deliverable:** Size + state props, persistent sidebar layout desktop, per-message 48px mobile.
**Dependencies:** None (isolated CSS/layout change).

### Unit D: Signal-Aware Probing Engine
**Owner:** Backend Agent
**Files:** `backend/routes/chat.js`, `backend/services/sessionService.js`
**Deliverable:** Signal accumulation, `confirmedThemes`, `roundCount`, `[ReadyForReport]` parsing, dynamic prompt injection, minimum 5 rounds enforcement.
**Dependencies:** Unit E must be started simultaneously.

### Unit E: Prompt Upgrades
**Owner:** AI Prompt Agent
**Files:** `backend/prompts.js`
**Deliverable:** `buildChatSystemPrompt(eduLevel, signalState)` updated signature; `ANALYZE_SYSTEM_PROMPT` with new schema.
**Dependencies:** None (can run in parallel with D).

### Unit F: LLM Routing
**Owner:** Backend Agent
**Files:** `backend/services/llmService.js`, `backend/.env`, `backend/routes/chat.js`, `backend/routes/analyze.js`
**Deliverable:** Kimi-K2.5 model entry; explicit model selection per route; failover chain.
**Dependencies:** Requires AIping Kimi-K2.5 endpoint details (confirm before starting).

### Unit G: Action Buttons + Round UI
**Owner:** Frontend Agent
**Files:** `ChatAssessmentPage.jsx`
**Deliverable:** Two persistent buttons (Keep Chatting / View Results Now) with visibility rules; round counter dot-progress in header.
**Dependencies:** Unit D (needs `isComplete`, `roundCount` in API response).

### Unit H: Three-Layer Report UI
**Owner:** Frontend Agent
**Files:** `ResultsPage.jsx`, new `ThemeCard.jsx`, new `DomainMap.jsx`, new `ToolkitPanel.jsx`
**Deliverable:** Full three-section report layout; Layer 1 expandable cards; Layer 2 horizontal bars + narrative grid; Layer 3 toolkit tabs; hakimiVerdict hero; certification stamp.
**Dependencies:** Unit E must be done (schema defined); Unit F should be done (real data available for testing).

### Unit I: Analyze Route Upgrade
**Owner:** Backend Agent
**Files:** `backend/routes/analyze.js`
**Deliverable:** New schema validation; robust JSON parsing; explicit GLM-4.7 model selection with flash fallback.
**Dependencies:** Unit E (prompt schema).

---

## Section 7 — Data Flow After All Changes

```
User message
    │
    ▼
POST /api/chat (chat.js)
    │  ├─ detectSkip()
    │  ├─ session.assessmentState.roundCount++
    │  ├─ buildChatSystemPrompt(eduLevel, signalState)  ← new arg
    │  ├─ llmService.chat(..., { model: 'kimi-k2-5' })  ← new routing
    │  ├─ parseSignalTags(response) → update signalTags
    │  ├─ detectReadyForReport(response) → isComplete
    │  └─ return { reply, progress, isComplete, roundCount, mode, ... }
    │
    ▼
ChatAssessmentPage.jsx
    │  ├─ processResponse(): update ChatContext
    │  ├─ show round counter dots
    │  ├─ if isComplete || roundCount>=5 → show action buttons
    │  └─ avatar state: thinking while isTyping, speaking while TTS
    │
    ▼ (user clicks "立即查看结果")
POST /api/analyze (analyze.js)
    │  ├─ llmService.chat(..., { model: 'glm-4.7' })    ← new routing
    │  ├─ JSON parse with fallback chain
    │  ├─ validate new 3-layer schema fields
    │  └─ return fullAnalysis object
    │
    ▼
ResultsPage.jsx
    ├─ Layer 1: ThemeCard × 5 (expandable)
    ├─ Layer 2: DomainMap (bars + narrative grid)
    └─ Layer 3: ToolkitPanel (tabs per theme)
```

---

## Section 8 — Risk Register

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Kimi-K2.5 endpoint string differs from assumed | Medium | Confirm with AIping before Unit F; code accepts `KIMI_K2_MODEL` env var |
| GLM-4.7 returns malformed JSON for new schema | Medium | Robust parse fallback chain (Unit I); prompt explicitly forbids markdown fences |
| Signal tag parsing brittle if LLM omits tags | Medium | Backend estimates signal from keyword matching as fallback; threshold tunable |
| 3-layer report causes frontend bundle bloat | Low | Split ThemeCard, DomainMap, ToolkitPanel into lazy-loaded components |
| Demo mode counter resets on page refresh | Low | Store `demoRound` in `sessionStorage` keyed to demo session ID |
| Minimum 5-round enforcement frustrates users who gave rich answers | Low | Expose "I've given enough" option only after round 3; not gating at 5 |

---

## Section 9 — Out of Scope (This Plan)

- Voice TTS improvements (already implemented in previous sprint)
- Mode B Likert scale changes (already implemented)
- Job recommendation page changes
- Mobile PWA packaging
- User authentication / persistent accounts
- Gallup bank `.md` file updates (structure already stable)

---

## Appendix A — File Change Matrix

| File | Unit | Type | Notes |
|------|------|------|-------|
| `frontend/src/utils/mockData.js` | A | Modify | Extend conversation + fullAnalysis |
| `frontend/src/context/DemoModeContext.jsx` | B | Modify | Add demoRound counter |
| `frontend/src/hooks/useApi.js` | B | Modify | Demo branch uses new schema |
| `frontend/src/components/CatAvatar.jsx` | C | Modify | size + state props |
| `frontend/src/pages/ChatAssessmentPage.jsx` | B,C,G | Modify | Multiple concerns; coordinate carefully |
| `backend/routes/chat.js` | D | Modify | Signal engine + roundCount |
| `backend/services/sessionService.js` | D | Modify | New assessmentState fields |
| `backend/prompts.js` | E | Modify | signalState param + new analyze schema |
| `backend/services/llmService.js` | F | Modify | kimi-k2-5 model entry |
| `backend/routes/analyze.js` | I | Modify | New schema validation + model routing |
| `frontend/src/pages/ResultsPage.jsx` | H | Modify | Three-layer layout |
| `frontend/src/components/ThemeCard.jsx` | H | **New** | Layer 1 expandable card |
| `frontend/src/components/DomainMap.jsx` | H | **New** | Layer 2 bars + narrative |
| `frontend/src/components/ToolkitPanel.jsx` | H | **New** | Layer 3 tab panel |
| `backend/.env` / `.env.example` | F | Modify | New Kimi keys + model vars |

---

*End of Plan-v1.md*
