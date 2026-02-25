import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cloud, Server, ChevronDown, Loader2, CheckCircle2, AlertCircle, RefreshCw, Zap } from 'lucide-react'
import { useProtectionTheme } from '../../hooks/useProtectionTheme'

const TABS = [
  { id: 'vertex',  label: 'Vertex AI', icon: Cloud,   color: 'blue' },
  { id: 'bedrock', label: 'Bedrock',   icon: Server,  color: 'orange' },
]

const STATUS_STYLE = {
  available:    'text-emerald-400',
  experimental: 'text-yellow-400',
  legacy:       'text-slate-500',
  unknown:      'text-slate-600',
}

export function ModelSelector({ backend, model, onBackendChange, onModelChange }) {
  const theme = useProtectionTheme()
  const [open, setOpen] = useState(false)
  const [vertexModels, setVertexModels] = useState([])
  const [bedrockModels, setBedrockModels] = useState([])
  const [loading, setLoading] = useState({ vertex: false, bedrock: false })
  const [errors, setErrors] = useState({ vertex: null, bedrock: null })
  const [filter, setFilter] = useState('')
  const panelRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const fetchModels = async (provider) => {
    setLoading(prev => ({ ...prev, [provider]: true }))
    setErrors(prev => ({ ...prev, [provider]: null }))
    try {
      const res = await fetch(`/api/models/${provider}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load models')
      if (provider === 'vertex') setVertexModels(data.models ?? [])
      else setBedrockModels(data.models ?? [])
    } catch (err) {
      setErrors(prev => ({ ...prev, [provider]: err.message }))
    } finally {
      setLoading(prev => ({ ...prev, [provider]: false }))
    }
  }

  // Fetch both on mount
  useEffect(() => {
    fetchModels('vertex')
    fetchModels('bedrock')
  }, [])

  const currentModels = backend === 'vertex' ? vertexModels : bedrockModels
  const isLoading = loading[backend]
  const error = errors[backend]

  const filtered = currentModels.filter(m =>
    m.label?.toLowerCase().includes(filter.toLowerCase()) ||
    m.id?.toLowerCase().includes(filter.toLowerCase()) ||
    m.provider?.toLowerCase().includes(filter.toLowerCase())
  )

  const activeModel = currentModels.find(m => m.id === model) ?? { id: model, label: model }

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger row */}
      <div className="space-y-2">
        {/* Backend tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-black/40 border border-white/10">
          {TABS.map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => {
                onBackendChange(tab.id)
                setFilter('')
              }}
              className={`relative flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-colors duration-200 ${
                backend === tab.id ? '' : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              {backend === tab.id && (
                <motion.span
                  layoutId="backend-pill"
                  className={`absolute inset-0 rounded-md ${theme.primaryBg2} border ${theme.primaryBorder2}`}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon size={11} className={`relative z-10 ${backend === tab.id ? theme.primaryText : ''} transition-colors duration-200`} />
              <span className={`relative z-10 ${backend === tab.id ? theme.primaryText : ''} transition-colors duration-200`}>
                {tab.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Model picker trigger */}
        <button
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all duration-200 text-left
            ${open
              ? `${theme.primaryBorder2} ${theme.primaryBg2}`
              : 'border-white/10 bg-black/20 hover:border-white/20'
            }
          `}
        >
          <Zap size={10} className={theme.primaryText} />
          <span className="flex-1 text-[11px] font-mono text-slate-300 truncate">
            {activeModel.label || activeModel.id}
          </span>
          {isLoading ? (
            <Loader2 size={10} className="animate-spin text-slate-500" />
          ) : (
            <ChevronDown size={10} className={`text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          )}
        </button>
      </div>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-white/15 bg-base-800/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden"
            style={{ minWidth: '230px' }}
          >
            {/* Search + refresh */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
              <input
                autoFocus
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Filter models…"
                className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none"
              />
              <button
                onClick={() => fetchModels(backend)}
                disabled={isLoading}
                className="text-slate-600 hover:text-slate-400 transition-colors disabled:opacity-40"
                title="Refresh model list"
              >
                <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Model list */}
            <div className="max-h-64 overflow-y-auto">
              {isLoading && filtered.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-6 text-slate-500">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="text-xs">Loading models…</span>
                </div>
              ) : error ? (
                <div className="px-3 py-4 text-center">
                  <AlertCircle size={16} className="text-red-400 mx-auto mb-1" />
                  <p className="text-[10px] text-red-400">{error}</p>
                  <button
                    onClick={() => fetchModels(backend)}
                    className="mt-2 text-[10px] text-slate-500 hover:text-slate-300 underline"
                  >
                    Retry
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-600">No models match</div>
              ) : (
                filtered.map(m => {
                  const isSelected = m.id === model
                  const statusStyle = STATUS_STYLE[m.status] ?? STATUS_STYLE.unknown
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        onModelChange(m.id)
                        setOpen(false)
                        setFilter('')
                      }}
                      className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors duration-100 ${
                        isSelected
                          ? `${theme.primaryBg2}`
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium truncate ${isSelected ? theme.primaryText : 'text-slate-300'}`}>
                            {m.label ?? m.id}
                          </span>
                          {m.provider && m.provider !== 'Google' && (
                            <span className="text-[9px] text-slate-600 flex-shrink-0">{m.provider}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-mono text-slate-600 truncate">{m.id}</span>
                          {m.status && (
                            <span className={`text-[9px] font-semibold ${statusStyle}`}>
                              {m.status}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={12} className={`flex-shrink-0 mt-0.5 ${theme.primaryText}`} />
                      )}
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-3 py-1.5 border-t border-white/10">
              <span className="text-[9px] text-slate-600">
                {filtered.length} model{filtered.length !== 1 ? 's' : ''} · {backend === 'vertex' ? 'Google Cloud Vertex AI' : 'AWS Bedrock'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
