// 全局聊天状态管理 Context
import React, { createContext, useContext, useReducer } from 'react'

// 初始状态
const initialState = {
  sessionId: null,          // 后端返回的会话 ID
  messages: [],             // 消息列表 { role, content, timestamp, mode? }
  progress: {               // 四大领域探测进度 0-100
    execution: 0,
    influence: 0,
    relationship: 0,
    strategic: 0,
  },
  isComplete: false,        // 对话是否充分完成
  results: null,            // 才干分析结果
  selectedDomains: [],      // 用户选择的行业领域
  jobs: null,               // 职位推荐结果
  isLoading: false,
  error: null,
  demoMode: false,

  // ── 新增：评估模式状态 ──────────────────────────────────
  assessmentMode: 'A',      // 'A' = 闲聊模式 | 'B' = 量表模式
  currentTheme: null,       // 当前正在探测的才干主题 (英文, e.g. 'Achiever')
  currentThemeZh: null,     // 才干主题中文名
  scaleQuestions: [],       // Mode B 量表问题列表
  voiceEnabled: true,       // 是否开启语音自动播放（默认开启）
  skipDetected: false,      // 最近一次是否触发了跳过
}

// Action 类型常量
export const ActionTypes = {
  SET_SESSION: 'SET_SESSION',
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_PROGRESS: 'SET_PROGRESS',
  SET_COMPLETE: 'SET_COMPLETE',
  SET_RESULTS: 'SET_RESULTS',
  SET_DOMAINS: 'SET_DOMAINS',
  SET_JOBS: 'SET_JOBS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  TOGGLE_DEMO: 'TOGGLE_DEMO',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESET_SESSION: 'RESET_SESSION',
  // 新增
  SET_ASSESSMENT_MODE: 'SET_ASSESSMENT_MODE',   // { mode, theme, themeZh, scaleQuestions }
  TOGGLE_VOICE: 'TOGGLE_VOICE',
  SET_SKIP_DETECTED: 'SET_SKIP_DETECTED',
}

// Reducer 函数
function chatReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_SESSION:
      return { ...state, sessionId: action.payload }

    case ActionTypes.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, {
          ...action.payload,
          timestamp: action.payload.timestamp || new Date().toISOString(),
        }],
      }

    case ActionTypes.SET_PROGRESS:
      return { ...state, progress: { ...state.progress, ...action.payload } }

    case ActionTypes.SET_COMPLETE:
      return { ...state, isComplete: action.payload }

    case ActionTypes.SET_RESULTS:
      return { ...state, results: action.payload }

    case ActionTypes.SET_DOMAINS:
      return { ...state, selectedDomains: action.payload }

    case ActionTypes.SET_JOBS:
      return { ...state, jobs: action.payload }

    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload }

    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false }

    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null }

    case ActionTypes.TOGGLE_DEMO:
      return { ...state, demoMode: !state.demoMode }

    case ActionTypes.RESET_SESSION:
      return {
        ...initialState,
        demoMode: state.demoMode,
        voiceEnabled: state.voiceEnabled,
      }

    case ActionTypes.SET_ASSESSMENT_MODE: {
      const { mode, theme, themeZh, scaleQuestions } = action.payload
      return {
        ...state,
        assessmentMode: mode || 'A',
        currentTheme: theme || state.currentTheme,
        currentThemeZh: themeZh || state.currentThemeZh,
        scaleQuestions: scaleQuestions || [],
      }
    }

    case ActionTypes.TOGGLE_VOICE:
      return { ...state, voiceEnabled: !state.voiceEnabled }

    case ActionTypes.SET_SKIP_DETECTED:
      return { ...state, skipDetected: action.payload }

    default:
      return state
  }
}

// 创建 Context
const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (!context) throw new Error('useChatContext 必须在 ChatProvider 内部使用')
  return context
}

export default ChatContext
