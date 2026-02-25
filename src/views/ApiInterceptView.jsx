import React, { useState, useRef, useCallback, useEffect } from 'react'
import { AttackLibrary } from '../components/api-intercept/AttackLibrary'
import { ChatCenter } from '../components/api-intercept/ChatCenter'
import { TelemetrySidebar } from '../components/api-intercept/TelemetrySidebar'
import { useAttackSimulator } from '../hooks/useAttackSimulator'
import { useProtectionTheme } from '../hooks/useProtectionTheme'

const DEFAULT_MODELS = {
  vertex: 'gemini-2.0-flash-001',
  bedrock: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
}

const MIN_WIDTH = 220
const MAX_WIDTH = 600
const DEFAULT_WIDTH = 320

export function ApiInterceptView() {
  const [backend, setBackend] = useState('vertex')
  const [model, setModel] = useState(DEFAULT_MODELS.vertex)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(0)
  const theme = useProtectionTheme()

  const { messages, activeTelemetry, isLoading, sendAttack, sendMessage, clearChat } = useAttackSimulator()

  const handleBackendChange = (b) => {
    setBackend(b)
    setModel(DEFAULT_MODELS[b])
  }

  const handleSelectAttack = (attack) => {
    sendAttack(attack, backend, model)
  }

  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    dragStartX.current = e.clientX
    dragStartWidth.current = sidebarWidth
    setIsDragging(true)
  }, [sidebarWidth])

  useEffect(() => {
    if (!isDragging) return

    const onMouseMove = (e) => {
      const delta = dragStartX.current - e.clientX
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta))
      setSidebarWidth(newWidth)
    }

    const onMouseUp = () => setIsDragging(false)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isDragging])

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{ cursor: isDragging ? 'col-resize' : 'default', userSelect: isDragging ? 'none' : 'auto' }}
    >
      {/* Left: Attack Library + Model Selector — 260px fixed */}
      <div className="w-[260px] flex-shrink-0 border-r border-white/10 overflow-hidden">
        <AttackLibrary
          onSelectAttack={handleSelectAttack}
          backend={backend}
          model={model}
          onBackendChange={handleBackendChange}
          onModelChange={setModel}
        />
      </div>

      {/* Center: Chat — flex-1 */}
      <div className="flex-1 min-w-0 overflow-hidden bg-base-950/50">
        <ChatCenter
          messages={messages}
          isLoading={isLoading}
          onSendMessage={sendMessage}
          onClear={clearChat}
          backend={backend}
          model={model}
        />
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onMouseDown}
        className="relative flex-shrink-0 w-1 group cursor-col-resize"
      >
        {/* Invisible wider hit area */}
        <div className="absolute inset-y-0 -left-1.5 -right-1.5 z-10" />
        {/* Visible track */}
        <div className={`h-full w-full transition-colors duration-150 ${
          isDragging
            ? theme.isProtected ? 'bg-emerald-500/60' : 'bg-red-500/60'
            : 'bg-white/10 group-hover:' + (theme.isProtected ? 'bg-emerald-500/40' : 'bg-red-500/40')
        }`} />
        {/* Center grip dots */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center gap-1 pointer-events-none">
          {[0,1,2].map(i => (
            <div
              key={i}
              className={`w-0.5 h-0.5 rounded-full transition-colors duration-150 ${
                isDragging || false
                  ? theme.isProtected ? 'bg-emerald-400' : 'bg-red-400'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Right: Telemetry — resizable */}
      <div
        className="flex-shrink-0 overflow-hidden bg-base-900/30"
        style={{ width: sidebarWidth }}
      >
        <TelemetrySidebar telemetry={activeTelemetry} />
      </div>
    </div>
  )
}
