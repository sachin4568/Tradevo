import { useQuery } from '@tanstack/react-query'
import { fetchMarketOverview, fetchMarketNews } from '@/services/marketService'
import type { MarketOverview, MarketNews } from '@/types/market'

export function useMarketOverview() {
  return useQuery<MarketOverview>({
    queryKey: ['market-overview'],
    queryFn: async () => {
      const response = await fetchMarketOverview()
      if (!response.success) throw new Error(response.message)
      return response.data
    },
  })
}

export function useMarketNews() {
  return useQuery<MarketNews[]>({
    queryKey: ['market-news'],
    queryFn: async () => {
      const response = await fetchMarketNews()
      if (!response.success) throw new Error(response.message)
      return response.data
    },
  })
}