import { useMemo } from 'react'
import { usePortfolio } from './usePortfolio'
import type { AllocationDataPoint } from '@/types/chart'
import { getSectorColor } from '@/lib/chartTheme'

/**
 * Aggregates portfolio holdings by sector for the AllocationDonut chart.
 * Returns an array of { sector, value, percent, color } sorted by value descending.
 */
export function usePortfolioAllocation(): AllocationDataPoint[] {
  const { holdingsWithDetails, isEmpty } = usePortfolio()

  return useMemo<AllocationDataPoint[]>(() => {
    if (isEmpty) return []

    const sectorMap = new Map<string, number>()
    for (const h of holdingsWithDetails) {
      const sector = h.company.sector
      sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + h.currentValue)
    }

    const totalValue = holdingsWithDetails.reduce(
      (sum, h) => sum + h.currentValue,
      0,
    )

    if (totalValue === 0) return []

    return Array.from(sectorMap.entries())
      .map(([sector, value]) => ({
        sector,
        value,
        percent: Math.round((value / totalValue) * 1000) / 10,
        color: getSectorColor(sector),
      }))
      .sort((a, b) => b.value - a.value)
  }, [holdingsWithDetails, isEmpty])
}