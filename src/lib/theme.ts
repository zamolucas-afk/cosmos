export type Theme = 'deep-space' | 'cloud'

export const THEME_KEY = 'cosmos-theme'

/** Get theme-aware glow color for box-shadows */
export function glow(theme: Theme, intensity: 'low' | 'med' | 'high' = 'med'): string {
  const map = {
    'deep-space': { low: '#7c3aed44', med: '#7c3aed88', high: '#a855f7aa' },
    'cloud':      { low: '#7c3aed22', med: '#7c3aed44', high: '#7c3aed66' },
  }
  return map[theme][intensity]
}

/** Build a box-shadow string with theme-aware violet glow */
export function glowShadow(theme: Theme, blur = 30, intensity: 'low' | 'med' | 'high' = 'med'): string {
  return `0 0 ${blur}px ${glow(theme, intensity)}`
}
