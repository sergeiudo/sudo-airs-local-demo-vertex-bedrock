import React from 'react'
import { motion } from 'framer-motion'
import { Layers } from 'lucide-react'
import { MODEL_REGISTRY } from '../../data/mockData'
import { ModelCard } from './ModelCard'
import { useProtectionTheme } from '../../hooks/useProtectionTheme'

const container = {
  animate: { transition: { staggerChildren: 0.07 } },
}

const item = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0 },
}

export function ModelRegistry({ selectedModel, onSelectModel, onScanModel, scanState }) {
  const theme = useProtectionTheme()

  const vulnerableCount = MODEL_REGISTRY.filter(m => m.scanStatus === 'vulnerable').length
  const cleanCount = MODEL_REGISTRY.filter(m => m.scanStatus === 'clean').length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 flex-shrink-0">
        <Layers size={14} className={theme.primaryText} />
        <span className="text-xs font-semibold text-slate-300">Model Registry</span>
        <span className="ml-auto text-[10px] text-slate-600">{MODEL_REGISTRY.length} models</span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-2 p-3 border-b border-white/10 flex-shrink-0">
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
          <div className="text-base font-bold text-red-400">{vulnerableCount}</div>
          <div className="text-[10px] text-slate-500">Vulnerable</div>
        </div>
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
          <div className="text-base font-bold text-emerald-400">{cleanCount}</div>
          <div className="text-[10px] text-slate-500">Clean</div>
        </div>
      </div>

      {/* Model list */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <motion.div variants={container} initial="initial" animate="animate" className="space-y-2">
          {MODEL_REGISTRY.map(model => (
            <motion.div key={model.id} variants={item}>
              <ModelCard
                model={model}
                isSelected={selectedModel?.id === model.id}
                onSelect={() => onSelectModel(model)}
                onScan={onScanModel}
                scanState={selectedModel?.id === model.id ? scanState : 'idle'}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
