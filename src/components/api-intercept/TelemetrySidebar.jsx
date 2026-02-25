import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, Activity, Code2, Cpu, Hash,
  Zap, Clock, ArrowDownToLine, ArrowUpFromLine,
  AlertTriangle, CheckCircle2, ShieldX, ShieldCheck,
  Gauge, Layers, FileCode,
} from 'lucide-react'
import { CodeBlock } from '../shared/CodeBlock'
import { SDK_SNIPPETS } from '../../data/mockData'
import { useProtectionTheme } from '../../hooks/useProtectionTheme'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function latencyLabel(ms) {
  if (ms == null) return { label: '—', color: 'text-slate-600' }
  if (ms < 300)  return { label: 'Fast',   color: 'text-emerald-400' }
  if (ms < 800)  return { label: 'Normal', color: 'text-blue-400' }
  if (ms < 2000) return { label: 'Slow',   color: 'text-yellow-400' }
  return           { label: 'Very slow', color: 'text-red-400' }
}

function fmt(n, unit = '') {
  if (n == null) return '—'
  return `${n.toLocaleString()}${unit}`
}

// ─── Collapsible section ──────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = true, badge, badgeColor = 'bg-white/10 text-slate-400' }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-white/8 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-white/[0.025] transition-colors"
      >
        <Icon size={12} className="text-slate-500 flex-shrink-0" />
        <span className="flex-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        {badge != null && (
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
        )}
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown size={11} className="text-slate-700" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'text-slate-200', icon: Icon, wide = false }) {
  return (
    <div className={`flex flex-col gap-0.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/8 ${wide ? 'col-span-2' : ''}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        {Icon && <Icon size={10} className="text-slate-600" />}
        <span className="text-[9px] text-slate-600 uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <span className={`text-sm font-bold font-mono leading-none ${color}`}>{value ?? '—'}</span>
      {sub && <span className="text-[9px] text-slate-600 mt-0.5">{sub}</span>}
    </div>
  )
}

// ─── Token bar ────────────────────────────────────────────────────────────────
function TokenBar({ tokensIn, tokensOut }) {
  const total = (tokensIn ?? 0) + (tokensOut ?? 0)
  if (!total) return null
  const inPct  = total ? ((tokensIn  ?? 0) / total) * 100 : 0
  const outPct = total ? ((tokensOut ?? 0) / total) * 100 : 0

  return (
    <div className="space-y-1.5">
      <div className="flex h-3 rounded-full overflow-hidden bg-white/5 gap-px">
        <motion.div
          className="bg-blue-500/70 flex items-center justify-center"
          initial={{ width: 0 }}
          animate={{ width: `${inPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {inPct > 15 && <span className="text-[8px] text-blue-200 font-bold">{tokensIn}</span>}
        </motion.div>
        <motion.div
          className="bg-violet-500/70 flex items-center justify-center"
          initial={{ width: 0 }}
          animate={{ width: `${outPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        >
          {outPct > 15 && <span className="text-[8px] text-violet-200 font-bold">{tokensOut}</span>}
        </motion.div>
      </div>
      <div className="flex items-center gap-3 text-[9px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500/70 inline-block" />Input {tokensIn ?? '—'} tok</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500/70 inline-block" />Output {tokensOut ?? '—'} tok</span>
        <span className="ml-auto font-mono font-semibold text-slate-400">{total} total</span>
      </div>
    </div>
  )
}

// ─── Timing waterfall ─────────────────────────────────────────────────────────
function TimingWaterfall({ timing }) {
  const total = timing?.total_ms || 1
  const segments = [
    { key: 'airs_input_scan_ms',  label: 'AIRS Input Scan',   color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    { key: 'llm_ms',              label: 'LLM Inference',      color: 'bg-blue-500',    textColor: 'text-blue-400' },
    { key: 'airs_output_scan_ms', label: 'AIRS Output Scan',   color: 'bg-violet-500',  textColor: 'text-violet-400' },
  ].filter(s => timing?.[s.key] != null && timing[s.key] > 0)

  if (!segments.length) {
    const llm = timing?.llm_ms
    if (!llm) return null
    return (
      <div className="space-y-2">
        <div className="flex h-4 rounded-lg overflow-hidden bg-white/5">
          <motion.div className="bg-blue-500/70 rounded-lg" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 0.6 }} />
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-blue-400 font-mono">{llm}ms LLM</span>
          <span className="text-slate-500">{latencyLabel(llm).label}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {/* Stacked bar */}
      <div className="flex h-4 rounded-lg overflow-hidden bg-white/5 gap-px">
        {segments.map(s => (
          <motion.div
            key={s.key}
            className={`${s.color} opacity-80 flex items-center justify-center`}
            initial={{ width: 0 }}
            animate={{ width: `${(timing[s.key] / total) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {(timing[s.key] / total) > 0.15 && (
              <span className="text-[8px] text-white font-bold">{timing[s.key]}ms</span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Per-phase rows */}
      <div className="space-y-1.5">
        {segments.map(s => {
          const pct = Math.round((timing[s.key] / total) * 100)
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.color}`} />
              <span className="text-[10px] text-slate-500 flex-1">{s.label}</span>
              <span className={`text-[10px] font-mono font-bold ${s.textColor}`}>{timing[s.key]}ms</span>
              <span className="text-[9px] text-slate-700 w-7 text-right">{pct}%</span>
            </div>
          )
        })}
        <div className="flex items-center gap-2 pt-1 border-t border-white/8">
          <Clock size={9} className="text-slate-600 flex-shrink-0" />
          <span className="text-[10px] text-slate-500 flex-1">Total round-trip</span>
          <span className="text-[10px] font-mono font-bold text-slate-200">{total}ms</span>
        </div>
      </div>
    </div>
  )
}

// ─── Detection flag grid ──────────────────────────────────────────────────────
function DetectionGrid({ detected, label }) {
  if (!detected || !Object.keys(detected).length) return null
  const entries = Object.entries(detected)
  const triggered = entries.filter(([, v]) => v)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-slate-600 uppercase tracking-wider font-semibold">{label}</span>
        {triggered.length > 0
          ? <span className="text-[9px] font-bold text-red-400">{triggered.length} triggered</span>
          : <span className="text-[9px] text-emerald-500">all clear</span>
        }
      </div>
      <div className="grid grid-cols-2 gap-1">
        {entries.map(([key, val]) => (
          <div
            key={key}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-medium ${
              val
                ? 'border-red-500/40 bg-red-500/10 text-red-300'
                : 'border-white/6 bg-white/[0.02] text-slate-700'
            }`}
          >
            {val
              ? <AlertTriangle size={8} className="text-red-400 flex-shrink-0" />
              : <CheckCircle2 size={8} className="text-slate-800 flex-shrink-0" />
            }
            <span className="truncate">{key.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── IDs card ─────────────────────────────────────────────────────────────────
function IdsCard({ scan }) {
  if (!scan) return null
  const fields = [
    { label: 'scan_id',    value: scan.scan_id },
    { label: 'report_id',  value: scan.report_id },
    { label: 'tr_id',      value: scan.tr_id },
    { label: 'profile_id', value: scan.profile_id },
  ].filter(f => f.value)

  return (
    <div className="rounded-xl bg-black/30 border border-white/8 overflow-hidden">
      {fields.map(({ label, value }, i) => (
        <div key={label} className={`flex gap-2 px-3 py-2 ${i < fields.length - 1 ? 'border-b border-white/6' : ''}`}>
          <span className="text-[9px] text-slate-600 w-16 flex-shrink-0 pt-0.5">{label}</span>
          <span className="text-[9px] font-mono text-slate-400 break-all leading-relaxed">{value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Scan result block ────────────────────────────────────────────────────────
function ScanBlock({ scan, type }) {
  if (!scan) return <p className="text-[10px] text-slate-700 py-2">No {type} scan performed</p>

  const detected = type === 'input' ? scan.prompt_detected : scan.response_detected
  const details  = type === 'input' ? scan.prompt_detection_details : scan.response_detection_details
  const masked   = type === 'input' ? scan.prompt_masked_data : scan.response_masked_data
  const procMs   = scan.completed_at && scan.created_at
    ? new Date(scan.completed_at) - new Date(scan.created_at)
    : scan.latency_ms

  return (
    <div className="space-y-3">
      {/* Mini verdict grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: 'Category', value: scan.category, accent: scan.category === 'malicious' },
          { label: 'Action',   value: scan.action,   accent: scan.action === 'block' },
          { label: 'Scan time',value: `${procMs ?? '—'}ms` },
        ].map(({ label, value, accent }) => (
          <div key={label} className="text-center p-2 rounded-lg bg-white/5 border border-white/8">
            <div className={`text-xs font-bold font-mono ${accent ? 'text-red-400' : value === 'allow' || value === 'benign' ? 'text-emerald-400' : 'text-slate-300'}`}>
              {value}
            </div>
            <div className="text-[8px] text-slate-600 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Timestamps */}
      <div className="grid grid-cols-2 gap-1.5 text-[9px]">
        {[['Created', scan.created_at], ['Completed', scan.completed_at]].filter(([, v]) => v).map(([label, value]) => (
          <div key={label} className="p-2 rounded-lg bg-white/[0.03] border border-white/6">
            <div className="text-slate-600 mb-0.5">{label}</div>
            <div className="font-mono text-slate-400 break-all">{new Date(value).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>

      {/* IDs */}
      <IdsCard scan={scan} />

      {/* Detection flags */}
      {detected && <DetectionGrid detected={detected} label={type === 'input' ? 'Prompt classifier results' : 'Response classifier results'} />}

      {masked && (
        <div>
          <div className="text-[9px] text-slate-600 uppercase tracking-wider font-semibold mb-1.5">Masked Data</div>
          <CodeBlock code={masked} language="json" maxHeight="100px" />
        </div>
      )}
      {details && (
        <div>
          <div className="text-[9px] text-slate-600 uppercase tracking-wider font-semibold mb-1.5">Detection Details</div>
          <CodeBlock code={details} language="json" maxHeight="140px" />
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function TelemetrySidebar({ telemetry }) {
  const [sdkTab, setSdkTab] = useState('python')
  const theme = useProtectionTheme()

  const isBlocked = telemetry?.summary?.verdict === 'BLOCKED'
  const hasAirs   = telemetry?.summary != null
  const isDirect  = telemetry && !telemetry.summary
  const llm       = telemetry?.llm
  const timing    = telemetry?.timing

  const latency   = latencyLabel(llm?.latency_ms)

  return (
    <div className="flex flex-col h-full overflow-hidden border-l border-white/10 bg-base-900/20">

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 flex-shrink-0">
        <Activity size={14} className={theme.primaryText} />
        <span className="text-xs font-semibold text-slate-300">Telemetry</span>
        {hasAirs && (
          <motion.span
            key={isBlocked ? 'blocked' : 'allowed'}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`ml-auto flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              isBlocked
                ? 'bg-red-500/20 text-red-400 border-red-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}
          >
            {isBlocked ? <ShieldX size={10} /> : <ShieldCheck size={10} />}
            {isBlocked ? 'BLOCKED' : 'ALLOWED'}
          </motion.span>
        )}
        {isDirect && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border bg-slate-800 text-slate-500 border-slate-700">
            <Zap size={10} /> DIRECT
          </span>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Empty */}
        {!telemetry && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-6">
            <Activity size={28} className="text-slate-800" />
            <div>
              <p className="text-xs font-semibold text-slate-600">No telemetry yet</p>
              <p className="text-[10px] text-slate-700 mt-1">Send a message to capture live data</p>
            </div>
          </div>
        )}

        {/* ── AIRS verdict hero ── */}
        {hasAirs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mx-4 mt-4 mb-1 p-4 rounded-xl border ${
              isBlocked
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-emerald-500/10 border-emerald-500/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isBlocked ? 'bg-red-500/20' : 'bg-emerald-500/20'
              }`}>
                {isBlocked
                  ? <ShieldX size={20} className="text-red-400" />
                  : <ShieldCheck size={20} className="text-emerald-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-bold ${isBlocked ? 'text-red-300' : 'text-emerald-300'}`}>
                  {isBlocked ? 'Threat Blocked' : 'Request Allowed'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {telemetry.summary.profile} · {telemetry.summary.category}
                </div>
                {telemetry.summary.threats_detected?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {telemetry.summary.threats_detected.map(t => (
                      <span key={t} className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500/20 border border-red-500/30 text-[9px] font-bold text-red-400">
                        <AlertTriangle size={8} />{t.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Unprotected hero ── */}
        {isDirect && (
          <div className="mx-4 mt-4 mb-1 p-4 rounded-xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                <Zap size={18} className="text-slate-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-400">Unprotected · Direct LLM</div>
                <div className="text-[10px] text-slate-600 mt-0.5">Enable protection to scan with Prisma AIRS</div>
              </div>
            </div>
          </div>
        )}

        {/* ── LLM Performance ── */}
        {llm && (
          <Section title="LLM Performance" icon={Cpu} defaultOpen
            badge={llm.latency_ms != null ? `${llm.latency_ms}ms` : null}
            badgeColor={`${latency.color} bg-white/5`}
          >
            <div className="space-y-3">
              {/* Model pill */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/30 border border-white/8">
                <Layers size={11} className="text-slate-500" />
                <span className="text-[10px] font-mono text-slate-300 flex-1 truncate">{llm.model}</span>
                {llm.finish_reason && (
                  <span className="text-[9px] text-slate-600 font-semibold uppercase">{llm.finish_reason}</span>
                )}
              </div>

              {/* Stat grid */}
              <div className="grid grid-cols-2 gap-1.5">
                <StatCard
                  label="Latency"
                  value={fmt(llm.latency_ms, 'ms')}
                  sub={latency.label}
                  color={latency.color}
                  icon={Clock}
                />
                <StatCard
                  label="Throughput"
                  value={llm.throughput_tps != null ? `${llm.throughput_tps} t/s` : '—'}
                  sub="tokens per second"
                  color="text-violet-400"
                  icon={Gauge}
                />
                <StatCard
                  label="Input tokens"
                  value={fmt(llm.tokens_in)}
                  sub="prompt length"
                  color="text-blue-400"
                />
                <StatCard
                  label="Output tokens"
                  value={fmt(llm.tokens_out)}
                  sub="response length"
                  color="text-violet-400"
                />
              </div>

              {/* Token split bar */}
              {(llm.tokens_in || llm.tokens_out) && (
                <div>
                  <div className="text-[9px] text-slate-600 uppercase tracking-wider font-semibold mb-1.5">Token split</div>
                  <TokenBar tokensIn={llm.tokens_in} tokensOut={llm.tokens_out} />
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── Timing waterfall ── */}
        {timing && (
          <Section title="Request Timing" icon={Clock} defaultOpen
            badge={timing.total_ms != null ? `${timing.total_ms}ms total` : null}
            badgeColor="text-slate-400 bg-white/5"
          >
            <TimingWaterfall timing={timing} />
          </Section>
        )}

        {/* ── AIRS sections (protected only) ── */}
        {hasAirs && (
          <>
            <Section
              title="Input Scan · Prompt"
              icon={ArrowDownToLine}
              defaultOpen
              badge={telemetry.inputScan?.category}
              badgeColor={telemetry.inputScan?.category === 'malicious'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-emerald-500/20 text-emerald-400'}
            >
              <ScanBlock scan={telemetry.inputScan} type="input" />
            </Section>

            {telemetry.outputScan && (
              <Section
                title="Output Scan · Response"
                icon={ArrowUpFromLine}
                defaultOpen={false}
                badge={telemetry.outputScan?.category}
                badgeColor={telemetry.outputScan?.category === 'malicious'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-emerald-500/20 text-emerald-400'}
              >
                <ScanBlock scan={telemetry.outputScan} type="output" />
              </Section>
            )}

            <Section title="Raw JSON Payload" icon={Hash} defaultOpen={false}>
              <div className="space-y-2">
                <p className="text-[9px] text-slate-600 uppercase tracking-wider">Input scan</p>
                <CodeBlock code={telemetry.inputScan} language="json" maxHeight="200px" />
                {telemetry.outputScan && (
                  <>
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider mt-2">Output scan</p>
                    <CodeBlock code={telemetry.outputScan} language="json" maxHeight="200px" />
                  </>
                )}
              </div>
            </Section>
          </>
        )}

        {/* ── Dev Corner ── */}
        {telemetry && (
          <Section title="Dev Corner" icon={FileCode} defaultOpen={false}>
            <div className="flex gap-1 mb-3 p-1 bg-black/30 rounded-lg border border-white/10">
              {['python', 'node'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setSdkTab(tab)}
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-semibold transition-all duration-150 ${
                    sdkTab === tab
                      ? `${theme.primaryBg2} ${theme.primaryText} border ${theme.primaryBorder2}`
                      : 'text-slate-600 hover:text-slate-400'
                  }`}
                >
                  {tab === 'python' ? 'Python' : 'Node.js'}
                </button>
              ))}
            </div>
            <CodeBlock
              code={SDK_SNIPPETS[sdkTab]}
              language={sdkTab === 'python' ? 'python' : 'javascript'}
              maxHeight="260px"
            />
          </Section>
        )}

      </div>
    </div>
  )
}
