'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { formatINRDecimal, formatINRCompact } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CandlestickData } from '@/lib/mock-data'

/* ──────────────────────── Types ──────────────────────── */

interface CandlestickChartProps {
  data: CandlestickData[]
  height?: number
  showVolume?: boolean
  /** If provided, overrides internal timeframe state (external control) */
  externalTimeframe?: string
  onTimeframeChange?: (tf: string) => void
}

type Timeframe = 'Today' | '1W' | '1M' | '6M'

const TIMEFRAMES: Timeframe[] = ['Today', '1W', '1M', '6M']

const TF_DAYS: Record<Timeframe, number> = { 'Today': 1, '1W': 5, '1M': 22, '6M': 130 }

/* ──────────────────────── Tooltip ──────────────────────── */

function ChartTooltip({
  data,
  position,
}: {
  data: CandlestickData | null
  position: { x: number; y: number } | null
}) {
  if (!data || !position) return null

  const isBullish = data.close >= data.open
  const dateStr = new Date(data.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div
      className="surface-card-static p-3 text-xs shadow-xl pointer-events-none z-50 min-w-[200px] absolute"
      style={{ left: position.x + 12, top: position.y - 10 }}
    >
      <p className="text-text-tertiary mb-2 font-medium">{dateStr}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-6">
          <span className="text-text-tertiary">Open</span>
          <span className="text-text-primary font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatINRDecimal(data.open)}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-text-tertiary">High</span>
          <span className="text-tv-emerald font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatINRDecimal(data.high)}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-text-tertiary">Low</span>
          <span className="text-tv-coral font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatINRDecimal(data.low)}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-text-tertiary">Close</span>
          <span
            className={cn('font-medium', isBullish ? 'text-tv-emerald' : 'text-tv-coral')}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatINRDecimal(data.close)}
          </span>
        </div>
        <div className="border-t border-border-subtle my-1.5" />
        <div className="flex justify-between gap-6">
          <span className="text-text-tertiary">Volume</span>
          <span className="text-text-primary font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatINRCompact(data.volume)}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────── Main Chart ──────────────────────── */

export function CandlestickChart({
  data,
  height = 400,
  showVolume = true,
  externalTimeframe,
  onTimeframeChange,
}: CandlestickChartProps) {
  const [internalTf, setInternalTf] = useState<Timeframe>('1M')
  const timeframe = (externalTimeframe as Timeframe) ?? internalTf
  const handleTfChange = useCallback((tf: string) => {
    if (onTimeframeChange) {
      onTimeframeChange(tf)
    } else {
      setInternalTf(tf as Timeframe)
    }
  }, [onTimeframeChange])

  const [zoomRange, setZoomRange] = useState<{ start: number; end: number } | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const [svgWidth, setSvgWidth] = useState(800)
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, rangeStart: 0, rangeEnd: 0 })

  // Track actual SVG width with ResizeObserver
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        if (w > 0) setSvgWidth(Math.round(w))
      }
    })
    ro.observe(el)
    // Initial measurement
    const w = el.clientWidth
    if (w > 0) setSvgWidth(Math.round(w))
    return () => ro.disconnect()
  }, [])

  // Slice data for timeframe
  const tfData = useMemo(() => {
    const days = TF_DAYS[timeframe]
    return data.slice(-days)
  }, [data, timeframe])

  // Apply zoom
  const visibleData = useMemo(() => {
    if (!zoomRange) return tfData
    return tfData.slice(zoomRange.start, zoomRange.end + 1)
  }, [tfData, zoomRange])

  // Reset zoom when timeframe changes
  useEffect(() => {
    setZoomRange(null)
  }, [timeframe])

  // Chart dimensions
  const padding = { top: 20, right: 70, bottom: 30, left: 10 }
  const volumeHeight = showVolume ? 60 : 0
  const chartHeight = height - padding.top - padding.bottom - volumeHeight
  const chartWidth = svgWidth - padding.left - padding.right

  // Y-axis domain for price
  const { minPrice, maxPrice } = useMemo(() => {
    if (!visibleData.length) return { minPrice: 0, maxPrice: 100 }
    let min = Infinity, max = -Infinity
    for (const d of visibleData) {
      if (d.low < min) min = d.low
      if (d.high > max) max = d.high
    }
    const margin = (max - min) * 0.05 || 1
    return { minPrice: min - margin, maxPrice: max + margin }
  }, [visibleData])

  // Y-axis domain for volume
  const maxVolume = useMemo(() => {
    if (!visibleData.length) return 1
    return Math.max(...visibleData.map(d => d.volume))
  }, [visibleData])

  // Scale functions
  const priceToY = useCallback(
    (price: number) => {
      return padding.top + chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight
    },
    [padding.top, chartHeight, minPrice, maxPrice]
  )

  const indexToX = useCallback(
    (i: number) => {
      if (visibleData.length <= 1) return padding.left + chartWidth / 2
      return padding.left + (i / (visibleData.length - 1)) * chartWidth
    },
    [visibleData.length, padding.left, chartWidth]
  )

  const xToIndex = useCallback(
    (x: number) => {
      if (visibleData.length <= 1) return 0
      const ratio = (x - padding.left) / chartWidth
      return Math.round(ratio * (visibleData.length - 1))
    },
    [visibleData.length, padding.left, chartWidth]
  )

  // Y-axis labels
  const priceLabels = useMemo(() => {
    const range = maxPrice - minPrice
    if (range === 0) return [minPrice]
    const step = range / 5
    const labels: number[] = []
    for (let i = 0; i <= 5; i++) {
      labels.push(minPrice + step * i)
    }
    return labels
  }, [minPrice, maxPrice])

  // X-axis labels
  const xLabels = useMemo(() => {
    if (visibleData.length <= 6) return visibleData.map((d, i) => ({ label: d.date, index: i }))
    const step = Math.ceil(visibleData.length / 6)
    const result: { label: string; index: number }[] = []
    for (let i = 0; i < visibleData.length; i++) {
      if (i % step === 0 || i === visibleData.length - 1) {
        result.push({ label: visibleData[i].date, index: i })
      }
    }
    return result
  }, [visibleData])

  // Candle width calculation (responsive)
  const candleWidth = useMemo(() => {
    if (visibleData.length <= 1) return 6
    const spacing = chartWidth / visibleData.length
    return Math.max(2, Math.min(14, spacing * 0.65))
  }, [visibleData.length, chartWidth])

  // Mouse handlers for zoom/pan
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 1 : -1
      setZoomRange((prev) => {
        const len = tfData.length
        if (!prev) {
          const zoomAmount = Math.max(2, Math.floor(len * 0.1))
          const newEnd = len - 1 - Math.max(0, delta > 0 ? 0 : zoomAmount)
          const newStart = Math.max(0, delta > 0 ? zoomAmount : 0)
          if (newStart >= newEnd) return null
          return { start: newStart, end: newEnd }
        }
        const range = prev.end - prev.start
        const change = Math.max(1, Math.floor(range * 0.1))
        let newStart = prev.start + (delta > 0 ? change : -change)
        let newEnd = prev.end - (delta > 0 ? change : -change)
        if (newEnd - newStart < 5) return prev
        newStart = Math.max(0, newStart)
        newEnd = Math.min(len - 1, newEnd)
        if (newEnd - newStart < 5) return prev
        return { start: newStart, end: newEnd }
      })
    },
    [tfData.length]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true
      dragStart.current = {
        x: e.clientX,
        rangeStart: zoomRange?.start ?? 0,
        rangeEnd: zoomRange?.end ?? (tfData.length - 1),
      }
    },
    [zoomRange, tfData.length]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const svgRect = svgRef.current?.getBoundingClientRect()
      if (!svgRect) return

      const x = e.clientX - svgRect.left
      const idx = xToIndex(x)
      if (idx >= 0 && idx < visibleData.length) {
        setHoveredIndex(idx)
        setTooltipPos({ x: e.clientX - svgRect.left, y: e.clientY - svgRect.top })
      } else {
        setHoveredIndex(null)
        setTooltipPos(null)
      }

      if (isDragging.current && zoomRange) {
        const dx = e.clientX - dragStart.current.x
        const ratio = -dx / chartWidth
        const range = dragStart.current.rangeEnd - dragStart.current.rangeStart
        const shift = Math.round(ratio * range)
        let newStart = dragStart.current.rangeStart + shift
        let newEnd = dragStart.current.rangeEnd + shift
        if (newStart < 0) { newEnd -= newStart; newStart = 0 }
        if (newEnd >= tfData.length) { newStart -= (newEnd - tfData.length + 1); newEnd = tfData.length - 1 }
        if (newStart < 0) newStart = 0
        setZoomRange({ start: newStart, end: newEnd })
      }
    },
    [visibleData.length, xToIndex, zoomRange, tfData.length, chartWidth]
  )

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const hoveredData = hoveredIndex !== null ? visibleData[hoveredIndex] : null
  const isBullish = hoveredData ? hoveredData.close >= hoveredData.open : true
  const rightEdge = svgWidth - padding.right

  return (
    <div className="w-full" ref={containerRef}>
      {/* Timeframe Filter */}
      <div className="flex items-center gap-1 mb-3">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => handleTfChange(tf)}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-medium transition-all duration-200',
              timeframe === tf
                ? 'bg-tv-cyan text-white'
                : 'bg-surface-2 text-text-tertiary hover:text-text-secondary'
            )}
          >
            {tf}
          </button>
        ))}
        {zoomRange && (
          <button
            onClick={() => setZoomRange(null)}
            className="ml-2 px-2 py-1 rounded-md text-[10px] font-medium text-tv-amber bg-tv-amber-muted hover:bg-tv-amber/20 transition-colors"
          >
            Reset Zoom
          </button>
        )}
        <span className="ml-auto text-[10px] text-text-tertiary">
          {visibleData.length} trading days
        </span>
      </div>

      {/* Chart */}
      <div
        className="relative rounded-lg overflow-hidden border border-border-subtle bg-card"
        style={{ height }}
        onWheel={handleWheel}
      >
        <svg
          ref={svgRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { setHoveredIndex(null); setTooltipPos(null); isDragging.current = false }}
          width={svgWidth}
          height={height}
        >
          <g>
            {/* Grid lines */}
            {priceLabels.map((price, i) => {
              const y = priceToY(price)
              return (
                <g key={`grid-${i}`}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={rightEdge}
                    y2={y}
                    stroke="var(--border-subtle)"
                    strokeWidth={0.5}
                    strokeDasharray="4 4"
                  />
                  <text
                    x={rightEdge + 8}
                    y={y + 4}
                    fill="var(--text-tertiary)"
                    fontSize={10}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatINRDecimal(price)}
                  </text>
                </g>
              )
            })}

            {/* X-axis labels */}
            {xLabels.map(({ label, index }, i) => {
              const x = indexToX(index)
              const dateStr = new Date(label).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
              return (
                <text
                  key={`xlabel-${i}`}
                  x={x}
                  y={height - 8}
                  fill="var(--text-tertiary)"
                  fontSize={10}
                  textAnchor="middle"
                >
                  {dateStr}
                </text>
              )
            })}

            {/* Volume bars */}
            {showVolume &&
              visibleData.map((d, i) => {
                const x = indexToX(i)
                const volTop = height - padding.bottom - volumeHeight
                const volBarHeight = maxVolume > 0 ? (d.volume / maxVolume) * volumeHeight : 0
                const isBull = d.close >= d.open
                return (
                  <rect
                    key={`vol-${i}`}
                    x={x - candleWidth / 2}
                    y={volTop + volumeHeight - volBarHeight}
                    width={candleWidth}
                    height={volBarHeight}
                    fill={isBull ? 'var(--tv-emerald)' : 'var(--tv-coral)'}
                    opacity={0.25}
                    rx={1}
                  />
                )
              })}

            {/* Candlesticks */}
            {visibleData.map((d, i) => {
              const x = indexToX(i)
              const isBull = d.close >= d.open
              const color = isBull ? 'var(--tv-emerald)' : 'var(--tv-coral)'
              const bodyTop = priceToY(Math.max(d.open, d.close))
              const bodyBottom = priceToY(Math.min(d.open, d.close))
              const bodyHeight = Math.max(1, bodyBottom - bodyTop)
              const isHovered = i === hoveredIndex

              return (
                <g
                  key={`candle-${i}`}
                  onMouseEnter={() => { setHoveredIndex(i) }}
                  opacity={hoveredIndex !== null && !isHovered ? 0.4 : 1}
                >
                  {/* Wick (high-low line) */}
                  <line
                    x1={x}
                    y1={priceToY(d.high)}
                    x2={x}
                    y2={priceToY(d.low)}
                    stroke={color}
                    strokeWidth={1}
                  />
                  {/* Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={color}
                    stroke={color}
                    strokeWidth={0.5}
                    rx={1}
                  />
                </g>
              )
            })}

            {/* Crosshair */}
            {hoveredIndex !== null && hoveredData && (
              <>
                <line
                  x1={indexToX(hoveredIndex)}
                  y1={padding.top}
                  x2={indexToX(hoveredIndex)}
                  y2={height - padding.bottom}
                  stroke="var(--tv-cyan)"
                  strokeWidth={0.5}
                  strokeDasharray="4 4"
                  opacity={0.5}
                />
                <line
                  x1={padding.left}
                  y1={priceToY(hoveredData.close)}
                  x2={rightEdge}
                  y2={priceToY(hoveredData.close)}
                  stroke="var(--tv-cyan)"
                  strokeWidth={0.5}
                  strokeDasharray="4 4"
                  opacity={0.5}
                />
                {/* Price label on right */}
                <rect
                  x={rightEdge}
                  y={priceToY(hoveredData.close) - 10}
                  width={padding.right}
                  height={20}
                  fill={isBullish ? 'var(--tv-emerald)' : 'var(--tv-coral)'}
                  rx={3}
                />
                <text
                  x={rightEdge + padding.right / 2}
                  y={priceToY(hoveredData.close) + 4}
                  fill="white"
                  fontSize={10}
                  textAnchor="middle"
                  fontWeight={600}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatINRDecimal(hoveredData.close)}
                </text>
              </>
            )}
          </g>
        </svg>

        {/* Tooltip */}
        <ChartTooltip data={hoveredData} position={tooltipPos} />
      </div>

      {/* Scroll hint */}
      <p className="text-[10px] text-text-tertiary mt-1.5 text-center">
        Scroll to zoom · Drag to pan
      </p>
    </div>
  )
}