# System Architecture: Gallup CliftonStrengths Guidance System

This document explains how the Question Bank interacts with the AI agent and the end-user.

## 1. System Flow Diagram

```mermaid
graph TD
    User((User)) -->|Input: UG/PG Status| Router{Initial Router}
    Router -->|Undergraduate| UG_Branch[UG Scenarios]
    Router -->|Graduate| PG_Branch[PG Scenarios]
    
    subgraph QuestionBank [Gallup Strengths Bank v3]
        direction TB
        ModeA[Mode A: Chatty Situations]
        ModeB[Mode B: 1-5 Scale Statements]
        IndustryQ[Industry Interest Detection]
    end

    UG_Branch --> ModeA
    PG_Branch --> ModeA
    User -.->|Quantitative Response| ModeB
    
    ModeA --> AI_Analysis[AI Semantic Analysis]
    ModeB --> Scoring_Engine[Weighted Scoring Engine]
    IndustryQ --> Industry_Mapper[Industry Preference Analysis]
    
    AI_Analysis --> Fusion[Signal Fusion Layer]
    Scoring_Engine --> Fusion
    
    Fusion -->|Top 5 Strengths| Matcher[Career Matching Engine]
    Industry_Mapper -->|Sector Interest| Matcher
    
    Matcher -->|Final Output| Report[Personalized Career Report]
```

## 2. Component Descriptions

### A. Initial Router
Detects user identity (Education level) to trigger the correct situational branching in the Question Bank.

### B. Dual-Mode Question Bank
- **Chatty Mode**: High-empathy, low-pressure conversational probes to bypass self-reporting bias.
- **Scale Mode**: Standardized Likert statements for statistical validation and "hard" data points.

### C. Signal Fusion Layer
Syntheses qualitative "gut feelings" from the chat and quantitative "hard data" from the scales. It prioritizes semantic signals for social-heavy themes (e.g., Empathy) and scale data for productivity-heavy themes (e.g., Focus).

### D. Career Matching Engine
Uses the `matching_principles.md` rules to map the user's High Strength x Industry Interest to specific niche roles (e.g., "Analytical" + "Semiconductor Interest" -> "IC Design").
