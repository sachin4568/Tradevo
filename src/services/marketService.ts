import type { ApiResponse } from '@/types/api'
import type { MarketOverview, MarketNews } from '@/types/market'
import { getMarketOverview as getMarketData, getMarketNews as getNewsData } from '@/data/market'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchMarketOverview(): Promise<ApiResponse<MarketOverview>> {
  await delay(250)
  return {
    success: true,
    message: 'Operation successful',
    data: getMarketData(),
  }
}

export async function fetchMarketNews(): Promise<ApiResponse<MarketNews[]>> {
  await delay(200)
  return {
    success: true,
    message: 'Operation successful',
    data: getNewsData(),
  }
}