import { create } from 'zustand'

type Theme = 'dark' | 'light'

const STORAGE_KEY = 'tradevo_theme'

interface ThemeState {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

function applyTheme(t: Theme) {
  document.documentElement.classList.toggle('light', t === 'light')
}

function readStored(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'light' || raw === 'dark') return raw
  } catch {
    // ignore
  }
  return 'dark'
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: readStored(),

  toggle: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem(STORAGE_KEY, next)
      applyTheme(next)
      return { theme: next }
    }),

  setTheme: (t) => {
    localStorage.setItem(STORAGE_KEY, t)
    applyTheme(t)
    set({ theme: t })
  },
}))