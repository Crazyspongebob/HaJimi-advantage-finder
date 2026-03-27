// 骨架屏加载占位组件
import React from 'react'

function Skeleton({ width, height, className = '' }) {
  return (
    <div
      className={`skeleton-loading rounded-md ${className}`}
      style={{
        width: width || '100%',
        height: height || '1rem',
      }}
      aria-hidden="true"
    />
  )
}

export default Skeleton
