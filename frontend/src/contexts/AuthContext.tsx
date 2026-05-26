import { createContext, useContext, useState, useCallback } from 'react'
import { authApi } from '../api/auth'
import type { LoginResponse } from '../api/auth'

export interface AuthUser {
  id?: string
  name: string
  email?: string
  avatarUrl?: string
  voiceProfile?: string
  onboardingCompleted?: boolean
  token: string
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthLoading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  register: (name: string, email: string, password: string) => Promise<AuthUser>
  logout: () => void
  updateUser: (updates: Partial<Omit<AuthUser, 'token'>>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'kontrol_auth'

const CLEAR_KEYS = ['kontrol_smart_schedule', 'kontrol_voice_edits']

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

  // True while a login or register API call is in flight.
  // RequireAuth watches this to avoid redirecting to /login during auth.
  const [isAuthLoading, setIsAuthLoading] = useState(false)

  const persistUser = useCallback((newUser: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
    localStorage.setItem('kontrol_user_name', newUser.name)
    setUser(newUser)
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    setIsAuthLoading(true)
    try {
      const res = await authApi.login(email, password)
      // Clear stale data from previous session
      CLEAR_KEYS.forEach(k => localStorage.removeItem(k))
      const newUser = responseToUser(res)
      persistUser(newUser)
      return newUser
    } finally {
      setIsAuthLoading(false)
    }
  }, [persistUser])

  const register = useCallback(async (name: string, email: string, password: string): Promise<AuthUser> => {
    setIsAuthLoading(true)
    try {
      const res = await authApi.register(name, email, password)
      // Clear stale data
      CLEAR_KEYS.forEach(k => localStorage.removeItem(k))
      const newUser = responseToUser(res)
      persistUser(newUser)
      return newUser
    } finally {
      setIsAuthLoading(false)
    }
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
    <AuthContext.Provider value={{ user, isAuthLoading, login, register, logout, updateUser }}>
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
