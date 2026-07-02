import { create } from 'zustand'

interface WatchlistState {
  watchlistIds: string[]
  add: (id: string) => void
  remove: (id: string) => void
  toggle: (id: string) => void
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  watchlistIds: [],

  add: (id) => {
    const { watchlistIds } = get()
    if (!watchlistIds.includes(id)) {
      set({ watchlistIds: [...watchlistIds, id] })
    }
  },

  remove: (id) => {
    set({
      watchlistIds: get().watchlistIds.filter((wid) => wid !== id),
    })
  },

  toggle: (id) => {
    const { watchlistIds } = get()
    if (watchlistIds.includes(id)) {
      set({
        watchlistIds: watchlistIds.filter((wid) => wid !== id),
      })
    } else {
      set({ watchlistIds: [...watchlistIds, id] })
    }
  },
}))