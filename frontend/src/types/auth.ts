export interface User {
  id: string
  name: string
  email: string
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  riskPreference: 'conservative' | 'moderate' | 'aggressive'
  createdAt: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface ProfileUpdatePayload {
  name?: string
  experienceLevel?: User['experienceLevel']
  riskPreference?: User['riskPreference']
}

export interface AuthResponse {
  user: User
  token: string
}