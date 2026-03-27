// 演示模式 Context - 在没有后端时使用模拟数据
import React, { createContext, useContext, useState } from 'react'
import { mockData } from '../utils/mockData'

const DemoModeContext = createContext(null)

export function DemoModeProvider({ children }) {
  const [isDemoMode, setIsDemoMode] = useState(false)

  // 切换演示模式
  const toggleDemoMode = () => {
    setIsDemoMode(prev => !prev)
  }

  // 获取模拟数据
  const getMockData = (type) => {
    return mockData[type] || null
  }

  // 模拟 API 延迟（演示模式下模拟网络请求）
  const simulateDelay = (ms = 800) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  return (
    <DemoModeContext.Provider value={{
      isDemoMode,
      toggleDemoMode,
      getMockData,
      simulateDelay,
    }}>
      {children}
    </DemoModeContext.Provider>
  )
}

export function useDemoMode() {
  const context = useContext(DemoModeContext)
  if (!context) {
    throw new Error('useDemoMode 必须在 DemoModeProvider 内部使用')
  }
  return context
}

export default DemoModeContext
