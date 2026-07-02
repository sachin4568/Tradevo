import type { AuthResponse } from '@/types/auth'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function generateId(): string {
  return `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function generateToken(): string {
  return `eyJ_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`
}

export async function login(
  email: string,
  _password: string,
): Promise<AuthResponse> {
  await delay(400)

  // Mock: accept any valid email/password
  return {
    user: {
      id: generateId(),
      name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      experienceLevel: 'beginner',
      riskPreference: 'moderate',
      createdAt: new Date().toISOString(),
    },
    token: generateToken(),
  }
}

export async function register(
  name: string,
  email: string,
  _password: string,
): Promise<AuthResponse> {
  await delay(500)

  return {
    user: {
      id: generateId(),
      name,
      email,
      experienceLevel: 'beginner',
      riskPreference: 'moderate',
      createdAt: new Date().toISOString(),
    },
    token: generateToken(),
  }
}