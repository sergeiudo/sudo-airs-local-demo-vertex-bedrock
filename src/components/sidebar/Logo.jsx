import React from 'react'
import { Shield } from 'lucide-react'
import { useProtectionTheme } from '../../hooks/useProtectionTheme'
import { useAppContext } from '../../context/AppContext'

export function Logo() {
  const theme = useProtectionTheme()
  const { dispatch } = useAppContext()

  return (
    <button
      onClick={() => dispatch({ type: 'SET_VIEW', payload: 'home' })}
      className="flex items-center gap-3 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors duration-200 w-full text-left"
      title="Back to home"
    >
      {/* Icon mark */}
      <div className={`relative flex items-center justify-center w-9 h-9 rounded-lg border ${theme.primaryBorder2} ${theme.primaryBg2} transition-all duration-500`}>
        <Shield
          size={18}
          className={`${theme.primaryText} transition-colors duration-500`}
          strokeWidth={2}
        />
        {/* Corner accent */}
        <span className={`absolute top-0.5 right-0.5 w-1 h-1 rounded-full ${theme.pulseColor} transition-colors duration-500`} />
      </div>

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span className={`text-sm font-bold tracking-[0.1em] ${theme.primaryText} transition-colors duration-500`}>
          SUDO AIRS Demo
        </span>
        <span className="text-[9px] tracking-[0.15em] text-slate-500 uppercase">
          Prisma AIRS · Command
        </span>
      </div>
    </button>
  )
}
