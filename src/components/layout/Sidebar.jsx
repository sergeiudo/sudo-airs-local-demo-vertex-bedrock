import React from 'react'
import { Crosshair, ScanSearch, Swords, Settings, Activity, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '../sidebar/Logo'
import { ProtectionToggle } from '../sidebar/ProtectionToggle'
import { NavItem } from '../sidebar/NavItem'
import { useAppContext } from '../../context/AppContext'
import { useProtectionTheme } from '../../hooks/useProtectionTheme'

const NAV_ITEMS = [
  {
    id: 'apiIntercept',
    label: 'API Intercept',
    sublabel: 'Live payload simulation',
    icon: Crosshair,
  },
  {
    id: 'modelScanning',
    label: 'Model Scanning',
    sublabel: 'CVE vulnerability scanner',
    icon: ScanSearch,
  },
  {
    id: 'redTeaming',
    label: 'Red Teaming',
    sublabel: 'Automated attack campaigns',
    icon: Swords,
  },
]

export function Sidebar() {
  const { state, dispatch } = useAppContext()
  const theme = useProtectionTheme()

  const setView = (id) => dispatch({ type: 'SET_VIEW', payload: id })

  return (
    <aside className="flex flex-col w-[260px] flex-shrink-0 h-full border-r border-white/10 bg-base-900/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="px-4 pt-5 pb-4">
        <Logo />
      </div>

      {/* Protection Toggle */}
      <ProtectionToggle />

      {/* SCM Console link — appears after first scan */}
      <AnimatePresence>
        {state.scmUrl && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="px-3 overflow-hidden"
          >
            <a
              href={state.scmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2.5 w-full px-3 py-2.5 my-2 rounded-lg border text-xs font-semibold transition-all duration-300 ${theme.primaryBg2} ${theme.primaryBorder2} ${theme.primaryText} ${theme.primaryHoverBg2}`}
            >
              <ExternalLink size={12} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div>View in SCM Console</div>
                <div className="text-[9px] font-normal opacity-60 truncate">Strata Cloud Manager</div>
              </div>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 space-y-1 overflow-y-auto">
        <div className="mb-2 px-2">
          <span className="text-[9px] font-semibold tracking-[0.2em] text-slate-600 uppercase">
            Products
          </span>
        </div>
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            sublabel={item.sublabel}
            isActive={state.activeView === item.id}
            onClick={() => setView(item.id)}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 pb-4 space-y-3">
        {/* System health */}
        <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${theme.primaryBorder2} ${theme.primaryBg2} transition-all duration-500`}>
          <Activity size={12} className={`${theme.primaryText} transition-colors duration-500`} />
          <div className="flex-1">
            <div className={`text-[10px] font-semibold ${theme.primaryText} transition-colors duration-500`}>
              System Status
            </div>
            <div className="text-[10px] text-slate-500">All scanners operational</div>
          </div>
          <span className={`w-1.5 h-1.5 rounded-full ${theme.pulseColor} animate-pulse transition-colors duration-500`} />
        </div>

        {/* Version */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-slate-600">SUDO AIRS Demo</span>
          <button className="text-slate-600 hover:text-slate-400 transition-colors">
            <Settings size={12} />
          </button>
        </div>
      </div>
    </aside>
  )
}
