import { memo, useState, useMemo, useRef, useCallback, useEffect } from 'react'
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { AnimatePresence, motion } from 'framer-motion'
import type { OHLCVDataPoint, TimelineFilter, ChartMode, LineDataPoint } from '@/types/chart'

/* ─── Constants ─── */

const BULL = '#34d399'
const BEAR = '#f87171'
const TIMELINES: { label: string; value: TimelineFilter }[] = [
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '6M', value: '6M' },
  { label: '1Y', value: '1Y' },
  { label: '5Y', value: '5Y' },
  { label: 'MAX', value: 'MAX' },
]

const ZOOM_LEVELS = [20, 40, 60, 100, 160, 9999]

/* ─── Props ─── */

export interface ProfessionalChartProps {
  ohlcvData: OHLCVDataPoint[]
  height?: number
  defaultMode?: ChartMode
  defaultTimeline?: TimelineFilter
  showChartTypeToggle?: boolean
  showTimeline?: boolean
  className?: string
  lineData?: LineDataPoint[]
  isPortfolio?: boolean
  onTimelineChange?: (t: TimelineFilter) => void
}

/* ─── Tooltip Styles (read from CSS vars) ─── */

function tooltipBg(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--color-surface-2').trim() || '#1a2235'
}
function tooltipBorder(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim() || '#1e293b'
}
function tooltipText(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--color-tx-primary').trim() || '#f1f5f9'
}
function tooltipMuted(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--color-tx-muted').trim() || '#64748b'
}

const baseTooltipStyle = () => ({
  backgroundColor: tooltipBg(),
  border: `1px solid ${tooltipBorder()}`,
  borderRadius: '8px',
  fontSize: '12px',
  color: tooltipText(),
  padding: '10px 14px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
})

/* ─── Crosshair ─── */

function CrosshairOverlay({
  chartWidth,
  chartHeight,
  mouseY,
  mouseX,
  visible,
}: {
  chartWidth: number
  chartHeight: number
  mouseY: number
  mouseX: number
  visible: boolean
}) {
  if (!visible || mouseY < 0) return null
  return (
    <svg
      className="pointer-events-none absolute inset-0"
      style={{ width: chartWidth, height: chartHeight }}
    >
      <line
        x1={0} y1={mouseY} x2={chartWidth} y2={mouseY}
        stroke={tooltipMuted()}
        strokeWidth={0.5}
        strokeDasharray="3 3"
        opacity={0.5}
      />
      <line
        x1={mouseX} y1={0} x2={mouseX} y2={chartHeight}
        stroke={tooltipMuted()}
        strokeWidth={0.5}
        strokeDasharray="3 3"
        opacity={0.5}
      />
    </svg>
  )
}

/* ─── OHLC Tooltip ─── */

function OHLCTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as OHLCVDataPoint | undefined
  if (!d) return null
  const bull = d.close >= d.open
  const chg = d.close - d.open
  const pct = d.open ? (chg / d.open) * 100 : 0
  return (
    <div style={baseTooltipStyle()}>
      <p style={{ color: tooltipMuted(), fontSize: '11px', marginBottom: '6px' }}>{d.date}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '3px 16px' }}>
        <span style={{ color: tooltipMuted() }}>Open</span><span>₹{d.open.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        <span style={{ color: tooltipMuted() }}>High</span><span>₹{d.high.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        <span style={{ color: tooltipMuted() }}>Low</span><span>₹{d.low.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        <span style={{ color: tooltipMuted() }}>Close</span><span style={{ color: bull ? BULL : BEAR, fontWeight: 600 }}>₹{d.close.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        <span style={{ color: tooltipMuted() }}>Volume</span><span>{(d.volume / 100000).toFixed(1)}L</span>
        <span style={{ color: tooltipMuted() }}>Change</span><span style={{ color: bull ? BULL : BEAR }}>{chg >= 0 ? '+' : ''}{chg.toFixed(2)} ({pct >= 0 ? '+' : ''}{pct.toFixed(2)}%)</span>
      </div>
    </div>
  )
}

/* ─── Line Tooltip ─── */

function LineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const v = payload[0]?.value
  if (v == null) return null
  return (
    <div style={baseTooltipStyle()}>
      <p style={{ color: tooltipMuted(), fontSize: '11px', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontWeight: 600 }}>₹{v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
    </div>
  )
}

/* ─── Main Component ─── */

export default memo(function ProfessionalChart({
  ohlcvData,
  height = 400,
  defaultMode = 'line',
  defaultTimeline = '1M',
  showChartTypeToggle = true,
  showTimeline = true,
  className = '',
  lineData,
  isPortfolio = false,
  onTimelineChange,
}: ProfessionalChartProps) {
  const [mode, setMode] = useState<ChartMode>(isPortfolio ? 'line' : defaultMode)
  const [timeline, setTimeline] = useState<TimelineFilter>(defaultTimeline)
  const [zoomIdx, setZoomIdx] = useState(4) // start showing most data
  const [panOffset, setPanOffset] = useState(0)
  const [mousePos, setMousePos] = useState({ x: -1, y: -1, inside: false })
  const [chartSize, setChartSize] = useState({ w: 0, h: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ dragging: false, startX: 0, startOffset: 0 })
  const rafRef = useRef(0)

  // Derive line data from OHLCV if no explicit lineData provided
  const derivedLineData = useMemo(() => {
    if (lineData) return lineData
    // When in line mode with only ohlcvData, convert close prices to line format
    return ohlcvData.map(d => ({ date: d.date, value: d.close })) as LineDataPoint[]
  }, [ohlcvData, lineData])

  // Effective line source — always has data if ohlcvData has data
  const effectiveLineSource = mode === 'line' ? derivedLineData : null

  // Zoom window
  const maxVisible = ZOOM_LEVELS[zoomIdx]
  const totalLen = mode === 'line'
    ? effectiveLineSource!.length   // <-- FIX: use derived data, not missing lineData
    : ohlcvData.length
  const effectiveMax = Math.min(maxVisible, totalLen)

  const visibleData = useMemo(() => {
    if (mode === 'line' && effectiveLineSource) {
      const start = Math.max(0, Math.min(panOffset, effectiveLineSource.length - effectiveMax))
      return effectiveLineSource.slice(start, start + effectiveMax)
    }
    const start = Math.max(0, Math.min(panOffset, ohlcvData.length - effectiveMax))
    return ohlcvData.slice(start, start + effectiveMax)
  }, [mode, effectiveLineSource, ohlcvData, panOffset, effectiveMax])

  // Y domain
  const { yDomain, volumeMax } = useMemo(() => {
    if (mode === 'line' && visibleData.length > 0) {
      const vals = visibleData.map(d => (d as LineDataPoint).value)
      const mn = Math.min(...vals)
      const mx = Math.max(...vals)
      const pad = (mx - mn) * 0.08 || mx * 0.02
      return { yDomain: [Math.floor((mn - pad) * 100) / 100, Math.ceil((mx + pad) * 100) / 100] as [number, number], volumeMax: 1 }
    }
    const ohlcv = visibleData as OHLCVDataPoint[]
    if (ohlcv.length === 0) return { yDomain: [0, 1] as [number, number], volumeMax: 1 }
    const lo = Math.min(...ohlcv.map(d => d.low))
    const hi = Math.max(...ohlcv.map(d => d.high))
    const pad = (hi - lo) * 0.06 || hi * 0.01
    const vm = Math.max(...ohlcv.map(d => d.volume))
    return {
      yDomain: [Math.floor((lo - pad) * 100) / 100, Math.ceil((hi + pad) * 100) / 100] as [number, number],
      volumeMax: vm,
    }
  }, [visibleData, mode])

  const yRange = yDomain[1] - yDomain[0]

  // Current price
  const lastItem = visibleData[visibleData.length - 1]
  const firstItem = visibleData[0]
  const currentPrice = mode === 'line'
    ? (lastItem as LineDataPoint)?.value ?? 0
    : (lastItem as OHLCVDataPoint)?.close ?? 0
  const firstPrice = mode === 'line'
    ? (firstItem as LineDataPoint)?.value ?? 0
    : (firstItem as OHLCVDataPoint)?.open ?? 0
  const pricePositive = currentPrice >= firstPrice
  const changePercent = firstPrice ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0

  // X-axis tick interval
  const tickInterval = visibleData.length > 100 ? Math.floor(visibleData.length / 6)
    : visibleData.length > 40 ? Math.floor(visibleData.length / 5)
    : visibleData.length > 15 ? Math.floor(visibleData.length / 5)
    : 0

  // Handlers
  const handleTimeline = useCallback((t: TimelineFilter) => {
    setTimeline(t)
    setPanOffset(0)
    setZoomIdx(4)
    onTimelineChange?.(t)
  }, [onTimelineChange])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setZoomIdx(prev => {
      const dir = e.deltaY > 0 ? -1 : 1
      const next = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, prev + dir))
      if (next !== prev) setPanOffset(0)
      return next
    })
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { dragging: true, startX: e.clientX, startOffset: panOffset }
  }, [panOffset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      inside: true,
    })

    if (dragRef.current.dragging) {
      const dx = e.clientX - dragRef.current.startX
      const candleWidth = chartSize.w / effectiveMax
      const pan = Math.round(-dx / candleWidth)
      const maxPan = Math.max(0, totalLen - effectiveMax)
      setPanOffset(Math.max(0, Math.min(maxPan, dragRef.current.startOffset + pan)))
    }
  }, [effectiveMax, totalLen, chartSize.w])

  const handleMouseUp = useCallback(() => {
    dragRef.current.dragging = false
  }, [])

  const handleMouseLeave = useCallback(() => {
    dragRef.current.dragging = false
    setMousePos({ x: -1, y: -1, inside: false })
  }, [])

  // Resize observer
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => {
          setChartSize({ w: entry.contentRect.width, h: entry.contentRect.height })
        })
      }
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // ─── FIX: Show proper empty state only when there's truly no data ───
  if (ohlcvData.length === 0) {
    return (
      <div className={`flex items-center justify-center text-[13px] text-tx-muted ${className}`} style={{ height }}>
        No chart data available.
      </div>
    )
  }

  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#22d3ee'

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Header: Price + Change + Chart Type Toggle */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[18px] font-bold text-tx-primary">
            ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className={`flex items-center gap-1 text-[13px] font-semibold ${pricePositive ? 'text-tx-success' : 'text-tx-danger'}`}>
            {pricePositive ? '+' : ''}{changePercent.toFixed(2)}%
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Chart Type Toggle */}
          {showChartTypeToggle && !isPortfolio && (
            <div className="relative">
              <select
                value={mode}
                onChange={e => setMode(e.target.value as ChartMode)}
                className="appearance-none rounded-md border border-border-subtle bg-surface-2 pl-3 pr-7 py-1.5 text-[12px] font-medium text-tx-secondary outline-none transition-colors hover:bg-surface-3 focus:border-accent/40"
              >
                <option value="line">Line</option>
                <option value="candlestick">Candlestick</option>
              </select>
              <svg className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-tx-muted" viewBox="0 0 12 12" fill="none"><path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          )}

          {/* Timeline */}
          {showTimeline && (
            <div className="flex gap-0.5">
              {TIMELINES.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleTimeline(opt.value)}
                  className={`rounded px-2.5 py-1.5 text-[11.5px] font-medium transition-all ${
                    timeline === opt.value
                      ? 'bg-accent-subtle text-accent'
                      : 'text-tx-muted hover:bg-surface-2 hover:text-tx-secondary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart Area */}
      <div
        ref={containerRef}
        className="relative cursor-crosshair select-none overflow-hidden rounded-lg"
        style={{ height: height - 40 }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              {mode === 'line' ? (
                <ComposedChart data={visibleData} margin={{ top: 8, right: 60, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="lineGradientFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accentColor} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={accentColor} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: tooltipMuted() }}
                    axisLine={false}
                    tickLine={false}
                    interval={tickInterval}
                  />
                  <YAxis
                    yAxisId="price"
                    domain={yDomain}
                    orientation="right"
                    tick={{ fontSize: 10, fill: tooltipMuted() }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    width={58}
                  />
                  <Tooltip content={<LineTooltip />} cursor={{ stroke: tooltipMuted(), strokeDasharray: '3 3', opacity: 0.4 }} />
                  <ReferenceLine yAxisId="price" y={currentPrice} stroke={pricePositive ? BULL : BEAR} strokeDasharray="4 3" strokeWidth={0.8} />
                  <Area
                    yAxisId="price"
                    type="monotone"
                    dataKey="value"
                    stroke={accentColor}
                    strokeWidth={2}
                    fill="url(#lineGradientFill)"
                    dot={false}
                    activeDot={{ r: 3, fill: accentColor, strokeWidth: 0 }}
                    isAnimationActive={true}
                    animationDuration={500}
                  />
                </ComposedChart>
              ) : (
                <ComposedChart data={visibleData} margin={{ top: 8, right: 60, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: tooltipMuted() }}
                    axisLine={false}
                    tickLine={false}
                    interval={tickInterval}
                  />
                  <YAxis
                    yAxisId="price"
                    domain={yDomain}
                    orientation="right"
                    tick={{ fontSize: 10, fill: tooltipMuted() }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    width={58}
                  />
                  <YAxis yAxisId="vol" orientation="right" domain={[0, volumeMax * 4]} tick={false} axisLine={false} tickLine={false} width={0} />
                  <Tooltip
                    yAxisId="price"
                    content={<OHLCTooltip />}
                    cursor={{ stroke: tooltipMuted(), strokeDasharray: '3 3', opacity: 0.3 }}
                  />
                  <ReferenceLine yAxisId="price" y={currentPrice} stroke={pricePositive ? BULL : BEAR} strokeDasharray="4 3" strokeWidth={0.8} />

                  {/* Candlestick wicks */}
                  <Bar yAxisId="price" dataKey="high" stackId="wick" fill="transparent" isAnimationActive={false}
                    shape={(props: any) => {
                      const { x, width: bw, payload: p } = props
                      const loY = 300 - ((p.low - yDomain[0]) / yRange) * 300
                      const hiY = 300 - ((p.high - yDomain[0]) / yRange) * 300
                      const cx = x + bw / 2
                      const bull = p.close >= p.open
                      return <line x1={cx} y1={hiY} x2={cx} y2={loY} stroke={bull ? BULL : BEAR} strokeWidth={1} />
                    }}
                  />

                  {/* Candlestick bodies */}
                  <Bar yAxisId="price" dataKey="close" stackId="wick" fill="transparent" isAnimationActive={false}
                    shape={(props: any) => {
                      const { x, width: bw, payload: p } = props
                      const bull = p.close >= p.open
                      const bodyTop = Math.max(p.open, p.close)
                      const bodyBot = Math.min(p.open, p.close)
                      const bodyH = Math.max(((bodyTop - bodyBot) / yRange) * 300, 1)
                      const topY = 300 - ((bodyTop - yDomain[0]) / yRange) * 300
                      const barW = Math.max(Math.min(bw * 0.65, 12), 2)
                      const cx = x + (bw - barW) / 2
                      return <rect x={cx} y={topY} width={barW} height={bodyH} fill={bull ? BULL : BEAR} rx={1.5} />
                    }}
                  />

                  {/* Volume bars */}
                  <Bar yAxisId="vol" dataKey="volume" isAnimationActive={true} animationDuration={400}
                    shape={(props: any) => {
                      const { x, y, width: bw, height: bh, payload: p } = props
                      if (bh <= 0) return null
                      const bull = p.close >= p.open
                      return <rect x={x} y={y} width={Math.max(bw, 1)} height={bh} fill={bull ? BULL : BEAR} opacity={0.18} rx={1} />
                    }}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>

        {/* Current price label on right edge */}
        <div
          className="pointer-events-none absolute right-0 flex items-center gap-1.5 rounded-l-md px-2 py-0.5 text-[11px] font-bold"
          style={{
            top: `${((yDomain[1] - currentPrice) / yRange) * (height - 40)}%`,
            backgroundColor: pricePositive ? BULL : BEAR,
            color: '#fff',
            transform: 'translateY(-50%)',
            marginTop: '8px',
            marginBottom: '8px',
            transition: 'top 0.3s ease',
          }}
        >
          ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>

        {/* Crosshair overlay */}
        <CrosshairOverlay
          chartWidth={chartSize.w}
          chartHeight={height - 40}
          mouseX={mousePos.x}
          mouseY={mousePos.y}
          visible={mousePos.inside && !dragRef.current.dragging}
        />
      </div>
    </div>
  )
})