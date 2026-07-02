export interface Company {
  id: string
  name: string
  symbol: string
  sector: string
  industry: string
  exchange: string
  marketCap: string
  currentPrice: number
  previousClose: number
  dayChange: number
  dayChangePercent: number
  volume: number
  pe: number
  pb: number
  dividendYield: number
  week52High: number
  week52Low: number
  description: string
  website: string
  foundedYear: number
  employees: number
}

export interface CompanyFinancial {
  revenue: number
  netProfit: number
  debt: number
  cashFlow: number
  roe: number
  roa: number
  promotorHolding: number
  institutionalHolding: number
  publicHolding: number
}

export interface CompanyNews {
  id: string
  headline: string
  source: string
  publishedAt: string
  summary: string
}

export interface CompanyDetail extends Company {
  financials: CompanyFinancial
  news: CompanyNews[]
}