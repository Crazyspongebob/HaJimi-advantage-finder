// 演示模式 Context - 在没有后端时使用模拟数据
// 新增：demoRound 计数器 + isDemoComplete 状态
import React, { createContext, useContext, useState, useRef } from 'react'
import { demoConversation, demoFullAnalysis, mockData } from '../utils/mockData'

const DemoModeContext = createContext(null)

export function DemoModeProvider({ children }) {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const demoRoundRef = useRef(0)   // 0 = greeting sent, 1-4 = user replies
  const [demoRound, setDemoRound] = useState(0)

  const toggleDemoMode = () => {
    setIsDemoMode(prev => !prev)
    // Reset counter on toggle
    demoRoundRef.current = 0
    setDemoRound(0)
  }

  /**
   * 获取下一条演示回复
   * roundIndex 0 = greeting，1-N = user replies
   * 超出范围后返回"演示已结束"存根，不重复最后一条
   */
  function getNextDemoResponse() {
    const idx = demoRoundRef.current
    // Past end of demo — return graceful "demo ended" stub
    if (idx >= demoConversation.length) {
      return {
        sessionId: 'demo-session-001',
        reply: '喵~ 演示对话已结束！点击下方「立即查看结果」查看你的专属才干报告吧~ 🐾',
        isComplete: true,
        readyForReport: true,
        autoPromptReport: true,
        roundCount: demoConversation.length,
        mode: 'A',
        currentTheme: null,
        skipDetected: false,
        progress: { execution: 75, influence: 60, relationship: 70, strategic: 65 },
      }
    }
    const entry = demoConversation[idx]
    demoRoundRef.current = idx + 1  // No clamping — allow going past end
    setDemoRound(demoRoundRef.current)
    return entry
  }

  function resetDemo() {
    demoRoundRef.current = 0
    setDemoRound(0)
  }

  // isDemoComplete = true once we've consumed all demo entries
  const isDemoComplete = demoRound >= demoConversation.length

  const getMockData = (type) => {
    if (type === 'fullAnalysis') return demoFullAnalysis
    return mockData[type] || null
  }

  const simulateDelay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms))

  return (
    <DemoModeContext.Provider value={{
      isDemoMode,
      toggleDemoMode,
      demoRound,
      isDemoComplete,
      getNextDemoResponse,
      resetDemo,
      getMockData,
      simulateDelay,
    }}>
      {children}
    </DemoModeContext.Provider>
  )
}

export function useDemoMode() {
  const context = useContext(DemoModeContext)
  if (!context) throw new Error('useDemoMode 必须在 DemoModeProvider 内部使用')
  return context
}

export default DemoModeContext
