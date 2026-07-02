export interface MarketIndex {
  name: string
  value: number
  change: number
  changePercent: number
}

export interface SectorPerformance {
  sector: string
  change: number
  changePercent: number
}

export interface TopMover {
  companyId: string
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  isGainer: boolean
}

export interface MarketNews {
  id: string
  headline: string
  source: string
  publishedAt: string
  summary: string
  companyId: string | null
}

export interface MarketOverview {
  status: 'open' | 'closed'
  indices: MarketIndex[]
  topGainers: TopMover[]
  topLosers: TopMover[]
  sectorPerformance: SectorPerformance[]
}

export type Sector = 'All Sectors' | 'Banking' | 'IT' | 'FMCG' | 'Automobile' | 'Pharma' | 'Energy'