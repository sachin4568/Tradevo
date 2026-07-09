import { memo, useState, useMemo, useCallback } from 'react'
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { OHLCVDataPoint, TimelineFilter } from '@/types/chart'
import { TOOLTIP_STYLE, AXIS_TICK_STYLE, formatCompactCurrency } from '@/lib/chartTheme'

interface CandlestickVolumeChartProps {
  data: OHLCVDataPoint[]
  height?: number
  /** Show timeline filter buttons */
  showTimeline?: boolean
  /** External timeline control (parent manages state) */
  timeline?: TimelineFilter
  onTimelineChange?: (timeline: TimelineFilter) => void
  /** Callback to request data refresh */
  onTimelineFilter?: (timeline: TimelineFilter) => void
}

const TIMELINE_OPTIONS: { label: string; value: TimelineFilter }[] = [
  { label: 'Today', value: '1D' },
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '6M', value: '6M' },
]

/** Custom candlestick renderer using recharts Bars */
function CandlestickSeries({ data, yDomain }: { data: OHLCVDataPoint[]; yDomain: [number, number] }) {
  const range = yDomain[1] - yDomain[0]
  const pxPerUnit = 300 / range // approximate pixels per price unit

  return (
    <>
      {/* Wick (high-low line) */}
      <Bar
        dataKey="high"
        stackId="candle"
        fill="transparent"
        isAnimationActive={false}
        shape={(props: any) => {
          const { x, payload, width } = props
          const lowY = 300 - ((payload.low - yDomain[0]) / range) * 300
          const highY = 300 - ((payload.high - yDomain[0]) / range) * 300
          const cx = x + width / 2
          const isBullish = payload.close >= payload.open
          return (
            <line
              x1={cx}
              y1={highY}
              x2={cx}
              y2={lowY}
              stroke={isBullish ? '#34d399' : '#f87171'}
              strokeWidth={1}
            />
          )
        }}
      />
      {/* Body (open-close rectangle) */}
      <Bar
        dataKey="close"
        stackId="candle"
        fill="transparent"
        isAnimationActive={false}
        shape={(props: any) => {
          const { x, payload, width } = props
          const isBullish = payload.close >= payload.open
          const bodyTop = Math.max(payload.open, payload.close)
          const bodyBottom = Math.min(payload.open, payload.close)
          const bodyHeight = Math.max(((bodyTop - bodyBottom) / range) * 300, 1)
          const topY = 300 - ((bodyTop - yDomain[0]) / range) * 300
          const barWidth = Math.max(Math.min(width * 0.6, 10), 3)
          const cx = x + (width - barWidth) / 2
          return (
            <rect
              x={cx}
              y={topY}
              width={barWidth}
              height={bodyHeight}
              fill={isBullish ? '#34d399' : '#f87171'}
              rx={1}
            />
          )
        }}
      />
    </>
  )
}

/** Professional OHLC tooltip */
function CandlestickTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ payload: OHLCVDataPoint }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const isBullish = d.close >= d.open
  const changeVal = d.close - d.open
  const changePct = d.open !== 0 ? (changeVal / d.open) * 100 : 0

  return (
    <div style={TOOLTIP_STYLE.contentStyle}>
      <p style={TOOLTIP_STYLE.labelStyle}>{label}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '2px 12px', ...TOOLTIP_STYLE.itemStyle }}>
        <span style={{ color: '#64748b' }}>Open</span>
        <span>₹{d.open.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        <span style={{ color: '#64748b' }}>High</span>
        <span>₹{d.high.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        <span style={{ color: '#64748b' }}>Low</span>
        <span>₹{d.low.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        <span style={{ color: '#64748b' }}>Close</span>
        <span style={{ color: isBullish ? '#34d399' : '#f87171', fontWeight: 600 }}>
          ₹{d.close.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
        <span style={{ color: '#64748b' }}>Vol</span>
        <span>{(d.volume / 100000).toFixed(1)}L</span>
        <span style={{ color: '#64748b' }}>Change</span>
        <span style={{ color: isBullish ? '#34d399' : '#f87171' }}>
          {changeVal >= 0 ? '+' : ''}{changeVal.toFixed(2)} ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
        </span>
      </div>
    </div>
  )
}

/** Volume bar tooltip */
function VolumeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; payload: OHLCVDataPoint }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={TOOLTIP_STYLE.contentStyle}>
      <p style={TOOLTIP_STYLE.labelStyle}>{label}</p>
      <p style={TOOLTIP_STYLE.itemStyle}>
        Volume: {d.volume.toLocaleString('en-IN')}
      </p>
    </div>
  )
}

/**
 * Professional Candlestick + Volume chart component for TradeVo.
 * Uses recharts ComposedChart to render OHLC candlesticks with volume bars.
 * Green (#34d399) = bullish (close >= open), Red (#f87171) = bearish.
 */
export default memo(function CandlestickVolumeChart({
  data,
  height = 380,
  showTimeline = true,
  timeline: externalTimeline,
  onTimelineChange,
  onTimelineFilter,
}: CandlestickVolumeChartProps) {
  const [internalTimeline, setInternalTimeline] = useState<TimelineFilter>('1M')
  const activeTimeline = externalTimeline ?? internalTimeline

  const handleTimelineChange = useCallback((t: TimelineFilter) => {
    if (externalTimeline !== undefined && onTimelineChange) {
      onTimelineChange(t)
    } else {
      setInternalTimeline(t)
    }
    onTimelineFilter?.(t)
  }, [externalTimeline, onTimelineChange, onTimelineFilter])

  const { yDomain, volumeMax } = useMemo(() => {
    if (data.length === 0) return { yDomain: [0, 1], volumeMax: 1 }
    const allHighs = data.map(d => d.high)
    const allLows = data.map(d => d.low)
    const minPrice = Math.min(...allLows)
    const maxPrice = Math.max(...allHighs)
    const padding = (maxPrice - minPrice) * 0.08
    const vMax = Math.max(...data.map(d => d.volume))
    return {
      yDomain: [Math.floor((minPrice - padding) * 100) / 100, Math.ceil((maxPrice + padding) * 100) / 100],
      volumeMax: vMax,
    }
  }, [data])

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-[13px] text-tx-muted" style={{ height }}>
        <div className="mb-2 h-8 w-8 animate-pulse rounded-lg bg-surface-3" />
        Loading chart data...
      </div>
    )
  }

  // Determine how many X-axis labels to show
  const tickInterval = data.length > 60 ? Math.floor(data.length / 8) : data.length > 20 ? Math.floor(data.length / 6) : 0

  return (
    <div className="flex flex-col">
      {showTimeline && (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-1">
            {TIMELINE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleTimelineChange(opt.value)}
                className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  activeTimeline === opt.value
                    ? 'bg-accent-subtle text-accent'
                    : 'text-tx-muted hover:bg-surface-2 hover:text-tx-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Current price indicator */}
          {data.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-tx-muted">Last:</span>
              <span className={`text-[13px] font-semibold ${
                data[data.length - 1].close >= data[data.length - 1].open
                  ? 'text-tx-success' : 'text-tx-danger'
              }`}>
                ₹{data[data.length - 1].close.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      )}

      <div role="img" aria-label="Candlestick chart with volume">
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tick={AXIS_TICK_STYLE}
              axisLine={false}
              tickLine={false}
              interval={tickInterval}
            />

            {/* Price Y-axis (left) */}
            <YAxis
              yAxisId="price"
              domain={yDomain}
              tick={AXIS_TICK_STYLE}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              width={70}
            />

            {/* Volume Y-axis (right, hidden) */}
            <YAxis
              yAxisId="volume"
              orientation="right"
              domain={[0, volumeMax * 4]}
              tick={false}
              axisLine={false}
              tickLine={false}
              width={0}
            />

            {/* Opening price reference line */}
            <ReferenceLine
              yAxisId="price"
              y={data[0]?.open}
              stroke="#64748b"
              strokeDasharray="4 4"
              strokeWidth={0.5}
            />

            <Tooltip
              yAxisId="price"
              content={<CandlestickTooltip />}
              cursor={{ fill: 'rgba(34, 211, 238, 0.04)' }}
            />

            {/* Candlestick body + wick */}
            <CandlestickSeries data={data} yDomain={yDomain} />

            {/* Volume bars at the bottom 20% of chart */}
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="#22d3ee"
              opacity={0.15}
              isAnimationActive={true}
              animationDuration={600}
              shape={(props: any) => {
                const { x, y, width, height: barHeight, payload } = props
                if (barHeight <= 0) return null
                const isBullish = payload.close >= payload.open
                return (
                  <rect
                    x={x}
                    y={y}
                    width={Math.max(width, 1)}
                    height={barHeight}
                    fill={isBullish ? '#34d399' : '#f87171'}
                    opacity={0.2}
                    rx={1}
                  />
                )
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})