import { useState, useCallback } from 'react'
import { useAppContext } from '../context/AppContext'

const SCM_BASE = 'https://stratacloudmanager.paloaltonetworks.com/ai-security/runtime/ai-sessions'

function buildScmUrl(inputScan) {
  if (!inputScan?.tr_id || !inputScan?.profile_id || !inputScan?.scan_id) return null
  return `${SCM_BASE}/${inputScan.tr_id}/${inputScan.profile_id}/CITADEL/transactions/${inputScan.scan_id}/0#date=24hr`
}

const WELCOME = {
  id: 'welcome',
  role: 'system',
  content: 'SUDO AIRS Demo — Intercept Console ready. Type a message or select an attack payload from the library.',
  timestamp: new Date().toISOString(),
}

export function useAttackSimulator() {
  const { state, dispatch } = useAppContext()
  const [messages, setMessages] = useState([WELCOME])
  const [activeTelemetry, setActiveTelemetry] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const send = useCallback(async ({ payload, attackMeta = null, backend = 'vertex', modelId = null }) => {
    const userMsg = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: payload,
      attackMeta,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    setActiveTelemetry(null)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: payload,
          backend,
          modelId,
          airsEnabled: state.isProtected,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}-err`,
          role: 'assistant',
          content: null,
          blocked: true,
          blockReason: `Server error: ${data.error ?? res.statusText}`,
          verdict: 'ERROR',
          riskScore: null,
          timestamp: new Date().toISOString(),
        }])
        return
      }

      const { chatResponse, ...telemetry } = data

      // verdict: BLOCKED | ALLOWED (AIRS) | DIRECT (no protection)
      const verdict = telemetry.summary
        ? telemetry.summary.verdict
        : 'DIRECT'

      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: chatResponse?.content ?? null,
        blocked: chatResponse?.blocked ?? false,
        blockReason: chatResponse?.block_reason ?? null,
        verdict,
        riskScore: null,
        timestamp: new Date().toISOString(),
      }])
      setActiveTelemetry({ ...telemetry, chatResponse })

      const url = buildScmUrl(telemetry.inputScan)
      if (url) dispatch({ type: 'SET_SCM_URL', payload: url })
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: null,
        blocked: true,
        blockReason: `Connection error: ${err.message}. Is the proxy server running?`,
        verdict: 'ERROR',
        riskScore: null,
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setIsLoading(false)
    }
  }, [state.isProtected])

  // Called from attack library
  const sendAttack = useCallback((attack, backend, modelId) => {
    send({ payload: attack.payload, attackMeta: { label: attack.label, severity: attack.severity, technique: attack.technique }, backend, modelId })
  }, [send])

  // Called from free chat input
  const sendMessage = useCallback((text, backend, modelId) => {
    send({ payload: text, attackMeta: null, backend, modelId })
  }, [send])

  const clearChat = useCallback(() => {
    setMessages([{ ...WELCOME, timestamp: new Date().toISOString() }])
    setActiveTelemetry(null)
  }, [])

  return { messages, activeTelemetry, isLoading, sendAttack, sendMessage, clearChat }
}
