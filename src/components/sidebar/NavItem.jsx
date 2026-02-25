import React from 'react'
import { motion } from 'framer-motion'
import { useProtectionTheme } from '../../hooks/useProtectionTheme'

export function NavItem({ icon: Icon, label, sublabel, isActive, onClick }) {
  const theme = useProtectionTheme()

  return (
    <motion.button
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group
        ${isActive
          ? `${theme.navActiveBg} border ${theme.navActiveBorder}`
          : 'border border-transparent hover:bg-white/5 hover:border-white/10'
        }
      `}
      whileTap={{ scale: 0.98 }}
    >
      {/* Active indicator bar */}
      {isActive && (
        <motion.span
          layoutId="nav-indicator"
          className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${theme.pulseColor}`}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}

      <Icon
        size={16}
        strokeWidth={isActive ? 2.5 : 2}
        className={`flex-shrink-0 transition-colors duration-200 ${
          isActive ? theme.primaryText : 'text-slate-500 group-hover:text-slate-400'
        }`}
      />

      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium transition-colors duration-200 ${
          isActive ? theme.primaryText : 'text-slate-400 group-hover:text-slate-300'
        }`}>
          {label}
        </div>
        {sublabel && (
          <div className="text-[10px] text-slate-600 truncate">{sublabel}</div>
        )}
      </div>
    </motion.button>
  )
}
