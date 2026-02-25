import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CodeBlock({ code, language = 'json', maxHeight = '240px' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(
      typeof code === 'string' ? code : JSON.stringify(code, null, 2)
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayCode =
    typeof code === 'string' ? code : JSON.stringify(code, null, 2)

  return (
    <div className="relative group rounded-lg border border-white/10 bg-black/40 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-white/[0.03]">
        <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
        >
          {copied ? (
            <Check size={12} className="text-emerald-400" />
          ) : (
            <Copy size={12} />
          )}
          <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      {/* Code content */}
      <div
        className="overflow-auto p-3"
        style={{ maxHeight }}
      >
        <pre className="font-mono text-xs text-slate-300 whitespace-pre leading-relaxed">
          {displayCode}
        </pre>
      </div>
    </div>
  )
}
