import React from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, RotateCcw } from 'lucide-react'
import { useProtectionTheme } from '../../hooks/useProtectionTheme'

export function ResendWidget({ lastAttack, onResend, onClear, isLoading }) {
  const theme = useProtectionTheme()

  if (!lastAttack) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 px-3 py-2 mx-4 mb-2 rounded-lg border ${theme.primaryBorder2} ${theme.primaryBg2} transition-all duration-500`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-slate-500 mb-0.5">Last payload</div>
        <div className="text-xs text-slate-400 truncate font-mono">{lastAttack.label}</div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onResend}
          disabled={isLoading}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200
            ${theme.isProtected
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <RefreshCw size={10} className={isLoading ? 'animate-spin' : ''} />
          Resend
        </button>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-400 transition-colors text-[10px]"
        >
          <RotateCcw size={10} />
          Clear
        </button>
      </div>
    </motion.div>
  )
}
