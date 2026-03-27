// 演示模式切换按钮 - 固定在右下角
import React from 'react'
import { useDemoMode } from '../context/DemoModeContext'

function DemoModeButton() {
  const { isDemoMode, toggleDemoMode } = useDemoMode()

  return (
    <button
      onClick={toggleDemoMode}
      className={`
        fixed bottom-6 right-4 z-50
        px-4 py-2 rounded-full
        text-sm font-semibold
        shadow-lg
        transition-all duration-300
        flex items-center gap-2
        border-2
        ${isDemoMode
          ? 'bg-hakimi-primary text-white border-amber-400 shadow-amber-200'
          : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-600'
        }
      `}
      title={isDemoMode ? '点击关闭演示模式' : '点击开启演示模式（无需后端）'}
    >
      {/* 文字状态 */}
      <span>
        {isDemoMode ? '演示 ON 🐱' : '演示模式'}
      </span>

      {/* 状态指示灯 */}
      <span
        className={`
          w-2 h-2 rounded-full
          ${isDemoMode ? 'bg-white animate-pulse' : 'bg-gray-300'}
        `}
      />
    </button>
  )
}

export default DemoModeButton
