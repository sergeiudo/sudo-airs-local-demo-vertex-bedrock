import { useAppContext } from '../context/AppContext'

/**
 * Central theme token resolver.
 * All components call this instead of hardcoding colors.
 * Returns Tailwind class strings derived from isProtected.
 */
export function useProtectionTheme() {
  const { state } = useAppContext()
  const { isProtected } = state

  if (isProtected) {
    return {
      isProtected: true,

      // Primary accent
      primary: 'emerald-400',
      primaryDark: 'emerald-600',
      primaryBg: 'emerald-500/10',
      primaryBorder: 'emerald-500/30',
      primaryText: 'text-emerald-400',
      primaryBg2: 'bg-emerald-500/10',
      primaryBorder2: 'border-emerald-500/30',
      primaryRing: 'ring-emerald-500/40',

      // Secondary accent
      accent: 'blue-400',
      accentText: 'text-blue-400',
      accentBg: 'bg-blue-500/10',
      accentBorder: 'border-blue-500/30',

      // Glow / shadow
      glow: 'shadow-glow-emerald',
      glowColor: 'rgba(52,211,153,0.4)',

      // Pulse dot
      pulseColor: 'bg-emerald-400',
      pulseRing: 'ring-emerald-400/30',

      // Status badge
      badgeBg: 'bg-emerald-500/15',
      badgeBorder: 'border-emerald-500/40',
      badgeText: 'text-emerald-400',

      // Status label
      statusLabel: 'SECURED BY AIRS',
      statusClass: 'text-emerald-400',

      // Button
      btnBg: 'bg-emerald-500',
      btnHover: 'hover:bg-emerald-400',
      btnText: 'text-black',

      // Hover
      primaryHoverBg2: 'hover:bg-emerald-500/20',

      // Toggle track
      trackBg: 'bg-emerald-500/20',
      trackBorder: 'border-emerald-500/40',

      // Nav active
      navActiveBg: 'bg-emerald-500/10',
      navActiveBorder: 'border-emerald-500/30',
      navActiveText: 'text-emerald-400',

      // Chart / gauge
      gaugeColor: '#34d399',
      gaugeTrack: '#1a2e27',
    }
  }

  // Unprotected / Vulnerable state
  return {
    isProtected: false,

    primary: 'red-500',
    primaryDark: 'red-700',
    primaryBg: 'red-500/10',
    primaryBorder: 'red-500/30',
    primaryText: 'text-red-400',
    primaryBg2: 'bg-red-500/10',
    primaryBorder2: 'border-red-500/30',
    primaryRing: 'ring-red-500/40',

    accent: 'orange-400',
    accentText: 'text-orange-400',
    accentBg: 'bg-orange-500/10',
    accentBorder: 'border-orange-500/30',

    glow: 'shadow-glow-red',
    glowColor: 'rgba(239,68,68,0.4)',

    pulseColor: 'bg-red-500',
    pulseRing: 'ring-red-500/30',

    badgeBg: 'bg-red-500/15',
    badgeBorder: 'border-red-500/40',
    badgeText: 'text-red-400',

    statusLabel: 'VULNERABLE — UNPROTECTED',
    statusClass: 'text-red-400',

    btnBg: 'bg-red-500',
    btnHover: 'hover:bg-red-400',
    btnText: 'text-white',

    trackBg: 'bg-red-500/20',
    trackBorder: 'border-red-500/40',

    // Hover
    primaryHoverBg2: 'hover:bg-red-500/20',

    navActiveBg: 'bg-red-500/10',
    navActiveBorder: 'border-red-500/30',
    navActiveText: 'text-red-400',

    gaugeColor: '#ef4444',
    gaugeTrack: '#2e1a1a',
  }
}
