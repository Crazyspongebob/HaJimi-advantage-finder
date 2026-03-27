// 自定义 API Hook - 封装所有后端请求
import { useDemoMode } from '../context/DemoModeContext'
import { mockData, mockProgressSequence } from '../utils/mockData'

// 统一错误处理
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
  const { isDemoMode, simulateDelay } = useDemoMode()

  // ── 发送聊天消息 POST /api/chat ─────────────────────────────
  // 新增: scaleAnswer 参数用于量表模式提交
  // scaleAnswer: { theme: string, answers: number[] }
  async function sendMessage(sessionId, message, history = [], scaleAnswer = null) {
    if (isDemoMode) {
      await simulateDelay(800)
      const msgIndex = history.length
      const mockMsg = mockData.messages[Math.min(msgIndex + 1, mockData.messages.length - 1)]
      const progressIndex = Math.min(Math.floor(msgIndex / 2), mockProgressSequence.length - 1)
      const progress = mockProgressSequence[progressIndex]
      const isComplete = msgIndex >= 4
      return {
        data: {
          sessionId: sessionId || 'demo-session-001',
          reply: mockMsg?.content || '喵~ 感谢你的分享！哈基米已充分了解你，可以生成报告了！🐾',
          progress,
          isComplete,
          mode: 'A',
          currentTheme: null,
          skipDetected: false,
        },
        error: null,
      }
    }

    return fetchWithErrorHandling('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message, history, scaleAnswer }),
    })
  }

  // ── 量表答题提交（包装 sendMessage）────────────────────────
  async function submitScaleAnswer(sessionId, theme, answers) {
    return sendMessage(sessionId, '', [], { theme, answers })
  }

  // ── 分析才干结果 POST /api/analyze ──────────────────────────
  async function analyzeResults(sessionId, history = []) {
    if (isDemoMode) {
      await simulateDelay(2000)
      return { data: mockData.analysis, error: null }
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
      return { data: mockData.jobs, error: null }
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
        data: {
          sessionId: 'demo-session-001',
          messages: mockData.messages,
          progress: mockProgressSequence[mockProgressSequence.length - 1],
          isComplete: true,
        },
        error: null,
      }
    }
    return fetchWithErrorHandling(`/api/session/${sessionId}`)
  }

  // ── 语音合成 POST /api/tts ──────────────────────────────────
  // 返回 { data: { audioUrl, audioBlob }, error }
  async function synthesizeSpeech(text) {
    if (isDemoMode) {
      await simulateDelay(300)
      return { data: null, error: null }
    }
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        // TTS 失败是非致命错误，返回 null data
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
      return {
        data: { autoplay: false, maxTtsLength: 250, voice: 'qiaopi_mengmei', speed: 1.0 },
        error: null,
      }
    }
    return fetchWithErrorHandling('/api/voice/config')
  }

  return {
    sendMessage,
    submitScaleAnswer,
    analyzeResults,
    getRecommendations,
    getSession,
    synthesizeSpeech,
    getVoiceConfig,
  }
}

export default useApi
