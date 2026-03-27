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
   */
  function getNextDemoResponse() {
    const idx = demoRoundRef.current
    const entry = demoConversation[Math.min(idx, demoConversation.length - 1)]
    demoRoundRef.current = Math.min(idx + 1, demoConversation.length - 1)
    setDemoRound(demoRoundRef.current)
    return entry
  }

  function resetDemo() {
    demoRoundRef.current = 0
    setDemoRound(0)
  }

  const isDemoComplete = demoRound >= demoConversation.length - 1

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
