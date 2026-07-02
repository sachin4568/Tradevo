import { memo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { AllocationDataPoint } from '@/types/chart'
import { TOOLTIP_STYLE, formatCompactCurrency } from '@/lib/chartTheme'

interface AllocationDonutProps {
  data: AllocationDataPoint[]
  height?: number
}

/** Custom tooltip for the donut chart */
function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: AllocationDataPoint }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={TOOLTIP_STYLE.contentStyle}>
      <p style={TOOLTIP_STYLE.labelStyle}>{d.sector}</p>
      <p style={TOOLTIP_STYLE.itemStyle}>
        {d.percent}% &middot; {formatCompactCurrency(d.value)}
      </p>
    </div>
  )
}

/**
 * Sector allocation donut chart.
 * Pure presentation component — receives pre-computed data from usePortfolioAllocation.
 */
export default memo(function AllocationDonut({ data, height = 200 }: AllocationDonutProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[13px] text-tx-muted"
        style={{ height }}
      >
        No holdings to display
      </div>
    )
  }

  return (
    <div role="img" aria-label="Sector allocation chart">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="sector"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.sector} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<DonutTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.map((d) => (
          <div key={d.sector} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-[11.5px] text-tx-secondary">
              {d.sector}{' '}
              <span className="text-tx-muted">{d.percent}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
})