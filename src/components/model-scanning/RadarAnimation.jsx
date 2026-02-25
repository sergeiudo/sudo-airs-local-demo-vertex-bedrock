import React from 'react'
import { motion } from 'framer-motion'
import { useProtectionTheme } from '../../hooks/useProtectionTheme'

export function RadarAnimation({ isScanning, progress = 0 }) {
  const theme = useProtectionTheme()

  const color = theme.isProtected ? '#34d399' : '#ef4444'
  const colorFaint = theme.isProtected ? 'rgba(52,211,153,0.08)' : 'rgba(239,68,68,0.08)'
  const colorMid = theme.isProtected ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)'

  // Random blip positions (deterministic)
  const blips = [
    { cx: 110, cy: 75, r: 2.5, delay: 0.4 },
    { cx: 145, cy: 120, r: 2, delay: 0.9 },
    { cx: 85, cy: 130, r: 3, delay: 1.4 },
    { cx: 120, cy: 95, r: 2, delay: 0.2 },
    { cx: 155, cy: 80, r: 2.5, delay: 1.8 },
    { cx: 75, cy: 100, r: 2, delay: 0.7 },
  ]

  return (
    <div className="relative flex items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200">
        {/* Concentric circles */}
        {[80, 60, 40, 20].map((r, i) => (
          <circle
            key={r}
            cx="100" cy="100" r={r}
            fill="none"
            stroke={i === 0 ? colorMid : colorFaint}
            strokeWidth="1"
          />
        ))}

        {/* Cross hairs */}
        <line x1="100" y1="20" x2="100" y2="180" stroke={colorFaint} strokeWidth="0.5" />
        <line x1="20" y1="100" x2="180" y2="100" stroke={colorFaint} strokeWidth="0.5" />

        {/* Sweep gradient fill */}
        <defs>
          <radialGradient id="radar-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.05" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sweep-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="100%" stopColor={color} stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Sweep arm */}
        {isScanning && (
          <motion.g
            style={{ transformOrigin: '100px 100px' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
          >
            {/* Trailing fill pie */}
            <path
              d="M 100 100 L 100 20 A 80 80 0 0 1 180 100 Z"
              fill={color}
              fillOpacity="0.06"
            />
            {/* Sweep line */}
            <line
              x1="100" y1="100" x2="100" y2="22"
              stroke={color}
              strokeWidth="2"
              strokeOpacity="0.8"
            />
          </motion.g>
        )}

        {/* Blips */}
        {isScanning && blips.map((b, i) => (
          <motion.circle
            key={i}
            cx={b.cx} cy={b.cy} r={b.r}
            fill={color}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
            transition={{
              duration: 2.4,
              delay: b.delay,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* Center dot */}
        <circle cx="100" cy="100" r="3" fill={color} fillOpacity="0.8" />

        {/* Outer ring */}
        <circle
          cx="100" cy="100" r="90"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeOpacity="0.3"
          strokeDasharray={isScanning ? "4 4" : "0"}
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {isScanning ? (
          <>
            <span className="text-2xl font-bold font-mono" style={{ color }}>{progress}%</span>
            <span className="text-[10px] text-slate-500 mt-0.5 tracking-wider">SCANNING</span>
          </>
        ) : (
          <>
            <span className="text-xs text-slate-600">Select a model</span>
            <span className="text-[10px] text-slate-700">to begin scan</span>
          </>
        )}
      </div>
    </div>
  )
}
