import { useMemo } from 'react'
import { useCompanies } from './useCompanies'
import { useWatchlistStore } from '@/stores/watchlistStore'
import type { Company } from '@/types/company'

export function useWatchlist() {
  const watchlistIds = useWatchlistStore((s) => s.watchlistIds)
  const toggle = useWatchlistStore((s) => s.toggle)
  const { data: companies } = useCompanies()

  const companyMap = useMemo(() => {
    const map = new Map<string, Company>()
    companies?.forEach((c) => map.set(c.id, c))
    return map
  }, [companies])

  const watchlistCompanies = useMemo<Company[]>(() => {
    if (!companies) return []
    return watchlistIds
      .map((id) => companyMap.get(id))
      .filter((c): c is Company => c !== undefined)
  }, [watchlistIds, companyMap, companies])

  const isWatched = useMemo(() => {
    const set = new Set(watchlistIds)
    return (id: string) => set.has(id)
  }, [watchlistIds])

  return { companies: watchlistCompanies, isWatched, toggle }
}