// VoiceButton.jsx — 麦克风语音输入按钮
// 使用 Web Speech API (SpeechRecognition) 实现语音转文字
// 当浏览器不支持时，按钮自动隐藏

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react'

// 检查浏览器支持
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null

/**
 * @param {function} onResult   - 识别成功后回调 (text: string) => void
 * @param {boolean}  disabled   - 是否禁用
 * @param {string}   className  - 额外样式类
 * @param {ref}      ref        - 外部可调用 { startListening, stopListening, isListening }
 */
const VoiceButton = forwardRef(function VoiceButton({ onResult, disabled = false, className = '' }, ref) {
  const [isListening, setIsListening] = useState(false)
  const [errorMsg, setErrorMsg]       = useState('')
  const recognizerRef = useRef(null)

  useImperativeHandle(ref, () => ({ startListening, stopListening, get isListening() { return isListening } }))

  // 浏览器不支持时不渲染
  if (!SpeechRecognition) return null

  function startListening() {
    if (disabled || isListening) return
    setErrorMsg('')

    const rec = new SpeechRecognition()
    rec.lang           = 'zh-CN'
    rec.interimResults = false
    rec.maxAlternatives = 1
    recognizerRef.current = rec

    rec.onstart = () => setIsListening(true)

    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript || ''
      if (text) onResult(text)
    }

    rec.onerror = (e) => {
      setErrorMsg(e.error === 'no-speech' ? '没听到声音~' : '识别出错了')
      setIsListening(false)
    }

    rec.onend = () => setIsListening(false)

    try {
      rec.start()
    } catch (err) {
      setErrorMsg('麦克风启动失败')
      setIsListening(false)
    }
  }

  function stopListening() {
    recognizerRef.current?.stop()
    setIsListening(false)
  }

  // 组件卸载时停止识别
  useEffect(() => {
    return () => recognizerRef.current?.abort()
  }, [])

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        title={isListening ? '点击停止录音（或再按空格）' : '点击说话（或按空格键）'}
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 relative overflow-hidden"
        style={{
          background: isListening
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : disabled
              ? 'rgba(15,23,42,0.1)'
              : 'rgba(201,168,76,0.12)',
          border: isListening
            ? '1px solid rgba(239,68,68,0.4)'
            : '1px solid rgba(201,168,76,0.25)',
          color: isListening ? '#fff' : disabled ? '#94a3b8' : '#C9A84C',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isListening ? '0 0 0 4px rgba(239,68,68,0.15)' : 'none',
        }}
      >
        {/* 录音时的脉冲环 */}
        {isListening && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: 'rgba(239,68,68,0.25)' }}
          />
        )}

        {/* 麦克风图标 */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4.5 h-4.5 relative z-10"
          style={{ width: '18px', height: '18px' }}
        >
          {isListening ? (
            // 停止图标（方块）
            <rect x="6" y="6" width="12" height="12" rx="2" />
          ) : (
            // 麦克风图标
            <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5ZM6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
          )}
        </svg>
      </button>

      {/* 错误提示（小字，2秒后消失） */}
      {errorMsg && (
        <span
          className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap px-2 py-0.5 rounded"
          style={{ background: 'rgba(239,68,68,0.9)', color: '#fff' }}
        >
          {errorMsg}
        </span>
      )}
    </div>
  )
})

export default VoiceButton
