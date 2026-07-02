import { memo } from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  /** Stroke color — defaults to accent cyan */
  color?: string
  /** Show a positive (green) or negative (red) trend indicator */
  trend?: 'up' | 'down' | 'neutral'
}

/**
 * Minimal sparkline for inline trend visualization.
 * Pure presentation component — receives a flat array of numbers.
 */
export default memo(function Sparkline({
  data,
  width = 80,
  height = 28,
  color,
  trend,
}: SparklineProps) {
  if (data.length < 2) return null

  const points = data.map((value, index) => ({ index, value }))

  const strokeColor =
    color ??
    (trend === 'up'
      ? '#34d399'
      : trend === 'down'
        ? '#f87171'
        : '#22d3ee')

  return (
    <span role="img" aria-label={`Sparkline showing ${trend ?? 'neutral'} trend`}>
      <ResponsiveContainer width={width} height={height}>
        <LineChart data={points}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </span>
  )
})