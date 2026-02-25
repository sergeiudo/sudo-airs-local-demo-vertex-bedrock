import React, { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, ShieldX, ShieldCheck } from 'lucide-react'
import { LogEntry } from './LogEntry'
import { useProtectionTheme } from '../../hooks/useProtectionTheme'

export function AttackLogFeed({ entries, isRunning }) {
  const theme = useProtectionTheme()
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  const blockedCount = entries.filter(e => e.status === 'blocked').length
  const bypassedCount = entries.filter(e => e.status === 'bypassed').length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 flex-shrink-0">
        <Terminal size={14} className={theme.primaryText} />
        <span className="text-xs font-semibold text-slate-300">Attack Log</span>

        {entries.length > 0 && (
          <div className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <ShieldX size={9} /> {blockedCount} blocked
            </span>
            <span className="flex items-center gap-1 text-[10px] text-red-400">
              <ShieldCheck size={9} /> {bypassedCount} bypassed
            </span>
          </div>
        )}
      </div>

      {/* Live indicator */}
      {isRunning && (
        <div className={`flex items-center gap-2 px-4 py-2 border-b border-white/10 ${theme.primaryBg2} flex-shrink-0`}>
          <span className={`w-1.5 h-1.5 rounded-full ${theme.pulseColor} animate-pulse`} />
          <span className={`text-[10px] font-semibold ${theme.primaryText} tracking-wider`}>
            LIVE — Campaign running
          </span>
          <span className="ml-auto text-[10px] text-slate-500 font-mono">
            {entries.length} attacks sent
          </span>
        </div>
      )}

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Terminal size={28} className="text-slate-700 mb-2" />
            <p className="text-xs text-slate-600">Attack log will appear here</p>
            <p className="text-[10px] text-slate-700 mt-1">Launch a campaign to begin</p>
          </div>
        ) : (
          <AnimatePresence>
            {entries.map(entry => (
              <LogEntry key={entry.id} entry={entry} />
            ))}
          </AnimatePresence>
        )}
        <div ref={endRef} />
      </div>
    </div>
  )
}
