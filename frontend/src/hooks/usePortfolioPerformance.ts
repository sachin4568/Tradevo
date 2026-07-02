import { useMemo } from 'react'
import { usePortfolioStore } from '@/stores/portfolioStore'
import { useCompanies } from './useCompanies'
import type { PerformanceDataPoint } from '@/types/chart'

/**
 * Builds a time-series from the transaction history showing
 * cumulative invested amount vs. total portfolio value (cash + holdings)
 * at each transaction point.
 *
 * NOTE: "current" value uses today's prices as a proxy for historical prices.
 * This is acceptable for the static-data educational phase — the chart shows
 * the *relationship* between invested and value, not exact historical accuracy.
 */
const INITIAL_CASH = 1_000_000

export function usePortfolioPerformance(): PerformanceDataPoint[] {
  const transactions = usePortfolioStore((s) => s.transactions)
  const { data: companies } = useCompanies()

  return useMemo<PerformanceDataPoint[]>(() => {
    if (!companies || transactions.length === 0) return []

    const companyMap = new Map(companies.map((c) => [c.id, c.currentPrice]))

    // Sort chronologically
    const sortedTx = [...transactions].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )

    const points: PerformanceDataPoint[] = [
      { label: 'Start', invested: 0, current: INITIAL_CASH },
    ]

    // Running state
    let cash = INITIAL_CASH
    const qtyMap = new Map<string, number>() // companyId → total shares held

    for (const tx of sortedTx) {
      if (tx.action === 'buy') {
        cash -= tx.total
        qtyMap.set(tx.companyId, (qtyMap.get(tx.companyId) ?? 0) + tx.quantity)
      } else {
        cash += tx.total
        qtyMap.set(tx.companyId, (qtyMap.get(tx.companyId) ?? 0) - tx.quantity)
      }

      // Compute total holdings value at current prices
      let holdingsValue = 0
      for (const [cid, qty] of qtyMap) {
        const price = companyMap.get(cid) ?? 0
        holdingsValue += qty * price
      }

      const date = new Date(tx.timestamp)
      const label = date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      })

      points.push({
        label,
        invested: INITIAL_CASH - cash,
        current: cash + holdingsValue,
      })
    }

    return points
  }, [transactions, companies])
}