import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScanSearch, CheckCircle2, AlertTriangle, Play } from 'lucide-react'
import { RadarAnimation } from './RadarAnimation'
import { VulnerabilityReport } from './VulnerabilityReport'
import { useProtectionTheme } from '../../hooks/useProtectionTheme'

export function ScannerPanel({ selectedModel, scanState, scanProgress, findings, onScan }) {
  const theme = useProtectionTheme()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 flex-shrink-0">
        <ScanSearch size={14} className={theme.primaryText} />
        <span className="text-xs font-semibold text-slate-300">
          {selectedModel ? `Scanning: ${selectedModel.name}` : 'Scanner'}
        </span>
        {scanState === 'complete' && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400">
            <CheckCircle2 size={10} />
            Scan complete
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Radar + Progress */}
        <div className="flex flex-col items-center px-6 py-6 border-b border-white/10">
          <RadarAnimation isScanning={scanState === 'scanning'} progress={scanProgress} />

          {/* Progress bar */}
          <AnimatePresence>
            {(scanState === 'scanning' || scanState === 'complete') && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mt-4 space-y-2"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Scan progress</span>
                  <span className="font-mono">{scanProgress}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      theme.isProtected ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                    initial={{ width: '0%' }}
                    animate={{ width: `${scanProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Phase indicators */}
                <div className="grid grid-cols-4 gap-1 mt-2">
                  {['Probe', 'Inject', 'Analyze', 'Report'].map((phase, i) => {
                    const threshold = (i + 1) * 25
                    const active = scanProgress >= threshold - 25
                    const done = scanProgress >= threshold
                    return (
                      <div
                        key={phase}
                        className={`text-center py-1 rounded text-[9px] font-semibold transition-all duration-300 ${
                          done
                            ? `${theme.primaryBg2} ${theme.primaryText} border ${theme.primaryBorder2}`
                            : active
                            ? 'bg-white/5 text-slate-400 border border-white/10 animate-pulse'
                            : 'text-slate-700'
                        }`}
                      >
                        {phase}
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Idle state */}
          {scanState === 'idle' && !selectedModel && (
            <div className="text-center mt-4">
              <p className="text-xs text-slate-600">Select a model from the registry</p>
              <p className="text-[10px] text-slate-700">to begin vulnerability scanning</p>
            </div>
          )}

          {/* Scan button when model selected but not scanning */}
          {scanState === 'idle' && selectedModel && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onScan(selectedModel)}
              className={`mt-4 flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                ${theme.isProtected
                  ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                  : 'bg-red-500 text-white hover:bg-red-400'
                }
              `}
            >
              <Play size={14} />
              Scan {selectedModel.name}
            </motion.button>
          )}
        </div>

        {/* Vulnerability Report */}
        {scanState === 'complete' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={12} className="text-orange-400" />
              <span className="text-xs font-semibold text-slate-300">Vulnerability Report</span>
              <span className="ml-auto text-[10px] text-slate-600">{findings.length} findings</span>
            </div>
            <VulnerabilityReport findings={findings} model={selectedModel} />
          </motion.div>
        )}
      </div>
    </div>
  )
}
