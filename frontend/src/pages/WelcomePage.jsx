import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatContext, ActionTypes } from '../context/ChatContext'
import { hakimiQuotes } from '../utils/mockData'

// SVG cat silhouette fallback
function CatSilhouette() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="100" r="100" fill="#1E293B"/>
      <ellipse cx="100" cy="130" rx="45" ry="40" fill="#C9A84C" opacity="0.9"/>
      <circle cx="100" cy="82" r="32" fill="#C9A84C" opacity="0.9"/>
      <polygon points="74,58 65,38 86,54" fill="#C9A84C" opacity="0.9"/>
      <polygon points="126,58 135,38 114,54" fill="#C9A84C" opacity="0.9"/>
      <polygon points="75,56 68,44 84,54" fill="#E2C97E" opacity="0.7"/>
      <polygon points="125,56 132,44 116,54" fill="#E2C97E" opacity="0.7"/>
      <ellipse cx="89" cy="80" rx="5" ry="6" fill="#0F172A"/>
      <ellipse cx="111" cy="80" rx="5" ry="6" fill="#0F172A"/>
      <circle cx="90" cy="79" r="1.5" fill="white"/>
      <circle cx="112" cy="79" r="1.5" fill="white"/>
      <polygon points="100,88 97,92 103,92" fill="#E8A0B4"/>
      <line x1="60" y1="86" x2="90" y2="90" stroke="white" strokeWidth="1" opacity="0.7"/>
      <line x1="60" y1="91" x2="90" y2="92" stroke="white" strokeWidth="1" opacity="0.7"/>
      <line x1="110" y1="90" x2="140" y2="86" stroke="white" strokeWidth="1" opacity="0.7"/>
      <line x1="110" y1="92" x2="140" y2="91" stroke="white" strokeWidth="1" opacity="0.7"/>
      <ellipse cx="76" cy="165" rx="14" ry="10" fill="#C9A84C" opacity="0.9"/>
      <ellipse cx="124" cy="165" rx="14" ry="10" fill="#C9A84C" opacity="0.9"/>
      <path d="M145 145 Q175 120 165 100 Q155 85 148 105" stroke="#C9A84C" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.9"/>
    </svg>
  )
}

function WelcomePage() {
  const navigate = useNavigate()
  const { dispatch } = useChatContext()
  const [quote] = useState(() => {
    const idx = Math.floor(Math.random() * hakimiQuotes.length)
    return hakimiQuotes[idx]
  })
  const [catImgError, setCatImgError] = useState(false)
  const [catImgLoaded, setCatImgLoaded] = useState(false)

  const handleStart = () => {
    dispatch({ type: ActionTypes.RESET_SESSION })
    navigate('/chat')
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: '#0F172A' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(201,168,76,0.05)' }} />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(201,168,76,0.04)' }} />
        <div className="absolute top-1/2 left-0 w-64 h-64 rounded-full blur-3xl" style={{ background: 'rgba(59,130,246,0.03)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-16 min-h-screen flex flex-col">
        {/* Top nav */}
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #9B7A1F)', color: '#0F172A' }}
            >
              H
            </div>
            <span className="text-white/70 text-sm font-medium">哈基米</span>
          </div>
          <span className="text-white/40 text-xs">基于盖洛普 StrengthsFinder</span>
        </nav>

        {/* Main content */}
        <div className="flex-1 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          {/* Left: text */}
          <div className="flex-1 text-center lg:text-left">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#C9A84C' }} />
              <span className="text-xs font-medium tracking-wider uppercase" style={{ color: '#C9A84C' }}>AI 才干探索</span>
            </div>

            <h1
              className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              发现你的<br />
              <span className="gold-text">天赋优势</span>
            </h1>

            <p className="text-lg mb-10 max-w-md lg:max-w-none leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
              通过与哈基米的轻松对话，5 分钟揭示你<br className="hidden lg:block"/>
              独一无二的才干组合和最匹配的职业方向。
            </p>

            {/* Quote card */}
            <div
              className="rounded-2xl p-5 mb-10 max-w-md"
              style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', backdropFilter: 'blur(8px)' }}
            >
              <p className="text-sm italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>"{quote}"</p>
              <p className="text-xs mt-2" style={{ color: 'rgba(201,168,76,0.6)' }}>— 哈基米</p>
            </div>

            {/* CTA */}
            <button
              onClick={handleStart}
              className="btn-gold font-bold text-base px-10 py-4 rounded-full inline-flex items-center gap-3 group"
              style={{ color: '#0F172A' }}
            >
              <span>开始探索</span>
              <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </button>

            {/* Feature chips */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-8">
              {['约 5 分钟', '盖洛普方法论', '34 个才干维度', '个性化报告'].map(f => (
                <span
                  key={f}
                  className="text-xs rounded-full px-3 py-1"
                  style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Right: cat image */}
          <div className="relative flex-shrink-0">
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-full scale-110 blur-2xl" style={{ background: 'rgba(201,168,76,0.2)' }} />
            <div
              className="relative w-72 h-72 lg:w-96 lg:h-96 rounded-full overflow-hidden"
              style={{
                border: '2px solid rgba(201,168,76,0.3)',
                boxShadow: '0 0 60px rgba(201,168,76,0.15), 0 0 120px rgba(201,168,76,0.08)',
              }}
            >
              {!catImgError ? (
                <>
                  {!catImgLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#1E293B' }}>
                      <CatSilhouette />
                    </div>
                  )}
                  <img
                    src="https://cataas.com/cat?width=400&height=400"
                    alt="哈基米猫咪"
                    className={`w-full h-full object-cover transition-opacity duration-700 ${catImgLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setCatImgLoaded(true)}
                    onError={() => setCatImgError(true)}
                  />
                </>
              ) : (
                <CatSilhouette />
              )}
            </div>
            {/* Floating badge */}
            <div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full px-5 py-2 flex items-center gap-2 whitespace-nowrap"
              style={{
                background: '#0F172A',
                border: '1px solid rgba(201,168,76,0.3)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>哈基米在线，随时为你服务</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          © 2025 哈基米优势发现器 · 基于盖洛普 CliftonStrengths 34 方法论
        </footer>
      </div>
    </div>
  )
}

export default WelcomePage
