import React from 'react'

const SEVERITY_STYLES = {
  critical: 'bg-red-500/20 border-red-500/50 text-red-400',
  high: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
  medium: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
  low: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
  clean: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
  blocked: 'bg-red-500/20 border-red-500/50 text-red-400',
  allowed: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
  bypassed: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
  scanning: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
  vulnerable: 'bg-red-500/20 border-red-500/50 text-red-400',
  unscanned: 'bg-slate-500/20 border-slate-500/50 text-slate-400',
  online: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
  offline: 'bg-slate-500/20 border-slate-500/50 text-slate-400',
}

export function StatusBadge({ status, label, className = '' }) {
  const styles = SEVERITY_STYLES[status] || 'bg-slate-500/20 border-slate-500/50 text-slate-400'
  const displayLabel = label || status?.toUpperCase()

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${styles} ${className}`}
    >
      {displayLabel}
    </span>
  )
}
