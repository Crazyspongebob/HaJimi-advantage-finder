// 聊天评估页 - 哈基米才干探测对话
// Mode A (闲聊) + Mode B (量表) + 语音输入/TTS + 跳过逻辑
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatContext, ActionTypes } from '../context/ChatContext'
import { useApi } from '../hooks/useApi'
import CatAvatar from '../components/CatAvatar'
import TypingIndicator from '../components/TypingIndicator'
import VoiceButton from '../components/VoiceButton'
import LikertScaleCard from '../components/LikertScaleCard'

const ERROR_MSG = '哈基米猫粮吃撑了，正在打嗝，稍等喵~ 😅'

let _audio = null
function playAudio(url) {
  if (_audio) { _audio.pause(); _audio = null }
  _audio = new Audio(url)
  _audio.play().catch(() => {})
  _audio.onended = () => { _audio = null }
}

function ModeTag({ mode, themeZh }) {
  if (!themeZh) return null
  const isB = mode === 'B'
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium" style={{
      background: isB ? 'rgba(139,92,246,0.12)' : 'rgba(201,168,76,0.12)',
      border: isB ? '1px solid rgba(139,92,246,0.25)' : '1px solid rgba(201,168,76,0.25)',
      color: isB ? '#8b5cf6' : '#C9A84C',
    }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: isB ? '#8b5cf6' : '#C9A84C' }} />
      {isB ? `量表 · ${themeZh}` : `探测 · ${themeZh}`}
    </div>
  )
}

function MessageBubble({ message, onTTS }) {
  const isUser = message.role === 'user'
  const [ttsLoading, setTtsLoading] = useState(false)
  async function handleTTS() {
    setTtsLoading(true)
    await onTTS(message.content)
    setTtsLoading(false)
  }
  return (
    <div className={`flex items-end gap-2 message-bubble ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && <CatAvatar size="sm" className="flex-shrink-0" />}
      <div className={`max-w-xs sm:max-w-md lg:max-w-lg group flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        {message.skipDetected && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,168,76,0.1)', color: 'rgba(201,168,76,0.7)' }}>话题已跳过</span>
        )}
        <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed" style={{
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          ...(isUser ? {
            background: 'linear-gradient(135deg, #C9A84C 0%, #D4B46A 50%, #B8960C 100%)',
            color: '#0F172A', borderBottomRightRadius: '4px',
            boxShadow: '0 2px 8px rgba(201,168,76,0.25)', fontWeight: '500',
          } : {
            background: '#FFFFFF', color: '#1E293B', borderBottomLeftRadius: '4px',
            boxShadow: '0 1px 4px rgba(15,23,42,0.06)', borderLeft: '2px solid rgba(201,168,76,0.3)',
          }),
        }}>
          {message.content}
        </div>
        {!isUser && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-1">
            <button onClick={handleTTS} disabled={ttsLoading} className="text-xs" style={{ color: 'rgba(15,23,42,0.35)' }} title="朗读">
              {ttsLoading ? '⏳' : '🔊'}
            </button>
            {message.timestamp && (
              <span className="text-xs" style={{ color: 'rgba(15,23,42,0.25)' }}>
                {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatAssessmentPage() {
  const navigate = useNavigate()
  const { state, dispatch } = useChatContext()
  const { sendMessage, submitScaleAnswer, analyzeResults, synthesizeSpeech } = useApi()

  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [pendingScale, setPendingScale] = useState(null)
  const [scaleSubmitting, setScaleSubmitting] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = useCallback(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [])
  useEffect(() => { scrollToBottom() }, [state.messages, isTyping, pendingScale, scrollToBottom])
  useEffect(() => { if (state.messages.length === 0) initSession() }, []) // eslint-disable-line

  function processResponse(data) {
    if (!data) return
    if (data.sessionId) dispatch({ type: ActionTypes.SET_SESSION, payload: data.sessionId })
    if (data.progress) dispatch({ type: ActionTypes.SET_PROGRESS, payload: data.progress })
    if (data.mode || data.currentTheme) {
      dispatch({ type: ActionTypes.SET_ASSESSMENT_MODE, payload: {
        mode: data.mode || 'A', theme: data.currentTheme,
        themeZh: data.currentThemeZh, scaleQuestions: data.scaleQuestions || [],
      }})
    }
    if (data.skipDetected != null) dispatch({ type: ActionTypes.SET_SKIP_DETECTED, payload: data.skipDetected })
    if (data.mode === 'B' && data.scaleQuestions?.length > 0) {
      setPendingScale({ questions: data.scaleQuestions, theme: data.currentTheme, themeZh: data.currentThemeZh || data.currentTheme })
    }
    if (data.isComplete) dispatch({ type: ActionTypes.SET_COMPLETE, payload: true })
    if (state.voiceEnabled && data.reply) handleTTSPlay(data.reply)
  }

  async function handleTTSPlay(text) {
    const t = text.length > 250 ? text.slice(0, 250) : text
    const { data } = await synthesizeSpeech(t)
    if (data?.audioUrl) playAudio(data.audioUrl)
  }

  async function initSession() {
    setIsTyping(true)
    const { data, error } = await sendMessage(state.sessionId, '', [])
    setIsTyping(false)
    if (error) { dispatch({ type: ActionTypes.SET_ERROR, payload: error }); dispatch({ type: ActionTypes.ADD_MESSAGE, payload: { role: 'assistant', content: ERROR_MSG } }); return }
    if (data) { dispatch({ type: ActionTypes.ADD_MESSAGE, payload: { role: 'assistant', content: data.reply } }); processResponse(data) }
  }

  async function handleSend(overrideText) {
    const text = (overrideText !== undefined ? overrideText : inputValue).trim()
    if (!text || isTyping) return
    dispatch({ type: ActionTypes.ADD_MESSAGE, payload: { role: 'user', content: text } })
    setInputValue('')
    setIsTyping(true)
    const history = [...state.messages, { role: 'user', content: text }]
    const { data, error } = await sendMessage(state.sessionId, text, history)
    setIsTyping(false)
    if (error) { dispatch({ type: ActionTypes.SET_ERROR, payload: error }); dispatch({ type: ActionTypes.ADD_MESSAGE, payload: { role: 'assistant', content: ERROR_MSG } }); return }
    if (data) { dispatch({ type: ActionTypes.ADD_MESSAGE, payload: { role: 'assistant', content: data.reply, skipDetected: data.skipDetected } }); processResponse(data) }
  }

  async function handleSkip() { await handleSend('换一个') }

  async function handleSwitchToScale() {
    setIsTyping(true)
    const { data, error } = await sendMessage(state.sessionId, '__switch_to_scale__', state.messages)
    setIsTyping(false)
    if (error) { dispatch({ type: ActionTypes.SET_ERROR, payload: error }); return }
    if (data) { dispatch({ type: ActionTypes.ADD_MESSAGE, payload: { role: 'assistant', content: data.reply } }); processResponse(data) }
  }

  async function handleScaleSubmit({ theme, answers }) {
    const themeZh = pendingScale?.themeZh || theme
    setScaleSubmitting(true); setPendingScale(null)
    dispatch({ type: ActionTypes.ADD_MESSAGE, payload: { role: 'user', content: `[量表评分] ${themeZh}：${answers.join('、')} 分` } })
    setIsTyping(true)
    const { data, error } = await submitScaleAnswer(state.sessionId, theme, answers)
    setIsTyping(false); setScaleSubmitting(false)
    if (error) { dispatch({ type: ActionTypes.SET_ERROR, payload: error }); dispatch({ type: ActionTypes.ADD_MESSAGE, payload: { role: 'assistant', content: ERROR_MSG } }); return }
    if (data) { dispatch({ type: ActionTypes.ADD_MESSAGE, payload: { role: 'assistant', content: data.reply } }); processResponse(data) }
  }

  async function handleScaleSkip() { setPendingScale(null); await handleSend('跳过') }
  function handleVoiceResult(text) { setInputValue(text); setTimeout(() => handleSend(text), 300) }

  async function handleGenerateReport() {
    setIsGenerating(true); dispatch({ type: ActionTypes.SET_LOADING, payload: true })
    const { data, error } = await analyzeResults(state.sessionId, state.messages)
    setIsGenerating(false); dispatch({ type: ActionTypes.SET_LOADING, payload: false })
    if (error) { dispatch({ type: ActionTypes.SET_ERROR, payload: error }); return }
    if (data) { dispatch({ type: ActionTypes.SET_RESULTS, payload: data }); navigate('/results') }
  }

  function handleKeyDown(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }

  const { progress, isComplete, assessmentMode, currentThemeZh, voiceEnabled } = state
  const progressItems = [
    { key: 'execution', label: '执行力', value: progress.execution },
    { key: 'influence', label: '影响力', value: progress.influence },
    { key: 'relationship', label: '关系建立', value: progress.relationship },
    { key: 'strategic', label: '战略思维', value: progress.strategic },
  ]
  const inputDisabled = isTyping || isComplete || scaleSubmitting

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#FAFAF8' }}>
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="flex-shrink-0 px-4 py-3 flex items-center gap-3"
          style={{ background: '#0F172A', borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
          <CatAvatar size="sm" />
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-sm sm:text-base truncate" style={{ color: '#FAFAF8', fontFamily: "'Noto Serif SC', serif" }}>哈基米优势发现器</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs" style={{ color: 'rgba(201,168,76,0.6)' }}>{assessmentMode === 'B' ? '量表精准校准' : '才干闲聊探测'}</span>
              {currentThemeZh && <ModeTag mode={assessmentMode} themeZh={currentThemeZh} />}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => dispatch({ type: ActionTypes.TOGGLE_VOICE })}
              title={voiceEnabled ? '关闭语音播报' : '开启语音播报'}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ background: voiceEnabled ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.06)', border: voiceEnabled ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.1)', color: voiceEnabled ? '#C9A84C' : 'rgba(255,255,255,0.3)' }}>
              {voiceEnabled ? '🔊' : '🔇'}
            </button>
            <div className="sm:hidden flex items-center gap-1.5">
              {progressItems.map(item => (
                <div key={item.key} className="relative w-1 h-6 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }} title={`${item.label}: ${item.value}%`}>
                  <div className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-500" style={{ height: `${item.value}%`, background: 'linear-gradient(to top, #C9A84C, #E2C97E)' }} />
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4" style={{ background: '#F7F5F0' }}>
          {state.messages.map((message, index) => (
            <MessageBubble key={index} message={message} onTTS={handleTTSPlay} />
          ))}
          {pendingScale && (
            <div className="py-1">
              <LikertScaleCard questions={pendingScale.questions} themeName={pendingScale.themeZh}
                themeEn={pendingScale.theme} onSubmit={handleScaleSubmit} onSkip={handleScaleSkip} disabled={scaleSubmitting} />
            </div>
          )}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Error */}
        {state.error && (
          <div className="mx-4 mb-2 p-3 rounded-lg text-sm flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
            <span>⚠</span><span className="flex-1">{state.error}</span>
            <button onClick={() => dispatch({ type: ActionTypes.CLEAR_ERROR })} className="opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 px-4 py-3 pb-safe" style={{ background: '#FFFFFF', borderTop: '1px solid rgba(15,23,42,0.08)' }}>
          {!isComplete && !pendingScale && state.messages.length > 2 && (
            <div className="flex justify-end gap-2 mb-2 flex-wrap">
              <button onClick={handleSkip} disabled={inputDisabled} className="text-xs px-3 py-1.5 rounded-full transition-all hover:scale-105"
                style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.1)', color: 'rgba(15,23,42,0.5)', cursor: inputDisabled ? 'not-allowed' : 'pointer' }}>
                换个话题 →
              </button>
              {assessmentMode === 'A' && (
                <button onClick={handleSwitchToScale} disabled={inputDisabled} className="text-xs px-3 py-1.5 rounded-full transition-all hover:scale-105"
                  style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', color: '#8b5cf6', cursor: inputDisabled ? 'not-allowed' : 'pointer' }}>
                  切换量表模式
                </button>
              )}
            </div>
          )}
          <div className="flex items-end gap-2 max-w-2xl mx-auto">
            <VoiceButton onResult={handleVoiceResult} disabled={inputDisabled || !!pendingScale} />
            <textarea ref={inputRef} value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={pendingScale ? '请先完成量表评分...' : isComplete ? '对话已完成，可以生成报告了' : '和哈基米聊聊... 说「换一个」跳过话题'}
              disabled={inputDisabled} rows={1}
              className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm focus:outline-none max-h-24 overflow-y-auto transition-all"
              style={{ minHeight: '44px', background: inputDisabled ? 'rgba(15,23,42,0.03)' : '#F7F5F0', border: '1px solid rgba(15,23,42,0.1)', color: '#1E293B', fontFamily: 'Inter, sans-serif' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(201,168,76,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.1)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(15,23,42,0.1)'; e.target.style.boxShadow = 'none' }} />
            <button onClick={() => handleSend()} disabled={!inputValue.trim() || inputDisabled}
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                background: (!inputValue.trim() || inputDisabled) ? 'rgba(15,23,42,0.1)' : 'linear-gradient(135deg, #C9A84C 0%, #D4B46A 50%, #B8960C 100%)',
                boxShadow: (!inputValue.trim() || inputDisabled) ? 'none' : '0 4px 12px rgba(201,168,76,0.3)',
                color: (!inputValue.trim() || inputDisabled) ? '#94a3b8' : '#0F172A',
                cursor: (!inputValue.trim() || inputDisabled) ? 'not-allowed' : 'pointer',
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '18px', height: '18px' }}>
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-center mt-2" style={{ color: 'rgba(15,23,42,0.3)' }}>
            Enter 发送 · 🎤 语音输入 · 说「换一个」跳过话题
          </p>
        </div>
      </div>

      {/* 右侧进度面板 */}
      <aside className="hidden sm:flex flex-col w-72 p-5 flex-shrink-0"
        style={{ background: '#0F172A', borderLeft: '1px solid rgba(201,168,76,0.1)' }}>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #C9A84C, #9B7A1F)', color: '#0F172A' }}>H</div>
          <h2 className="font-semibold text-sm" style={{ color: '#FAFAF8', fontFamily: "'Noto Serif SC', serif" }}>才干探测进度</h2>
        </div>
        {currentThemeZh && (
          <div className="mb-5 px-3 py-2.5 rounded-xl" style={{ background: assessmentMode === 'B' ? 'rgba(139,92,246,0.08)' : 'rgba(201,168,76,0.06)', border: assessmentMode === 'B' ? '1px solid rgba(139,92,246,0.2)' : '1px solid rgba(201,168,76,0.15)' }}>
            <p className="text-xs font-medium mb-0.5" style={{ color: assessmentMode === 'B' ? '#a78bfa' : '#C9A84C' }}>{assessmentMode === 'B' ? '量表精准校准' : '闲聊探测'}</p>
            <p className="text-sm font-semibold" style={{ color: '#FAFAF8' }}>{currentThemeZh}</p>
          </div>
        )}
        <div className="space-y-5 flex-1">
          {progressItems.map(item => (
            <div key={item.key}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                <span className="text-xs tabular-nums" style={{ color: item.value > 0 ? '#C9A84C' : 'rgba(255,255,255,0.3)' }}>{item.value}%</span>
              </div>
              <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${item.value}%`, background: 'linear-gradient(90deg, #C9A84C, #E2C97E)' }} />
              </div>
            </div>
          ))}
        </div>
        {isComplete ? (
          <div className="mt-6 space-y-3">
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}>
              <p className="font-semibold text-sm" style={{ color: '#C9A84C' }}>探测完成</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>哈基米已充分了解你</p>
            </div>
            <button onClick={handleGenerateReport} disabled={isGenerating}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background: isGenerating ? 'rgba(201,168,76,0.4)' : 'linear-gradient(135deg, #C9A84C 0%, #D4B46A 50%, #B8960C 100%)', color: '#0F172A', boxShadow: isGenerating ? 'none' : '0 4px 15px rgba(201,168,76,0.3)' }}>
              {isGenerating ? <><span className="animate-spin">⏳</span><span>生成中...</span></> : '生成才干报告'}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-2">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs text-center leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>继续聊天，哈基米正在识别才干信号...</p>
            </div>
            {state.messages.length > 2 && (
              <div className="space-y-1.5">
                <button onClick={handleSkip} disabled={inputDisabled} className="w-full py-1.5 rounded-lg text-xs transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', cursor: inputDisabled ? 'not-allowed' : 'pointer' }}>
                  换个话题 →
                </button>
                {assessmentMode === 'A' && (
                  <button onClick={handleSwitchToScale} disabled={inputDisabled} className="w-full py-1.5 rounded-lg text-xs transition-all"
                    style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', color: '#a78bfa', cursor: inputDisabled ? 'not-allowed' : 'pointer' }}>
                    切换量表模式
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>盖洛普 34 才干 · 双模式探测<br />闲聊 + 量表 融合分析</p>
        </div>
      </aside>

      {isComplete && (
        <div className="sm:hidden fixed bottom-20 left-0 right-0 px-4 z-40">
          <div className="rounded-2xl shadow-2xl p-4" style={{ background: '#0F172A', border: '1px solid rgba(201,168,76,0.25)' }}>
            <p className="text-center font-semibold mb-3 text-sm" style={{ color: '#C9A84C' }}>探测完成！哈基米已了解你啦</p>
            <button onClick={handleGenerateReport} disabled={isGenerating}
              className="w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #D4B46A 50%, #B8960C 100%)', color: '#0F172A', boxShadow: '0 4px 15px rgba(201,168,76,0.3)' }}>
              {isGenerating ? '生成中...' : '生成才干报告'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
