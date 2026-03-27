// LikertScaleCard.jsx — 盖洛普量表题卡片 (Mode B)
// 显示 1-5 Likert 量表问题组，用户逐条评分后一键提交

import React, { useState } from 'react'

const LABELS = {
  1: { text: '完全不同意', color: '#ef4444' },
  2: { text: '不太同意',   color: '#f97316' },
  3: { text: '一般',       color: '#eab308' },
  4: { text: '比较同意',   color: '#84cc16' },
  5: { text: '非常同意',   color: '#22c55e' },
}

/**
 * @param {string[]} questions    - Likert 陈述列表
 * @param {string}   themeName    - 当前才干主题中文名 (e.g. "成就")
 * @param {string}   themeEn      - 英文主题名 (e.g. "Achiever")
 * @param {function} onSubmit     - 提交回调 ({ theme, answers: number[] }) => void
 * @param {function} onSkip       - 跳过整个量表
 * @param {boolean}  disabled     - 提交中禁用
 */
export default function LikertScaleCard({
  questions = [],
  themeName = '',
  themeEn = '',
  onSubmit,
  onSkip,
  disabled = false,
}) {
  const [answers, setAnswers] = useState({})   // { questionIndex: score }
  const [submitted, setSubmitted] = useState(false)

  const allAnswered = questions.length > 0 && questions.every((_, i) => answers[i] != null)

  function rate(index, score) {
    if (disabled || submitted) return
    setAnswers(prev => ({ ...prev, [index]: score }))
  }

  function handleSubmit() {
    if (!allAnswered || submitted) return
    setSubmitted(true)
    const answerArray = questions.map((_, i) => answers[i])
    onSubmit?.({ theme: themeEn, answers: answerArray })
  }

  return (
    <div
      className="mx-auto max-w-xl w-full rounded-2xl overflow-hidden message-bubble"
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(201,168,76,0.2)',
        boxShadow: '0 4px 24px rgba(15,23,42,0.08)',
      }}
    >
      {/* 标题栏 */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', borderBottom: '1px solid rgba(201,168,76,0.15)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', letterSpacing: '0.05em' }}
          >
            精准校准
          </span>
          <span className="text-sm font-semibold" style={{ color: '#FAFAF8', fontFamily: "'Noto Serif SC', serif" }}>
            {themeName} 维度量表
          </span>
        </div>
        <button
          onClick={onSkip}
          disabled={disabled || submitted}
          className="text-xs transition-colors hover:opacity-80"
          style={{ color: 'rgba(201,168,76,0.5)' }}
        >
          跳过 →
        </button>
      </div>

      {/* 说明 */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-xs" style={{ color: 'rgba(15,23,42,0.45)' }}>
          对以下陈述，你的认同程度是？（1 = 完全不同意，5 = 非常同意）
        </p>
      </div>

      {/* 题目列表 */}
      <div className="px-5 pb-4 space-y-4">
        {questions.map((q, i) => (
          <div key={i} className="space-y-2">
            {/* 陈述文本 */}
            <p className="text-sm leading-relaxed" style={{ color: '#1E293B' }}>
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold mr-1.5 flex-shrink-0"
                style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}
              >
                {i + 1}
              </span>
              {q}
            </p>

            {/* 评分按钮 */}
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(score => {
                const selected = answers[i] === score
                const label = LABELS[score]
                return (
                  <button
                    key={score}
                    onClick={() => rate(i, score)}
                    disabled={disabled || submitted}
                    title={label.text}
                    className="flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-150"
                    style={{
                      background: selected
                        ? label.color
                        : 'rgba(15,23,42,0.04)',
                      color: selected ? '#fff' : 'rgba(15,23,42,0.4)',
                      border: selected
                        ? `1px solid ${label.color}`
                        : '1px solid rgba(15,23,42,0.08)',
                      transform: selected ? 'scale(1.05)' : 'scale(1)',
                      fontWeight: selected ? '700' : '400',
                      cursor: disabled || submitted ? 'default' : 'pointer',
                    }}
                  >
                    {score}
                  </button>
                )
              })}
            </div>

            {/* 当前选择标签 */}
            {answers[i] != null && (
              <p className="text-xs" style={{ color: LABELS[answers[i]].color }}>
                {LABELS[answers[i]].text}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* 提交按钮 */}
      <div className="px-5 pb-5">
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || disabled || submitted}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-200"
            style={{
              background: allAnswered && !submitted
                ? 'linear-gradient(135deg, #C9A84C 0%, #D4B46A 50%, #B8960C 100%)'
                : 'rgba(15,23,42,0.08)',
              color: allAnswered && !submitted ? '#0F172A' : 'rgba(15,23,42,0.3)',
              boxShadow: allAnswered && !submitted ? '0 4px 12px rgba(201,168,76,0.3)' : 'none',
              cursor: allAnswered && !submitted ? 'pointer' : 'not-allowed',
            }}
          >
            {submitted ? '✓ 已提交' : `提交评分（${Object.keys(answers).length}/${questions.length}）`}
          </button>
        </div>

        {/* 进度提示 */}
        {!allAnswered && !submitted && (
          <p className="text-xs text-center mt-2" style={{ color: 'rgba(15,23,42,0.3)' }}>
            还有 {questions.length - Object.keys(answers).length} 题未评分
          </p>
        )}
      </div>
    </div>
  )
}
