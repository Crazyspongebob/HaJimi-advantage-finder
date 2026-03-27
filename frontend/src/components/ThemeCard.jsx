// ThemeCard.jsx — Layer 1: Expandable Top-5 signature theme card
import React, { useState } from 'react'

const DOMAIN_CONFIG = {
  executing:    { label: '执行力', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
  influencing:  { label: '影响力', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  relationship: { label: '关系建立', color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
  strategic:    { label: '战略思维', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
  // legacy aliases
  execution:    { label: '执行力', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
  influence:    { label: '影响力', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
}

const RANK_STYLES = [
  { bg: 'linear-gradient(135deg, #C9A84C, #B8960C)', color: '#0F172A', shadow: '0 2px 8px rgba(201,168,76,0.4)' },
  { bg: 'linear-gradient(135deg, #94a3b8, #64748b)', color: '#fff', shadow: '0 2px 8px rgba(100,116,139,0.3)' },
  { bg: 'linear-gradient(135deg, #cd7f32, #a0522d)', color: '#fff', shadow: '0 2px 8px rgba(205,127,50,0.3)' },
  { bg: 'rgba(51,65,85,0.9)', color: '#cbd5e1', shadow: 'none' },
  { bg: 'rgba(51,65,85,0.9)', color: '#cbd5e1', shadow: 'none' },
]

export default function ThemeCard({ theme, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const domainKey = theme.domain || 'executing'
  const domain = DOMAIN_CONFIG[domainKey] || DOMAIN_CONFIG.executing
  const rankStyle = RANK_STYLES[Math.min((theme.rank || 1) - 1, RANK_STYLES.length - 1)]

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: '#FFFFFF',
        border: `1px solid ${domain.color}22`,
        boxShadow: expanded ? `0 4px 20px ${domain.color}18` : '0 1px 4px rgba(15,23,42,0.06)',
        borderLeft: `4px solid ${domain.color}`,
      }}
    >
      {/* Card Header — always visible */}
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-4"
        onClick={() => setExpanded(p => !p)}
        aria-expanded={expanded}
      >
        {/* Rank badge */}
        <div
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-black"
          style={{ background: rankStyle.bg, color: rankStyle.color, boxShadow: rankStyle.shadow }}
        >
          {theme.rank}
        </div>

        {/* Name + domain */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-base" style={{ color: '#0F172A', fontFamily: "'Noto Serif SC', serif" }}>
              {theme.nameZh || theme.name}
            </span>
            {theme.nameEn && (
              <span className="text-xs" style={{ color: 'rgba(15,23,42,0.4)' }}>{theme.nameEn}</span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: domain.bg, color: domain.color }}>
              {domain.label}
            </span>
          </div>
          {theme.tagline && (
            <p className="text-xs mt-0.5" style={{ color: 'rgba(15,23,42,0.45)' }}>{theme.tagline}</p>
          )}
        </div>

        {/* Score bar */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <span className="text-sm font-bold tabular-nums" style={{ color: domain.color }}>{theme.score}</span>
          <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(15,23,42,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${theme.score}%`, background: `linear-gradient(90deg, ${domain.color}, ${domain.color}99)` }} />
          </div>
        </div>

        {/* Expand chevron */}
        <span className="flex-shrink-0 text-xs transition-transform duration-200 ml-1"
          style={{ color: 'rgba(15,23,42,0.3)', transform: expanded ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* Score bar full-width */}
          <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(15,23,42,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${theme.score}%`, background: `linear-gradient(90deg, ${domain.color}, ${domain.color}66)` }} />
          </div>

          {/* Description */}
          {theme.description && (
            <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{theme.description}</p>
          )}

          {/* Evidence */}
          {theme.evidence && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: domain.bg, borderLeft: `3px solid ${domain.color}` }}>
              <p className="text-xs font-semibold mb-1" style={{ color: domain.color }}>📌 对话中的证据</p>
              <p className="leading-relaxed" style={{ color: '#374151' }}>{theme.evidence}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
