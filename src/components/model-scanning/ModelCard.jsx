import React from 'react'
import { motion } from 'framer-motion'
import { Cpu, Calendar, ScanSearch, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react'
import { StatusBadge } from '../shared/StatusBadge'
import { useProtectionTheme } from '../../hooks/useProtectionTheme'

const STATUS_ICONS = {
  vulnerable: { Icon: AlertCircle, color: 'text-red-400' },
  clean: { Icon: CheckCircle2, color: 'text-emerald-400' },
  unscanned: { Icon: Clock, color: 'text-slate-500' },
  scanning: { Icon: Loader2, color: 'text-blue-400', spin: true },
}

export function ModelCard({ model, isSelected, onSelect, onScan, scanState }) {
  const theme = useProtectionTheme()
  const statusConfig = STATUS_ICONS[model.scanStatus] || STATUS_ICONS.unscanned
  const { Icon, color, spin } = statusConfig

  const isScanning = scanState === 'scanning' && isSelected

  return (
    <motion.div
      layout
      onClick={onSelect}
      className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
        isSelected
          ? `${theme.primaryBorder2} ${theme.primaryBg2}`
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center flex-shrink-0">
          <Cpu size={14} className="text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-200 truncate">{model.name}</span>
            <StatusBadge status={isScanning ? 'scanning' : model.scanStatus} />
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {model.provider} · {model.size} params
          </div>
        </div>
        <Icon
          size={14}
          className={`${color} flex-shrink-0 ${spin ? 'animate-spin' : ''}`}
        />
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-2">
        {model.tags.map(tag => (
          <span
            key={tag}
            className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/5 border border-white/10 text-slate-500"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Findings summary */}
      {model.findingsCounts && (
        <div className="flex items-center gap-2 mb-2">
          {model.findingsCounts.critical > 0 && (
            <span className="text-[10px] text-red-400 font-bold">{model.findingsCounts.critical} CRIT</span>
          )}
          {model.findingsCounts.high > 0 && (
            <span className="text-[10px] text-orange-400">{model.findingsCounts.high} HIGH</span>
          )}
          {model.findingsCounts.medium > 0 && (
            <span className="text-[10px] text-yellow-400">{model.findingsCounts.medium} MED</span>
          )}
          {model.findingsCounts.low > 0 && (
            <span className="text-[10px] text-slate-500">{model.findingsCounts.low} LOW</span>
          )}
        </div>
      )}

      {/* Last scanned + Scan button */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <div className="flex items-center gap-1 text-[10px] text-slate-600">
          <Calendar size={9} />
          <span>
            {model.lastScanned
              ? new Date(model.lastScanned).toLocaleDateString()
              : 'Never scanned'}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onScan(model) }}
          disabled={isScanning}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200
            ${isSelected
              ? `${theme.primaryBg2} ${theme.primaryText} border ${theme.primaryBorder2} hover:brightness-110`
              : 'bg-white/5 text-slate-400 border border-white/10 hover:border-white/20'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isScanning ? (
            <><Loader2 size={9} className="animate-spin" /> Scanning</>
          ) : (
            <><ScanSearch size={9} /> Scan</>
          )}
        </button>
      </div>
    </motion.div>
  )
}
