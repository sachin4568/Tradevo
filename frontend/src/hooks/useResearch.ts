import { useQuery } from '@tanstack/react-query'
import {
  fetchResearchReport,
  fetchMarketIntelligence,
  fetchSectorAnalysis,
} from '@/services/researchService'
import { useResearchStore } from '@/stores/researchStore'
import { useCompanies } from '@/hooks/useCompanies'
import { getResearchReport } from '@/data/research'
import type { ResearchReport } from '@/types/research'

// ─── TanStack Query hooks ───

export function useResearchReport(companyId: string) {
  return useQuery<ResearchReport>({
    queryKey: ['research-report', companyId],
    queryFn: async () => {
      const res = await fetchResearchReport(companyId)
      if (!res.success) throw new Error(res.message)
      return res.data
    },
    enabled: !!companyId,
  })
}

export function useMarketIntelligence() {
  return useQuery({
    queryKey: ['market-intelligence'],
    queryFn: async () => {
      const res = await fetchMarketIntelligence()
      if (!res.success) throw new Error(res.message)
      return res.data
    },
  })
}

export function useSectorAnalysis() {
  return useQuery({
    queryKey: ['sector-analysis'],
    queryFn: async () => {
      const res = await fetchSectorAnalysis()
      if (!res.success) throw new Error(res.message)
      return res.data
    },
  })
}

// ─── Research History (Zustand-derived) ───

export function useResearchHistory() {
  const viewedReports = useResearchStore((s) => s.viewedReports)
  const { data: companies } = useCompanies()

  const history = viewedReports
    .map((vr) => {
      const company = companies?.find((c) => c.id === vr.companyId)
      const report = getResearchReport(vr.companyId)
      if (!company || !report) return null
      return {
        companyId: vr.companyId,
        companyName: company.name,
        symbol: company.symbol,
        sector: company.sector,
        viewedAt: vr.viewedAt,
        analysisCoverage: report.analysisCoverage,
        outlook: report.outlook,
      }
    })
    .filter(Boolean) as NonNullable<ReturnType<typeof viewedReports.map>[number]>[]

  return {
    history,
    count: viewedReports.length,
  }
}