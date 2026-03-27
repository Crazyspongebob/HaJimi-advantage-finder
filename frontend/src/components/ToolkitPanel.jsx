// ToolkitPanel.jsx — Layer 3: Per-theme "Hakimi Career Toolkit" tabs
import React, { useState } from 'react'
import CatAvatar from './CatAvatar'

const DOMAIN_COLORS = {
  executing:    '#3B82F6',
  influencing:  '#F59E0B',
  relationship: '#10B981',
  strategic:    '#8B5CF6',
  execution:    '#3B82F6',
  influence:    '#F59E0B',
}

export default function ToolkitPanel({ themes = [] }) {
  const [activeIdx, setActiveIdx] = useState(0)

  if (!themes.length) return null

  const theme = themes[Math.min(activeIdx, themes.length - 1)]
  const toolkit = theme?.toolkit || {}
  const domainColor = DOMAIN_COLORS[theme.domain] || '#C9A84C'

  return (
    <div>
      {/* Tab row */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {themes.map((t, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: i === activeIdx ? domainColor : 'rgba(15,23,42,0.05)',
              color: i === activeIdx ? '#fff' : 'rgba(15,23,42,0.5)',
              border: i === activeIdx ? `1px solid ${domainColor}` : '1px solid rgba(15,23,42,0.08)',
            }}
          >
            <span className="w-4 h-4 rounded-full text-center leading-4 text-xs font-black"
              style={{ background: i === activeIdx ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.06)' }}>
              {t.rank}
            </span>
            {t.nameZh || t.name}
          </button>
        ))}
      </div>

      {/* Toolkit card */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#FAFAF8', border: `1px solid ${domainColor}22` }}>
        {/* Card header */}
        <div className="px-5 py-4 flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${domainColor}12, ${domainColor}06)`, borderBottom: `1px solid ${domainColor}15` }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm"
            style={{ background: domainColor, color: '#fff' }}>
            {theme.rank}
          </div>
          <div>
            <p className="font-bold text-base" style={{ color: '#0F172A', fontFamily: "'Noto Serif SC', serif" }}>
              {theme.nameZh || theme.name}
              {theme.nameEn && <span className="text-xs font-normal ml-1.5" style={{ color: 'rgba(15,23,42,0.4)' }}>{theme.nameEn}</span>}
            </p>
            <p className="text-xs" style={{ color: domainColor }}>哈基米职场建议</p>
          </div>
        </div>

        {/* Toolkit rows */}
        <div className="px-5 py-5 space-y-4">
          {toolkit.strength && (
            <div className="flex gap-3">
              <span className="flex-shrink-0 text-lg leading-tight">💪</span>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: '#0F172A' }}>发挥你的优势</p>
                <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{toolkit.strength}</p>
              </div>
            </div>
          )}

          {toolkit.blindspot && (
            <div className="flex gap-3">
              <span className="flex-shrink-0 text-lg leading-tight">⚠️</span>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: '#0F172A' }}>注意盲点</p>
                <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{toolkit.blindspot}</p>
              </div>
            </div>
          )}

          {toolkit.action && (
            <div className="flex gap-3 px-4 py-3 rounded-xl" style={{ background: `${domainColor}08`, border: `1px solid ${domainColor}18` }}>
              <span className="flex-shrink-0 text-lg leading-tight">✅</span>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: domainColor }}>本周行动</p>
                <p className="text-sm font-medium leading-relaxed" style={{ color: '#1F2937' }}>{toolkit.action}</p>
              </div>
            </div>
          )}

          {toolkit.hakimiQuote && (
            <div className="flex gap-3 items-start pt-2">
              <CatAvatar size="sm" className="flex-shrink-0 mt-0.5" />
              <div className="px-4 py-3 rounded-2xl rounded-tl-none flex-1" style={{ background: '#0F172A' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(201,168,76,0.7)' }}>哈基米说</p>
                <p className="text-sm leading-relaxed" style={{ color: '#FAFAF8' }}>{toolkit.hakimiQuote}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
