// ============================================================
// Tradevo — Shared Formatting & Utility Functions
// ============================================================

/** Format number as Indian Rupee (e.g., ₹1,23,456) */
export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/** Format number as INR with decimals (e.g., ₹1,234.56) */
export function formatINRDecimal(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Format price with 2 decimal places (e.g., ₹2,685.40) */
export function formatPrice(price: number): string {
  return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Compact INR format (e.g., ₹12.5L, ₹1.2Cr, ₹4.2K) */
export function formatINRCompact(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(1)}Cr`
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(1)}L`
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(1)}K`
  return `${sign}₹${abs.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

/** Format stock price for display */
export function formatStockPrice(price: number): string {
  return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ---- Score Color Helpers ----

export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-tv-emerald'
  if (score >= 50) return 'text-tv-amber'
  return 'text-tv-coral'
}

export function getScoreBg(score: number): string {
  if (score >= 70) return 'bg-tv-emerald-muted'
  if (score >= 50) return 'bg-tv-amber-muted'
  return 'bg-tv-coral-muted'
}

export function getScoreDotColor(score: number): string {
  if (score >= 70) return 'bg-tv-emerald'
  if (score >= 50) return 'bg-tv-amber'
  return 'bg-tv-coral'
}

// ---- Animation Variants ----

export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
}

export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
}

// ---- Sector Colors ----

export const SECTOR_COLORS = [
  'var(--tv-cyan)',
  'var(--tv-emerald)',
  'var(--tv-amber)',
  'var(--tv-coral)',
  'var(--tv-blue)',
]

// ---- AI Insight Accent Map ----

export const AI_ACCENT_MAP: Record<string, { border: string; bg: string }> = {
  portfolio: { border: 'accent-border-cyan', bg: 'bg-tv-cyan-muted' },
  behavior: { border: 'accent-border-amber', bg: 'bg-tv-amber-muted' },
  risk: { border: 'accent-border-coral', bg: 'bg-tv-coral-muted' },
  opportunity: { border: 'accent-border-emerald', bg: 'bg-tv-emerald-muted' },
  learning: { border: 'accent-border-cyan', bg: 'bg-tv-cyan-muted' },
}

// ---- Brokerage Calculator (Indian Market) ----

export function calculateBrokerage(
  orderType: 'buy' | 'sell',
  price: number,
  quantity: number,
  transactionType: 'market' | 'limit' | 'stoploss'
): {
  orderValue: number
  brokerage: number
  stt: number
  exchangeCharges: number
  gst: number
  sebiCharges: number
  stampDuty: number
  totalCharges: number
  netAmount: number
} {
  const orderValue = price * quantity

  // Brokerage: ₹20 per order or 0.03% of turnover (whichever is lower)
  const brokeragePercent = Math.min(0.0003, 20 / orderValue) * orderValue
  const brokerage = Math.min(20, brokeragePercent)

  // STT (Securities Transaction Tax) - Equity intraday vs delivery
  const isDelivery = transactionType !== 'market'
  const sttRate = isDelivery
    ? orderType === 'buy' ? 0.001 : 0.00125  // Delivery
    : 0.00025  // Intraday
  const stt = orderValue * sttRate

  // Exchange transaction charges
  const exchangeRate = 0.0000345
  const exchangeCharges = orderValue * exchangeRate

  // SEBI turnover charges
  const sebiCharges = orderValue * 0.000001

  // Stamp duty (varies by state, using Maharashtra rates)
  const stampDutyRate = orderType === 'buy' ? 0.00003 : 0.00002
  const stampDuty = orderValue * stampDutyRate

  // GST (18% on brokerage + exchange charges + SEBI charges)
  const gstBase = brokerage + exchangeCharges + sebiCharges
  const gst = gstBase * 0.18

  const totalCharges = brokerage + stt + exchangeCharges + gst + sebiCharges + stampDuty
  const netAmount = orderType === 'buy'
    ? orderValue + totalCharges
    : orderValue - totalCharges

  return {
    orderValue: Math.round(orderValue * 100) / 100,
    brokerage: Math.round(brokerage * 100) / 100,
    stt: Math.round(stt * 100) / 100,
    exchangeCharges: Math.round(exchangeCharges * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    sebiCharges: Math.round(sebiCharges * 100) / 100,
    stampDuty: Math.round(stampDuty * 100) / 100,
    totalCharges: Math.round(totalCharges * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
  }
}