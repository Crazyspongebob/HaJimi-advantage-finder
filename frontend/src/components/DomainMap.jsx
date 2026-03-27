// DomainMap.jsx — Layer 2: Four-domain horizontal bar chart + narrative grid
import React from 'react'

const DOMAINS = [
  { key: 'executing',    label: '执行力',   icon: '⚡', color: '#3B82F6', desc: 'Executing' },
  { key: 'strategic',   label: '战略思维',  icon: '🧭', color: '#8B5CF6', desc: 'Strategic Thinking' },
  { key: 'relationship',label: '关系建立',  icon: '🤝', color: '#10B981', desc: 'Relationship Building' },
  { key: 'influencing', label: '影响力',   icon: '✨', color: '#F59E0B', desc: 'Influencing' },
  // legacy aliases
  { key: 'execution',   label: '执行力',   icon: '⚡', color: '#3B82F6', desc: 'Executing' },
  { key: 'influence',   label: '影响力',   icon: '✨', color: '#F59E0B', desc: 'Influencing' },
]

const DOMAIN_KEYS_ORDERED = ['executing', 'strategic', 'relationship', 'influencing']

function resolveScore(scores, key) {
  if (scores[key] != null) return scores[key]
  // aliases
  if (key === 'executing' && scores.execution != null) return scores.execution
  if (key === 'influencing' && scores.influence != null) return scores.influence
  return 0
}

function resolveDomain(key) {
  return DOMAINS.find(d => d.key === key) || DOMAINS[0]
}

export default function DomainMap({ domainScores = {}, domainNarrative = {} }) {
  // Sort by score descending for bar display
  const sorted = DOMAIN_KEYS_ORDERED
    .map(key => ({ ...resolveDomain(key), score: resolveScore(domainScores, key) }))
    .sort((a, b) => b.score - a.score)

  const topTwo = sorted.slice(0, 2).map(d => d.key)

  return (
    <div>
      {/* Horizontal bar chart */}
      <div className="space-y-3 mb-6">
        {sorted.map((d, i) => (
          <div key={d.key} className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-24 flex-shrink-0">
              <span className="text-base">{d.icon}</span>
              <span className="text-xs font-medium" style={{ color: '#374151' }}>{d.label}</span>
            </div>
            <div className="flex-1 relative">
              <div className="h-5 rounded-full overflow-hidden" style={{ background: 'rgba(15,23,42,0.06)' }}>
                <div
                  className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-1000"
                  style={{
                    width: `${d.score}%`,
                    background: topTwo.includes(d.key)
                      ? `linear-gradient(90deg, ${d.color}, ${d.color}cc)`
                      : `linear-gradient(90deg, ${d.color}88, ${d.color}55)`,
                    minWidth: d.score > 0 ? '32px' : '0',
                  }}
                >
                  {d.score >= 15 && (
                    <span className="text-xs font-bold text-white tabular-nums">{d.score}%</span>
                  )}
                </div>
              </div>
              {topTwo.includes(d.key) && i === 0 && (
                <span className="absolute -right-1 -top-1 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: d.color, color: '#fff', fontSize: '10px' }}>主导</span>
              )}
            </div>
            {d.score < 15 && (
              <span className="text-xs font-semibold tabular-nums w-8 text-right" style={{ color: d.color }}>{d.score}%</span>
            )}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px" style={{ background: 'rgba(15,23,42,0.06)' }} />
        <span className="text-xs" style={{ color: 'rgba(15,23,42,0.3)' }}>◆</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(15,23,42,0.06)' }} />
      </div>

      {/* 2×2 Narrative grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map(d => {
          const narrative = domainNarrative[d.key] || domainNarrative[d.key === 'executing' ? 'execution' : d.key === 'influencing' ? 'influence' : d.key] || ''
          const isTop = topTwo.includes(d.key)
          return (
            <div key={d.key} className="p-4 rounded-xl" style={{
              background: isTop ? `${d.color}08` : 'rgba(15,23,42,0.02)',
              border: `1px solid ${isTop ? d.color + '22' : 'rgba(15,23,42,0.06)'}`,
            }}>
              <div className="flex items-center gap-2 mb-2">
                <span>{d.icon}</span>
                <span className="font-semibold text-sm" style={{ color: d.color, fontFamily: "'Noto Serif SC', serif" }}>{d.label}</span>
                <span className="text-xs ml-auto font-bold tabular-nums" style={{ color: d.color }}>{resolveScore(domainScores, d.key)}%</span>
              </div>
              {narrative ? (
                <p className="text-xs leading-relaxed" style={{ color: '#4B5563' }}>{narrative}</p>
              ) : (
                <p className="text-xs" style={{ color: 'rgba(15,23,42,0.3)' }}>暂无解读</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
