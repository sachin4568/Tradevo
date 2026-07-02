import { create } from 'zustand'
import type { Holding, Transaction } from '@/types/portfolio'

interface PortfolioState {
  virtualCash: number
  holdings: Holding[]
  transactions: Transaction[]
  buy: (companyId: string, quantity: number, price: number) => void
  sell: (companyId: string, quantity: number, price: number) => void
}

let txCounter = 0

function generateTxId(): string {
  txCounter++
  return `TXN-${String(txCounter).padStart(4, '0')}`
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  virtualCash: 1000000,
  holdings: [],
  transactions: [],

  buy: (companyId, quantity, price) => {
    if (quantity <= 0) throw new Error('Quantity must be positive')

    const total = quantity * price
    const { virtualCash, holdings } = get()

    if (total > virtualCash) {
      throw new Error(
        `Insufficient cash. You need ₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })} but have ₹${virtualCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
      )
    }

    const existingIdx = holdings.findIndex(
      (h) => h.companyId === companyId,
    )
    let newHoldings: Holding[]

    if (existingIdx >= 0) {
      const existing = holdings[existingIdx]
      const newQty = existing.quantity + quantity
      const newAvg =
        (existing.avgPrice * existing.quantity + price * quantity) / newQty
      newHoldings = [...holdings]
      newHoldings[existingIdx] = {
        companyId,
        quantity: newQty,
        avgPrice: Math.round(newAvg * 100) / 100,
      }
    } else {
      newHoldings = [
        ...holdings,
        { companyId, quantity, avgPrice: price },
      ]
    }

    const transaction: Transaction = {
      id: generateTxId(),
      companyId,
      action: 'buy',
      quantity,
      price,
      total: Math.round(total * 100) / 100,
      timestamp: new Date().toISOString(),
    }

    set({
      virtualCash: Math.round((virtualCash - total) * 100) / 100,
      holdings: newHoldings,
      transactions: [transaction, ...get().transactions],
    })
  },

  sell: (companyId, quantity, price) => {
    if (quantity <= 0) throw new Error('Quantity must be positive')

    const { holdings } = get()
    const holdingIdx = holdings.findIndex(
      (h) => h.companyId === companyId,
    )

    if (holdingIdx < 0) {
      throw new Error('No holdings found for this company.')
    }

    const holding = holdings[holdingIdx]

    if (holding.quantity < quantity) {
      throw new Error(
        `Insufficient holdings. You have ${holding.quantity} shares but tried to sell ${quantity}.`,
      )
    }

    const total = quantity * price
    let newHoldings: Holding[]

    if (holding.quantity === quantity) {
      newHoldings = holdings.filter((_, i) => i !== holdingIdx)
    } else {
      newHoldings = [...holdings]
      newHoldings[holdingIdx] = {
        ...holding,
        quantity: holding.quantity - quantity,
      }
    }

    const transaction: Transaction = {
      id: generateTxId(),
      companyId,
      action: 'sell',
      quantity,
      price,
      total: Math.round(total * 100) / 100,
      timestamp: new Date().toISOString(),
    }

    set({
      virtualCash: Math.round((get().virtualCash + total) * 100) / 100,
      holdings: newHoldings,
      transactions: [transaction, ...get().transactions],
    })
  },
}))