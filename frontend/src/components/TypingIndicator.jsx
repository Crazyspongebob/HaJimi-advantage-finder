// 打字指示器组件 - 显示 AI 正在输入
import React from 'react'
import CatAvatar from './CatAvatar'

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 message-bubble">
      {/* 猫咪头像 */}
      <CatAvatar size="sm" />

      {/* 气泡 */}
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          {/* 三个弹跳圆点 */}
          <span
            className="typing-dot w-2 h-2 bg-gray-400 rounded-full block"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="typing-dot w-2 h-2 bg-gray-400 rounded-full block"
            style={{ animationDelay: '200ms' }}
          />
          <span
            className="typing-dot w-2 h-2 bg-gray-400 rounded-full block"
            style={{ animationDelay: '400ms' }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">哈基米正在思考中...</p>
      </div>
    </div>
  )
}

export default TypingIndicator
