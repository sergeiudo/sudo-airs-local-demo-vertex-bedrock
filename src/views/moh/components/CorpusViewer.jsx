import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Eye, EyeOff, Columns2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react'
import { useMohLang } from '../i18n'
import { MOH_RISK_COLORS } from '../theme'

/**
 * CorpusViewer — read the actual clinical documents the RAG demo retrieves.
 *
 * Describing a poisoned document is far less convincing than showing it, so
 * this renders the real body with the dangerous spans marked and annotated.
 * Two of the documents hide their payload in zero-width characters, which is
 * exactly the point — the "reveal hidden characters" switch makes them
 * visible, and nothing else in the portal can do that.
 */

/** Split content into plain / highlighted / hidden segments, in order. */
function annotate(content, highlights = [], hiddenRuns = []) {
  const marks = []

  for (const h of highlights) {
    const at = content.indexOf(h.text)
    if (at === -1) continue // content edited without updating the highlight
    marks.push({ start: at, end: at + h.text.length, type: 'highlight', data: h })
  }
  for (const r of hiddenRuns) {
    marks.push({ start: r.start, end: r.end, type: 'hidden', data: r })
  }

  marks.sort((a, b) => a.start - b.start)

  // Drop any mark that overlaps one already accepted — a highlight and a
  // hidden run can cover the same characters.
  const kept = []
  let guard = -1
  for (const m of marks) {
    if (m.start < guard) continue
    kept.push(m)
    guard = m.end
  }

  const out = []
  let cursor = 0
  for (const m of kept) {
    if (m.start > cursor) out.push({ type: 'text', text: content.slice(cursor, m.start) })
    out.push({ ...m, text: content.slice(m.start, m.end) })
    cursor = m.end
  }
  if (cursor < content.length) out.push({ type: 'text', text: content.slice(cursor) })
  return out
}

function DocBody({ doc, revealHidden, theme, compact }) {
  const { lang } = useMohLang()
  const segments = useMemo(
    () => annotate(doc.content, doc.highlights, doc.hiddenRuns || []),
    [doc]
  )

  return (
    <pre
      dir="rtl"
      style={{
        margin: 0, padding: compact ? '12px 14px' : '16px 18px', borderRadius: 10,
        background: theme.surfaceMuted, border: `1px solid ${theme.border}`,
        fontFamily: 'Heebo, Inter, sans-serif', fontSize: compact ? 11.5 : 12.5,
        lineHeight: 1.85, color: theme.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        maxHeight: compact ? 420 : 560, overflowY: 'auto',
      }}
    >
      {segments.map((s, i) => {
        if (s.type === 'text') return <React.Fragment key={i}>{s.text}</React.Fragment>

        if (s.type === 'hidden') {
          if (!revealHidden) {
            // Left genuinely invisible — that is the attack.
            return <React.Fragment key={i}>{s.text}</React.Fragment>
          }

          // A smuggled run is 100+ Tags code points; rendering them as
          // individual chips would be noise. Show what it decodes to instead.
          if (s.data.kind === 'smuggled') {
            return (
              <span
                key={i}
                dir="ltr"
                style={{
                  display: 'block', margin: '6px 0', padding: '8px 11px', borderRadius: 8,
                  background: 'rgba(239,68,68,0.12)', border: '1px dashed rgba(239,68,68,0.55)',
                  textAlign: 'left', whiteSpace: 'pre-wrap',
                }}
              >
                <span
                  style={{
                    display: 'block', fontSize: 8.5, fontWeight: 800, letterSpacing: '0.06em',
                    color: '#ef4444', marginBottom: 4, fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {s.data.codepoints.length} INVISIBLE CHARACTERS · UNICODE TAGS BLOCK · DECODED
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#fca5a5', lineHeight: 1.6 }}>
                  {s.data.decoded}
                </span>
              </span>
            )
          }

          return (
            <span key={i} dir="ltr" style={{ display: 'inline-flex', gap: 2, margin: '0 2px', verticalAlign: 'middle' }}>
              {s.data.codepoints.map((cp, j) => (
                <span
                  key={j}
                  title={`Non-printing character ${cp}`}
                  style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 8.5, fontWeight: 700,
                    padding: '1px 4px', borderRadius: 4, background: 'rgba(239,68,68,0.20)',
                    color: '#ef4444', border: '1px solid rgba(239,68,68,0.45)', whiteSpace: 'nowrap',
                  }}
                >
                  {cp}
                </span>
              ))}
            </span>
          )
        }

        const danger = s.data.kind === 'danger'
        const c = danger ? '#ef4444' : '#10b981'
        return (
          <mark
            key={i}
            title={lang === 'he' ? s.data.note_he : s.data.note_en}
            style={{
              background: `${c}1f`, color: theme.text, borderBottom: `2px solid ${c}`,
              borderRadius: 3, padding: '1px 2px', cursor: 'help',
            }}
          >
            {s.text}
          </mark>
        )
      })}
    </pre>
  )
}

function FindingsList({ doc, theme }) {
  const { t, lang } = useMohLang()
  const items = (doc.highlights || []).filter((h) => h.kind === 'danger')
  if (!items.length && !doc.hiddenCount) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((h, i) => (
        <div
          key={i}
          style={{
            display: 'flex', gap: 8, padding: '8px 11px', borderRadius: 9,
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)',
          }}
        >
          <AlertTriangle size={12} color="#ef4444" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: theme.text, lineHeight: 1.5 }}>
              {lang === 'he' ? h.note_he : h.note_en}
            </div>
            <div
              dir="auto"
              style={{
                fontSize: 10, color: theme.textFaint, marginTop: 2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              “{h.text}”
            </div>
          </div>
        </div>
      ))}
      {doc.hiddenCount > 0 && (
        <div
          style={{
            display: 'flex', gap: 8, padding: '8px 11px', borderRadius: 9,
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)',
          }}
        >
          <EyeOff size={12} color="#ef4444" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: theme.text, lineHeight: 1.5 }}>
              {t('corpus.hiddenFound').replace('{n}', doc.hiddenCount)}
            </div>
            {(doc.hiddenRuns || [])
              .filter((r) => r.kind === 'smuggled')
              .map((r, i) => (
                <div
                  key={i}
                  dir="ltr"
                  style={{
                    fontSize: 10, color: theme.textFaint, marginTop: 3, textAlign: 'left',
                    fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.5,
                  }}
                >
                  “{r.decoded}”
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function CorpusViewer({ docId, theme }) {
  const { t, lang, pick } = useMohLang()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(false)
  const [revealHidden, setRevealHidden] = useState(false)
  const [compare, setCompare] = useState(false)

  useEffect(() => {
    if (!docId) { setDoc(null); return }
    setLoading(true)
    setCompare(false)
    fetch(`/api/moh/corpus/${docId}`)
      .then((r) => r.json())
      .then((d) => setDoc(d.error ? null : d))
      .catch(() => setDoc(null))
      .finally(() => setLoading(false))
  }, [docId])

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: theme.textFaint }}>
        <RefreshCw size={18} className="animate-spin" />
      </div>
    )
  }
  if (!doc) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: theme.textFaint, fontSize: 12.5 }}>
        {t('corpus.pickDoc')}
      </div>
    )
  }

  const poisoned = doc.risk !== 'benign'
  const c = MOH_RISK_COLORS[doc.risk] || theme.textFaint

  const Toggle = ({ on, onClick, icon: Icon, label }) => (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 8,
        fontSize: 10.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'Heebo, Inter, sans-serif',
        background: on ? `${c}1a` : 'transparent',
        border: `1px solid ${on ? `${c}66` : theme.border}`,
        color: on ? c : theme.textMuted,
      }}
    >
      <Icon size={12} />
      {label}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 900 }}>
      {/* header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginBottom: 5 }}>
          <FileText size={16} color={c} />
          <h2 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: theme.text }}>
            {lang === 'he' ? doc.title_he : doc.title_en}
          </h2>
          <span
            style={{
              fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
              background: `${c}22`, color: c, border: `1px solid ${c}55`, whiteSpace: 'nowrap',
            }}
          >
            {t(`rag.risk.${doc.risk}`)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 10.5, color: theme.textFaint }}>
          <code dir="ltr">{doc.id}</code>
          <span>{doc.chars} chars</span>
          {doc.hiddenCount > 0 && (
            <span style={{ color: '#ef4444', fontWeight: 700 }}>
              {doc.hiddenCount} non-printing
            </span>
          )}
        </div>
        {lang === 'en' && doc.gloss_en && (
          <p style={{ margin: '7px 0 0', fontSize: 11.5, color: theme.textMuted, lineHeight: 1.6 }}>{doc.gloss_en}</p>
        )}
      </div>

      {/* controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {doc.hiddenCount > 0 && (
          <Toggle
            on={revealHidden}
            onClick={() => setRevealHidden((v) => !v)}
            icon={revealHidden ? Eye : EyeOff}
            label={revealHidden ? t('corpus.hideHidden') : t('corpus.revealHidden')}
          />
        )}
        {doc.compare && (
          <Toggle
            on={compare}
            onClick={() => setCompare((v) => !v)}
            icon={Columns2}
            label={t('corpus.compare')}
          />
        )}
      </div>

      {/* findings */}
      {poisoned && <FindingsList doc={doc} theme={theme} />}

      {/* body / side-by-side */}
      {compare && doc.compare ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <ShieldCheck size={12} color="#10b981" />
              <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', letterSpacing: '0.05em' }}>
                {t('corpus.cleanVersion')}
              </span>
            </div>
            <DocBody
              doc={{ ...doc.compare, highlights: doc.compare.highlights || [], hiddenRuns: [] }}
              revealHidden={false}
              theme={theme}
              compact
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <AlertTriangle size={12} color="#ef4444" />
              <span style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', letterSpacing: '0.05em' }}>
                {t('corpus.poisonedVersion')}
              </span>
            </div>
            <DocBody doc={doc} revealHidden={revealHidden} theme={theme} compact />
          </div>
        </div>
      ) : (
        <DocBody doc={doc} revealHidden={revealHidden} theme={theme} />
      )}

      <p style={{ margin: 0, fontSize: 10, color: theme.textFaint, lineHeight: 1.6 }}>
        {t('corpus.disclaimer')}
      </p>
    </div>
  )
}

/** Document picker used in the RAG tab's left panel. */
export function CorpusList({ docs, activeId, onPick, theme }) {
  const { t, lang } = useMohLang()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {docs.map((d) => {
        const c = MOH_RISK_COLORS[d.risk] || theme.textFaint
        const on = d.id === activeId
        return (
          <button
            key={d.id}
            onClick={() => onPick(d.id)}
            style={{
              display: 'flex', flexDirection: 'column', gap: 3, padding: '9px 11px', borderRadius: 10,
              border: `1px solid ${on ? c : theme.border}`,
              background: on ? `${c}14` : theme.surface,
              cursor: 'pointer', textAlign: 'start',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%' }}>
              <FileText size={11} color={c} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: theme.text, flex: 1, lineHeight: 1.4 }}>
                {lang === 'he' ? d.title_he : d.title_en}
              </span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, paddingInlineStart: 18 }}>
              <span
                style={{
                  fontSize: 8.5, fontWeight: 800, padding: '1px 6px', borderRadius: 999,
                  background: `${c}22`, color: c, whiteSpace: 'nowrap',
                }}
              >
                {t(`rag.risk.${d.risk}`)}
              </span>
              {d.findings > 0 && (
                <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 700 }}>
                  {d.findings} {t('corpus.findings')}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
