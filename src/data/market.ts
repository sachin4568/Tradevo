import type { MarketOverview, MarketNews } from '@/types/market'
import { getCompanies } from './companies'

function getTopMovers() {
  const companies = getCompanies()
  const sorted = [...companies].sort(
    (a, b) => Math.abs(b.dayChangePercent) - Math.abs(a.dayChangePercent),
  )
  const gainers = sorted
    .filter((c) => c.dayChangePercent > 0)
    .slice(0, 5)
    .map((c) => ({
      companyId: c.id,
      symbol: c.symbol,
      name: c.name,
      price: c.currentPrice,
      change: c.dayChange,
      changePercent: c.dayChangePercent,
      isGainer: true,
    }))
  const losers = sorted
    .filter((c) => c.dayChangePercent < 0)
    .slice(0, 5)
    .map((c) => ({
      companyId: c.id,
      symbol: c.symbol,
      name: c.name,
      price: c.currentPrice,
      change: c.dayChange,
      changePercent: c.dayChangePercent,
      isGainer: false,
    }))
  return { gainers, losers }
}

export function getMarketOverview(): MarketOverview {
  const { gainers, losers } = getTopMovers()
  return {
    status: 'open',
    indices: [
      { name: 'NIFTY 50', value: 24856.70, change: 128.45, changePercent: 0.52 },
      { name: 'SENSEX', value: 81542.30, change: 412.85, changePercent: 0.51 },
      { name: 'NIFTY BANK', value: 53241.15, change: 245.60, changePercent: 0.46 },
      { name: 'NIFTY IT', value: 38452.80, change: -312.40, changePercent: -0.81 },
    ],
    topGainers: gainers,
    topLosers: losers,
    sectorPerformance: [
      { sector: 'Banking', change: 245.60, changePercent: 0.46 },
      { sector: 'IT', change: -312.40, changePercent: -0.81 },
      { sector: 'FMCG', change: 78.20, changePercent: 0.32 },
      { sector: 'Automobile', change: -156.80, changePercent: -0.62 },
      { sector: 'Pharma', change: 42.10, changePercent: 0.18 },
      { sector: 'Energy', change: 189.30, changePercent: 0.71 },
    ],
  }
}

export function getMarketNews(): MarketNews[] {
  return [
    { id: 'mn-001', headline: 'RBI keeps repo rate unchanged at 6.5%', source: 'Economic Times', publishedAt: '2026-06-29T10:00:00Z', summary: 'The central bank maintained the benchmark lending rate, citing stable inflation trends.', companyId: null },
    { id: 'mn-002', headline: 'FII net buyers for fifth consecutive session', source: 'Moneycontrol', publishedAt: '2026-06-29T09:30:00Z', summary: 'Foreign institutional investors bought shares worth Rs 3,200 crore in today\'s session.', companyId: null },
    { id: 'mn-003', headline: 'India GDP growth projected at 7.2% for FY27', source: 'Reuters India', publishedAt: '2026-06-28T14:00:00Z', summary: 'The World Bank revised India\'s growth forecast upward citing strong domestic consumption.', companyId: null },
    { id: 'mn-004', headline: 'Crude oil prices drop 2% on global demand concerns', source: 'Financial Express', publishedAt: '2026-06-28T11:00:00Z', summary: 'Brent crude fell below $78 per barrel amid weakening demand from major economies.', companyId: null },
    { id: 'mn-005', headline: 'SEBI tightens F&O trading norms for retail investors', source: 'LiveMint', publishedAt: '2026-06-27T16:00:00Z', summary: 'The regulator proposed stricter margin requirements and position limits for individual traders.', companyId: null },
  ]
}