import type { ApiResponse } from '@/types/api'
import type {
  ResearchReport,
  MarketIntelligence,
  SectorInsight,
} from '@/types/research'
import {
  getResearchReport,
  marketIntelligence as staticMarketIntel,
  sectorInsights as staticSectorInsights,
} from '@/data/research'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchResearchReport(
  companyId: string,
): Promise<ApiResponse<ResearchReport>> {
  await delay(250)
  const report = getResearchReport(companyId)
  if (!report) throw new Error('Research report not available for this company')
  return {
    success: true,
    message: 'Operation successful',
    data: report,
  }
}

export async function fetchMarketIntelligence(): Promise<ApiResponse<MarketIntelligence>> {
  await delay(200)
  return {
    success: true,
    message: 'Operation successful',
    data: staticMarketIntel,
  }
}

export async function fetchSectorAnalysis(): Promise<ApiResponse<SectorInsight[]>> {
  await delay(200)
  return {
    success: true,
    message: 'Operation successful',
    data: staticSectorInsights,
  }
}