# AI Analysis Rules & Scoring Matrix (Updated)

## 1. Dual-Mode Input Processing

### Chatty Mode (闲聊模式)
- **Primary Signal:** Semantic analysis of open-ended responses.
- **Tone Detection:** Identifying "enthusiasm", "avoidance", "frustration" or "analytical depth" in the chat.
- **Scoring:** +1.0 for strong match, -0.5 for active rejection.

### Scale Mode (量表模式)
- **Direct Scoring:** 1-5 Likert scale values.
- **Weighting:**
  - 5 (Extremely Agree) = +2.0 strength signal.
  - 4 (Agree) = +1.0 strength signal.
  - 3 (Neutral) = +0.5 baseline.
  - 2 (Disagree) = -0.5 negative signal.
  - 1 (Extremely Disagree) = -1.5 inhibition signal.

## 2. Cross-Verification Logic
- **Consistency Check:** If the user "Chatty Mode" responses contradict their "Scale Mode" scores (e.g., chat shows high "Activator" but scale gives it a 1), AI should flag this for a "Deep Dive" question.
- **Bias Detection:** Adjusting for "Social Desirability Bias" in scale responses by weighing "Chatty Mode" signals higher in professional/ethical categories.

## 3. Top 5 Derivation
1. Sum all values (Scale points + Chat weights) for each of the 34 dimensions.
2. Sort by Final Score.
3. Select Top 5 for the final report.
