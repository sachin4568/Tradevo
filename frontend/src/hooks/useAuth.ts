import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/types/auth'

// Hydrate auth state on first call
let _hydrated = false

function ensureHydrated() {
  if (!_hydrated) {
    useAuthStore.getState()._hydrate()
    _hydrated = true
  }
}

// ─── Primary auth hook ───

export function useAuth() {
  ensureHydrated()

  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)
  const logout = useAuthStore((s) => s.logout)
  const updateProfile = useAuthStore((s) => s.updateProfile)

  return { user: user as User | null, isAuthenticated, login, register, logout, updateProfile }
}

// ─── Navigation-aware auth ───

export function useRequireAuth() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, navigate])

  return isAuthenticated
}