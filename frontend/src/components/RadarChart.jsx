// 雷达图组件 - 展示四大才干领域得分
import React from 'react'
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

function RadarChart({ data }) {
  // 将数据转换为 Recharts 需要的格式
  const chartData = [
    {
      subject: '执行力',
      value: data?.execution || 0,
      fullMark: 100,
    },
    {
      subject: '影响力',
      value: data?.influence || 0,
      fullMark: 100,
    },
    {
      subject: '关系建立',
      value: data?.relationship || 0,
      fullMark: 100,
    },
    {
      subject: '战略思维',
      value: data?.strategic || 0,
      fullMark: 100,
    },
  ]

  return (
    <div className="w-full" style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={chartData}>
          {/* 网格线 */}
          <PolarGrid stroke="#E5E7EB" />

          {/* 坐标轴标签 */}
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: '#1E3A5F',
              fontSize: 13,
              fontWeight: 600,
            }}
          />

          {/* 半径轴（0-100，不显示刻度标签） */}
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />

          {/* 雷达区域 */}
          <Radar
            name="才干得分"
            dataKey="value"
            stroke="#F59E0B"
            fill="#F59E0B"
            fillOpacity={0.3}
            strokeWidth={2}
          />

          {/* 悬浮提示 */}
          <Tooltip
            formatter={(value) => [`${value}分`, '才干得分']}
            contentStyle={{
              backgroundColor: '#FFF3CD',
              border: '1px solid #F59E0B',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default RadarChart
