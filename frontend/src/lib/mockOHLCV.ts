import type { OHLCVDataPoint, TimelineFilter, LineDataPoint, ChartMode } from '@/types/chart'

/**
 * Generates massive OHLCV mock data for zoom/pan behavior.
 * Produces deterministic data per companyId + timeline using seeded PRNG.
 */

type TimelineConfig = {
  count: number
  intervalMs: number
  startOffsetMs: number
  labelFn: (d: Date) => string
}

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function isWeekend(d: Date): boolean {
  const day = d.getDay()
  return day === 0 || day === 6
}

function toISTLabel(d: Date, fmt: 'time' | 'short' | 'day' | 'month'): string {
  if (fmt === 'time') return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  if (fmt === 'short') return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  if (fmt === 'day') return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

const TIMELINES: Record<TimelineFilter, TimelineConfig> = {
  '1D': {
    count: 375,
    intervalMs: 60_000, // 1-min candles
    startOffsetMs: 0,
    labelFn: (d) => toISTLabel(d, 'time'),
  },
  '1W': {
    count: 150,
    intervalMs: 15 * 60_000, // 15-min candles
    startOffsetMs: 7 * 86400000,
    labelFn: (d) => toISTLabel(d, 'time'),
  },
  '1M': {
    count: 30,
    intervalMs: 86400000,
    startOffsetMs: 35 * 86400000,
    labelFn: (d) => toISTLabel(d, 'short'),
  },
  '6M': {
    count: 130,
    intervalMs: 86400000,
    startOffsetMs: 190 * 86400000,
    labelFn: (d) => toISTLabel(d, 'short'),
  },
  '1Y': {
    count: 52,
    intervalMs: 7 * 86400000,
    startOffsetMs: 380 * 86400000,
    labelFn: (d) => toISTLabel(d, 'short'),
  },
  '5Y': {
    count: 60,
    intervalMs: 30 * 86400000,
    startOffsetMs: 1825 * 86400000,
    labelFn: (d) => toISTLabel(d, 'month'),
  },
  'MAX': {
    count: 24,
    intervalMs: 30 * 86400000,
    startOffsetMs: 730 * 86400000,
    labelFn: (d) => toISTLabel(d, 'month'),
  },
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function generateMockOHLCV(
  companyId: string,
  basePrice: number,
  timeline: TimelineFilter = '1M',
): OHLCVDataPoint[] {
  const seed = hashString(companyId + timeline)
  const rand = seededRandom(seed)
  const config = TIMELINES[timeline]
  const data: OHLCVDataPoint[] = []
  let price = basePrice * (0.85 + rand() * 0.3) // Start somewhere near base

  const startDate = new Date(Date.now() - config.startOffsetMs)
  if (timeline === '1D') {
    startDate.setHours(9, 15, 0, 0)
  }

  let cursor = new Date(startDate.getTime())
  let generated = 0

  while (generated < config.count && cursor < new Date()) {
    if (config.intervalMs >= 86400000 && isWeekend(cursor)) {
      cursor = new Date(cursor.getTime() + config.intervalMs)
      continue
    }

    const volatility = 0.008 + rand() * 0.018
    const drift = (basePrice - price) / basePrice * 0.03
    const noise = (rand() - 0.48 + drift) * volatility * price

    const open = price
    const close = Math.max(open * 0.92, open + noise)
    const wickUp = rand() * 0.01 * price
    const wickDn = rand() * 0.01 * price
    const high = Math.max(open, close) + wickUp
    const low = Math.max(open * 0.91, Math.min(open, close) - wickDn)
    const baseVol = 300000 + rand() * 2000000
    const volSpike = 1 + Math.abs(noise / price) * 15
    const volume = Math.floor(baseVol * volSpike)

    data.push({
      date: config.labelFn(cursor),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    })

    price = close
    cursor = new Date(cursor.getTime() + config.intervalMs)
    generated++
  }

  return data
}

/**
 * Generate portfolio value line data (for Portfolio page line chart).
 */
export function generatePortfolioLineData(
  baseValue: number,
  timeline: TimelineFilter = '1M',
): LineDataPoint[] {
  const seed = hashString('portfolio-line-' + timeline)
  const rand = seededRandom(seed)
  const config = TIMELINES[timeline]
  const data: LineDataPoint[] = []
  let value = baseValue * (0.92 + rand() * 0.16)

  const startDate = new Date(Date.now() - config.startOffsetMs)
  let cursor = new Date(startDate.getTime())
  let generated = 0

  while (generated < config.count && cursor < new Date()) {
    if (config.intervalMs >= 86400000 && isWeekend(cursor)) {
      cursor = new Date(cursor.getTime() + config.intervalMs)
      continue
    }

    const drift = (baseValue - value) / baseValue * 0.04
    const change = (rand() - 0.47 + drift) * 0.012 * value
    value = Math.max(value * 0.85, value + change)

    data.push({
      date: config.labelFn(cursor),
      value: Math.round(value * 100) / 100,
    })

    cursor = new Date(cursor.getTime() + config.intervalMs)
    generated++
  }

  return data
}