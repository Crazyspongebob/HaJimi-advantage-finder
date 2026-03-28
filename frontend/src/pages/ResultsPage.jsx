// 结果展示页 — 三层专业才干报告
// Layer 0: 如何阅读指引（可折叠）
// Layer 1: 五大签名才干卡片
// Layer DNA: 才干 DNA 解读（新增）
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

// Certification stamp with date context
function CertStamp({ sessionId }) {
  const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\//g, '.')
  const idStr = sessionId ? String(sessionId).slice(-8).toUpperCase() : '00000000'
  return (
    <div className="flex-shrink-0 w-20 h-20 relative flex flex-col items-center justify-center" style={{ opacity: 0.9 }}>
      <svg viewBox="0 0 80 80" className="absolute inset-0 w-full h-full">
        <circle cx="40" cy="40" r="38" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeDasharray="4 2" />
        <circle cx="40" cy="40" r="30" fill="none" stroke="#C9A84C" strokeWidth="0.5" />
      </svg>
      <div className="text-center z-10 px-1">
        <div style={{ fontSize: '20px', lineHeight: 1 }}>🐾</div>
        <div className="font-bold mt-0.5" style={{ color: '#C9A84C', fontSize: '7px', letterSpacing: '0.1em' }}>认证</div>
        <div style={{ color: 'rgba(201,168,76,0.65)', fontSize: '6px', marginTop: '2px', letterSpacing: '0.05em' }}>{dateStr}</div>
        <div style={{ color: 'rgba(201,168,76,0.4)', fontSize: '5.5px', marginTop: '1px', fontFamily: 'monospace' }}>#{idStr.slice(0, 6)}</div>
      </div>
    </div>
  )
}

// How to read this report — collapsible guide
function HowToReadGuide() {
  const [expanded, setExpanded] = useState(false)
  const items = [
    ['Top 5 签名才干', '这是你自然爆发、不费力的前5项天赋，不是你唯一的才干，而是最耀眼的那几个'],
    ['置信度分数', '分数（66-95）代表哈基米对该才干的识别置信度，不代表能力好坏，没有高低之分'],
    ['四大领域', '盖洛普将34个才干分为执行力、影响力、关系建立、战略思维，你的分布反映了行事风格'],
    ['职场工具箱', '基于你才干量身定制的职场行动建议，每个本周行动都是你可以立刻实践的小实验'],
  ]
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(15,23,42,0.07)', background: '#FFFFFF' }}>
      <button
        className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50"
        onClick={() => setExpanded(p => !p)}
        aria-expanded={expanded}
      >
        <span className="text-xs font-semibold flex items-center gap-2" style={{ color: 'rgba(15,23,42,0.5)' }}>
          📖 如何阅读这份报告
        </span>
        <span className="text-xs transition-transform duration-200" style={{ color: 'rgba(15,23,42,0.3)', display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(15,23,42,0.05)' }}>
          {items.map(([title, desc]) => (
            <div key={title} className="flex gap-3 pt-3">
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: '#C9A84C' }} />
              <div>
                <span className="text-xs font-semibold" style={{ color: '#0F172A' }}>{title}：</span>
                <span className="text-xs leading-relaxed" style={{ color: '#4B5563' }}>{desc}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Talent DNA Card — synthesis of all 5 themes
function TalentDNACard({ talentDNA, crossDomainInsight }) {
  if (!talentDNA && !crossDomainInsight) return null
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#0F172A', border: '1px solid rgba(201,168,76,0.15)' }}>
      <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(201,168,76,0.12)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)' }}>
          🧬
        </div>
        <div>
          <p className="font-bold text-base" style={{ color: '#FAFAF8', fontFamily: "'Noto Serif SC', serif" }}>才干 DNA 解读</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(201,168,76,0.6)' }}>你的才干如何协同工作</p>
        </div>
      </div>
      <div className="px-5 py-5 space-y-4">
        {talentDNA && (
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>{talentDNA}</p>
        )}
        {crossDomainInsight && (
          <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.18)' }}>
            <p className="text-xs font-semibold mb-1.5" style={{ color: '#C9A84C' }}>⚡ 跨域洞察</p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(201,168,76,0.88)' }}>{crossDomainInsight}</p>
          </div>
        )}
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
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#0F172A',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `哈基米才干报告_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) { console.error('截图失败:', err) }
  }

  const results = state.results
  const themes = results?.themes || results?.topTalents || []
  const hasResults = themes.length > 0
  const hasToolkit = hasResults && themes.some(t => t.toolkit && Object.values(t.toolkit).some(v => v))
  const hasDNA = !!(results?.talentDNA || results?.crossDomainInsight)

  return (
    <>
      {showOverlay && <AnalysisOverlay onComplete={() => setShowOverlay(false)} />}

      <div className="min-h-screen pb-24" style={{ background: '#FAFAF8' }}>

        {/* ── Capturable Report (hero + body + watermark) ──── */}
        <div ref={captureRef} id="results-capture">

          {/* ── Hero Banner ──────────────────────────────────── */}
          <div className="px-6 py-8 text-center" style={{ background: '#0F172A', borderBottom: '1px solid rgba(201,168,76,0.12)' }}>
            <div className="flex items-center justify-center gap-4 mb-4">
              <CatAvatar size="lg" avatarState="speaking" />
              <CertStamp sessionId={state.sessionId} />
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

          {/* ── Report body ───────────────────────────────────── */}
          <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6 pb-4">

            {/* ── How to Read Guide ─────────────────────────── */}
            <HowToReadGuide />

            {/* ═══ Layer 1: Top 5 Themes ═════════════════════ */}
            <section>
              <Divider label="Top 5 签名才干" />
              <div className="space-y-3 mt-4">
                {!hasResults ? (
                  [1, 2, 3, 4, 5].map(i => <Skeleton key={i} height="h-20" className="rounded-2xl" />)
                ) : (
                  themes.map((theme, i) => (
                    <ThemeCard key={theme.rank || i} theme={theme} defaultExpanded={i === 0} />
                  ))
                )}
              </div>
            </section>

            {/* ═══ Talent DNA ════════════════════════════════ */}
            {hasDNA && (
              <TalentDNACard
                talentDNA={results.talentDNA}
                crossDomainInsight={results.crossDomainInsight}
              />
            )}

            {/* ═══ Layer 2: Domain Distribution Map ═════════ */}
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

            {/* ═══ Layer 3: Hakimi Career Toolkit ═══════════ */}
            {hasToolkit && (
              <section className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}>
                <Divider label="哈基米职场工具箱" />
                <div className="mt-4">
                  <ToolkitPanel themes={themes} />
                </div>
              </section>
            )}

            {/* ═══ Overall Assessment ════════════════════════ */}
            {results?.summary && (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#0F172A', border: '1px solid rgba(201,168,76,0.15)' }}>
                <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                  <CatAvatar size="sm" />
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#FAFAF8', fontFamily: "'Noto Serif SC', serif" }}>哈基米的总评</p>
                    <p className="text-xs" style={{ color: 'rgba(201,168,76,0.55)' }}>综合才干组合分析</p>
                  </div>
                </div>
                <div className="px-5 py-5">
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>{results.summary}</p>
                </div>
              </div>
            )}

            {/* ── Watermark (visible in screenshot) ────────── */}
            <div className="text-center py-2" style={{ borderTop: '1px solid rgba(15,23,42,0.06)' }}>
              <p className="text-xs" style={{ color: 'rgba(15,23,42,0.2)', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>
                哈基米优势发现器 · 基于盖洛普 CliftonStrengths 34 · {new Date().toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
        </div>

        {/* ── Action Bar (outside captureRef) ──────────────── */}
        <div className="max-w-2xl mx-auto px-4 mt-6 space-y-3">
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
