import React from 'react'

export function GlassCard({ children, className = '', onClick, hover = false }) {
  const base = 'rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-card'
  const hoverClass = hover
    ? 'transition-all duration-200 hover:border-white/20 hover:bg-white/[0.07] cursor-pointer'
    : ''
  const clickable = onClick ? 'cursor-pointer' : ''

  return (
    <div
      className={`${base} ${hoverClass} ${clickable} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
