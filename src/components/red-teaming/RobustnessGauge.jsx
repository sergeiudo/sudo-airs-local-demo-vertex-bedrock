import React from 'react'
import { motion } from 'framer-motion'
import { useProtectionTheme } from '../../hooks/useProtectionTheme'

const CIRCUMFERENCE = 2 * Math.PI * 54 // r=54

function getGaugeColor(score) {
  if (score >= 80) return '#34d399'
  if (score >= 60) return '#60a5fa'
  if (score >= 40) return '#facc15'
  return '#ef4444'
}

function getGradeLabel(score) {
  if (score >= 80) return { grade: 'A', label: 'ROBUST' }
  if (score >= 60) return { grade: 'B', label: 'MODERATE' }
  if (score >= 40) return { grade: 'C', label: 'AT RISK' }
  return { grade: 'D', label: 'VULNERABLE' }
}

export function RobustnessGauge({ score = 0, isRunning = false }) {
  const theme = useProtectionTheme()
  const color = getGaugeColor(score)
  const { grade, label } = getGradeLabel(score)

  const dashOffset = CIRCUMFERENCE * (1 - score / 100)

  return (
    <div className="flex flex-col items-center">
      {/* SVG Gauge */}
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Track */}
          <circle
            cx="70" cy="70" r="54"
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="10"
          />

          {/* Value arc */}
          <motion.circle
            cx="70" cy="70" r="54"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              transformOrigin: '70px 70px',
              transform: 'rotate(-90deg)',
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map(tick => {
            const angle = (tick / 100) * 360 - 90
            const rad = (angle * Math.PI) / 180
            const x1 = 70 + 47 * Math.cos(rad)
            const y1 = 70 + 47 * Math.sin(rad)
            const x2 = 70 + 44 * Math.cos(rad)
            const y2 = 70 + 44 * Math.sin(rad)
            return (
              <line
                key={tick}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1.5"
              />
            )
          })}
        </svg>

        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold font-mono"
            style={{ color }}
            animate={{ opacity: isRunning ? [1, 0.6, 1] : 1 }}
            transition={isRunning ? { duration: 1, repeat: Infinity } : {}}
          >
            {score}
          </motion.span>
          <span className="text-[9px] text-slate-500 tracking-wider">/ 100</span>
        </div>
      </div>

      {/* Grade badge */}
      <div className="flex items-center gap-2 mt-2">
        <span
          className="text-lg font-bold w-8 h-8 rounded-lg flex items-center justify-center border"
          style={{ color, borderColor: `${color}40`, backgroundColor: `${color}15` }}
        >
          {grade}
        </span>
        <div>
          <div className="text-xs font-semibold" style={{ color }}>{label}</div>
          <div className="text-[10px] text-slate-600">Robustness score</div>
        </div>
      </div>
    </div>
  )
}
