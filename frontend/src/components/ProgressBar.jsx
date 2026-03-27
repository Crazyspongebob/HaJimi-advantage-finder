// 进度条组件 - 用于才干探测进度面板
import React from 'react'

function ProgressBar({ value = 0, color = 'amber', label = '' }) {
  // 颜色映射（Tailwind 类名）
  const colorMap = {
    blue: {
      bar: 'bg-blue-500',
      text: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    amber: {
      bar: 'bg-amber-500',
      text: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    green: {
      bar: 'bg-green-500',
      text: 'text-green-600',
      bg: 'bg-green-50',
    },
    purple: {
      bar: 'bg-purple-500',
      text: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  }

  const colors = colorMap[color] || colorMap.amber

  // 确保 value 在 0-100 范围内
  const safeValue = Math.min(100, Math.max(0, value))

  return (
    <div className="w-full">
      {/* 标签和数值 */}
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-bold ${colors.text}`}>{safeValue}%</span>
      </div>

      {/* 进度条轨道 */}
      <div className={`w-full h-2 rounded-full ${colors.bg}`}>
        {/* 进度条填充 */}
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colors.bar}`}
          style={{ width: `${safeValue}%` }}
          role="progressbar"
          aria-valuenow={safeValue}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${safeValue}%`}
        />
      </div>
    </div>
  )
}

export default ProgressBar
