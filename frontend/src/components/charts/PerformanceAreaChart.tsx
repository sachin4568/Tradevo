import { memo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { PerformanceDataPoint } from '@/types/chart'
import { TOOLTIP_STYLE, AXIS_TICK_STYLE, formatCompactCurrency } from '@/lib/chartTheme'

interface PerformanceAreaChartProps {
  data: PerformanceDataPoint[]
  height?: number
}

function PerformanceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div style={TOOLTIP_STYLE.contentStyle}>
      <p style={TOOLTIP_STYLE.labelStyle}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ ...TOOLTIP_STYLE.itemStyle, color: p.color }}>
          {p.dataKey === 'invested' ? 'Invested' : 'Portfolio Value'}:{' '}
          {formatCompactCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

function CustomLegend({
  payload,
}: {
  payload?: Array<{ value: string; color: string }>
}) {
  if (!payload) return null
  return (
    <div className="flex justify-center gap-5 pt-2">
      {payload.map((item) => (
        <div key={item.value} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[11.5px] text-tx-secondary">
            {item.value === 'invested' ? 'Invested' : 'Portfolio Value'}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Invested vs. Portfolio Value area chart.
 * Pure presentation component — receives pre-computed data from usePortfolioPerformance.
 */
export default memo(function PerformanceAreaChart({
  data,
  height = 220,
}: PerformanceAreaChartProps) {
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-[13px] text-tx-muted"
        style={{ height }}
      >
        Make at least one trade to see your performance chart
      </div>
    )
  }

  return (
    <div role="img" aria-label="Portfolio performance chart">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradInvested" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={AXIS_TICK_STYLE}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={AXIS_TICK_STYLE}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatCompactCurrency(v)}
            width={60}
          />
          <Tooltip content={<PerformanceTooltip />} />
          <Legend content={<CustomLegend />} />
          <Area
            type="monotone"
            dataKey="invested"
            stroke="#fbbf24"
            strokeWidth={1.5}
            fill="url(#gradInvested)"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="current"
            stroke="#22d3ee"
            strokeWidth={2}
            fill="url(#gradCurrent)"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
})