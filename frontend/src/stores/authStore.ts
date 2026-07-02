import { create } from 'zustand'
import type { User } from '@/types/auth'
import { login as authServiceLogin, register as authServiceRegister } from '@/services/authService'

const STORAGE_KEY = 'tradevo_auth'

interface PersistedAuth {
  user: User
  token: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  _hydrated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (updates: Partial<Pick<User, 'name' | 'experienceLevel' | 'riskPreference'>>) => void
  _hydrate: () => void
}

function persist(user: User, token: string) {
  const data: PersistedAuth = { user, token }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function depersist(): PersistedAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedAuth
  } catch {
    return null
  }
}

function clearPersist() {
  localStorage.removeItem(STORAGE_KEY)
}

const DEMO_USER: User = {
  id: 'usr-demo-001',
  name: 'Demo Investor',
  email: 'demo@tradevo.ai',
  experienceLevel: 'intermediate',
  riskPreference: 'moderate',
  createdAt: new Date().toISOString(),
}

const DEMO_TOKEN = 'demo_jwt_tradevo_dev_bypass_token'

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  _hydrated: false,

  _hydrate: () => {
    const existing = get()
    if (existing._hydrated) return

    // Dev bypass: auto-authenticate demo user
    if (import.meta.env.VITE_DEV_AUTH_BYPASS === 'true') {
      persist(DEMO_USER, DEMO_TOKEN)
      set({
        user: DEMO_USER,
        token: DEMO_TOKEN,
        isAuthenticated: true,
        _hydrated: true,
      })
      return
    }

    // Normal: restore from localStorage
    const stored = depersist()
    if (stored?.user && stored?.token) {
      set({
        user: stored.user,
        token: stored.token,
        isAuthenticated: true,
        _hydrated: true,
      })
    } else {
      set({ _hydrated: true })
    }
  },

  login: async (email, password) => {
    const res = await authServiceLogin(email, password)
    persist(res.user, res.token)
    set({
      user: res.user,
      token: res.token,
      isAuthenticated: true,
    })
  },

  register: async (name, email, password) => {
    const res = await authServiceRegister(name, email, password)
    persist(res.user, res.token)
    set({
      user: res.user,
      token: res.token,
      isAuthenticated: true,
    })
  },

  logout: () => {
    clearPersist()
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    })
  },

  updateProfile: (updates) => {
    const { user } = get()
    if (!user) return
    const updated = { ...user, ...updates }
    const token = get().token
    if (token) persist(updated, token)
    set({ user: updated })
  },
}))