import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldX, ShieldCheck, ChevronDown } from 'lucide-react'

const SEV_COLOR = {
  CRITICAL: 'text-red-400',
  HIGH:     'text-orange-400',
  MEDIUM:   'text-yellow-400',
  LOW:      'text-blue-400',
}

const CAT_COLOR = {
  SECURITY:   'bg-red-500/15 text-red-400 border-red-500/30',
  SAFETY:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  COMPLIANCE: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
}

export function LogEntry({ entry }) {
  const [expanded, setExpanded] = useState(false)
  // threat: true = bypassed (attack succeeded), false = blocked
  const bypassed = entry.threat === true

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className={`rounded-xl border overflow-hidden transition-all ${
        bypassed
          ? 'bg-red-500/8 border-red-500/25'
          : 'bg-emerald-500/5 border-emerald-500/20'
      }`}
    >
      <button
        className="w-full flex items-start gap-3 p-2.5 text-left"
        onClick={() => setExpanded(o => !o)}
      >
        {/* Icon */}
        <div className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5 ${
          bypassed ? 'bg-red-500/20' : 'bg-emerald-500/20'
        }`}>
          {bypassed
            ? <ShieldX size={12} className="text-red-400" />
            : <ShieldCheck size={12} className="text-emerald-400" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            {/* Sub-category */}
            <span className="text-[10px] font-semibold text-slate-300">
              {entry.sub_category_display_name || entry.sub_category || 'Attack'}
            </span>
            {/* Category badge */}
            {entry.category && (
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${CAT_COLOR[entry.category] || 'bg-white/10 text-slate-500 border-white/20'}`}>
                {entry.category}
              </span>
            )}
            {/* Severity */}
            {entry.severity && (
              <span className={`text-[9px] font-bold ${SEV_COLOR[entry.severity] || 'text-slate-500'}`}>
                {entry.severity}
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 font-mono truncate leading-relaxed">
            {entry.prompt}
          </p>
        </div>

        {/* Result */}
        <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
          <span className={`text-[10px] font-bold ${bypassed ? 'text-red-400' : 'text-emerald-400'}`}>
            {bypassed ? 'BYPASSED' : 'BLOCKED'}
          </span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.18 }}>
            <ChevronDown size={10} className="text-slate-600" />
          </motion.div>
        </div>
      </button>

      {/* Expanded: show full prompt + outputs */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="overflow-hidden px-3 pb-3 border-t border-white/8"
        >
          <div className="pt-2 space-y-2">
            <div>
              <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Prompt</div>
              <p className="text-[10px] text-slate-400 font-mono leading-relaxed bg-black/30 rounded-lg p-2 break-words">
                {entry.prompt}
              </p>
            </div>
            {entry.outputs?.length > 0 && (
              <div>
                <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Model Response</div>
                <p className="text-[10px] text-slate-400 leading-relaxed bg-black/30 rounded-lg p-2 break-words">
                  {entry.outputs[0]?.output || '—'}
                </p>
              </div>
            )}
            {entry.uuid && (
              <div className="text-[9px] font-mono text-slate-700">{entry.uuid}</div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
