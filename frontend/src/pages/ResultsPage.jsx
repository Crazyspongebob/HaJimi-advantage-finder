// 结果展示页 — 三层专业才干报告
// Layer 1: 五大签名才干卡片
// Layer 2: 四域分布地图（横向条形 + 叙事）
// Layer 3: 哈基米职场工具箱

import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatContext, ActionTypes } from '../context/ChatContext'
import { useApi } from '../hooks/useApi'
import CatAvatar from '../components/CatAvatar'
import ThemeCard from '../components/ThemeCard'
import DomainMap from '../components/DomainMap'
import ToolkitPanel from '../components/ToolkitPanel'
import Skeleton from '../components/Skeleton'

// 分析加载 Overlay
function AnalysisOverlay({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState(0)
  const stages = ['正在读取对话记录…', '识别才干信号词…', '匹配盖洛普维度…', '生成你的天赋报告']

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 2
        if (next >= 100) { clearInterval(interval); setTimeout(onComplete, 400); return 100 }
        setStage(Math.floor((next / 100) * (stages.length - 1)))
        return next
      })
    }, 60)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(8px)' }}>
      <div className="mb-8 relative">
        <CatAvatar size="lg" avatarState="thinking" />
        <div className="absolute inset-0 rounded-full" style={{ border: '2px solid rgba(201,168,76,0.3)', animation: 'ping 1.5s infinite', transform: 'scale(1.3)' }} />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: '#FAFAF8', fontFamily: "'Noto Serif SC', serif" }}>哈基米正在分析你的才干</h2>
      <p className="text-sm mb-10" style={{ color: 'rgba(201,168,76,0.7)' }}>{stages[stage]}</p>
      <div className="w-64">
        <div className="h-0.5 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full transition-all duration-100" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #C9A84C, #E2C97E)' }} />
        </div>
        <p className="text-xs text-center tabular-nums" style={{ color: 'rgba(255,255,255,0.3)' }}>{progress}%</p>
      </div>
    </div>
  )
}

// Section divider
function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3))' }} />
      <span className="text-xs font-semibold tracking-widest uppercase px-2" style={{ color: 'rgba(201,168,76,0.6)', fontFamily: 'Inter, sans-serif' }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(201,168,76,0.3), transparent)' }} />
    </div>
  )
}

// Certification stamp
function CertStamp() {
  return (
    <div className="flex-shrink-0 w-16 h-16 relative flex items-center justify-center" style={{ opacity: 0.85 }}>
      <svg viewBox="0 0 64 64" className="absolute inset-0 w-full h-full">
        <circle cx="32" cy="32" r="30" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeDasharray="4 2" />
        <circle cx="32" cy="32" r="24" fill="none" stroke="#C9A84C" strokeWidth="0.5" />
      </svg>
      <div className="text-center z-10">
        <div style={{ fontSize: '18px', lineHeight: 1 }}>🐾</div>
        <div className="text-xs font-bold mt-0.5" style={{ color: '#C9A84C', fontSize: '7px', letterSpacing: '0.1em' }}>认证</div>
      </div>
    </div>
  )
}

function ResultsPage() {
  const navigate = useNavigate()
  const { state, dispatch } = useChatContext()
  const { analyzeResults } = useApi()
  const [showOverlay, setShowOverlay] = useState(!state.results)
  const [copied, setCopied] = useState(false)
  const captureRef = useRef(null)

  useEffect(() => {
    if (!state.results) triggerAnalysis()
  }, []) // eslint-disable-line

  async function triggerAnalysis() {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true })
    const { data, error } = await analyzeResults(state.sessionId, state.messages)
    dispatch({ type: ActionTypes.SET_LOADING, payload: false })
    if (error || !data) { dispatch({ type: ActionTypes.SET_ERROR, payload: error || '分析失败，请重试' }); return }
    dispatch({ type: ActionTypes.SET_RESULTS, payload: data })
  }

  function handleCopy() {
    const themes = results?.themes || results?.topTalents || []
    if (!themes.length) return
    const text = themes.map(t => `${t.rank}. ${t.nameZh || t.name}（${t.domain}）：${t.description}`).join('\n')
    navigator.clipboard.writeText(`我的 Top 5 才干报告\n\n${text}\n\n— 哈基米优势发现器 🐾`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  async function handleScreenshot() {
    if (!captureRef.current) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(captureRef.current, { backgroundColor: '#FAFAF8', scale: 2, useCORS: true })
      const link = document.createElement('a')
      link.download = `哈基米才干报告_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) { console.error('截图失败:', err) }
  }

  const results = state.results
  const themes = results?.themes || results?.topTalents || []
  const hasResults = themes.length > 0

  return (
    <>
      {showOverlay && <AnalysisOverlay onComplete={() => setShowOverlay(false)} />}

      <div className="min-h-screen pb-24" style={{ background: '#FAFAF8' }}>

        {/* ── Hero Banner ──────────────────────────────────────── */}
        <div className="px-6 py-8 text-center" style={{ background: '#0F172A', borderBottom: '1px solid rgba(201,168,76,0.12)' }}>
          <div className="flex items-center justify-center gap-4 mb-4">
            <CatAvatar size="lg" avatarState="speaking" />
            <CertStamp />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-3" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#C9A84C' }} />
            <span className="text-xs font-medium tracking-wider" style={{ color: '#C9A84C' }}>哈基米认证才干报告</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
            你的才干报告出炉了
          </h1>

          {results?.hakimiVerdict && (
            <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: 'rgba(201,168,76,0.85)', fontFamily: "'Noto Serif SC', serif" }}>
              {results.hakimiVerdict}
            </p>
          )}
        </div>

        {/* ── Report body ─────────────────────────────────────── */}
        <div ref={captureRef} id="results-capture" className="max-w-2xl mx-auto px-4 pt-8 space-y-8">

          {/* ═══ Layer 1: Top 5 Themes ═══════════════════════════ */}
          <section>
            <Divider label="Top 5 签名才干" />
            <div className="space-y-3 mt-4">
              {!hasResults ? (
                [1,2,3,4,5].map(i => <Skeleton key={i} height="h-20" className="rounded-2xl" />)
              ) : (
                themes.map((theme, i) => (
                  <ThemeCard key={theme.rank || i} theme={theme} defaultExpanded={i === 0} />
                ))
              )}
            </div>
          </section>

          {/* ═══ Layer 2: Domain Distribution Map ═══════════════ */}
          <section className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}>
            <Divider label="四大领域分布" />
            <div className="mt-4">
              {!hasResults ? (
                <Skeleton height="h-48" className="rounded-xl" />
              ) : (
                <DomainMap
                  domainScores={results.domainScores || {}}
                  domainNarrative={results.domainNarrative || {}}
                />
              )}
            </div>
          </section>

          {/* ═══ Layer 3: Hakimi Career Toolkit ════════════════ */}
          {hasResults && themes.some(t => t.toolkit?.strength) && (
            <section className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}>
              <Divider label="哈基米职场工具箱" />
              <div className="mt-4">
                <ToolkitPanel themes={themes} />
              </div>
            </section>
          )}

          {/* ═══ Summary Quote ══════════════════════════════════ */}
          {results?.summary && (
            <div className="rounded-2xl px-5 py-4" style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <p className="text-sm leading-relaxed" style={{ color: '#7A5C10' }}>
                <span className="font-bold" style={{ color: '#9B7A1F' }}>哈基米说：</span>{results.summary}
              </p>
            </div>
          )}
        </div>

        {/* ── Action Bar ───────────────────────────────────────── */}
        <div className="max-w-2xl mx-auto px-4 mt-8 space-y-3">
          <div className="flex gap-3">
            <button onClick={handleCopy} className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{ border: '1px solid rgba(201,168,76,0.3)', color: '#9B7A1F', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
              {copied ? '已复制 ✓' : '复制结果'}
            </button>
            <button onClick={handleScreenshot} className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{ border: '1px solid rgba(201,168,76,0.3)', color: '#9B7A1F', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
              截图保存
            </button>
          </div>

          <button onClick={() => navigate('/domain')} disabled={!hasResults}
            className="w-full py-4 rounded-full font-bold text-base transition-all duration-200"
            style={{
              background: hasResults ? 'linear-gradient(135deg, #C9A84C 0%, #D4B46A 50%, #B8960C 100%)' : 'rgba(15,23,42,0.08)',
              color: hasResults ? '#0F172A' : 'rgba(15,23,42,0.3)',
              boxShadow: hasResults ? '0 4px 15px rgba(201,168,76,0.3)' : 'none',
              cursor: hasResults ? 'pointer' : 'not-allowed',
            }}>
            选择我感兴趣的领域 →
          </button>
        </div>
      </div>
    </>
  )
}

export default ResultsPage
