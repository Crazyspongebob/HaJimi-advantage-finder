// 领域选择页 - 用户选择感兴趣的行业方向（最多2个）
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatContext, ActionTypes } from '../context/ChatContext'

// 8 个可选领域
const DOMAINS = [
  { id: '科技/互联网', icon: '💻', label: '科技/互联网', desc: '产品、研发、数据、AI' },
  { id: '金融投资',   icon: '📈', label: '金融投资',   desc: '投资、风控、金融科技' },
  { id: '教育培训',   icon: '📚', label: '教育培训',   desc: '课程研发、教学、EdTech' },
  { id: '市场营销',   icon: '📢', label: '市场营销',   desc: '品牌、增长、内容运营' },
  { id: '产品设计',   icon: '🎨', label: '产品设计',   desc: 'UX/UI、用研、交互设计' },
  { id: '咨询管理',   icon: '🏢', label: '咨询管理',   desc: '战略咨询、管理培训' },
  { id: '医疗健康',   icon: '🏥', label: '医疗健康',   desc: '医疗器械、健康科技' },
  { id: '文化创意',   icon: '🎭', label: '文化创意',   desc: '影视、游戏、内容创作' },
]

function DomainSelectionPage() {
  const navigate = useNavigate()
  const { dispatch } = useChatContext()
  const [selected, setSelected] = useState([])

  function toggleDomain(id) {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(d => d !== id)
      if (prev.length >= 2) return prev  // 最多 2 个
      return [...prev, id]
    })
  }

  function handleConfirm() {
    dispatch({ type: ActionTypes.SET_DOMAINS, payload: selected })
    navigate('/jobs')
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: '#0F172A' }}>
      {/* 顶部标题 */}
      <div
        className="px-6 py-6 text-center"
        style={{ borderBottom: '1px solid rgba(201,168,76,0.12)' }}
      >
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4"
          style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#C9A84C' }} />
          <span className="text-xs font-medium tracking-wider" style={{ color: '#C9A84C' }}>选择方向</span>
        </div>
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: '#FAFAF8', fontFamily: "'Noto Serif SC', serif" }}
        >
          选择你感兴趣的领域
        </h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          最多选择 <span style={{ color: '#C9A84C', fontWeight: '600' }}>2 个</span>，哈基米为你精准匹配岗位
        </p>
      </div>

      {/* 领域卡片网格 */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DOMAINS.map(domain => {
            const isSelected = selected.includes(domain.id)
            const isDisabled = !isSelected && selected.length >= 2

            return (
              <button
                key={domain.id}
                onClick={() => toggleDomain(domain.id)}
                disabled={isDisabled}
                className="relative flex flex-col items-center text-center px-3 py-5 rounded-2xl transition-all duration-200"
                style={{
                  background: isSelected
                    ? 'rgba(201,168,76,0.12)'
                    : isDisabled
                    ? 'rgba(255,255,255,0.02)'
                    : 'rgba(255,255,255,0.04)',
                  border: isSelected
                    ? '1.5px solid rgba(201,168,76,0.5)'
                    : isDisabled
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid rgba(255,255,255,0.08)',
                  opacity: isDisabled ? 0.35 : 1,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  boxShadow: isSelected ? '0 4px 20px rgba(201,168,76,0.1)' : 'none',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                }}
                onMouseEnter={e => {
                  if (!isDisabled && !isSelected) {
                    e.currentTarget.style.border = '1px solid rgba(201,168,76,0.3)'
                    e.currentTarget.style.background = 'rgba(201,168,76,0.06)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isDisabled && !isSelected) {
                    e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  }
                }}
              >
                {/* 选中指示器 */}
                {isSelected && (
                  <div
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #C9A84C, #B8960C)' }}
                  >
                    <span className="text-white text-xs font-bold" style={{ fontSize: '10px' }}>✓</span>
                  </div>
                )}

                <span className="text-3xl mb-2">{domain.icon}</span>
                <span
                  className="font-semibold text-sm"
                  style={{ color: isSelected ? '#E2C97E' : 'rgba(255,255,255,0.8)' }}
                >
                  {domain.label}
                </span>
                <span className="text-xs mt-1 leading-tight" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {domain.desc}
                </span>
              </button>
            )
          })}
        </div>

        {/* 选中状态提示 */}
        <div className="mt-5 text-center">
          {selected.length === 0 && (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>点击卡片选择你感兴趣的方向</p>
          )}
          {selected.length > 0 && selected.length < 2 && (
            <p className="text-sm" style={{ color: '#C9A84C' }}>
              已选 {selected.length} 个，还可以再选 {2 - selected.length} 个
            </p>
          )}
          {selected.length === 2 && (
            <p className="text-sm font-medium" style={{ color: '#E2C97E' }}>
              完美！已选择 2 个领域
            </p>
          )}
        </div>
      </div>

      {/* 底部确认按钮 - 固定在底部 */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-4"
        style={{ background: 'rgba(15,23,42,0.95)', borderTop: '1px solid rgba(201,168,76,0.1)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleConfirm}
            disabled={selected.length === 0}
            className="w-full py-4 rounded-full font-bold text-base transition-all duration-200"
            style={{
              background: selected.length === 0
                ? 'rgba(255,255,255,0.06)'
                : 'linear-gradient(135deg, #C9A84C 0%, #D4B46A 50%, #B8960C 100%)',
              color: selected.length === 0 ? 'rgba(255,255,255,0.25)' : '#0F172A',
              cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: selected.length === 0 ? 'none' : '0 4px 15px rgba(201,168,76,0.3)',
            }}
          >
            {selected.length === 0
              ? '请先选择至少 1 个领域'
              : `获取岗位推荐 → (${selected.join(' + ')})`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DomainSelectionPage
