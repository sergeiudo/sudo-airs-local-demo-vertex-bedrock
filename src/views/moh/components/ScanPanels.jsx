import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ShieldX, ShieldAlert, RefreshCw, ChevronDown, Copy, Check } from 'lucide-react'
import { useMohLang } from '../i18n'
import { MOH_DETECTORS } from '../../../data/moh/attacks'

/**
 * Shared AIRS telemetry panels for the Ministry of Health pillar.
 *
 * The portal's convention is to copy these per pillar (see RagSecurityView /
 * McpSecurityView), but MOH needs one bilingual, direction-aware version used
 * by the citizen app, the pillar tabs and the security console alike — so they
 * live here once rather than three times.
 */

export function CopyButton({ text, accent = '#0d9488' }) {
  const { t } = useMohLang()
  const [copied, setCopied] = useState(false)
  const onCopy = () => {
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1400) }
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(done)
    else done()
  }
  return (
    <button
      onClick={onCopy}
      style={{
        display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
        cursor: 'pointer', fontSize: 10, color: copied ? '#10b981' : accent, padding: 0,
      }}
      title={t('common.copy')}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      <span>{copied ? t('common.copied') : t('common.copy')}</span>
    </button>
  )
}

/** AIRS detector flags → bilingual pills. */
export function DetectionBadges({ detected }) {
  const { lang } = useMohLang()
  const hits = Object.entries(detected || {}).filter(([, v]) => v === true).map(([k]) => k)
  if (!hits.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
      {hits.map((k) => (
        <span
          key={k}
          style={{
            fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
            background: 'rgba(168,85,247,0.16)', color: '#a855f7',
            border: '1px solid rgba(168,85,247,0.30)', whiteSpace: 'nowrap',
          }}
        >
          {MOH_DETECTORS[k]?.[lang] ?? k.replace(/_/g, ' ')}
        </span>
      ))}
    </div>
  )
}

/**
 * One AIRS scan stage.
 *
 * `source` distinguishes the two enforcement points that make up this demo's
 * architecture: the AI-Gateway guardrail, and the direct AIRS tool_event scan.
 * Showing which one fired is the whole "two enforcement points, one policy"
 * argument, so it is surfaced rather than hidden.
 */
export function ScanStageCard({ stage, label, data, pending, skipped, theme }) {
  const { t } = useMohLang()
  const isBlock = data?.action === 'block'
  const isAllow = data?.action === 'allow'

  const border = pending || skipped
    ? theme.border
    : isBlock ? theme.blockedBorder
    : isAllow ? theme.allowedBorder
    : theme.border
  const bg = pending || skipped
    ? theme.surfaceMuted
    : isBlock ? theme.blockedBg
    : isAllow ? theme.allowedBg
    : theme.surfaceMuted

  return (
    <div style={{ border: `1px solid ${border}`, background: bg, borderRadius: 12, padding: '11px 13px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: data ? 8 : 0 }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: theme.textFaint, letterSpacing: '0.1em' }}>
          {stage}
        </span>
        <span style={{ fontSize: 10, color: theme.textMuted, flex: 1 }}>{label}</span>
        {pending && <RefreshCw size={11} color={theme.textFaint} className="animate-spin" />}
        {skipped && <span style={{ fontSize: 9, color: theme.textFaint }}>—</span>}
        {isBlock && <ShieldCheck size={14} color={theme.allowed} />}
        {isAllow && <ShieldCheck size={14} color={theme.allowed} />}
      </div>

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                background: isBlock ? 'rgba(239,68,68,0.18)' : 'rgba(16,185,129,0.18)',
                color: isBlock ? theme.blocked : theme.allowed,
              }}
            >
              {String(data.action || '').toUpperCase()}
            </span>
            {data.category && (
              <span style={{ fontSize: 10, color: theme.textMuted }}>{data.category}</span>
            )}
            {data.source && (
              <span style={{ fontSize: 9, color: theme.textFaint, fontStyle: 'italic' }}>
                {data.source === 'ai-gateway-guardrail' ? t('console.gatewayScan') : t('console.directScan')}
              </span>
            )}
            {data.latencyMs != null && (
              <span style={{ fontSize: 9, color: theme.textFaint, marginInlineStart: 'auto' }}>
                {data.latencyMs} {t('common.ms')}
              </span>
            )}
          </div>
          <DetectionBadges detected={data.prompt_detected || data.response_detected} />
          {data.scan_id && (
            <span style={{ fontSize: 9, fontFamily: 'monospace', color: theme.textFaint, direction: 'ltr' }}>
              scan_id: {data.scan_id}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/** Minimal JSON pretty-printer with token colouring (dark in both themes). */
function JsonToken({ k, v, depth }) {
  const pad = '  '.repeat(depth)
  const colour =
    typeof v === 'string' ? '#a5d6ff'
    : typeof v === 'number' ? '#79c0ff'
    : typeof v === 'boolean' ? (v ? '#7ee787' : '#ff7b72')
    : '#8b949e'
  return (
    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
      <span style={{ color: '#8b949e' }}>{pad}</span>
      {k != null && <span style={{ color: '#d2a8ff' }}>&quot;{k}&quot;: </span>}
      <span style={{ color: colour }}>{typeof v === 'string' ? `"${v}"` : String(v)}</span>
    </div>
  )
}

export function JsonLines({ obj, depth = 0 }) {
  if (obj == null) return <JsonToken v={null} depth={depth} />
  if (typeof obj !== 'object') return <JsonToken v={obj} depth={depth} />
  return (
    <>
      {Object.entries(obj).map(([k, v]) =>
        v && typeof v === 'object' ? (
          <div key={k}>
            <div style={{ color: '#d2a8ff', whiteSpace: 'pre' }}>
              {'  '.repeat(depth)}&quot;{k}&quot;: {Array.isArray(v) ? '[' : '{'}
            </div>
            <JsonLines obj={v} depth={depth + 1} />
            <div style={{ color: '#8b949e', whiteSpace: 'pre' }}>
              {'  '.repeat(depth)}{Array.isArray(v) ? ']' : '}'}
            </div>
          </div>
        ) : (
          <JsonToken key={k} k={k} v={v} depth={depth} />
        )
      )}
    </>
  )
}

/**
 * Collapsible viewer for the raw AIRS payloads.
 *
 * Forced dark in both themes — this is the CLAUDE.md exception for
 * syntax-highlighted content, and it is always LTR regardless of UI direction
 * because JSON with RTL bidi applied is unreadable.
 */
export function AirsPayloadViewer({ stages, theme, accent = '#0d9488' }) {
  const { t } = useMohLang()
  const [open, setOpen] = useState(false)
  const list = (stages || []).filter((s) => s && s.body)
  if (!list.length) return null

  return (
    <div style={{ borderRadius: 12, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 13px',
          background: theme.surfaceMuted, border: 'none', cursor: 'pointer',
          textAlign: 'start', color: theme.text,
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: '0.05em' }}>
          {t('console.payloads')}
        </span>
        <span style={{ fontSize: 9, color: theme.textFaint }}>({list.length})</span>
        <motion.div style={{ marginInlineStart: 'auto' }} animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown size={12} color={theme.textMuted} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            {list.map((s, i) => (
              <div key={i} style={{ borderTop: `1px solid ${theme.border}` }}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 13px',
                    background: theme.surfaceMuted,
                  }}
                >
                  <span style={{ fontSize: 9, fontWeight: 800, color: accent, letterSpacing: '0.06em' }}>
                    {s.label}
                  </span>
                  {s.latency != null && (
                    <span style={{ fontSize: 9, color: theme.textFaint }}>{s.latency} {t('common.ms')}</span>
                  )}
                  <span style={{ marginInlineStart: 'auto' }}>
                    <CopyButton text={JSON.stringify(s.body, null, 2)} accent={accent} />
                  </span>
                </div>
                <pre
                  dir="ltr"
                  style={{
                    margin: 0, padding: '12px 16px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                    lineHeight: 1.55, background: theme.codeBg, color: theme.codeText,
                    overflowX: 'auto', maxHeight: 300, overflowY: 'auto', textAlign: 'left',
                  }}
                >
                  <JsonLines obj={s.body} />
                </pre>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Verdict pill used in the console header and the pillar tabs. */
export function VerdictPill({ status, theme, size = 'md' }) {
  const { t } = useMohLang()
  const map = {
    blocked: { c: theme.blocked, bg: theme.blockedBg, b: theme.blockedBorder, Icon: ShieldX, label: t('console.blockedShort') },
    flagged: { c: theme.flagged, bg: theme.flaggedBg, b: theme.flaggedBorder, Icon: ShieldAlert, label: 'FLAGGED' },
    done: { c: theme.allowed, bg: theme.allowedBg, b: theme.allowedBorder, Icon: ShieldCheck, label: t('console.allowed') },
    direct: { c: theme.textFaint, bg: theme.surfaceMuted, b: theme.border, Icon: ShieldAlert, label: t('console.direct') },
  }
  const s = map[status] || map.done
  const pad = size === 'sm' ? '2px 7px' : '3px 10px'
  const fs = size === 'sm' ? 9 : 10
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, padding: pad, borderRadius: 999,
        background: s.bg, border: `1px solid ${s.b}`, color: s.c, fontSize: fs, fontWeight: 800,
        letterSpacing: '0.04em', whiteSpace: 'nowrap',
      }}
    >
      <s.Icon size={fs + 2} />
      {s.label}
    </span>
  )
}
