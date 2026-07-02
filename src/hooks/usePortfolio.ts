import { useMemo } from 'react'
import { useCompanies } from './useCompanies'
import { usePortfolioStore } from '@/stores/portfolioStore'
import type { Holding } from '@/types/portfolio'
import type { Company } from '@/types/company'

export interface HoldingDetail extends Holding {
  company: Company
  currentPrice: number
  investedValue: number
  currentValue: number
  pnl: number
  pnlPercent: number
  dayPnl: number
}

export interface PortfolioSummary {
  totalValue: number
  totalInvested: number
  totalPnL: number
  totalPnLPercent: number
  totalDayPnL: number
  virtualCash: number
  holdingsWithDetails: HoldingDetail[]
  isEmpty: boolean
}

export function usePortfolio(): PortfolioSummary {
  const virtualCash = usePortfolioStore((s) => s.virtualCash)
  const holdings = usePortfolioStore((s) => s.holdings)
  const { data: companies } = useCompanies()

  const companyMap = useMemo(() => {
    const map = new Map<string, Company>()
    companies?.forEach((c) => map.set(c.id, c))
    return map
  }, [companies])

  const holdingsWithDetails = useMemo<HoldingDetail[]>(() => {
    if (!companies) return []
    return holdings
      .map((h) => {
        const company = companyMap.get(h.companyId)
        if (!company) return null
        const investedValue = h.quantity * h.avgPrice
        const currentValue = h.quantity * company.currentPrice
        const pnl = currentValue - investedValue
        const pnlPercent =
          investedValue > 0 ? (pnl / investedValue) * 100 : 0
        const dayPnl = h.quantity * company.dayChange
        return {
          ...h,
          company,
          currentPrice: company.currentPrice,
          investedValue,
          currentValue,
          pnl,
          pnlPercent,
          dayPnl,
        }
      })
      .filter((h): h is HoldingDetail => h !== null)
  }, [holdings, companies, companyMap])

  const summary = useMemo<PortfolioSummary>(() => {
    const totalInvested = holdingsWithDetails.reduce(
      (sum, h) => sum + h.investedValue,
      0,
    )
    const totalValue = holdingsWithDetails.reduce(
      (sum, h) => sum + h.currentValue,
      0,
    )
    const totalPnL = totalValue - totalInvested
    const totalPnLPercent =
      totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0
    const totalDayPnL = holdingsWithDetails.reduce(
      (sum, h) => sum + h.dayPnl,
      0,
    )
    return {
      totalValue,
      totalInvested,
      totalPnL,
      totalPnLPercent,
      totalDayPnL,
      virtualCash,
      holdingsWithDetails,
      isEmpty: holdings.length === 0,
    }
  }, [holdingsWithDetails, virtualCash, holdings.length])

  return summary
}