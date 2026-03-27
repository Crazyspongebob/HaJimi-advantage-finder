// 职位推荐页 - 展示与才干最匹配的岗位
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatContext, ActionTypes } from '../context/ChatContext'
import { useApi } from '../hooks/useApi'
import Skeleton from '../components/Skeleton'

// 领域名中文映射
const DOMAIN_NAMES = {
  execution: '执行力',
  influence: '影响力',
  relationship: '关系建立',
  strategic: '战略思维',
}

// 加载动效 overlay
function LoadingOverlay() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(15,23,42,0.96)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{
          background: 'linear-gradient(135deg, #C9A84C, #9B7A1F)',
          animation: 'spin 2s linear infinite',
          fontSize: '28px',
        }}
      >
        🐱
      </div>
      <h2
        className="text-lg font-bold mb-2"
        style={{ color: '#FAFAF8', fontFamily: "'Noto Serif SC', serif" }}
      >
        为你匹配最佳岗位
      </h2>
      <p className="text-sm" style={{ color: 'rgba(201,168,76,0.7)' }}>结合才干 + 行业，精准定位中...</p>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}

// 单个岗位卡片
function JobCard({ job, index }) {
  const { title, companyType, matchedTalents = [], reason, growthPath } = job
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200 group"
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(15,23,42,0.07)',
        boxShadow: '0 2px 12px rgba(15,23,42,0.05)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(15,23,42,0.1)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,23,42,0.05)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* 序号 + 标题 */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #C9A84C, #B8960C)', color: '#0F172A' }}
        >
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="font-bold text-base leading-tight"
            style={{ color: '#0F172A', fontFamily: "'Noto Serif SC', serif" }}
          >
            {title}
          </h3>
          <span className="text-xs mt-0.5 block" style={{ color: 'rgba(15,23,42,0.4)' }}>{companyType}</span>
        </div>
      </div>

      {/* 才干匹配标签 */}
      {matchedTalents.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {matchedTalents.map(talent => (
            <span
              key={talent}
              className="px-2.5 py-0.5 text-xs font-semibold rounded-full"
              style={{ background: 'rgba(201,168,76,0.1)', color: '#9B7A1F', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              {talent}
            </span>
          ))}
        </div>
      )}

      {/* 匹配理由 */}
      <p className="text-sm leading-relaxed" style={{ color: 'rgba(15,23,42,0.65)' }}>{reason}</p>

      {/* 成长路径 */}
      {growthPath && (
        <div
          className="mt-3 pt-3"
          style={{ borderTop: '1px solid rgba(15,23,42,0.06)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(15,23,42,0.4)' }}>
            <span style={{ color: 'rgba(15,23,42,0.55)', fontWeight: '500' }}>成长路径：</span> {growthPath}
          </p>
        </div>
      )}

      {/* 了解更多 */}
      <button
        className="mt-3 w-full py-2 rounded-xl text-sm font-medium transition-all duration-200"
        style={{ border: '1px solid rgba(201,168,76,0.3)', color: '#9B7A1F', background: 'transparent' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.06)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        了解更多 →
      </button>
    </div>
  )
}

function JobRecommendationPage() {
  const navigate = useNavigate()
  const { state, dispatch } = useChatContext()
  const { getRecommendations } = useApi()
  const [isLoading, setIsLoading] = useState(!state.jobs)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!state.jobs) {
      fetchJobs()
    } else {
      setIsLoading(false)
    }
  }, [])

  async function fetchJobs() {
    setIsLoading(true)
    const { data, error } = await getRecommendations(
      state.results?.topTalents || [],
      state.selectedDomains || []
    )
    setIsLoading(false)

    if (error || !data) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error || '推荐失败' })
      return
    }
    dispatch({ type: ActionTypes.SET_JOBS, payload: data })
  }

  function handleShare() {
    if (!state.jobs?.jobs) return
    const text = state.jobs.jobs
      .map((j, i) => `${i + 1}. ${j.title}（${j.companyType}）`)
      .join('\n')
    navigator.clipboard.writeText(`哈基米为我推荐的职位\n\n${text}\n\n— 哈基米优势发现器`)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
  }

  const jobs = state.jobs?.jobs || []
  const insight = state.jobs?.personalityInsight

  return (
    <>
      {isLoading && <LoadingOverlay />}

      <div className="min-h-screen pb-24" style={{ background: '#FAFAF8' }}>
        {/* 顶部标题 */}
        <div
          className="px-6 py-6 text-center"
          style={{ background: '#0F172A', borderBottom: '1px solid rgba(201,168,76,0.12)' }}
        >
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-3"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#C9A84C' }} />
            <span className="text-xs font-medium tracking-wider" style={{ color: '#C9A84C' }}>岗位推荐</span>
          </div>
          <h1
            className="text-xl font-bold text-white mb-1"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            为你量身定制的职位推荐
          </h1>
          {state.selectedDomains?.length > 0 && (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              领域：{state.selectedDomains.join(' · ')}
            </p>
          )}
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
          {/* 个性洞察 */}
          {insight && !isLoading && (
            <div
              className="rounded-2xl px-5 py-4"
              style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              <p className="text-sm leading-relaxed" style={{ color: '#7A5C10' }}>
                <span className="font-bold" style={{ color: '#9B7A1F' }}>哈基米洞察：</span> {insight}
              </p>
            </div>
          )}

          {/* 岗位列表 */}
          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <Skeleton key={i} height="h-48" className="rounded-2xl" />)}
            </div>
          ) : jobs.length > 0 ? (
            jobs.map((job, index) => (
              <JobCard key={`${job.title}-${index}`} job={job} index={index} />
            ))
          ) : (
            <div className="text-center py-12" style={{ color: 'rgba(15,23,42,0.35)' }}>
              <div className="text-5xl mb-4">🐱</div>
              <p>暂时没有匹配的岗位，哈基米再想想...</p>
              <button
                onClick={fetchJobs}
                className="mt-4 px-6 py-2 rounded-full text-sm font-medium"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #B8960C)', color: '#0F172A' }}
              >
                重新推荐
              </button>
            </div>
          )}

          {/* 哈基米结语 */}
          {!isLoading && jobs.length > 0 && (
            <div
              className="rounded-2xl px-5 py-4 text-center"
              style={{ background: '#0F172A', border: '1px solid rgba(201,168,76,0.15)' }}
            >
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                这些岗位都非常适合你 — 相信自己的才干，出发吧
              </p>
            </div>
          )}
        </div>

        {/* 底部操作区 */}
        <div
          className="fixed bottom-0 left-0 right-0 px-4 py-4"
          style={{ background: 'rgba(250,250,248,0.95)', borderTop: '1px solid rgba(15,23,42,0.08)', backdropFilter: 'blur(12px)' }}
        >
          <div className="max-w-2xl mx-auto flex gap-3">
            <button
              onClick={() => { dispatch({ type: ActionTypes.RESET_SESSION }); navigate('/') }}
              className="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors"
              style={{ border: '1px solid rgba(15,23,42,0.12)', color: 'rgba(15,23,42,0.6)', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.04)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              重新探索
            </button>
            <button
              onClick={handleShare}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: 'linear-gradient(135deg, #C9A84C 0%, #D4B46A 50%, #B8960C 100%)',
                color: '#0F172A',
                boxShadow: '0 4px 12px rgba(201,168,76,0.25)',
              }}
            >
              {copied ? '已复制！' : '分享结果'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default JobRecommendationPage
