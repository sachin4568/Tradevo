import { create } from 'zustand'
import type { ResearchHistoryItem } from '@/types/research'

interface ResearchState {
  viewedReports: ResearchHistoryItem[]
  viewReport: (companyId: string) => void
}

export const useResearchStore = create<ResearchState>((set, get) => ({
  viewedReports: [],

  viewReport: (companyId) => {
    const { viewedReports } = get()
    const existingIdx = viewedReports.findIndex(
      (r) => r.companyId === companyId,
    )

    if (existingIdx >= 0) {
      // Update viewedAt for existing entry
      const updated = [...viewedReports]
      updated[existingIdx] = {
        companyId,
        viewedAt: new Date().toISOString(),
      }
      set({ viewedReports: updated })
    } else {
      // Add new entry
      set({
        viewedReports: [
          { companyId, viewedAt: new Date().toISOString() },
          ...viewedReports,
        ],
      })
    }
  },
}))