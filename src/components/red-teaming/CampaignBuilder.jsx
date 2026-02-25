import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Square, Crosshair, Zap, ChevronDown } from 'lucide-react'
import { ATTACK_PROFILES, TARGET_ENDPOINTS } from '../../data/mockData'
import { StatusBadge } from '../shared/StatusBadge'
import { useProtectionTheme } from '../../hooks/useProtectionTheme'

const AGGRESSION_COLORS = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-blue-400',
}

function Select({ label, value, onChange, options, renderOption }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none bg-black/40 border border-white/15 text-slate-300 text-xs rounded-lg px-3 py-2.5 pr-8 focus:outline-none focus:border-white/30 transition-colors"
        >
          {options.map(opt => (
            <option key={opt.id} value={opt.id}>
              {renderOption ? renderOption(opt) : opt.name}
            </option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      </div>
    </div>
  )
}

export function CampaignBuilder({ onLaunch, onStop, isRunning }) {
  const theme = useProtectionTheme()
  const [selectedProfile, setSelectedProfile] = useState(ATTACK_PROFILES[0].id)
  const [selectedEndpoint, setSelectedEndpoint] = useState(TARGET_ENDPOINTS[0].id)

  const profile = ATTACK_PROFILES.find(p => p.id === selectedProfile)
  const endpoint = TARGET_ENDPOINTS.find(e => e.id === selectedEndpoint)

  const handleLaunch = () => {
    onLaunch({ profile, endpoint })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 flex-shrink-0">
        <Crosshair size={14} className={theme.primaryText} />
        <span className="text-xs font-semibold text-slate-300">Campaign Builder</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Target Endpoint */}
        <Select
          label="Target Endpoint"
          value={selectedEndpoint}
          onChange={setSelectedEndpoint}
          options={TARGET_ENDPOINTS}
          renderOption={opt => `${opt.name} (${opt.model})`}
        />

        {/* Endpoint status */}
        <div className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-200 ${
          endpoint?.status === 'online'
            ? 'bg-emerald-500/10 border-emerald-500/25'
            : 'bg-slate-800 border-white/10'
        }`}>
          <div>
            <div className="text-xs font-semibold text-slate-300">{endpoint?.name}</div>
            <div className="text-[10px] text-slate-500">{endpoint?.region}</div>
          </div>
          <StatusBadge status={endpoint?.status} />
        </div>

        {/* Attack Profile */}
        <Select
          label="Attack Profile"
          value={selectedProfile}
          onChange={setSelectedProfile}
          options={ATTACK_PROFILES}
          renderOption={opt => opt.name}
        />

        {/* Profile detail card */}
        {profile && (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl border border-white/10 bg-white/5 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">{profile.name}</span>
              <span className={`text-[10px] font-bold uppercase ${AGGRESSION_COLORS[profile.aggressiveness] || 'text-slate-400'}`}>
                {profile.aggressiveness}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">{profile.description}</p>

            <div className="flex flex-wrap gap-1">
              {profile.categories.map(cat => (
                <span
                  key={cat}
                  className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 border border-white/10 text-slate-500"
                >
                  {cat}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
              <div>
                <div className="text-[10px] text-slate-600">Attack count</div>
                <div className="text-sm font-bold font-mono text-slate-300">{profile.attackCount}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-600">Est. duration</div>
                <div className="text-sm font-bold font-mono text-slate-300">{profile.duration}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* AIRS protection note */}
        <div className={`p-3 rounded-xl border transition-all duration-500 ${
          theme.isProtected
            ? 'bg-emerald-500/10 border-emerald-500/25'
            : 'bg-red-500/10 border-red-500/25'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={10} className={theme.primaryText} />
            <span className={`text-[10px] font-semibold ${theme.primaryText}`}>
              {theme.isProtected ? 'AIRS Protection Active' : 'No Protection — Raw Exposure'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">
            {theme.isProtected
              ? 'Attacks will be intercepted and blocked by Prisma AIRS. Robustness score reflects defense effectiveness.'
              : 'Toggle protection to see AIRS blocking attacks in real-time. Currently testing raw model exposure.'
            }
          </p>
        </div>

        {/* Launch / Stop button */}
        <motion.button
          onClick={isRunning ? onStop : handleLaunch}
          disabled={endpoint?.status === 'offline'}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg
            ${isRunning
              ? 'bg-red-500 text-white hover:bg-red-400'
              : endpoint?.status === 'offline'
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : theme.isProtected
              ? 'bg-emerald-500 text-black hover:bg-emerald-400'
              : 'bg-red-500 text-white hover:bg-red-400'
            }
          `}
          whileTap={{ scale: 0.97 }}
        >
          {isRunning ? (
            <><Square size={14} /> Stop Campaign</>
          ) : (
            <><Play size={14} /> Launch Campaign</>
          )}
        </motion.button>
      </div>
    </div>
  )
}
