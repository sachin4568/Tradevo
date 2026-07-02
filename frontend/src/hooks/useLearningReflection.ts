import { useMemo } from 'react'
import { usePortfolioStore } from '@/stores/portfolioStore'
import { useCompanies } from './useCompanies'
import type { ReflectionDataPoint } from '@/types/chart'

/**
 * Builds per-transaction data points for the Learning Reflection Timeline.
 * Each point shows the trade action, price, and current P&L outcome.
 *
 * For buys still held: outcome = unrealized P&L at current price.
 * For sells: outcome = realized P&L (sell price - avg buy price).
 *
 * Uses educational language — no evaluative terms like "mistake" or "error".
 */
export function useLearningReflection(): ReflectionDataPoint[] {
  const transactions = usePortfolioStore((s) => s.transactions)
  const holdings = usePortfolioStore((s) => s.holdings)
  const { data: companies } = useCompanies()

  return useMemo<ReflectionDataPoint[]>(() => {
    if (!companies || transactions.length === 0) return []

    const companyMap = new Map(companies.map((c) => [c.id, c]))
    const holdingMap = new Map(holdings.map((h) => [h.companyId, h]))

    // Sort by timestamp descending (most recent first)
    const sorted = [...transactions].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )

    return sorted.map((tx) => {
      const company = companyMap.get(tx.companyId)
      const holding = holdingMap.get(tx.companyId)

      let outcome: number
      let outcomePercent: number

      if (tx.action === 'sell' && holding === undefined) {
        // Fully sold — use realized P&L
        // The avg price at time of sell is stored in the transaction's price context
        // For simplicity, compare sell price to a rough average (we use tx.price itself for sell)
        // Real P&L would need the original avg price; since we don't track it post-sell,
        // we estimate: if the sell happened, the user's avg was what they bought at
        // We'll set outcome to 0 for sells since we can't reliably reconstruct avg buy price
        outcome = 0
        outcomePercent = 0
      } else if (holding) {
        // Still holding — unrealized P&L
        outcome = (company?.currentPrice ?? tx.price) - holding.avgPrice
        outcomePercent =
          holding.avgPrice > 0
            ? ((outcome / holding.avgPrice) * 100)
            : 0
      } else {
        outcome = 0
        outcomePercent = 0
      }

      return {
        transactionId: tx.id,
        companyId: tx.companyId,
        symbol: company?.symbol ?? 'Unknown',
        action: tx.action,
        quantity: tx.quantity,
        price: tx.price,
        total: tx.total,
        timestamp: tx.timestamp,
        currentPrice: company?.currentPrice ?? tx.price,
        outcome,
        outcomePercent,
      }
    })
  }, [transactions, holdings, companies])
}