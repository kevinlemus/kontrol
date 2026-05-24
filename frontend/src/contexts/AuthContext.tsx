import React, { createContext, useContext, useState, useCallback } from 'react'

export interface AuthUser {
  id?: string
  name: string
  email?: string
  voiceProfile?: string
  token: string
}

interface AuthContextValue {
  user: AuthUser | null
  login: (user: AuthUser) => void
  logout: () => void
  updateUser: (updates: Partial<Omit<AuthUser, 'token'>>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'kontrol_auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? (JSON.parse(stored) as AuthUser) : null
    } catch {
      return null
    }
  })

  const login = useCallback((newUser: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
    // Also write name to legacy key so settingsApi.getCachedUserName() stays in sync
    localStorage.setItem('kontrol_user_name', newUser.name)
    setUser(newUser)
  }, [])

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
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
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
