# Hakimi Advantage Discoverer — Plan-v2.md
**Architectural Remediation Plan (v2)**
Date: 2026-03-27
Author: Senior Full-Stack Architect (AI-assisted)

---

## Executive Summary

Two critical areas remain broken after Plan-v1 implementation. This plan diagnoses root causes from actual code inspection and prescribes targeted fixes. Each section is an independent work unit.

| # | Area | Root Cause | Severity |
|---|------|-----------|----------|
| 1 | Demo Mode non-functional | Wiring works but UX is broken: (a) no demo toggle accessible from UI, (b) `useApi.js` demo branch for `sendMessage` constructs response inline instead of using `getNextDemoResponse()` return shape directly — fields like `autoPromptReport` are hardcoded `false` instead of reading from `demoConversation[]`, (c) greeting (round 0) fires `getNextDemoResponse()` advancing the counter prematurely, (d) after round 4 the demo gets stuck repeating the last entry forever | HIGH |
| 2 | Report too shallow vs. Gallup standard | Components (ThemeCard, DomainMap, ToolkitPanel) exist and render correctly, but: (a) `ANALYZE_SYSTEM_PROMPT` doesn't enforce minimum 5 themes or score differentiation, (b) report has no "overall talent DNA" visualization or domain-balance interpretation, (c) no PDF/image export with branded layout, (d) ToolkitPanel only shows if `toolkit.strength` exists — fragile guard, (e) no "How to read this report" guidance for users, (f) CertStamp is decorative SVG with no date/session context | MEDIUM-HIGH |

---

## Section 1 — Demo Mode: Full End-to-End Fix

### 1.1 Diagnosis (from actual code)

**What exists and works:**
- `DemoModeContext.jsx` (line 24): `getNextDemoResponse()` correctly indexes into `demoConversation[]` and advances `demoRoundRef`
- `mockData.js`: 5 high-quality entries (rounds 0-4) with proper fields (`autoPromptReport: true` on round 4, `isComplete: true`, `readyForReport: true`)
- `useApi.js` (line 28-51): `sendMessage()` in demo mode calls `getNextDemoResponse()` and maps its fields
- `useApi.js` (line 60-63): `analyzeResults()` in demo mode returns `demoFullAnalysis` (complete 3-layer schema)

**What is broken:**

1. **No demo toggle in UI.** `DemoModeContext` exposes `toggleDemoMode()` but no button exists in any page to call it. Users cannot activate demo mode.

2. **Greeting double-advances the counter.** `ChatAssessmentPage.jsx` line 157 calls `initSession()` on mount which calls `sendMessage(sessionId, '', [])`. In demo mode, `useApi.js` line 28-46 calls `getNextDemoResponse()` — this consumes round 0 (the greeting). Then the user's first actual message consumes round 1. This is correct IF the greeting is entry 0. But the greeting text in `demoConversation[0]` doesn't match `GREETING_MESSAGE` from `chat.js` — in demo mode the backend is never called, so the greeting comes from mock data. This works but may confuse if the greeting tone differs from non-demo mode.

3. **Round 4 stuck loop.** `getNextDemoResponse()` (DemoModeContext line 27) clamps index to `demoConversation.length - 1` (= 4) and never goes beyond. If the user sends a 5th message in demo mode, they get round 4's response again (with `isComplete: true` and `autoPromptReport: true`). The chat page should either (a) block further input after `isComplete`, or (b) the demo should have a graceful "you've already completed the demo" response.

4. **`isDemoComplete` not consumed.** `DemoModeContext` computes `isDemoComplete` but no component reads it. It should trigger the action buttons or auto-navigate to results.

5. **`resetDemo()` never called.** When a user navigates away from chat and back, or starts a new session, the demo counter isn't reset. Stale state persists.

### 1.2 Remediation Plan

#### Unit A — Add Demo Toggle Button
**File:** `frontend/src/pages/ChatAssessmentPage.jsx`
**Location:** Header area (near voice toggle button, line 289-293)
**Action:**
- Add a small toggle button (e.g., 🎭 icon or "Demo" label) that calls `toggleDemoMode()` from `useDemoMode()`
- Only show in development mode (`import.meta.env.DEV`) OR always show with a subtle design
- When toggled ON: call `resetDemo()`, clear chat messages via `dispatch({ type: ActionTypes.RESET })`, re-trigger `initSession()`
- When toggled OFF: same reset flow
- Visual indicator: small badge or border color change on the toggle

**Also consider:** `frontend/src/pages/LandingPage.jsx` — add a "Demo Mode" button on the landing page that sets demo mode before navigating to `/chat`

#### Unit B — Fix Greeting & Counter Alignment
**File:** `frontend/src/hooks/useApi.js`
**Action:**
- In `sendMessage()` demo branch: when `message` is empty (greeting request), return a hardcoded greeting response WITHOUT calling `getNextDemoResponse()`. This preserves round 0 for the first real user message.
- OR: Keep current behavior (round 0 = greeting from demoConversation) but ensure `demoConversation[0]` is clearly the greeting and subsequent entries are response-to-user-message pairs. Current data already does this correctly — **no change needed if we accept demoConversation[0] as the greeting**.

**Decision:** Keep current behavior. The greeting from `demoConversation[0]` is appropriate. Document this in a code comment.

#### Unit C — Handle Demo Completion Gracefully
**File:** `frontend/src/hooks/useApi.js`
**Action:**
- After `getNextDemoResponse()` returns an entry with `isComplete: true`, subsequent calls should return a fixed "demo complete" response:
  ```
  { reply: "喵~ 演示对话已结束啦！点击「立即查看结果」看看你的才干报告吧~ 🐾",
    isComplete: true, readyForReport: true, autoPromptReport: true, roundCount: 5 }
  ```
- This prevents the "stuck loop" of repeating round 4's full response

**File:** `frontend/src/pages/ChatAssessmentPage.jsx`
**Action:**
- When `isComplete` is true in demo mode, disable the input field (already done via `inputDisabled` at line 269) and ensure action buttons are visible (already done via `buttonsVisible` at line 270). Verify this works end-to-end.

#### Unit D — Wire `isDemoComplete` and `resetDemo()`
**File:** `frontend/src/pages/ChatAssessmentPage.jsx`
**Action:**
- Import `useDemoMode` and destructure `{ isDemoMode, isDemoComplete, resetDemo }`
- On `isDemoComplete` becoming true: automatically show action buttons (redundant with `autoPromptReport` but serves as safety net)
- On component unmount or session reset: call `resetDemo()` to prevent stale counter

**File:** `frontend/src/pages/ResultsPage.jsx`
**Action:**
- No changes needed — `analyzeResults()` in demo mode already returns `demoFullAnalysis` which is a complete 3-layer report

#### Unit E — Add Demo Mode Indicator
**File:** `frontend/src/pages/ChatAssessmentPage.jsx`
**Location:** Below header or as header badge
**Action:**
- When `isDemoMode` is true, show a small banner: "🎭 演示模式 — 所有数据为模拟" with a dismiss/exit button
- This sets user expectations and prevents confusion

### 1.3 Test Checklist
- [ ] Toggle demo mode ON from landing page or chat page
- [ ] See greeting message appear (demoConversation[0])
- [ ] Send 4 messages, see rounds 1-4 responses with progressing progress bars
- [ ] On round 4: action buttons appear automatically (`autoPromptReport: true`)
- [ ] Click "立即查看结果" → navigate to ResultsPage → see full 3-layer report
- [ ] All 5 ThemeCards render with toolkit data
- [ ] DomainMap shows 4-domain horizontal bars
- [ ] ToolkitPanel tabs work for all 5 themes
- [ ] Toggle demo mode OFF → reset to real API mode
- [ ] Re-enter demo mode → starts fresh from round 0

---

## Section 2 — Report Quality: Gallup-Grade Three-Layer Report

### 2.1 Diagnosis (from actual code)

**What exists and works:**
- **ThemeCard.jsx**: Expandable cards with rank badge (gold/silver/bronze), domain color border, tagline, description, evidence block, score bar. Well-built component.
- **DomainMap.jsx**: Horizontal bar chart sorted by score, "主导" badge on top domain, 2x2 narrative grid. Handles legacy aliases.
- **ToolkitPanel.jsx**: Tab row per theme, strength/blindspot/action/hakimiQuote sections. CatAvatar in quote bubble.
- **ResultsPage.jsx**: Three-layer layout with AnalysisOverlay, Hero banner, CertStamp, Divider components, copy/screenshot actions.
- **analyze.js**: `normalizeReport()` with robust field mapping, domain alias handling, score clamping.
- **ANALYZE_SYSTEM_PROMPT**: Detailed instructions with JSON schema, evidence requirements, scoring guidelines.

**What is insufficient vs. Gallup standard:**

1. **No minimum theme count enforcement.** `ANALYZE_SYSTEM_PROMPT` says "3-5 个最突出的才干" but Gallup always reports exactly 5. The prompt should require exactly 5 themes. `normalizeReport()` doesn't pad to 5 if AI returns fewer.

2. **No score differentiation guidance.** Prompt doesn't tell AI to differentiate scores (e.g., top theme 88-95, second 82-88, etc.). AI might return all themes at score 85, making the report feel generic.

3. **No "Talent DNA" or overall pattern section.** Gallup reports include a "Your Unique Contribution" narrative that synthesizes the combination. `hakimiVerdict` exists but is too short (40-60 chars). Need a dedicated "才干 DNA" section with 150-200 char synthesis.

4. **No domain balance interpretation.** `domainNarrative` exists per-domain but there's no cross-domain interpretation (e.g., "你的执行力+战略思维组合意味着..."). This is a signature Gallup feature.

5. **ToolkitPanel guard is fragile.** `ResultsPage.jsx` line 185: `themes.some(t => t.toolkit?.strength)` — if AI omits `strength` but provides `blindspot`, the entire toolkit section is hidden. Should check for any toolkit field.

6. **No "How to Read This Report" section.** Users unfamiliar with Gallup have no context for what "Top 5 签名才干" means or how to use the toolkit.

7. **CertStamp is generic.** Shows 🐾 + "认证" but no session date, no report ID, no user identifier.

8. **Screenshot export quality.** `html2canvas` works but the captured area (`captureRef`) doesn't include the Hero banner. The export looks incomplete.

9. **No domain radar/spider chart.** The original plan mentioned replacing radar chart, but domain distribution is only shown as horizontal bars. A small radar chart alongside bars would add visual richness.

10. **Summary quote too small.** The `results.summary` block is styled as a subtle note. It should be more prominent as the "Overall Assessment."

### 2.2 Remediation Plan

#### Unit F — Enforce Exactly 5 Themes in Report
**File:** `backend/prompts.js` — `ANALYZE_SYSTEM_PROMPT`
**Action:**
- Change "3-5 个最突出的才干" → "必须返回恰好 5 个才干主题（Top 5 签名才干），不多不少"
- Add score differentiation guidance: "score 值必须有区分度：第1名 90-95，第2名 84-89，第3名 78-83，第4名 72-77，第5名 66-71。不要给出相同或接近的分数"
- Add domain diversity hint: "尽量覆盖至少 2 个不同的 domain（四大领域），避免 5 个才干全来自同一领域"

**File:** `backend/routes/analyze.js` — `normalizeReport()`
**Action:**
- If `themes.length < 5`, pad with placeholder themes (generic names from underrepresented domains, score 65, generic toolkit)
- If `themes.length > 5`, truncate to top 5 by score
- Enforce score ordering: sort by rank, ensure scores are monotonically decreasing

#### Unit G — Add Talent DNA Synthesis Section
**File:** `backend/prompts.js` — `ANALYZE_SYSTEM_PROMPT`
**Action:**
- Add new field to JSON schema: `"talentDNA": "150-200字的才干组合解读，分析这5个才干如何互相强化形成独特优势，用第二人称'你'来写"`
- Add new field: `"crossDomainInsight": "基于domainScores的跨域组合解读，说明哪两个领域的交叉最有价值，80-120字"`

**File:** `backend/routes/analyze.js` — `normalizeReport()`
**Action:**
- Add `talentDNA` and `crossDomainInsight` to normalization with fallback defaults

**File:** `frontend/src/pages/ResultsPage.jsx`
**Action:**
- Add new section between Layer 1 (ThemeCards) and Layer 2 (DomainMap): "才干 DNA 解读"
- Card style: navy background (`#0F172A`), gold text, CatAvatar, prominent typography
- Display `talentDNA` as main text, `crossDomainInsight` as secondary insight

#### Unit H — Fix ToolkitPanel Guard
**File:** `frontend/src/pages/ResultsPage.jsx` line 185
**Action:**
- Change `themes.some(t => t.toolkit?.strength)` to `themes.some(t => t.toolkit && (t.toolkit.strength || t.toolkit.blindspot || t.toolkit.action || t.toolkit.hakimiQuote))`
- Or simpler: `themes.some(t => t.toolkit && Object.values(t.toolkit).some(v => v))`

#### Unit I — Add "How to Read This Report" Guide
**File:** `frontend/src/pages/ResultsPage.jsx`
**Location:** Between Hero banner and Layer 1
**Action:**
- Add a collapsible card (default collapsed) titled "如何阅读这份报告"
- Content: 3-4 bullet points explaining:
  - "Top 5 签名才干" = 你最自然的思维/行为模式
  - 才干不是技能，而是天生的倾向
  - 分数代表置信度，不代表好坏
  - 工具箱建议是基于你的才干量身定制的行动指南
- Subtle styling, collapsible to not overwhelm

#### Unit J — Enhance CertStamp with Context
**File:** `frontend/src/pages/ResultsPage.jsx` — `CertStamp` component
**Action:**
- Add props: `date` (from analysis timestamp) and `sessionId` (truncated to 8 chars)
- Display date as "YYYY.MM.DD" below the 🐾 icon
- Display truncated session ID as "No. XXXXXXXX" in tiny text
- This makes the stamp feel like a real certification mark

#### Unit K — Improve Screenshot Export
**File:** `frontend/src/pages/ResultsPage.jsx`
**Action:**
- Move `captureRef` to wrap from the Hero banner through the Summary quote (currently starts at line 153 after the hero)
- Add a hidden "watermark" div inside `captureRef` that shows "哈基米优势发现器 · hakimi.app" at the bottom of the screenshot
- Set `html2canvas` `backgroundColor` to `#0F172A` for the hero section or use `#FAFAF8` with the hero included

#### Unit L — Elevate Summary Section
**File:** `frontend/src/pages/ResultsPage.jsx`
**Location:** The summary quote block (line 195-201)
**Action:**
- Upgrade from subtle note to prominent card:
  - Larger text (base instead of sm)
  - Navy background with gold accent border
  - CatAvatar inline
  - Title: "哈基米的总评"
- Move `hakimiVerdict` into the Hero banner (already done at line 146) and use `summary` as the detailed assessment in the body

#### Unit M — Add Domain Radar Mini-Chart (Optional Enhancement)
**File:** `frontend/src/components/DomainMap.jsx`
**Action:**
- Add a small SVG radar/spider chart (4 axes: executing, influencing, relationship, strategic) above the horizontal bars
- Pure SVG, no chart library needed — 4-point polygon on circular grid
- Size: 160x160px, centered
- Gold fill with 20% opacity, gold stroke
- Axis labels at each corner
- This adds visual richness without replacing the bars (bars are better for exact comparison, radar is better for shape/balance)

### 2.3 Priority Order

| Priority | Unit | Impact | Effort |
|----------|------|--------|--------|
| P0 | F | Exactly 5 themes + score differentiation | Low |
| P0 | H | Fix ToolkitPanel guard | Trivial |
| P1 | G | Talent DNA synthesis | Medium |
| P1 | L | Elevate summary | Low |
| P1 | I | "How to read" guide | Low |
| P2 | J | CertStamp context | Low |
| P2 | K | Screenshot export | Low |
| P2 | M | Radar mini-chart | Medium |

### 2.4 Test Checklist
- [ ] Analyze endpoint always returns exactly 5 themes with differentiated scores
- [ ] Scores are monotonically decreasing (rank 1 > rank 2 > ... > rank 5)
- [ ] At least 2 different domains represented in Top 5
- [ ] Talent DNA section renders between ThemeCards and DomainMap
- [ ] ToolkitPanel shows even if only `blindspot` or `action` exists (not just `strength`)
- [ ] "How to read" card is collapsible and doesn't overwhelm
- [ ] CertStamp shows date and truncated session ID
- [ ] Screenshot captures full report including hero banner
- [ ] Summary section is visually prominent
- [ ] Demo mode report renders all sections correctly

---

## LLM Routing (Changed from Plan-v1)

| Phase | Primary Model | Fallback Model | Endpoint |
|-------|---------------|----------------|----------|
| Chat (probing) | Kimi-K2.5 | MiniMax-M2.5 |GLM-5 |AIping: `api.aipng.cn/v1` |
| Report (analyze) | Kimi-K2.5 (`Kimi-K2.5`) |AIping: `api.aipng.cn/v1` 
| Report (backup) | GLM-4.7 (`glm-4.7`) | ('glm-4.5-air`) | GLM: `https://open.bigmodel.cn/api/coding/paas/v4` | 


No routing changes needed. `chatWithFallback()` in `llmService.js` handles this correctly.

---

## File Change Matrix

| File | Units | Type |
|------|-------|------|
| `frontend/src/pages/ChatAssessmentPage.jsx` | A, D, E | Modify |
| `frontend/src/pages/LandingPage.jsx` | A | Modify |
| `frontend/src/hooks/useApi.js` | B, C | Modify |
| `frontend/src/context/DemoModeContext.jsx` | D | No change (already correct) |
| `frontend/src/utils/mockData.js` | — | No change (already high quality) |
| `frontend/src/pages/ResultsPage.jsx` | G, H, I, J, K, L | Modify |
| `frontend/src/components/DomainMap.jsx` | M | Modify (optional) |
| `frontend/src/components/ToolkitPanel.jsx` | — | No change |
| `frontend/src/components/ThemeCard.jsx` | — | No change |
| `backend/prompts.js` | F, G | Modify |
| `backend/routes/analyze.js` | F, G | Modify |
| `backend/routes/chat.js` | — | No change |

---

## Summary

Plan-v2 addresses two areas with 13 work units (A-M). Demo mode needs 5 targeted fixes (Units A-E) to become fully functional — the infrastructure is already solid, it just needs proper wiring and edge case handling. The report needs 8 enhancements (Units F-M) to reach Gallup-grade quality — the component layer is already well-built, improvements focus on data quality (prompt engineering), missing sections (Talent DNA, guide), and polish (CertStamp, export, summary prominence).

Total estimated file touches: 6 modified files, 0 new files.
