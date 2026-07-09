/** Data point for sector allocation donut chart */
export interface AllocationDataPoint {
  sector: string
  value: number
  percent: number
  color: string
}

/** Data point for performance area chart (invested vs current value over time) */
export interface PerformanceDataPoint {
  label: string
  invested: number
  current: number
}

/** OHLC candlestick data point */
export interface OHLCVDataPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/** Data point for the learning reflection timeline */
export interface ReflectionDataPoint {
  transactionId: string
  companyId: string
  symbol: string
  action: 'buy' | 'sell'
  quantity: number
  price: number
  total: number
  timestamp: string
  /** Current price for P&L calculation */
  currentPrice: number
  /** Unrealized P&L if still holding, realized P&L if sold */
  outcome: number
  /** Percentage return */
  outcomePercent: number
}

/** Descriptive label for a trade outcome (educational, not evaluative) */
export type OutcomeDescription =
  | 'Strong upward movement'
  | 'Moderate upward movement'
  | 'Slight upward movement'
  | 'Largely unchanged'
  | 'Slight downward movement'
  | 'Moderate downward movement'
  | 'Significant downward movement'

/** Timeline filter options for charts */
export type TimelineFilter = '1D' | '1W' | '1M' | '6M' | '1Y' | '5Y' | 'MAX'

/** Chart display mode */
export type ChartMode = 'line' | 'candlestick'

/** Data point for a simple line chart (e.g. portfolio value over time) */
export interface LineDataPoint {
  date: string
  value: number
}