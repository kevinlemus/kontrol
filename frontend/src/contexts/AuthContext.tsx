import { createContext, useContext, useState, useCallback } from 'react'
import { authApi } from '../api/auth'
import type { LoginResponse } from '../api/auth'

export interface AuthUser {
  id?: string
  name: string
  email?: string
  voiceProfile?: string
  onboardingCompleted?: boolean
  token: string
}

interface AuthContextValue {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (updates: Partial<Omit<AuthUser, 'token'>>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'kontrol_auth'

const CLEAR_KEYS = ['kontrol_projects', 'kontrol_smart_schedule', 'kontrol_voice_edits']

function responseToUser(res: LoginResponse): AuthUser {
  return {
    id: res.user.id,
    name: res.user.name,
    email: res.user.email,
    voiceProfile: res.user.voice_profile,
    onboardingCompleted: res.user.onboarding_completed,
    token: res.token,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? (JSON.parse(stored) as AuthUser) : null
    } catch {
      return null
    }
  })

  const persistUser = useCallback((newUser: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
    localStorage.setItem('kontrol_user_name', newUser.name)
    setUser(newUser)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    // Clear stale data from previous session
    CLEAR_KEYS.forEach(k => localStorage.removeItem(k))
    persistUser(responseToUser(res))
  }, [persistUser])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await authApi.register(name, email, password)
    // Clear stale data
    CLEAR_KEYS.forEach(k => localStorage.removeItem(k))
    persistUser(responseToUser(res))
  }, [persistUser])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const updateUser = useCallback((updates: Partial<Omit<AuthUser, 'token'>>) => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...updates }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      if (updates.name) localStorage.setItem('kontrol_user_name', updates.name)
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

// FRONTEND-AGENT: AuthContext complete
