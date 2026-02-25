import React, { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, MessageSquare, Send, RotateCcw } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import { useProtectionTheme } from '../../hooks/useProtectionTheme'

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

export function ChatCenter({ messages, isLoading, onSendMessage, onClear, backend, model }) {
  const theme = useProtectionTheme()
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const [input, setInput] = useState('')

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSubmit = (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    onSendMessage(text, backend, model)
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 flex-shrink-0">
        <MessageSquare size={14} className={theme.primaryText} />
        <span className="text-xs font-semibold text-slate-300">Intercept Console</span>
        <button
          onClick={onClear}
          className="ml-auto flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
        >
          <RotateCcw size={10} /> Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        <motion.div variants={staggerContainer} animate="animate">
          <AnimatePresence>
            {messages.map((msg) => (
              <div key={msg.id} className="mb-4">
                <ChatMessage
                  message={msg}
                  onResend={msg.role === 'user' ? () => onSendMessage(msg.content, backend, model) : undefined}
                  isLoading={isLoading}
                />
              </div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 mb-4"
          >
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
              theme.isProtected
                ? 'bg-emerald-500/10 border-emerald-500/25'
                : 'bg-slate-800 border-white/10'
            }`}>
              <Loader2 size={12} className={`animate-spin ${theme.isProtected ? theme.primaryText : 'text-slate-500'}`} />
              <span className="text-xs text-slate-400">
                {theme.isProtected ? 'AIRS scanning…' : 'Sending to LLM…'}
              </span>
              <span className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className={`w-1 h-1 rounded-full ${theme.isProtected ? theme.pulseColor : 'bg-slate-600'}`}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                  />
                ))}
              </span>
            </div>
          </motion.div>
        )}

        <div ref={endRef} />
      </div>

      {/* Chat input */}
      <div className="flex-shrink-0 px-4 pb-4">
        <form onSubmit={handleSubmit}>
          <div className={`flex items-end gap-2 rounded-xl border p-2 transition-all duration-300 ${
            theme.isProtected
              ? 'border-emerald-500/30 bg-emerald-500/5 focus-within:border-emerald-500/50'
              : 'border-white/10 bg-white/5 focus-within:border-white/20'
          }`}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message or use the attack library…"
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 resize-none outline-none leading-relaxed max-h-32 disabled:opacity-50"
              style={{ minHeight: '20px' }}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed
                ${theme.isProtected
                  ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }
              `}
            >
              <Send size={12} />
            </button>
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <span className="text-[9px] text-slate-700">Enter to send · Shift+Enter for newline</span>
            <span className={`text-[9px] font-semibold ${theme.primaryText}`}>
              {theme.isProtected ? '⚡ AIRS Protected' : '⚠ Unprotected'}
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}
