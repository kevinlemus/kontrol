import { api } from './client'
import type { AuthUser } from '../contexts/AuthContext'

export interface LoginResponse {
  token: string
  user: {
    id?: string
    name: string
    email?: string
    voiceProfile?: string
  }
}

export interface UpdateSettingsRequest {
  name?: string
  email?: string
  voiceProfile?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

function getToken(): string {
  try {
    const stored = localStorage.getItem('kontrol_auth')
    if (stored) return (JSON.parse(stored) as AuthUser).token
  } catch {}
  return ''
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const BASE = (import.meta as { env: { VITE_API_URL?: string } }).env.VITE_API_URL ?? 'http://localhost:8080'

export const authApi = {
  login: (password: string): Promise<LoginResponse> =>
    api.post('/api/v1/auth/login', { password }),

  getMe: (): Promise<LoginResponse['user']> =>
    fetch(`${BASE}/api/v1/auth/me`, {
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    }).then(r => r.json() as Promise<LoginResponse['user']>),

  updateSettings: (data: UpdateSettingsRequest): Promise<LoginResponse['user']> =>
    fetch(`${BASE}/api/v1/auth/settings`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json() as Promise<LoginResponse['user']>),

  changePassword: (data: ChangePasswordRequest): Promise<{ message?: string; error?: string }> =>
    fetch(`${BASE}/api/v1/auth/password`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json() as Promise<{ message?: string; error?: string }>),
}

// FRONTEND-AGENT: api/auth complete
