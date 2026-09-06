/**
 * McpTab — the MCP tool-supply-chain beat.
 *
 * The Agent tab asks "is this tool CALL safe". This one asks the question a
 * level up: is the tool DEFINITION safe — the description the model reads and
 * the citizen never sees. A ministry assistant connects to servers other people
 * operate, and every `tools/list` they return is untrusted input.
 *
 * The manifest is rendered verbatim, payload and all, because the whole point
 * of the beat is that the dangerous text is invisible in a normal UI. Anything
 * holding JSON or tool names is pinned dir="ltr" so it survives an RTL layout.
 */
import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Server, ShieldCheck, ShieldOff, Play, RefreshCw, AlertTriangle,
  CheckCircle2, XCircle, Boxes, RotateCcw, Eye,
} from 'lucide-react'
import { useMohLang } from './i18n'
import { MOH_MCP_SCENARIOS, MOH_SEVERITY_COLORS } from '../../data/moh/attacks'
import { DetectionBadges, CopyButton } from './components/ScanPanels'

const ACCENT = '#0d9488'

function TrustBadge({ trust, theme, t }) {
  const third = trust === 'third-party'
  const c = third ? theme.flagged : theme.allowed
  return (
    <span
      dir="auto"
      style={{
        fontSize: 9.5, fontWeight: 800, letterSpacing: '0.04em', padding: '2px 7px',
        borderRadius: 5, background: `${c}1f`, color: c, border: `1px solid ${c}55`,
      }}
    >
      {third ? t('mcp.thirdParty') : t('mcp.firstParty')}
    </span>
  )
}

/** One tool from the returned manifest, description shown in full. */
function ToolCard({ tool, flagged, theme, t }) {
  const c = flagged ? theme.blocked : theme.border
  return (
    <div
      style={{
        borderRadius: 10, padding: '10px 12px',
        background: flagged ? theme.blockedBg : theme.surfaceMuted,
        border: `1px solid ${flagged ? theme.blockedBorder : c}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
        {flagged ? <AlertTriangle size={13} color={theme.blocked} /> : <Boxes size={13} color={theme.textFaint} />}
        <code dir="ltr" style={{ fontSize: 11.5, fontWeight: 700, color: theme.text }}>{tool.name}</code>
      </div>
      <div style={{ fontSize: 9.5, color: theme.textFaint, marginBottom: 4 }}>
        {t('mcp.description')} — <em>{t('mcp.payloadHint')}</em>
      </div>
      <div
        dir="auto"
        style={{
          fontSize: 11, lineHeight: 1.65, color: theme.textMuted, whiteSpace: 'pre-wrap',
          fontFamily: 'Heebo, Inter, sans-serif',
        }}
      >
        {tool.description}
      </div>
    </div>
  )
}

export default function McpTab({ theme }) {
  const { t, pick, lang, dir } = useMohLang()
  const [servers, setServers] = useState([])
  const [scenario, setScenario] = useState(MOH_MCP_SCENARIOS[1]) // poisoning is the headline
  const [airsEnabled, setAirsEnabled] = useState(true)
  const [busy, setBusy] = useState(false)
  const [run, setRun] = useState(null)
  const [error, setError] = useState(null)
  const [rug, setRug] = useState({ listCount: 0 })

  const loadServers = useCallback(() => {
    fetch('/api/moh/mcp/servers')
      .then((r) => r.json())
      .then((d) => { setServers(d.servers || []); setRug(d.rugPull || { listCount: 0 }) })
      .catch(() => {})
  }, [])

  useEffect(() => { loadServers() }, [loadServers])

  const runList = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await fetch('/api/moh/mcp/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: 'kupat-holim-connect',
          variant: scenario.variant,
          lang, airsEnabled, scenario: scenario.id,
        }),
      })
      const d = await r.json()
      setRun(d)
      setRug(d.rugPull || rug)
      if (d.error) setError(d.error)
    } catch (e) {
      setError(String(e?.message || e))
    } finally {
      setBusy(false)
    }
  }

  const reset = async () => {
    await fetch('/api/moh/mcp/reset', { method: 'POST' }).catch(() => {})
    setRun(null)
    setError(null)
    loadServers()
  }

  const measured = scenario.measured?.[lang] || scenario.measured?.en
  const sevColor = MOH_SEVERITY_COLORS[scenario.severity] || theme.textFaint

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 22 }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: theme.text }}>{t('mcp.title')}</h2>
            <p style={{ margin: '5px 0 0', fontSize: 12.5, color: theme.textMuted, lineHeight: 1.6 }}>
              {t('mcp.subtitle')}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setAirsEnabled((v) => !v)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 10,
                border: `1px solid ${airsEnabled ? theme.allowedBorder : theme.blockedBorder}`,
                background: airsEnabled ? theme.allowedBg : theme.blockedBg,
                color: airsEnabled ? theme.allowed : theme.blocked,
                fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'Heebo, Inter, sans-serif',
              }}
            >
              {airsEnabled ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
              {airsEnabled ? t('protection.on') : t('protection.off')}
            </button>
            <button
              onClick={reset}
              title={t('mcp.reset')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 12px', borderRadius: 10,
                border: `1px solid ${theme.border}`, background: theme.surfaceMuted, color: theme.textMuted,
                fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'Heebo, Inter, sans-serif',
              }}
            >
              <RotateCcw size={13} /> {t('mcp.reset')}
            </button>
          </div>
        </div>

        {/* ── connected servers ── */}
        <div
          style={{
            borderRadius: 14, padding: '13px 15px', background: theme.surface,
            border: `1px solid ${theme.border}`, boxShadow: theme.shadowSm,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: theme.textFaint, marginBottom: 9 }}>
            {t('mcp.servers').toUpperCase()}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {servers.map((s) => (
              <div
                key={s.id}
                style={{
                  flex: '1 1 300px', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 11,
                  background: theme.surfaceMuted, border: `1px solid ${theme.border}`,
                }}
              >
                <Server size={16} color={s.trust === 'third-party' ? theme.flagged : theme.allowed} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    <code dir="ltr" style={{ fontSize: 11, fontWeight: 700, color: theme.text }}>{s.id}</code>
                    <TrustBadge trust={s.trust} theme={theme} t={t} />
                  </div>
                  <div dir="auto" style={{ fontSize: 10.5, color: theme.textFaint, marginTop: 2 }}>
                    {pick(s.operator)} · {s.toolCount} {t('mcp.tools')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── scenario picker ── */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: theme.textFaint, marginBottom: 8 }}>
            {t('mcp.scenarios').toUpperCase()}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {MOH_MCP_SCENARIOS.map((s) => {
              const active = s.id === scenario.id
              const c = MOH_SEVERITY_COLORS[s.severity] || theme.textFaint
              return (
                <button
                  key={s.id}
                  onClick={() => { setScenario(s); setRun(null); setError(null) }}
                  style={{
                    flex: '1 1 200px', textAlign: dir === 'rtl' ? 'right' : 'left',
                    padding: '10px 12px', borderRadius: 11, cursor: 'pointer',
                    border: `1px solid ${active ? c : theme.border}`,
                    background: active ? `${c}14` : theme.surface,
                    fontFamily: 'Heebo, Inter, sans-serif',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0 }} />
                    <code dir="ltr" style={{ fontSize: 9.5, color: theme.textFaint }}>{s.id}</code>
                  </div>
                  <div dir="auto" style={{ fontSize: 11.5, fontWeight: 700, color: theme.text, lineHeight: 1.4 }}>
                    {pick(s.label)}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── why it matters + measured expectation ── */}
        <div
          style={{
            borderRadius: 12, padding: '12px 15px',
            background: theme.surfaceMuted, border: `1px solid ${theme.border}`,
          }}
        >
          <p dir="auto" style={{ margin: 0, fontSize: 12, color: theme.textMuted, lineHeight: 1.7 }}>
            {pick(scenario.why)}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 9, alignItems: 'center' }}>
            <span style={{ fontSize: 9.5, fontWeight: 800, color: theme.textFaint, letterSpacing: '0.05em' }}>
              {t('mcp.measured').toUpperCase()}:
            </span>
            {['en', 'he'].map((l) => {
              const v = scenario.measured?.[l]
              const blockExpected = v === 'block'
              const c = blockExpected ? theme.allowed : scenario.severity === 'none' ? theme.allowed : theme.flagged
              return (
                <span
                  key={l}
                  dir="ltr"
                  style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                    background: `${c}18`, color: c, border: `1px solid ${c}44`,
                  }}
                >
                  {l.toUpperCase()} · {v}
                </span>
              )
            })}
            {scenario.knownGap && (
              <span style={{ fontSize: 10, color: theme.flagged, fontWeight: 700 }}>▲ {t('mcp.knownGap')}</span>
            )}
            {!scenario.knownGap && scenario.measured?.en === 'block' && scenario.measured?.he === 'allow' && (
              <span style={{ fontSize: 10, color: theme.flagged, fontWeight: 700 }}>▲ {t('mcp.langGap')}</span>
            )}
          </div>
        </div>

        {/* ── run ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={runList}
            disabled={busy}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10,
              border: `1px solid ${ACCENT}66`, background: busy ? theme.surfaceMuted : `${ACCENT}1a`,
              color: ACCENT, fontSize: 12.5, fontWeight: 700, cursor: busy ? 'default' : 'pointer',
              fontFamily: 'Heebo, Inter, sans-serif',
            }}
          >
            {busy ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            {busy ? t('mcp.running') : t('mcp.run')}
          </button>

          {scenario.twoStep && (
            <span dir="auto" style={{ fontSize: 11, color: theme.textMuted }}>
              {t('mcp.listCount')}: <strong style={{ color: theme.text }}>{rug.listCount ?? 0}</strong>
              {' · '}
              {(rug.listCount ?? 0) === 0 ? t('mcp.step1') : t('mcp.step2')}
            </span>
          )}
        </div>

        {error && (
          <div style={{ padding: '11px 14px', borderRadius: 11, background: theme.blockedBg, border: `1px solid ${theme.blockedBorder}`, fontSize: 11.5, color: theme.text }}>
            {error}
          </div>
        )}

        {/* ── result ── */}
        <AnimatePresence mode="wait">
          {!run && !error && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              dir="auto"
              style={{ padding: '26px 18px', textAlign: 'center', fontSize: 12, color: theme.textFaint }}
            >
              {t('mcp.noRun')}
            </motion.div>
          )}

          {run && (
            <motion.div
              key={`${scenario.id}-${run.latencyMs}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {/* verdict */}
              <div
                style={{
                  borderRadius: 13, padding: '13px 16px',
                  background: run.blocked ? theme.blockedBg : theme.allowedBg,
                  border: `1px solid ${run.blocked ? theme.blockedBorder : theme.allowedBorder}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                  {run.blocked
                    ? <XCircle size={17} color={theme.blocked} />
                    : <CheckCircle2 size={17} color={theme.allowed} />}
                  <strong style={{ fontSize: 13, color: theme.text }}>
                    {run.blocked ? t('mcp.manifestBlocked') : t('mcp.verdict')}
                  </strong>
                  {run.scan?.category && (
                    <code dir="ltr" style={{ fontSize: 10.5, color: theme.textMuted }}>{run.scan.category}</code>
                  )}
                  <span style={{ marginInlineStart: 'auto', fontSize: 10.5, color: theme.textFaint }} dir="ltr">
                    {run.scan?.latencyMs ?? run.latencyMs}ms
                    {run.servedVariant ? ` · variant: ${run.servedVariant}` : ''}
                  </span>
                </div>

                {run.scan?.detected?.length > 0 && (
                  <div style={{ marginTop: 9 }}>
                    <DetectionBadges detected={run.scan.detected} />
                  </div>
                )}

                {!airsEnabled && (
                  <div dir="auto" style={{ marginTop: 8, fontSize: 11, color: theme.flagged }}>
                    ▲ AIRS off — the manifest was passed through unscanned.
                  </div>
                )}

                {run.scan?.scan_id && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <code dir="ltr" style={{ fontSize: 9.5, color: theme.textFaint }}>scan_id: {run.scan.scan_id}</code>
                    <CopyButton text={run.scan.scan_id} accent={ACCENT} />
                  </div>
                )}
              </div>

              {/* the manifest itself */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <Eye size={13} color={theme.textFaint} />
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: theme.textFaint }}>
                    {t('mcp.manifest').toUpperCase()}
                  </span>
                </div>

                {run.blocked ? (
                  <div
                    dir="auto"
                    style={{
                      padding: '16px 18px', borderRadius: 12, fontSize: 12, lineHeight: 1.7,
                      background: theme.blockedBg, border: `1px dashed ${theme.blockedBorder}`, color: theme.textMuted,
                    }}
                  >
                    {t('mcp.manifestBlocked')}
                    {run.flaggedTools?.length > 0 && (
                      <div dir="ltr" style={{ marginTop: 7, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {run.flaggedTools.map((n) => (
                          <code key={n} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: `${theme.blocked}1f`, color: theme.blocked }}>
                            {n}
                          </code>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(run.tools || []).map((tool) => (
                      <ToolCard
                        key={tool.name}
                        tool={tool}
                        flagged={run.flaggedTools?.includes(tool.name)}
                        theme={theme}
                        t={t}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
