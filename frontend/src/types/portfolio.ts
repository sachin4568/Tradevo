export interface Holding {
  companyId: string
  quantity: number
  avgPrice: number
}

export interface Transaction {
  id: string
  companyId: string
  action: 'buy' | 'sell'
  quantity: number
  price: number
  total: number
  timestamp: string
}