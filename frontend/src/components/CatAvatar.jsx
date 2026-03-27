// 哈基米猫咪头像组件 — 支持 size + state 属性
// state: 'idle' | 'thinking' | 'speaking'
import React, { useState } from 'react'

const sizeConfig = {
  sm:  { px: 48,  svgClass: 'text-lg' },
  md:  { px: 80,  svgClass: 'text-3xl' },
  lg:  { px: 100, svgClass: 'text-4xl' },
  xl:  { px: 128, svgClass: 'text-6xl' },
}

function CatSVG() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="50" cy="50" r="50" fill="#1E293B"/>
      <ellipse cx="50" cy="65" rx="22" ry="20" fill="#C9A84C" opacity="0.9"/>
      <circle cx="50" cy="41" r="16" fill="#C9A84C" opacity="0.9"/>
      <polygon points="37,29 32,19 43,27" fill="#C9A84C" opacity="0.9"/>
      <polygon points="63,29 68,19 57,27" fill="#C9A84C" opacity="0.9"/>
      <polygon points="37.5,28 33,21 42,27" fill="#E2C97E" opacity="0.6"/>
      <polygon points="62.5,28 67,21 58,27" fill="#E2C97E" opacity="0.6"/>
      <ellipse cx="44.5" cy="40" rx="2.5" ry="3" fill="#0F172A"/>
      <ellipse cx="55.5" cy="40" rx="2.5" ry="3" fill="#0F172A"/>
      <circle cx="45" cy="39.5" r="0.8" fill="white"/>
      <circle cx="56" cy="39.5" r="0.8" fill="white"/>
      <polygon points="50,44 48.5,46 51.5,46" fill="#E8A0B4"/>
      <line x1="30" y1="43" x2="45" y2="45" stroke="white" strokeWidth="0.6" opacity="0.6"/>
      <line x1="55" y1="45" x2="70" y2="43" stroke="white" strokeWidth="0.6" opacity="0.6"/>
      <ellipse cx="38" cy="83" rx="7" ry="5" fill="#C9A84C" opacity="0.9"/>
      <ellipse cx="62" cy="83" rx="7" ry="5" fill="#C9A84C" opacity="0.9"/>
    </svg>
  )
}

/**
 * @param {'sm'|'md'|'lg'|'xl'} size
 * @param {'idle'|'thinking'|'speaking'} avatarState
 * @param {boolean} bouncing
 * @param {string} className
 */
function CatAvatar({ size = 'md', avatarState = 'idle', bouncing = false, className = '' }) {
  const cfg = sizeConfig[size] || sizeConfig.md
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  // State-driven ring style
  const ringStyle = (() => {
    if (avatarState === 'speaking') return {
      border: '2px solid #C9A84C',
      boxShadow: '0 0 0 4px rgba(201,168,76,0.25), 0 0 16px rgba(201,168,76,0.3)',
      animation: 'speakingRing 1.2s ease-in-out infinite',
    }
    if (avatarState === 'thinking') return {
      border: '2px solid rgba(201,168,76,0.5)',
      boxShadow: '0 2px 8px rgba(15,23,42,0.15)',
      opacity: 0.75,
      animation: 'thinkingPulse 1.8s ease-in-out infinite',
    }
    return {
      border: '2px solid rgba(201,168,76,0.4)',
      boxShadow: '0 2px 8px rgba(15,23,42,0.15)',
    }
  })()

  return (
    <>
      <style>{`
        @keyframes speakingRing {
          0%, 100% { box-shadow: 0 0 0 3px rgba(201,168,76,0.2), 0 0 12px rgba(201,168,76,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(201,168,76,0.35), 0 0 20px rgba(201,168,76,0.4); }
        }
        @keyframes thinkingPulse {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 0.45; }
        }
      `}</style>
      <div
        className={`rounded-full overflow-hidden flex-shrink-0 ${bouncing ? 'animate-bounce' : ''} ${className}`}
        style={{ width: cfg.px, height: cfg.px, minWidth: cfg.px, transition: 'box-shadow 0.3s', ...ringStyle }}
        aria-label="哈基米猫咪头像"
      >
        {!imgError ? (
          <div className="relative w-full h-full">
            {!imgLoaded && <div className="absolute inset-0"><CatSVG /></div>}
            <img
              src="https://cataas.com/cat/cute"
              alt="哈基米猫咪"
              className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <CatSVG />
        )}
      </div>
    </>
  )
}

export default CatAvatar
