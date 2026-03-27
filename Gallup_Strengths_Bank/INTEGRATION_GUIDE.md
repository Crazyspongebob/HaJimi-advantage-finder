# Integration Guide & Interface Documentation

## Overview

This bank operates in two complementary modes for the AI Career Guidance Agent. The LLM is responsible for managing conversation flow naturally — the question bank provides **structured inputs**, not rigid scripts.

---

## 1. Data Schema (JSON Representation)

```json
{
  "theme": "Achiever",
  "domain": "Executing",
  "user_level": "ug | pg",
  "chatty_seeds": {
    "ug": ["Seed topic 1", "Seed topic 2", "Seed topic 3"],
    "pg": ["Seed topic 1", "Seed topic 2", "Seed topic 3"]
  },
  "scale_mode": [
    "Statement 1 (positive)",
    "Statement 2 (positive)",
    "...",
    "Statement 11 (reverse-coded)",
    "..."
  ],
  "industry_interest": {
    "chatty_seeds": ["Topic 1", "Topic 2"],
    "scale_statements": ["Statement 1 (Tech)", "Statement 2 (SOE)"]
  }
}
```

---

## 2. Interaction Architecture

### Mode A: LLM-Driven Chatty Mode

> **核心设计哲学：话题种子（Seeds），而非逐字念稿。**

**工作流程：**
1. Agent 从 `dimensions/{theme}.md` 的 `chatty_seeds` 中取一个话题。
2. **将话题 + 当前对话上下文（用户已说过的话、显露的性格倾向）一起注入 LLM**。
3. LLM 根据上下文"接话"，自然展开——可以是反问、追问、类比或讲故事——而非直接读那个种子问题。
4. 用户随时可以说"换个问题"或"这个我不想聊"，Agent 立刻切换下一个种子。

**System Prompt 注入模板：**
```
当前测评维度：{theme_name}（{domain}）
用户身份：{ug/pg}
当前对话记录摘要：{conversation_summary}

话题种子（请依据上下文发挥，不要逐字照读）：
"{current_seed}"

核心约束：
1. 绝不出戏：维持治愈聊天口吻，不要出现“测试”、“考核”、“评估”等生硬字眼。
2. 隐蔽探测：把话题种子翻译成关切或反问，引导用户多说话。
3. 静默打分：如果用户的自然回复中流露出对应天赋，请在返回消息的最后（前端将隐藏这部分结构化数据）打上心理标签 `[Signal: {Target_Signal}]`，用于后续后端计分。
4. 灵活跳过：遇到敷衍、抗拒，立刻说：“那我们不聊这个了~我们聊点别的”，并调用 Skip 逻辑切下一个种子。
```

### Mode B: Likert Scale Mode

当 Mode A 的语义信号不够清晰，或是系统在 Demo/Debug 阶段快速生成图表时：
- 直接呈现 1-5 量表陈述题（正向 + 反向计分）
- 作为快速生成盖洛普雷达图评估依据的后援通道。

---

## 3. Recommended API & Project Flow

| Step | Component / Action | Input | Outcome |
| :--- | :--- | :--- | :--- |
| **1. Init** | Frontend (React) / 获客 | 用户确认身份 (UG/PG) | 决定使用的维度种子库 |
| **2. Prompt** | API Gateway (Node.js) | FETCH `chatty_seeds` | 选择目标 probing theme |
| **3. Chat** | LLM Router (Kimi/GLM/MiniMax) | Seed + 猫咪 Prompt + 上下文 | 哈基米发语音/文本开启话题 |
| **4. Extract** | NLP Pipeline | 用户语言回复 | 提取 `[Signal]` 为对应维度加权分 |
| **5. Analyze** | Data-Agent / Logic Script | 34个维度得分聚合 | 输出 JSON: 标记四大领域及 Top 5 核心才干，发送至 React Recharts 渲染雷达图 |
| **6. Recommend**| Recommendation Agent | Top 5 + 意向行业 (Industry Seeds) | 输出极其精确的细分岗位推荐（基于盖洛普逻辑，拒绝泛泛而谈） |

---

## 4. Skip Logic (跳过机制设计)

用户触发词示例（Agent 应自动识别）：
- 显式：`"换一个"` / `"下一个"` / `"这个不想聊"` / `"skip"` / `"pass"`
- 隐式：连续两轮单字回复（如"哦"、"嗯"）→ 自动视为触发 skip

跳过后的行为：
1. 立刻友好回应（"好的！咱们聊点别的。"）
2. 切换到同主题的下一个种子（或切换到下一个维度）
3. **不打 Signal**（跳过的话题不计分）

---

## 5. Context Continuity (上下文连续性)

对话进行到中后段时，LLM 每次接新种子时应携带：
- `conversation_summary`：前几轮的关键信息点（不超过 300 字）
- `tentative_signals`：迄今为止捕捉到的初步信号列表
- `user_vibe`：用户整体语气画像（如"爱聊细节"、"偏保守"、"很直接"）

这样 LLM 的提问会越来越"懂这个人"，而不是每次从零开始。
