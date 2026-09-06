/**
 * bus.js — cross-window sync for the two-screen demo.
 *
 * The portal tab (mission control, on the laptop) and the citizen app tab
 * (Briut.AI, on the projector) are two independent React trees in two windows.
 * BroadcastChannel lets one drive the other: fire an attack from the laptop,
 * watch it land on the projector, and get the verdict back.
 *
 * Degrades to a no-op where BroadcastChannel is unavailable — each window then
 * simply works on its own, which is the fallback the live demo can survive on.
 */

const CHANNEL = 'briut-demo'

export const MOH_EVENTS = {
  FIRE: 'fire',              // portal → app: run this attack/scenario
  RESULT: 'result',          // app → portal: here is the verdict
  SET_PROTECTION: 'protection',
  SET_LANG: 'lang',
  SET_MODEL: 'model',
  CLEAR: 'clear',
  HELLO: 'hello',            // app → portal on mount, so the portal knows it is open
  PING: 'ping',              // portal → app: are you there?
}

let channel = null
let supported = typeof window !== 'undefined' && typeof window.BroadcastChannel === 'function'

function getChannel() {
  if (!supported) return null
  if (!channel) {
    try {
      channel = new BroadcastChannel(CHANNEL)
    } catch {
      supported = false
      return null
    }
  }
  return channel
}

export function isBusSupported() {
  return supported
}

/** Publish an event. Silently no-ops when unsupported. */
export function publish(type, payload = {}) {
  const ch = getChannel()
  if (!ch) return false
  try {
    ch.postMessage({ type, payload, at: Date.now() })
    return true
  } catch {
    return false
  }
}

/**
 * Subscribe to bus events.
 * @param {(type: string, payload: object) => void} handler
 * @returns {() => void} unsubscribe
 */
export function subscribe(handler) {
  const ch = getChannel()
  if (!ch) return () => {}
  const onMessage = (e) => {
    const { type, payload } = e?.data || {}
    if (type) handler(type, payload || {})
  }
  ch.addEventListener('message', onMessage)
  return () => ch.removeEventListener('message', onMessage)
}

/** Open (or refocus) the chrome-free citizen app in a second window. */
export function openCitizenApp() {
  const url = `${window.location.origin}${window.location.pathname}?app=briut`
  const win = window.open(url, 'briut-citizen-app')
  win?.focus?.()
  return win
}
