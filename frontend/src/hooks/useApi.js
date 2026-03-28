// 自定义 API Hook - 封装所有后端请求
import { useDemoMode } from '../context/DemoModeContext'
import { demoFullAnalysis } from '../utils/mockData'

async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `请求失败: ${response.status}`)
    }
    const data = await response.json()
    return { data, error: null }
  } catch (err) {
    console.error('API 请求错误:', err)
    return { data: null, error: err.message || '哈基米猫粮吃撑了，稍等喵~ 😅' }
  }
}

export function useApi() {
  const { isDemoMode, simulateDelay, getNextDemoResponse } = useDemoMode()

  // ── 发送聊天消息 POST /api/chat ─────────────────────────────
  async function sendMessage(sessionId, message, history = [], scaleAnswer = null, persona = null) {
    if (isDemoMode) {
      await simulateDelay(900)
      const entry = getNextDemoResponse()
      return {
        data: {
          sessionId: sessionId || 'demo-session-001',
          reply: entry.reply,
          progress: entry.progress,
          isComplete: entry.isComplete,
          readyForReport: entry.readyForReport,
          roundCount: entry.roundCount,
          mode: entry.mode || 'A',
          currentTheme: entry.currentTheme || null,
          skipDetected: entry.skipDetected || false,
          autoPromptReport: entry.autoPromptReport || false,
        },
        error: null,
      }
    }
    return fetchWithErrorHandling('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message, history, scaleAnswer, persona }),
    })
  }

  // ── 量表答题提交 ────────────────────────────────────────────
  async function submitScaleAnswer(sessionId, theme, answers, persona = null) {
    return sendMessage(sessionId, '__scale_answer__', [], { theme, answers }, persona)
  }

  // ── 分析才干结果 POST /api/analyze ──────────────────────────
  async function analyzeResults(sessionId, history = []) {
    if (isDemoMode) {
      await simulateDelay(2000)
      return { data: demoFullAnalysis, error: null }
    }
    return fetchWithErrorHandling('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ sessionId, history }),
    })
  }

  // ── 获取职位推荐 POST /api/recommend ────────────────────────
  async function getRecommendations(topTalents, selectedDomains) {
    if (isDemoMode) {
      await simulateDelay(1200)
      const { mockJobRecommendations } = await import('../utils/mockData')
      return { data: mockJobRecommendations, error: null }
    }
    return fetchWithErrorHandling('/api/recommend', {
      method: 'POST',
      body: JSON.stringify({ topTalents, selectedDomains }),
    })
  }

  // ── 获取会话信息 GET /api/session/:id ───────────────────────
  async function getSession(sessionId) {
    if (isDemoMode) {
      await simulateDelay(500)
      return {
        data: { sessionId: 'demo-session-001', progress: { execution: 75, influence: 60, relationship: 70, strategic: 65 }, isComplete: true },
        error: null,
      }
    }
    return fetchWithErrorHandling(`/api/session/${sessionId}`)
  }

  // ── 语音合成 POST /api/tts ──────────────────────────────────
  async function synthesizeSpeech(text, voiceId = null) {
    if (isDemoMode) {
      await simulateDelay(300)
      return { data: null, error: null }
    }
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId }),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        console.warn('[TTS] 合成失败:', errData.message || response.status)
        return { data: null, error: errData.message || 'TTS失败' }
      }
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      return { data: { audioUrl, audioBlob }, error: null }
    } catch (err) {
      console.error('[TTS] 请求错误:', err)
      return { data: null, error: err.message }
    }
  }

  // ── 语音配置 GET /api/voice/config ─────────────────────────
  async function getVoiceConfig() {
    if (isDemoMode) {
      return { data: { autoplay: false, maxTtsLength: 250, voice: 'qiaopi_mengmei', speed: 1.0 }, error: null }
    }
    return fetchWithErrorHandling('/api/voice/config')
  }

  return { sendMessage, submitScaleAnswer, analyzeResults, getRecommendations, getSession, synthesizeSpeech, getVoiceConfig }
}

export default useApi
