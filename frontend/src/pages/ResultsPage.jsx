// 结果展示页 - 展示 Top 5 才干 + 雷达图
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatContext, ActionTypes } from '../context/ChatContext'
import { useApi } from '../hooks/useApi'
import TalentCard from '../components/TalentCard'
import RadarChart from '../components/RadarChart'
import Skeleton from '../components/Skeleton'

// 领域颜色映射
const DOMAIN_COLORS = {
  execution: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  influence: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  relationship: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  strategic: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
}

// 分析加载 Overlay：伪进度条 3 秒完成
function AnalysisOverlay({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState(0)
  const stages = [
    '正在读取对话记录…',
    '识别才干信号词…',
    '匹配盖洛普维度…',
    '生成你的天赋报告',
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 2
        if (next >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 400)
          return 100
        }
        setStage(Math.floor((next / 100) * (stages.length - 1)))
        return next
      })
    }, 60)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(8px)' }}
    >
      {/* Animated logo */}
      <div className="mb-8 relative">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #C9A84C, #9B7A1F)',
            boxShadow: '0 0 40px rgba(201,168,76,0.3)',
            animation: 'pulse 2s infinite',
          }}
        >
          <span style={{ fontSize: '36px' }}>🐱</span>
        </div>
        <div
          className="absolute inset-0 rounded-full"
          style={{ border: '2px solid rgba(201,168,76,0.3)', animation: 'ping 1.5s infinite', transform: 'scale(1.3)' }}
        />
      </div>

      <h2
        className="text-xl font-bold mb-2"
        style={{ color: '#FAFAF8', fontFamily: "'Noto Serif SC', serif" }}
      >
        哈基米正在分析你的才干
      </h2>
      <p className="text-sm mb-10" style={{ color: 'rgba(201,168,76,0.7)' }}>{stages[stage]}</p>

      {/* Progress bar */}
      <div className="w-64">
        <div
          className="h-0.5 rounded-full overflow-hidden mb-3"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #C9A84C, #E2C97E)',
            }}
          />
        </div>
        <p
          className="text-xs text-center tabular-nums"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {progress}%
        </p>
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

  // 页面加载时如果没有结果，触发分析
  useEffect(() => {
    if (!state.results) {
      triggerAnalysis()
    }
  }, [])

  async function triggerAnalysis() {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true })
    const { data, error } = await analyzeResults(state.sessionId, state.messages)
    dispatch({ type: ActionTypes.SET_LOADING, payload: false })

    if (error || !data) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error || '分析失败，请重试' })
      return
    }
    dispatch({ type: ActionTypes.SET_RESULTS, payload: data })
  }

  // Overlay 完成后隐藏
  function handleOverlayComplete() {
    setShowOverlay(false)
  }

  // 复制结果到剪贴板
  function handleCopy() {
    if (!state.results?.topTalents) return
    const text = state.results.topTalents
      .map(t => `${t.rank}. ${t.name}（${t.domain === 'execution' ? '执行力' : t.domain === 'influence' ? '影响力' : t.domain === 'relationship' ? '关系建立' : '战略思维'}）：${t.description}`)
      .join('\n')
    navigator.clipboard.writeText(`我的 Top 5 才干报告\n\n${text}\n\n— 哈基米优势发现器`)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
  }

  // 截图保存
  async function handleScreenshot() {
    if (!captureRef.current) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#FAFAF8',
        scale: 2,
        useCORS: true,
      })
      const link = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      link.download = `哈基米优势报告_${date}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('截图失败:', err)
    }
  }

  const results = state.results
  const hasResults = results?.topTalents && results.topTalents.length > 0

  return (
    <>
      {/* 分析中 Overlay */}
      {showOverlay && <AnalysisOverlay onComplete={handleOverlayComplete} />}

      <div className="min-h-screen pb-20" style={{ background: '#FAFAF8' }}>
        {/* 顶部标题 — 深海军蓝 */}
        <div
          className="px-6 py-6 text-center"
          style={{ background: '#0F172A', borderBottom: '1px solid rgba(201,168,76,0.12)' }}
        >
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-3"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#C9A84C' }} />
            <span className="text-xs font-medium tracking-wider" style={{ color: '#C9A84C' }}>才干报告</span>
          </div>
          <h1
            className="text-xl font-bold text-white mb-1"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            你的才干报告出炉了
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>哈基米为你解读独特的天赋地图</p>
        </div>

        <div ref={captureRef} id="results-capture" className="max-w-2xl mx-auto px-4 pt-6 space-y-5">

          {/* Top 5 才干卡片 */}
          <section>
            <h2
              className="text-sm font-bold mb-3 flex items-center gap-2"
              style={{ color: 'rgba(15,23,42,0.6)', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '11px' }}
            >
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center text-xs"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #B8960C)', color: '#0F172A' }}
              >
                ★
              </div>
              Top 5 才干
            </h2>

            {!hasResults ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => <Skeleton key={i} height="h-24" className="rounded-2xl" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {results.topTalents.map(talent => (
                  <TalentCard key={talent.rank} {...talent} />
                ))}
              </div>
            )}
          </section>

          {/* 雷达图 */}
          <section
            className="rounded-2xl p-5"
            style={{ background: '#FFFFFF', border: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}
          >
            <h2
              className="font-bold mb-4 flex items-center gap-2 text-sm"
              style={{ color: 'rgba(15,23,42,0.7)', fontFamily: "'Noto Serif SC', serif" }}
            >
              <span style={{ color: '#C9A84C' }}>◈</span> 四大领域能力分布
            </h2>
            {!hasResults ? (
              <Skeleton height="h-56" className="rounded-xl" />
            ) : (
              <RadarChart data={results.domainScores} />
            )}
          </section>

          {/* 总结语 */}
          {results?.summary && (
            <div
              className="rounded-2xl px-5 py-4"
              style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              <p className="text-sm leading-relaxed" style={{ color: '#7A5C10' }}>
                <span className="font-bold" style={{ color: '#9B7A1F' }}>哈基米说：</span> {results.summary}
              </p>
            </div>
          )}
        </div>

        {/* 操作按钮区 */}
        <div className="max-w-2xl mx-auto px-4 mt-6 space-y-3">
          {/* 复制 + 截图 */}
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{
                border: '1px solid rgba(201,168,76,0.3)',
                color: '#9B7A1F',
                background: 'transparent',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {copied ? '已复制！' : '复制结果'}
            </button>
            <button
              onClick={handleScreenshot}
              className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{
                border: '1px solid rgba(201,168,76,0.3)',
                color: '#9B7A1F',
                background: 'transparent',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              截图保存
            </button>
          </div>

          {/* 进入下一步 */}
          <button
            onClick={() => navigate('/domain')}
            disabled={!hasResults}
            className="w-full py-4 rounded-full font-bold text-base transition-all duration-200"
            style={{
              background: hasResults
                ? 'linear-gradient(135deg, #C9A84C 0%, #D4B46A 50%, #B8960C 100%)'
                : 'rgba(15,23,42,0.08)',
              color: hasResults ? '#0F172A' : 'rgba(15,23,42,0.3)',
              boxShadow: hasResults ? '0 4px 15px rgba(201,168,76,0.3)' : 'none',
              cursor: hasResults ? 'pointer' : 'not-allowed',
            }}
          >
            选择我感兴趣的领域 →
          </button>
        </div>
      </div>
    </>
  )
}

export default ResultsPage
