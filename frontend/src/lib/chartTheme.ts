/**
 * Chart theme tokens for consistent Recharts styling across Tradevo.
 * All colors align with the Tailwind @theme tokens in index.css.
 */

/** Color palette for chart segments — vivid on the dark surface-0/1 background */
export const CHART_COLORS = [
  '#22d3ee', // accent (cyan)
  '#34d399', // tx-success (emerald)
  '#fbbf24', // tx-warning (amber)
  '#a78bfa', // violet
  '#f87171', // tx-danger (red)
  '#fb923c', // orange
  '#38bdf8', // sky
  '#e879f9', // fuchsia
] as const

/** Maps a sector name to a consistent chart color */
const sectorColorCache = new Map<string, string>()
let colorIndex = 0

export function getSectorColor(sector: string): string {
  if (sectorColorCache.has(sector)) return sectorColorCache.get(sector)!

  const color = CHART_COLORS[colorIndex % CHART_COLORS.length]
  colorIndex++
  sectorColorCache.set(sector, color)
  return color
}

/** Recharts-compatible tooltip style object */
export const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#1a2235',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#f1f5f9',
    padding: '8px 12px',
  },
  labelStyle: {
    color: '#94a3b8',
    fontSize: '11px',
    marginBottom: '4px',
  },
  itemStyle: {
    color: '#f1f5f9',
    fontSize: '12px',
    padding: '2px 0',
  },
} as const

/** Recharts axis tick style */
export const AXIS_TICK_STYLE = {
  fontSize: 11,
  fill: '#64748b',
} as const

/** Format a number as Indian-currency string */
export function formatCurrency(value: number): string {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

/** Format a number as compact currency (e.g. ₹1.2L, ₹3.5Cr) */
export function formatCompactCurrency(value: number): string {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`
  }
  return `₹${value.toFixed(0)}`
}

/** Format a percentage value */
export function formatPercent(value: number, showSign = false): string {
  const prefix = showSign && value >= 0 ? '+' : ''
  return `${prefix}${value.toFixed(1)}%`
}

/** Get a descriptive label for a trade outcome (educational, not evaluative) */
export function describeOutcome(percent: number): string {
  const abs = Math.abs(percent)
  if (abs >= 10) return percent >= 0 ? 'Strong upward movement' : 'Significant downward movement'
  if (abs >= 5) return percent >= 0 ? 'Moderate upward movement' : 'Moderate downward movement'
  if (abs >= 1) return percent >= 0 ? 'Slight upward movement' : 'Slight downward movement'
  return 'Largely unchanged'
}