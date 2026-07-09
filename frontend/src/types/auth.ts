export interface User {
  id: string
  name: string
  email: string
  phone?: string
  dob?: string
  occupation?: string
  address?: string
  bio?: string
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  riskPreference: 'conservative' | 'moderate' | 'aggressive'
  createdAt: string
  // KYC
  pan?: string
  aadhaar?: string
  // Payment
  bankAccount?: string
  upiId?: string
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