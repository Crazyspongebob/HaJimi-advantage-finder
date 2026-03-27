// 才干卡片组件 - 用于展示结果页的 Top 5 才干
import React from 'react'

// 领域颜色映射
const domainColorMap = {
  execution: {
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    border: 'border-l-blue-500',
    rank: 'bg-blue-500',
    icon: '⚡',
  },
  influence: {
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    border: 'border-l-amber-500',
    rank: 'bg-amber-500',
    icon: '✨',
  },
  relationship: {
    badge: 'bg-green-100 text-green-700 border-green-200',
    border: 'border-l-green-500',
    rank: 'bg-green-500',
    icon: '💚',
  },
  strategic: {
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    border: 'border-l-purple-500',
    rank: 'bg-purple-500',
    icon: '🧠',
  },
}

// 领域中文名映射
const domainNameMap = {
  execution: '执行力',
  influence: '影响力',
  relationship: '关系建立',
  strategic: '战略思维',
}

function TalentCard({ rank, name, domain, description, evidence }) {
  const colors = domainColorMap[domain] || domainColorMap.execution
  const domainName = domainNameMap[domain] || domain

  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${colors.border}
        p-4 sm:p-5
        hover:shadow-md transition-shadow duration-200
        flex-shrink-0 w-64 sm:w-auto
      `}
    >
      {/* 头部：排名 + 才干名称 */}
      <div className="flex items-center gap-3 mb-3">
        {/* 排名徽章 */}
        <div
          className={`
            w-8 h-8 rounded-full ${colors.rank}
            flex items-center justify-center
            text-white font-bold text-sm flex-shrink-0
          `}
        >
          {rank}
        </div>

        {/* 才干名称 */}
        <div>
          <h3 className="font-bold text-lg text-hakimi-secondary leading-tight">
            {name}
          </h3>
        </div>
      </div>

      {/* 领域标签 */}
      <div className="mb-3">
        <span
          className={`
            inline-flex items-center gap-1
            px-2 py-0.5 rounded-full text-xs font-medium
            border ${colors.badge}
          `}
        >
          <span>{colors.icon}</span>
          <span>{domainName}</span>
        </span>
      </div>

      {/* 才干描述 */}
      <p className="text-sm text-gray-600 leading-relaxed mb-3">
        {description}
      </p>

      {/* 证据（可选） */}
      {evidence && (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-400 italic">
            <span className="font-medium text-gray-500">哈基米观察：</span>{evidence}
          </p>
        </div>
      )}
    </div>
  )
}

export default TalentCard
