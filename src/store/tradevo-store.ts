import { create } from 'zustand'

export type TradevoPage =
  | 'dashboard'
  | 'portfolio'
  | 'market'
  | 'research'
  | 'learning'
  | 'notifications'
  | 'profile'
  | 'settings'
  | 'company'
  | 'trade'

export type TradeCompany = {
  id: string
  name: string
  ticker: string
  price: number
  change: number
}

interface TradevoState {
  // Navigation
  currentPage: TradevoPage
  previousPages: TradevoPage[]
  navigate: (page: TradevoPage) => void
  goBack: () => void

  // Mobile sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Spotlight search (cmdk)
  spotlightOpen: boolean
  setSpotlightOpen: (open: boolean) => void

  // AI Panel
  aiPanelOpen: boolean
  setAiPanelOpen: (open: boolean) => void

  // Trade modal
  tradeModalOpen: boolean
  tradeModalCompany: {
    id: string
    name: string
    ticker: string
    price: number
    change: number
  } | null
  tradeType: 'buy' | 'sell'
  openTradeModal: (
    company: {
      id: string
      name: string
      ticker: string
      price: number
      change: number
    },
    type?: 'buy' | 'sell',
  ) => void
  closeTradeModal: () => void

  // Company detail
  selectedCompany: string | null
  setSelectedCompany: (id: string | null) => void

  // Notifications
  notificationCount: number
}

export const useTradevoStore = create<TradevoState>((set, get) => ({
  // Navigation
  currentPage: 'dashboard',
  previousPages: [],
  navigate: (page) =>
    set((state) => ({
      currentPage: page,
      previousPages: [...state.previousPages, state.currentPage],
    })),
  goBack: () =>
    set((state) => {
      const prev = [...state.previousPages]
      const lastPage = prev.pop() ?? 'dashboard'
      return {
        currentPage: lastPage,
        previousPages: prev,
      }
    }),

  // Mobile sidebar
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Spotlight search
  spotlightOpen: false,
  setSpotlightOpen: (open) => set({ spotlightOpen: open }),

  // AI Panel
  aiPanelOpen: false,
  setAiPanelOpen: (open) => set({ aiPanelOpen: open }),

  // Trade modal
  tradeModalOpen: false,
  tradeModalCompany: null,
  tradeType: 'buy',
  openTradeModal: (company, type = 'buy') =>
    set({
      tradeModalOpen: true,
      tradeModalCompany: company,
      tradeType: type,
    }),
  closeTradeModal: () =>
    set({
      tradeModalOpen: false,
      tradeModalCompany: null,
    }),

  // Company detail
  selectedCompany: null,
  setSelectedCompany: (id) => set({ selectedCompany: id }),

  // Notifications
  notificationCount: 7,
}))