import React from 'react'
import { useProtectionTheme } from '../../hooks/useProtectionTheme'

export function PulsingDot({ size = 'sm', override = null }) {
  const theme = useProtectionTheme()
  const colorClass = override || theme.pulseColor

  const sizeMap = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  }

  return (
    <span className="relative inline-flex">
      <span
        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 ${colorClass}`}
      />
      <span
        className={`relative inline-flex rounded-full ${sizeMap[size]} ${colorClass}`}
      />
    </span>
  )
}
